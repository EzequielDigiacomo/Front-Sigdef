import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Card from '../components/common/Card';
import {
    Users, Shield, DollarSign, Award, Trophy, Briefcase, UserCheck, Lock,
    ChevronLeft, ChevronRight, Activity, AlertTriangle, KeyRound, UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const ACTIVITY_PAGE_SIZE = 4;

const formatFechaHora = (fecha) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const labelAccion = (accion = '') => {
    const map = {
        LOGIN_SUCCESS: 'Inicio de sesión',
        LOGIN_FAILED: 'Login fallido',
        LOGIN_BLOCKED: 'Acceso bloqueado',
        ACCOUNT_LOCKED: 'Cuenta bloqueada',
        CREATE_ATHLETE: 'Alta de atleta',
        UPDATE_ATHLETE: 'Actualización de atleta',
        DELETE_ATHLETE: 'Baja de atleta',
        CREATE_COACH: 'Alta de entrenador',
        CREATE_TUTOR: 'Alta de tutor',
        CREATE_DELEGATE: 'Alta de delegado',
        CREATE_USER: 'Alta de usuario',
        REGISTER_USER: 'Registro de usuario',
        REGISTRAR_PAGO: 'Pago registrado',
        TOGGLE_PAGO_CLUB: 'Cambio pago club',
        TOGGLE_PAGO_ATLETA: 'Cambio pago atleta',
    };
    return map[accion] || accion.replaceAll('_', ' ');
};

const isSecurityEvent = (accion = '') => {
    const upper = accion.toUpperCase();
    return upper.includes('FAILED')
        || upper.includes('BLOCK')
        || upper.includes('LOCKED')
        || upper.includes('ERROR');
};

const isAuthEvent = (accion = '') => {
    const upper = accion.toUpperCase();
    return upper.includes('LOGIN') || upper.includes('LOGOUT') || upper.includes('AUTH');
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [federacionNombre, setFederacionNombre] = useState('...');
    const [actividad, setActividad] = useState([]);
    const [activityPage, setActivityPage] = useState(1);
    const [activityLoading, setActivityLoading] = useState(true);

    const [stats, setStats] = useState([
        {
            label: 'Total Atletas',
            value: '...',
            icon: Users,
            color: 'var(--primary)',
            route: '/dashboard/atletas',
        },
        {
            label: 'Clubes Registrados',
            value: '...',
            icon: Shield,
            color: 'var(--success)',
            route: '/dashboard/clubes',
        },
        {
            label: 'Atletas con Deuda',
            value: '...',
            icon: DollarSign,
            color: 'var(--danger)',
            route: '/dashboard/atletas?filter=deuda',
        },
    ]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchFederacion = async () => {
            try {
                const fedId = user?.idFederacion || user?.federacionId || 1;
                const data = await api.get(`/Federaciones/${fedId}`);
                setFederacionNombre(data.nombre || data.razonSocial || data.Nombre || 'Federación Principal');
            } catch {
                setFederacionNombre('Federación SIGDEF');
            }
        };
        fetchFederacion();
    }, [user?.idFederacion, user?.federacionId]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [atletasData, clubesData] = await Promise.all([
                    api.get('/Atleta').catch(() => []),
                    api.get('/Club').catch(() => []),
                ]);

                const totalAtletas = atletasData.length;
                const totalClubes = clubesData.length;
                const atletasConDeuda = atletasData.filter((a) => (a.estadoPago || a.EstadoPago) === 2).length;

                setStats([
                    { label: 'Total Atletas', value: totalAtletas, icon: Users, color: 'var(--primary)', route: '/dashboard/atletas' },
                    { label: 'Clubes Registrados', value: totalClubes, icon: Shield, color: 'var(--success)', route: '/dashboard/clubes' },
                    { label: 'Atletas con Deuda', value: atletasConDeuda, icon: DollarSign, color: 'var(--danger)', route: '/dashboard/atletas?filter=deuda' },
                ]);
            } catch (error) {
                console.error('Error general en dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [refreshTrigger]);

    useEffect(() => {
        const fetchActividad = async () => {
            try {
                setActivityLoading(true);
                const data = await api.get('/Auditoria?limit=200');
                const rows = (Array.isArray(data) ? data : []).map((log) => ({
                    id: log.id ?? log.Id,
                    fecha: log.fecha ?? log.Fecha,
                    accion: log.accion ?? log.Accion ?? 'Evento',
                    detalle: log.detalle ?? log.Detalle ?? '',
                    usuario: log.usuario ?? log.Usuario ?? 'Sistema',
                    modulo: log.modulo ?? log.Modulo ?? 'General',
                    ip: log.ip ?? log.IP ?? '',
                }));
                setActividad(rows);
                setActivityPage(1);
            } catch (error) {
                console.error('Error cargando actividad:', error);
                setActividad([]);
            } finally {
                setActivityLoading(false);
            }
        };

        fetchActividad();
    }, []);

    const activityTotalPages = Math.max(1, Math.ceil(actividad.length / ACTIVITY_PAGE_SIZE));
    const activityPageSafe = Math.min(activityPage, activityTotalPages);
    const actividadPagina = useMemo(
        () => actividad.slice(
            (activityPageSafe - 1) * ACTIVITY_PAGE_SIZE,
            activityPageSafe * ACTIVITY_PAGE_SIZE
        ),
        [actividad, activityPageSafe]
    );

    const navCards = [
        { label: 'Clubes', icon: Shield, path: '/dashboard/clubes', color: '#3b82f6', description: 'Gestión de clubes y sedes' },
        { label: 'Atletas', icon: Users, path: '/dashboard/atletas', color: '#10b981', description: 'Listado y registro de atletas' },
        { label: 'Entrenadores', icon: Award, path: '/dashboard/entrenadores', color: '#f59e0b', description: 'Técnicos de club y selección' },
        { label: 'Selecciones', icon: Trophy, path: '/dashboard/selecciones', color: '#8b5cf6', description: 'Selecciones nacionales por categoría' },
        { label: 'Delegados', icon: Briefcase, path: '/dashboard/delegados', color: '#ef4444', description: 'Representantes de clubes' },
        { label: 'Tutores', icon: UserCheck, path: '/dashboard/tutores', color: '#ec4899', description: 'Tutoría de atletas menores' },
        { label: 'Pagos', icon: DollarSign, path: '/dashboard/pagos', color: '#06b6d4', description: 'Control de cuotas y transacciones' },
        { label: 'Federación', icon: Shield, path: '/dashboard/federacion', color: '#64748b', description: 'Información institucional' },
    ];

    if (user?.role === 'FEDERACION') {
        navCards.push({ label: 'Accesos', icon: Lock, path: '/dashboard/usuarios', color: '#475569', description: 'Gestión de usuarios y permisos' });
    }

    const handleCardClick = (route) => {
        navigate(route);
    };

    const getRowIcon = (accion) => {
        if (isSecurityEvent(accion)) return AlertTriangle;
        if (isAuthEvent(accion)) return KeyRound;
        if (String(accion).toUpperCase().includes('CREATE')) return UserPlus;
        return Activity;
    };

    return (
        <div className="dashboard-container dashboard-compact">
            <header className="dash-header">
                <div className="dash-title-block">
                    <p className="dash-eyebrow">Dashboard</p>
                    <h1 className="text-gradient">{federacionNombre}</h1>
                    <p className="dash-subtitle">
                        {user?.nombreCompleto || user?.username || 'Administrador'}
                    </p>
                </div>
            </header>

            <div className="stats-grid dash-stats">
                {stats.map((stat, index) => (
                    <button
                        key={index}
                        type="button"
                        className="dash-stat-card"
                        onClick={() => handleCardClick(stat.route)}
                    >
                        <span className="dash-stat-icon" style={{ backgroundColor: `${stat.color}18`, color: stat.color }}>
                            <stat.icon size={20} />
                        </span>
                        <div className="dash-stat-info">
                            <strong className="dash-stat-value">{loading ? '…' : stat.value}</strong>
                            <span className="dash-stat-label">{stat.label}</span>
                        </div>
                    </button>
                ))}
            </div>

            <section className="dashboard-content dash-modules">
                <div className="dash-section-head">
                    <h2>Módulos</h2>
                    <span>Acceso rápido</span>
                </div>

                <div className="nav-cards-grid dash-modules-grid">
                    {navCards.map((card, index) => (
                        <button
                            key={index}
                            type="button"
                            className="dash-module-card"
                            onClick={() => handleCardClick(card.path)}
                        >
                            <span className="dash-module-icon" style={{ backgroundColor: `${card.color}18`, color: card.color }}>
                                <card.icon size={22} />
                            </span>
                            <span className="dash-module-meta">
                                <strong>{card.label}</strong>
                                <small>{card.description}</small>
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="dashboard-activity">
                <div className="section-header mb-4">
                    <h2 className="section-title">
                        <Activity size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Actividad reciente
                    </h2>
                    <p className="section-subtitle">
                        Eventos de la federación: altas, accesos e intentos fallidos
                    </p>
                </div>

                <Card className="activity-table-card">
                    {activityLoading ? (
                        <p className="activity-empty">Cargando actividad...</p>
                    ) : actividad.length === 0 ? (
                        <p className="activity-empty">Sin actividad registrada para esta federación.</p>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="data-table activity-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha y hora</th>
                                            <th>Evento</th>
                                            <th>Detalle</th>
                                            <th>Usuario</th>
                                            <th>Módulo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {actividadPagina.map((row) => {
                                            const Icon = getRowIcon(row.accion);
                                            const danger = isSecurityEvent(row.accion);
                                            return (
                                                <tr
                                                    key={row.id}
                                                    className={danger ? 'row-status-warning' : isAuthEvent(row.accion) ? 'row-status-success' : ''}
                                                >
                                                    <td className="activity-datetime">{formatFechaHora(row.fecha)}</td>
                                                    <td>
                                                        <span className={`activity-event ${danger ? 'danger' : ''}`}>
                                                            <Icon size={14} />
                                                            {labelAccion(row.accion)}
                                                        </span>
                                                    </td>
                                                    <td className="activity-detail" title={row.detalle}>{row.detalle || '—'}</td>
                                                    <td>{row.usuario}</td>
                                                    <td>{row.modulo}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {activityTotalPages > 1 && (
                                <div className="activity-pagination">
                                    <button
                                        type="button"
                                        className="activity-page-btn"
                                        disabled={activityPageSafe <= 1}
                                        onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                                        aria-label="Página anterior"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="activity-page-info">
                                        Página {activityPageSafe} de {activityTotalPages}
                                        <span className="activity-page-total"> · {actividad.length} registros</span>
                                    </span>
                                    <button
                                        type="button"
                                        className="activity-page-btn"
                                        disabled={activityPageSafe >= activityTotalPages}
                                        onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                                        aria-label="Página siguiente"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </section>
        </div>
    );
};

export default Dashboard;
