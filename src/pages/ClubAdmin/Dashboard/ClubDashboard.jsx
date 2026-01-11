import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { Users, Calendar, Trophy, TrendingUp, AlertTriangle, CheckCircle, Target, Briefcase } from 'lucide-react';
import './ClubDashboard.css';

const getTimeAgo = (fecha) => {
    const ahora = new Date();
    const fechaPasada = new Date(fecha);
    const diferencia = ahora - fechaPasada;

    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);

    if (minutos < 60) return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`;
    if (dias < 30) return `Hace ${dias} día${dias !== 1 ? 's' : ''}`;
    return fechaPasada.toLocaleDateString('es-AR');
};

const ClubDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalAtletas: 0,
        eventosCreados: 0,
        inscripcionesActivas: 0,
        proximosEventos: 0
    });
    const [loading, setLoading] = useState(true);
    const [actividadReciente, setActividadReciente] = useState([]);
    const [proximosEventos, setProximosEventos] = useState([]);
    const [clubNombre, setClubNombre] = useState('...');
    const [membresiaAlDia, setMembresiaAlDia] = useState(true);

    useEffect(() => {
        if (user.idClub) {
            fetchStats();
        }
    }, [user.idClub]);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // 1. Obtener datos del Club
            try {
                const clubData = await api.get(`/Club/${user.idClub}`);
                setClubNombre(clubData.nombre || clubData.Nombre || 'Mi Club');
                setMembresiaAlDia(localStorage.getItem(`club_membresia_${user.idClub}`) === 'false' ? false : true);
            } catch (err) {
                console.error('Error fetching club info:', err);
                setClubNombre('Mi Club');
                setMembresiaAlDia(true);
            }

            // 2. Obtener estadísticas optimizadas desde los endpoints del club (con nombres)
            const [atletasDelClub, entrenadoresDelClub, delegadosDelClub, eventosDelClub, inscripciones] = await Promise.all([
                api.get(`/Club/${user.idClub}/Atletas`),
                api.get(`/Club/${user.idClub}/Entrenadores`),
                api.get(`/Club/${user.idClub}/Delegados`),
                api.get(`/Club/${user.idClub}/Eventos`),
                api.get('/Inscripcion')
            ]);

            // Filtramos inscripciones de atletas de este club
            const atletaIds = new Set(atletasDelClub.map(a => a.idPersona || a.IdPersona));
            const inscripcionesDelClub = inscripciones.filter(i => atletaIds.has(i.idAtleta || i.IdAtleta));

            const hoy = new Date();
            const eventosProximos = eventosDelClub.filter(e => {
                const fechaEvento = new Date(e.fechaInicio || e.FechaInicio);
                return fechaEvento >= hoy;
            });

            setStats({
                totalAtletas: atletasDelClub.length,
                eventosCreados: eventosDelClub.length,
                inscripcionesActivas: inscripcionesDelClub.length,
                proximosEventos: eventosProximos.length
            });

            // 3. Procesar actividad reciente
            const actividades = [];

            // Atletas recientes
            atletasDelClub
                .sort((a, b) => new Date(b.fechaCreacion || b.FechaCreacion || 0) - new Date(a.fechaCreacion || a.FechaCreacion || 0))
                .slice(0, 3)
                .forEach(atleta => {
                    actividades.push({
                        tipo: 'atleta',
                        titulo: `Atleta: ${atleta.nombrePersona || atleta.NombrePersona || 'Sin nombre'}`,
                        subtitulo: `Estado: Activo`,
                        fecha: atleta.fechaCreacion || atleta.FechaCreacion || new Date().toISOString()
                    });
                });

            // Entrenadores recientes
            entrenadoresDelClub
                .sort((a, b) => new Date(b.fechaCreacion || b.FechaCreacion || 0) - new Date(a.fechaCreacion || a.FechaCreacion || 0))
                .slice(0, 2)
                .forEach(entrenador => {
                    actividades.push({
                        tipo: 'entrenador',
                        titulo: `Entrenador: ${entrenador.nombrePersona || entrenador.NombrePersona || 'Sin nombre'}`,
                        subtitulo: entrenador.licencia || 'Sin licencia',
                        fecha: entrenador.fechaCreacion || entrenador.FechaCreacion || new Date().toISOString()
                    });
                });

            // Delegados recientes
            delegadosDelClub
                .sort((a, b) => new Date(b.fechaCreacion || b.FechaCreacion || 0) - new Date(a.fechaCreacion || a.FechaCreacion || 0))
                .slice(0, 2)
                .forEach(delegado => {
                    actividades.push({
                        tipo: 'delegado',
                        titulo: `Delegado: ${delegado.nombrePersona || delegado.NombrePersona || 'Sin nombre'}`,
                        fecha: delegado.fechaCreacion || delegado.FechaCreacion || new Date().toISOString()
                    });
                });

            // Eventos recientes
            eventosDelClub
                .sort((a, b) => new Date(b.fechaCreacion || b.FechaCreacion || 0) - new Date(a.fechaCreacion || a.FechaCreacion || 0))
                .slice(0, 2)
                .forEach(evento => {
                    actividades.push({
                        tipo: 'evento',
                        titulo: `Evento creado: ${evento.nombre || evento.Nombre}`,
                        fecha: evento.fechaCreacion || evento.FechaCreacion || new Date().toISOString()
                    });
                });

            setActividadReciente(actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8));
            setProximosEventos(eventosProximos.sort((a, b) => new Date(a.fechaInicio || a.FechaInicio) - new Date(b.fechaInicio || b.FechaInicio)).slice(0, 5));

        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCardsRaw = [
        {
            title: 'Total Atletas',
            value: stats.totalAtletas,
            icon: Users,
            color: 'var(--primary)',
            bgColor: 'rgba(99, 102, 241, 0.1)'
        },
        {
            title: 'Eventos Creados',
            value: stats.eventosCreados,
            icon: Calendar,
            color: 'var(--success)',
            bgColor: 'rgba(34, 197, 94, 0.1)',
            hidden: true
        },
        {
            title: 'Inscripciones Activas',
            value: stats.inscripcionesActivas,
            icon: Trophy,
            color: 'var(--warning)',
            bgColor: 'rgba(251, 146, 60, 0.1)',
            hidden: true
        },
        {
            title: 'Próximos Eventos',
            value: stats.proximosEventos,
            icon: TrendingUp,
            color: 'var(--info)',
            bgColor: 'rgba(59, 130, 246, 0.1)',
            hidden: true
        }
    ];

    const statCards = statCardsRaw.filter(s => !s.hidden);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando dashboard...</p>
            </div>
        );
    }

    return (
        <div className="club-dashboard">
            <div className="dashboard-header">
                <h1 className="text-gradient">Bienvenido, {user.nombreCompleto || user.username}</h1>
                <p className="dashboard-subtitle">Panel de gestión de <strong>{clubNombre}</strong></p>
            </div>

            {!membresiaAlDia && (
                <div className="glass-panel" style={{
                    borderLeft: '4px solid var(--warning)',
                    padding: '1rem 1.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    backgroundColor: 'rgba(251, 146, 60, 0.05)'
                }}>
                    <div style={{
                        backgroundColor: 'rgba(251, 146, 60, 0.15)',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        color: 'var(--warning)'
                    }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Membresía Pendiente</h4>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Tu membresía anual se encuentra pendiente de pago. Por favor, regulariza tu situación para mantener todas las funciones habilitadas.
                        </p>
                    </div>
                </div>
            )}

            {membresiaAlDia && (
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                        <CheckCircle size={14} /> Membresía al Día
                    </span>
                </div>
            )}

            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card glass-panel">
                        <div className="stat-icon" style={{ backgroundColor: stat.bgColor }}>
                            <stat.icon size={24} color={stat.color} />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-title">{stat.title}</h3>
                            <p className="stat-value">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-content">
                <div className="dashboard-section glass-panel">
                    <h2>Actividad Reciente</h2>
                    <div className="activity-list">
                        {actividadReciente.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                No hay actividad reciente
                            </p>
                        ) : (
                            actividadReciente.map((actividad, index) => (
                                <div key={index} className="activity-item">
                                    <div className="activity-icon">
                                        {(() => {
                                            switch (actividad.tipo) {
                                                case 'atleta': return <Users size={18} />;
                                                case 'entrenador': return <Target size={18} />;
                                                case 'delegado': return <Briefcase size={18} />;
                                                case 'evento': return <Calendar size={18} />;
                                                default: return <TrendingUp size={18} />;
                                            }
                                        })()}
                                    </div>
                                    <div className="activity-details">
                                        <p className="activity-title">{actividad.titulo}</p>
                                        {actividad.subtitulo && (
                                            <p className="activity-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                                                {actividad.subtitulo}
                                            </p>
                                        )}
                                        <p className="activity-time">
                                            {getTimeAgo(actividad.fecha)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/*
                <div className="dashboard-section glass-panel">
                    ... (contenido de próximos eventos) ...
                </div>
                */}
            </div>
        </div>
    );
};

export default ClubDashboard;
