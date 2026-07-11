import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import {
    ArrowLeft, Users, Shield, DollarSign, Award, Briefcase,
    UserCheck, Lock, Eye, AlertCircle, Building2
} from 'lucide-react';
import { withFederationScope, getClubFederationId } from '../../utils/apiHelpers';

// Banner visual que recuerda que el SuperAdmin está viendo una federación ajena
const SuperAdminContextBanner = ({ federacionNombre, onBack }) => (
    <div style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 100%)',
        border: '1px solid rgba(59,130,246,0.35)',
        borderRadius: '12px',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1.75rem'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
                background: 'rgba(59,130,246,0.2)',
                borderRadius: '8px',
                padding: '0.4rem',
                color: '#60a5fa'
            }}>
                <Eye size={18} />
            </div>
            <div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#93c5fd', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Modo Supervisión — SuperAdmin
                </p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {federacionNombre || 'Cargando...'}
                </p>
            </div>
        </div>
        <button
            onClick={onBack}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
            <ArrowLeft size={16} />
            Volver al Panel Global
        </button>
    </div>
);

// Tarjeta KPI pequeña
const StatCard = ({ label, value, icon: Icon, color, onClick }) => (
    <div
        className="glass-panel"
        onClick={onClick}
        style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'var(--transition)',
            border: '1px solid var(--border-color)'
        }}
        onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = color; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
    >
        <div style={{
            backgroundColor: `${color}20`,
            color: color,
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            flexShrink: 0
        }}>
            <Icon size={22} />
        </div>
        <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: '600' }}>{label}</p>
            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {value ?? '—'}
            </h3>
        </div>
    </div>
);

// Módulo de navegación
const ModuleCard = ({ label, icon: Icon, color, description, onClick }) => (
    <div
        className="glass-panel"
        onClick={onClick}
        style={{
            padding: '1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            border: '1px solid var(--border-color)',
            transition: 'var(--transition)'
        }}
        onMouseEnter={e => {
            e.currentTarget.style.borderColor = color;
            e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}
    >
        <div style={{
            backgroundColor: `${color}18`,
            color: color,
            padding: '0.8rem',
            borderRadius: 'var(--radius-md)',
            flexShrink: 0
        }}>
            <Icon size={24} />
        </div>
        <div>
            <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{label}</h4>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{description}</p>
        </div>
    </div>
);

const FederacionView = () => {
    const { fedId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [federacion, setFederacion] = useState(null);
    const [stats, setStats] = useState({ atletas: null, clubes: null, deuda: null });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!fedId) return;
        fetchData();
    }, [fedId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Cargar federación + datos de la fed en paralelo
            const [fedData, atletasData, clubesData] = await Promise.all([
                api.get(`/Federaciones/${fedId}`).catch(() => null),
                api.get(withFederationScope('/Atleta', fedId)).catch(() => []),
                api.get(withFederationScope('/Clubes', fedId)).catch(() => [])
            ]);

            setFederacion(fedData);

            let atletasArr = Array.isArray(atletasData) ? atletasData : [];
            let clubesArr = Array.isArray(clubesData) ? clubesData : [];

            // Filtrar clubes por federación (necesario porque SuperAdmin recibe todos)
            clubesArr = clubesArr.filter(c =>
                String(getClubFederationId(c) ?? '') === String(fedId)
            );
            
            const clubIds = clubesArr.map(c => c.idClub ?? c.id ?? c.Id);

            // Filtrar atletas (por idFederacion directo si existe, o por pertenecer a un club de la federación)
            atletasArr = atletasArr.filter(a => {
                const aFed = String(a.idFederacion ?? a.federacionId ?? a.FederacionId ?? '');
                if (aFed === String(fedId)) return true;
                const aClub = a.idClub ?? a.clubId ?? a.ClubId;
                return clubIds.includes(aClub);
            });

            setStats({
                atletas: atletasArr.length,
                clubes: clubesArr.length,
                deuda: atletasArr.filter(a => (a.estadoPago ?? a.EstadoPago) === 2).length
            });
        } catch (err) {
            console.error('Error cargando datos de federación:', err);
            setError('No se pudo cargar la información de esta federación.');
        } finally {
            setLoading(false);
        }
    };

    const goTo = (section) => navigate(`/superadmin/federacion/${fedId}/${section}`);
    const goBack = () => navigate('/superadmin/federaciones');

    const modules = [
        { label: 'Atletas', icon: Users, color: '#3b82f6', description: 'Nómina y registro de atletas', section: 'atletas' },
        { label: 'Clubes', icon: Building2, color: '#10b981', description: 'Instituciones afiliadas', section: 'clubes' },
        { label: 'Entrenadores', icon: Award, color: '#f59e0b', description: 'Técnicos de club y selección', section: 'entrenadores' },
        { label: 'Selección Nacional', icon: Shield, color: '#8b5cf6', description: 'Selecciones nacionales por categoría', section: 'selecciones' },
        { label: 'Delegados', icon: Briefcase, color: '#ef4444', description: 'Representantes de clubes', section: 'delegados' },
        { label: 'Tutores', icon: UserCheck, color: '#ec4899', description: 'Tutoría de atletas menores', section: 'tutores' },
        { label: 'Pagos', icon: DollarSign, color: '#06b6d4', description: 'Control de cuotas y transacciones', section: 'pagos' },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem' }}>
                <div className="spinner" style={{ width: 44, height: 44, border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: 'var(--text-secondary)' }}>Cargando información de la federación...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <AlertCircle size={40} />
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{error}</p>
                <button onClick={goBack} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>
                    ← Volver
                </button>
            </div>
        );
    }

    const fedNombre = federacion?.nombre || federacion?.razonSocial || `Federación #${fedId}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Banner contextual */}
            <SuperAdminContextBanner federacionNombre={fedNombre} onBack={goBack} />

            {/* Header */}
            <div>
                <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>
                    {fedNombre}
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Administración general de la federación — modo supervisión SuperAdmin.
                </p>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <StatCard
                    label="Total Atletas"
                    value={stats.atletas}
                    icon={Users}
                    color="#3b82f6"
                    onClick={() => goTo('atletas')}
                />
                <StatCard
                    label="Clubes Registrados"
                    value={stats.clubes}
                    icon={Building2}
                    color="#10b981"
                    onClick={() => goTo('clubes')}
                />
                <StatCard
                    label="Atletas con Deuda"
                    value={stats.deuda}
                    icon={DollarSign}
                    color="#ef4444"
                    onClick={() => goTo('atletas')}
                />
            </div>

            {/* Módulos de gestión */}
            <div>
                <div style={{ marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                        Módulos de Gestión
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                        Navegá dentro de esta federación para ver y gestionar su información.
                    </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {modules.map((mod) => (
                        <ModuleCard
                            key={mod.section}
                            label={mod.label}
                            icon={mod.icon}
                            color={mod.color}
                            description={mod.description}
                            onClick={() => goTo(mod.section)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FederacionView;
