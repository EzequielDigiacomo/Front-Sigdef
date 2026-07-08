import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchFederacionesStatus } from '../../services/saasService';
import Card from '../../components/common/Card';
import SearchInput from '../../components/common/SearchInput';
import {
    Building2, Users, Award, Shield, Globe, ArrowRight, Clock
} from 'lucide-react';

const LAST_FED_KEY = 'sigdef_superadmin_last_fed';

const MODULE_CONFIG = {
    clubes: {
        title: 'Clubes',
        description: 'Instituciones afiliadas a cada federación',
        icon: Building2,
        color: '#10b981',
    },
    atletas: {
        title: 'Atletas',
        description: 'Nómina y registro de atletas federados',
        icon: Users,
        color: '#3b82f6',
    },
    entrenadores: {
        title: 'Entrenadores de Club',
        description: 'Técnicos asociados a clubes',
        icon: Award,
        color: '#f59e0b',
        routeSuffix: 'entrenadores',
    },
    'entrenadores-seleccion': {
        title: 'Entrenadores de Selección',
        description: 'Cuerpo técnico de selecciones nacionales',
        icon: Award,
        color: '#8b5cf6',
        routeSuffix: 'entrenadores-seleccion',
    },
    selecciones: {
        title: 'Selección Nacional',
        description: 'Selecciones por categoría y planteles',
        icon: Shield,
        color: '#ec4899',
        routeSuffix: 'selecciones',
    },
};

const SuperAdminModulePicker = () => {
    const { moduleKey } = useParams();
    const navigate = useNavigate();
    const config = MODULE_CONFIG[moduleKey];

    const [federaciones, setFederaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastFed, setLastFed] = useState(null);

    useEffect(() => {
        loadFederaciones();
        try {
            const raw = sessionStorage.getItem(LAST_FED_KEY);
            if (raw) setLastFed(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    const loadFederaciones = async () => {
        setLoading(true);
        try {
            const data = await fetchFederacionesStatus();
            setFederaciones(data || []);
        } catch (e) {
            console.error('Error cargando federaciones:', e);
        } finally {
            setLoading(false);
        }
    };

    if (!config) {
        return (
            <Card>
                <p style={{ color: 'var(--text-secondary)' }}>Módulo no encontrado.</p>
            </Card>
        );
    }

    const routeSuffix = config.routeSuffix || moduleKey;

    const goToModule = (fed) => {
        sessionStorage.setItem(LAST_FED_KEY, JSON.stringify({
            id: fed.idFederacion,
            nombre: fed.nombre,
            sigla: fed.sigla,
        }));
        navigate(`/superadmin/federacion/${fed.idFederacion}/${routeSuffix}`);
    };

    const filtered = federaciones.filter(f =>
        (f.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.sigla || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const Icon = config.icon;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{
                        background: `${config.color}20`,
                        color: config.color,
                        padding: '0.6rem',
                        borderRadius: '10px',
                    }}>
                        <Icon size={22} />
                    </div>
                    <div>
                        <h1 className="text-gradient" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
                            {config.title}
                        </h1>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {config.description} — seleccioná una federación para continuar.
                        </p>
                    </div>
                </div>
            </div>

            {lastFed && (
                <Card className="glass-panel" style={{ padding: '1rem 1.25rem', border: `1px solid ${config.color}44` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Clock size={18} style={{ color: config.color }} />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Última federación: <strong style={{ color: 'var(--text-primary)' }}>{lastFed.nombre}</strong>
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(`/superadmin/federacion/${lastFed.id}/${routeSuffix}`)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                background: config.color, color: '#fff', border: 'none',
                                borderRadius: '8px', padding: '0.5rem 1rem',
                                fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                            }}
                        >
                            Continuar <ArrowRight size={16} />
                        </button>
                    </div>
                </Card>
            )}

            <Card>
                <div style={{ marginBottom: '1.25rem' }}>
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar federación..."
                    />
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Cargando federaciones...</p>
                ) : filtered.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No se encontraron federaciones.</p>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1rem',
                    }}>
                        {filtered.map(fed => (
                            <div
                                key={fed.idFederacion}
                                className="glass-panel"
                                onClick={() => goToModule(fed)}
                                style={{
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = config.color;
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div style={{
                                        width: 42, height: 42, borderRadius: '8px',
                                        background: 'rgba(59,130,246,0.12)', color: 'var(--primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold',
                                    }}>
                                        {fed.sigla || <Globe size={18} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {fed.nombre}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            Plan: {fed.plan || '—'}
                                        </p>
                                    </div>
                                    <ArrowRight size={18} style={{ color: config.color, flexShrink: 0 }} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <span>{fed.clubesAfiliados ?? 0} clubes</span>
                                    <span>{fed.atletasRegistrados ?? 0} atletas</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SuperAdminModulePicker;
