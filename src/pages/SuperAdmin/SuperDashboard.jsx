import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Globe, Shield, Users, DollarSign, Activity, TrendingUp, 
    Plus, ArrowUpRight 
} from 'lucide-react';
import { fetchSuperAdminDashboard } from '../../services/saasService';
import { getApiBaseUrl } from '../../services/api';
import Button from '../../components/common/Button';

const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH} hora${diffH > 1 ? 's' : ''}`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Hace ${diffD} día${diffD > 1 ? 's' : ''}`;
    return date.toLocaleString('es-AR');
};

const mapFederacionFromStatus = (c) => ({
    idFederacion: c.idFederacion,
    nombre: c.nombre,
    sigla: c.sigla,
    email: c.email,
    telefono: c.telefono,
    plan: c.plan,
    estado: c.estado,
    fechaRegistro: c.fechaRegistro,
});

const buildChartGeometry = (crecimiento) => {
    if (!crecimiento?.length) return null;
    const max = Math.max(...crecimiento.map((d) => d.cantidad ?? d.Cantidad ?? 0), 1);
    const chartHeight = 140;
    const baseY = 170;
    const startX = 40;
    const endX = 480;
    const step = (endX - startX) / Math.max(crecimiento.length - 1, 1);

    const points = crecimiento.map((d, i) => {
        const qty = d.cantidad ?? d.Cantidad ?? 0;
        return {
            x: startX + i * step,
            y: baseY - (qty / max) * chartHeight,
            mes: d.mes ?? d.Mes ?? '',
            qty,
        };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;

    return { points, linePath, areaPath };
};

const SuperDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalFederaciones: 0,
        totalClubes: 0,
        totalAtletas: 0,
        ingresosMensuales: 0,
        federacionesFacturando: 0,
        porcentajeCrecimiento: 0,
    });
    const [federaciones, setFederaciones] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [crecimiento, setCrecimiento] = useState([]);
    const [distribucionPlanes, setDistribucionPlanes] = useState([]);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setLoadError('');

                const { metrics, federaciones: feds, logs, errors } = await fetchSuperAdminDashboard();

                if (errors.length) {
                    setLoadError(
                        `No se pudieron cargar: ${errors.join(', ')}. ` +
                        `API: ${getApiBaseUrl()}. Verificá que estés logueado como SuperAdmin.`
                    );
                }

                if (metrics) {
                    setStats({
                        totalFederaciones: metrics.totalFederaciones,
                        totalClubes: metrics.totalClubes,
                        totalAtletas: metrics.totalAtletas,
                        ingresosMensuales: metrics.ingresosMensuales,
                        federacionesFacturando: metrics.federacionesFacturando,
                        porcentajeCrecimiento: metrics.porcentajeCrecimiento,
                    });
                    setCrecimiento(metrics.crecimiento);
                    setDistribucionPlanes(metrics.distribucionPlanes);
                }

                setFederaciones(feds.map(mapFederacionFromStatus));

                if (logs?.length) {
                    setAuditLogs(logs.map((log) => ({
                        id: log.id ?? log.Id,
                        accion: log.accion ?? log.Accion ?? 'Evento',
                        detalle: log.detalle ?? log.Detalle ?? '',
                        fecha: formatRelativeTime(log.fecha ?? log.Fecha),
                        usuario: log.usuario ?? log.Usuario ?? 'Sistema',
                        ip: log.ip ?? log.IP ?? '',
                    })));
                } else {
                    setAuditLogs([]);
                }
            } catch (err) {
                console.error('Error al obtener estadísticas del Superadmin Dashboard:', err);
                setLoadError(err.message || 'Error al conectar con la API');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const chart = useMemo(() => buildChartGeometry(crecimiento), [crecimiento]);
    const promedioClubes = stats.totalFederaciones > 0
        ? Math.round(stats.totalClubes / stats.totalFederaciones)
        : 0;
    const crecimientoLabel = stats.porcentajeCrecimiento >= 0
        ? `+${stats.porcentajeCrecimiento}%`
        : `${stats.porcentajeCrecimiento}%`;

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

            {loadError && (
                <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--danger)',
                    fontSize: '0.9rem',
                }}>
                    {loadError}
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
            }}>
                <div className="glass-panel" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '140px',
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
                    <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {stats.federacionesFacturando} con suscripción activa al día
                    </div>
                </div>

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
                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Promedio {promedioClubes}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>clubes por federación</span>
                    </div>
                </div>

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
                                {stats.totalAtletas.toLocaleString('es-AR')}
                            </h3>
                        </div>
                        <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            <Users size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                        <span style={{
                            color: stats.porcentajeCrecimiento >= 0 ? 'var(--success)' : 'var(--danger)',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.1rem'
                        }}>
                            <TrendingUp size={14} /> {crecimientoLabel}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>altas vs mes anterior</span>
                    </div>
                </div>

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
                                ${stats.ingresosMensuales.toLocaleString('es-AR')}
                            </h3>
                        </div>
                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                            {stats.federacionesFacturando} facturando
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>de {stats.totalFederaciones} federaciones</span>
                    </div>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1.5rem',
                alignItems: 'stretch'
            }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Evolución de Registros en el Ecosistema</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Altas de atletas federados por mes (últimos 6 meses)</p>
                        </div>
                    </div>

                    <div style={{ flex: 1, width: '100%', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {chart ? (
                            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%' }}>
                                <defs>
                                    <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="5 5" />
                                <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="5 5" />
                                <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="5 5" />
                                <line x1="40" y1="170" x2="480" y2="170" stroke="var(--border-color)" strokeWidth="0.5" />
                                {chart.points.map((p) => (
                                    <text key={p.mes} x={p.x} y="190" fill="var(--text-secondary)" fontSize="10" textAnchor="middle">{p.mes}</text>
                                ))}
                                <path d={chart.areaPath} fill="url(#gradient-area)" />
                                <path d={chart.linePath} fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" />
                                {chart.points.map((p) => (
                                    <circle key={`pt-${p.mes}`} cx={p.x} cy={p.y} r="4.5" fill="var(--bg-secondary)" stroke="var(--primary)" strokeWidth="2.5" />
                                ))}
                            </svg>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)' }}>Sin datos de crecimiento todavía.</p>
                        )}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1rem' }}>Planes Activos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
                        {distribucionPlanes.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No hay planes asignados.</p>
                        ) : distribucionPlanes.map((plan) => {
                            const nombre = plan.nombre ?? plan.Nombre ?? 'Plan';
                            const cantidad = plan.cantidad ?? plan.Cantidad ?? 0;
                            const precio = Number(plan.precio ?? plan.Precio ?? 0);
                            return (
                                <div key={nombre} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
                                    <div>
                                        <h4 style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{nombre}</h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            ${precio.toLocaleString('es-AR')} / mes
                                        </span>
                                    </div>
                                    <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                                        {cantidad} federación{cantidad !== 1 ? 'es' : ''}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '1.5rem'
            }}>
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
                        {federaciones.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No hay federaciones registradas.</p>
                        ) : federaciones.slice(0, 3).map((fed) => (
                            <div key={fed.idFederacion} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
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
                        {auditLogs.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sin actividad registrada.</p>
                        ) : auditLogs.map((log) => (
                            <div key={log.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{
                                    color: log.accion.includes('Bloqueo') || log.accion.includes('Error') || log.accion.includes('FAILED') ? 'var(--danger)' : 'var(--primary)',
                                    backgroundColor: log.accion.includes('Bloqueo') || log.accion.includes('Error') || log.accion.includes('FAILED') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
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

            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Grilla de Precios de Referencia (SaaS)</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valores oficiales de suscripción mensual y pago anual con descuento del 20%.</p>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <th style={{ padding: '1rem 0.5rem' }}>PLAN / MÓDULO</th>
                                <th style={{ padding: '1rem 0.5rem' }}>MENSUAL</th>
                                <th style={{ padding: '1rem 0.5rem' }}>ANUAL (PAGO ÚNICO)</th>
                                <th style={{ padding: '1rem 0.5rem' }}>EQUIV. MENSUAL EN ANUAL</th>
                                <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>AHORRO EFECTIVO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: 'SIGDEF (S)', mensual: 'USD 50', anual: 'USD 480', equiv: 'USD 40', ahorro: '20%' },
                                { name: 'SIGDEF (M)', mensual: 'USD 120', anual: 'USD 1.150', equiv: 'USD 95.8', ahorro: '20%' },
                                { name: 'SIGDEF (L)', mensual: 'USD 250', anual: 'USD 2.400', equiv: 'USD 200', ahorro: '20%' },
                                { name: 'SportTrack (S)', mensual: 'USD 40', anual: 'USD 380', equiv: 'USD 31.6', ahorro: '20%' },
                                { name: 'SportTrack (M)', mensual: 'USD 90', anual: 'USD 860', equiv: 'USD 71.6', ahorro: '20%' },
                                { name: 'SportTrack (L)', mensual: 'USD 190', anual: 'USD 1.800', equiv: 'USD 150', ahorro: '20%' },
                                { name: 'Pack Dúo (S)', mensual: 'USD 75', anual: 'USD 720', equiv: 'USD 60', ahorro: '20%' },
                                { name: 'Pack Dúo (M)', mensual: 'USD 170', anual: 'USD 1.600', equiv: 'USD 133.3', ahorro: '20%' },
                                { name: 'Pack Dúo (L)', mensual: 'USD 350', anual: 'USD 3.360', equiv: 'USD 280', ahorro: '20%' },
                            ].map((row, idx) => (
                                <tr key={idx} style={{ 
                                    borderBottom: '1px solid var(--border-color)', 
                                    fontSize: '0.9rem', 
                                    color: 'var(--text-primary)',
                                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                                }}>
                                    <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>{row.name}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>{row.mensual}</td>
                                    <td style={{ padding: '1rem 0.5rem', color: 'var(--success)', fontWeight: '600' }}>{row.anual}</td>
                                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>{row.equiv}</td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                        <span style={{ 
                                            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                                            color: 'var(--success)', 
                                            fontSize: '0.75rem', 
                                            padding: '0.2rem 0.5rem', 
                                            borderRadius: '6px',
                                            fontWeight: 'bold' 
                                        }}>
                                            {row.ahorro}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperDashboard;
