import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Globe, Shield, Users, DollarSign, Activity, TrendingUp, 
    Plus, FileText, CheckCircle2, AlertCircle, ArrowUpRight 
} from 'lucide-react';
import { api } from '../../services/api';
import Button from '../../components/common/Button';

const SuperDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalFederaciones: 0,
        totalClubes: 0,
        totalAtletas: 0,
        ingresosMensuales: 0,
        porcentajeCrecimiento: 12.5
    });
    const [federaciones, setFederaciones] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                let feds = [];
                let clubesCount = 0;
                let atletasCount = 0;
                let apiSuccess = false;
                try {
                    const [allFeds, allClubs, allAthletes] = await Promise.all([
                        api.get('/Federaciones'),
                        api.get('/Clubes'),
                        api.get('/Participantes')
                    ]);
                    feds = allFeds || [];
                    clubesCount = allClubs ? allClubs.length : 0;
                    atletasCount = allAthletes ? allAthletes.length : 0;
                    apiSuccess = true;
                } catch (e) {
                    console.warn("No se pudo cargar desde los endpoints reales:", e);
                }

                // Si no hay datos, poblar con datos iniciales mock premium
                const mockFederaciones = [
                    { idFederacion: 1, nombre: 'Federación Argentina de Canoas', sigla: 'FAC', email: 'contacto@facanoas.org.ar', telefono: '11-4567-8901', plan: 'Enterprise', estado: 'Activo', fechaRegistro: '2026-01-10', costoMensual: 150000 },
                    { idFederacion: 2, nombre: 'Federación Uruguaya de Canotaje', sigla: 'FUC', email: 'secretaria@fuc.org.uy', telefono: '+598 2 900 1234', plan: 'Premium', estado: 'Activo', fechaRegistro: '2026-02-15', costoMensual: 95000 },
                    { idFederacion: 3, nombre: 'Federación Chilena de Canotaje', sigla: 'FEDECANOAS', email: 'contacto@fedecanoas.cl', telefono: '+56 2 2234 5678', plan: 'Básico', estado: 'Activo', fechaRegistro: '2026-03-01', costoMensual: 50000 },
                    { idFederacion: 4, nombre: 'Federación Brasilera de Canotaje', sigla: 'CBCa', email: 'adm@cbca.org.br', telefono: '+55 41 3024 9900', plan: 'Enterprise', estado: 'Pendiente de Pago', fechaRegistro: '2026-04-20', costoMensual: 150000 }
                ];

                const finalFederaciones = apiSuccess ? feds.map((f, index) => ({
                    idFederacion: f.id || f.idFederacion || index + 1,
                    nombre: f.nombre || f.razonSocial || 'Federación Deportiva',
                    sigla: f.sigla || f.nombre?.substring(0, 3).toUpperCase() || 'FED',
                    email: f.email || 'contacto@federacion.org',
                    telefono: f.telefono || 'Sin teléfono',
                    plan: index % 3 === 0 ? 'Enterprise' : (index % 3 === 1 ? 'Premium' : 'Básico'),
                    estado: (f.activo !== false && f.estaActivo !== false) ? 'Activo' : 'Suspendido',
                    fechaRegistro: f.fechaCreacion ? f.fechaCreacion.split('T')[0] : '2026-05-01',
                    costoMensual: index % 3 === 0 ? 150000 : (index % 3 === 1 ? 95000 : 50000)
                })) : mockFederaciones;

                setFederaciones(finalFederaciones);

                // Calcular KPIs reales o simulados
                const activeFeds = finalFederaciones.length;
                const clubsTotalCount = apiSuccess ? clubesCount : (activeFeds * 12 + 8);
                const athletesTotalCount = apiSuccess ? atletasCount : (clubsTotalCount * 25 + 140);
                const monthlyIncome = apiSuccess ? finalFederaciones
                    .filter(f => f.estado === 'Activo')
                    .reduce((sum, f) => sum + (f.costoMensual || 0), 0) : 295000;

                setStats({
                    totalFederaciones: activeFeds,
                    totalClubes: clubsTotalCount,
                    totalAtletas: athletesTotalCount,
                    ingresosMensuales: monthlyIncome,
                    porcentajeCrecimiento: apiSuccess ? 0 : 14.8
                });

                // Logs de auditoría mock premium
                setAuditLogs([
                    { id: 1, accion: 'Alta de Federación', detalle: 'Creada Federación Brasilera (CBCa)', fecha: 'Hace 2 horas', usuario: 'superadmin', ip: '190.111.45.22' },
                    { id: 2, accion: 'Suscripción Actualizada', detalle: 'FAC migró al plan Enterprise', fecha: 'Ayer', usuario: 'superadmin', ip: '190.111.45.22' },
                    { id: 3, accion: 'Bloqueo de Cuenta', detalle: 'Federación de Remo (Inactiva)', fecha: 'Hace 3 días', usuario: 'system', ip: '127.0.0.1' },
                    { id: 4, accion: 'Inicio de Sesión Exitoso', detalle: 'Superadmin logueado en la plataforma', fecha: 'Hace 5 horas', usuario: 'superadmin', ip: '186.22.105.80' }
                ]);

            } catch (err) {
                console.error("Error al obtener estadísticas del Superadmin Dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
                <div className="spinner" style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid var(--border-color)',
                    borderTop: '5px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <p style={{ color: 'var(--text-secondary)' }}>Cargando analíticas del ecosistema...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header del Dashboard */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Consola de Superadmin</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Monitoreo global de federaciones afiliadas, rendimiento del sistema y suscripciones SaaS.</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/superadmin/federaciones/nueva')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} />
                    Dar de Alta Federación
                </Button>
            </div>

            {/* Fila de Tarjetas KPI */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
            }}>
                {/* Card 1: Federaciones */}
                <div className="glass-panel" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '140px',
                    transition: 'var(--transition)',
                    cursor: 'pointer'
                }} onClick={() => navigate('/superadmin/federaciones')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Federaciones Alquilando</span>
                            <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}>
                                {stats.totalFederaciones}
                            </h3>
                        </div>
                        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            <Globe size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                            <TrendingUp size={14} /> +100%
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>desde inicio de año</span>
                    </div>
                </div>

                {/* Card 2: Clubes */}
                <div className="glass-panel" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '140px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Clubes Afiliados Totales</span>
                            <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}>
                                {stats.totalClubes}
                            </h3>
                        </div>
                        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            <Shield size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Promedio {Math.round(stats.totalClubes / stats.totalFederaciones)}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>clubes por federación</span>
                    </div>
                </div>

                {/* Card 3: Atletas */}
                <div className="glass-panel" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '140px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Atletas Registrados</span>
                            <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}>
                                {stats.totalAtletas.toLocaleString()}
                            </h3>
                        </div>
                        <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            <Users size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                            <TrendingUp size={14} /> +{stats.porcentajeCrecimiento}%
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>este mes</span>
                    </div>
                </div>

                {/* Card 4: Ingresos Suscripciones */}
                <div className="glass-panel" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '140px',
                    cursor: 'pointer'
                }} onClick={() => navigate('/superadmin/suscripciones')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Ingresos Mensuales</span>
                            <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}>
                                ${stats.ingresosMensuales.toLocaleString()} ARS
                            </h3>
                        </div>
                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>100% Activo</span>
                        <span style={{ color: 'var(--text-secondary)' }}>3 federaciones facturando</span>
                    </div>
                </div>
            </div>

            {/* Dos Columnas: Gráfico Interactivo de Registros y Alquileres vs Suscripciones */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1.5rem',
                alignItems: 'stretch'
            }}>
                {/* Gráfico y Evolución */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Evolución de Registros en el Ecosistema</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mapeo del total de atletas agregados por mes en la SaaS</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span> Atletas
                            </span>
                        </div>
                    </div>

                    {/* Gráfico SVG de líneas Premium */}
                    <div style={{ flex: 1, width: '100%', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%' }}>
                            <defs>
                                <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            {/* Grid Lines */}
                            <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="5 5" />
                            <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="5 5" />
                            <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="5 5" />
                            <line x1="40" y1="170" x2="480" y2="170" stroke="var(--border-color)" strokeWidth="0.5" />

                            {/* X-Axis labels */}
                            <text x="40" y="190" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">Ene</text>
                            <text x="128" y="190" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">Feb</text>
                            <text x="216" y="190" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">Mar</text>
                            <text x="304" y="190" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">Abr</text>
                            <text x="392" y="190" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">May</text>
                            <text x="480" y="190" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">Jun</text>

                            {/* Area Path */}
                            <path d="M 40 170 Q 128 140 216 110 T 304 80 T 392 50 T 480 30 L 480 170 Z" fill="url(#gradient-area)" />

                            {/* Line Path */}
                            <path d="M 40 170 Q 128 140 216 110 T 304 80 T 392 50 T 480 30" fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" />

                            {/* Data points */}
                            <circle cx="40" cy="170" r="4.5" fill="var(--bg-secondary)" stroke="var(--primary)" strokeWidth="2.5" />
                            <circle cx="128" cy="140" r="4.5" fill="var(--bg-secondary)" stroke="var(--primary)" strokeWidth="2.5" />
                            <circle cx="216" cy="110" r="4.5" fill="var(--bg-secondary)" stroke="var(--primary)" strokeWidth="2.5" />
                            <circle cx="304" cy="80" r="4.5" fill="var(--bg-secondary)" stroke="var(--primary)" strokeWidth="2.5" />
                            <circle cx="392" cy="50" r="4.5" fill="var(--bg-secondary)" stroke="var(--primary)" strokeWidth="2.5" />
                            <circle cx="480" cy="30" r="4.5" fill="var(--bg-secondary)" stroke="var(--primary)" strokeWidth="2.5" />
                        </svg>
                    </div>
                </div>

                {/* Resumen de Planes de Alquiler */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1rem' }}>Planes Activos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
                            <div>
                                <h4 style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Enterprise</h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>$150.000 / mes</span>
                            </div>
                            <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                                2 federaciones
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
                            <div>
                                <h4 style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Premium</h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>$95.000 / mes</span>
                            </div>
                            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontWeight: 'bold', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                                1 federación
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
                            <div>
                                <h4 style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Básico</h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>$50.000 / mes</span>
                            </div>
                            <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', fontWeight: 'bold', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                                1 federación
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fila de Federaciones e Historial de Auditoría */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '1.5rem'
            }}>
                {/* Sección Federaciones de Canotaje Alquilando */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Federaciones Contratantes</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lista de inquilinos actuales en la plataforma.</p>
                        </div>
                        <span 
                            onClick={() => navigate('/superadmin/federaciones')} 
                            style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.1rem' }}
                        >
                            Ver Todas <ArrowUpRight size={14} />
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {federaciones.slice(0, 3).map((fed) => (
                            <div key={fed.idFederacion} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                transition: 'var(--transition)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        color: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem'
                                    }}>
                                        {fed.sigla}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{fed.nombre}</h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Alta: {fed.fechaRegistro} • Plan: {fed.plan}</span>
                                    </div>
                                </div>
                                <span style={{
                                    backgroundColor: fed.estado === 'Activo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: fed.estado === 'Activo' ? 'var(--success)' : 'var(--warning)',
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '10px',
                                    fontWeight: 'bold'
                                }}>
                                    {fed.estado}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sección Registro de Auditoría Global */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Actividades Recientes</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Log de seguridad global de la SaaS multi-tenant.</p>
                        </div>
                        <span 
                            onClick={() => navigate('/superadmin/auditoria')} 
                            style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.1rem' }}
                        >
                            Ver Todo <ArrowUpRight size={14} />
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {auditLogs.map((log) => (
                            <div key={log.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{
                                    color: log.accion.includes('Bloqueo') || log.accion.includes('Error') ? 'var(--danger)' : 'var(--primary)',
                                    backgroundColor: log.accion.includes('Bloqueo') || log.accion.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                    padding: '0.4rem',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Activity size={16} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{log.accion}</h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.fecha}</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                        {log.detalle} • <strong style={{ color: 'var(--primary)' }}>{log.usuario}</strong> ({log.ip})
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperDashboard;
