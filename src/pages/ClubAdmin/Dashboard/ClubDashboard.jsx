import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { Users, Calendar, Trophy, TrendingUp } from 'lucide-react';
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

    useEffect(() => {
        fetchStats();
    }, [user.clubId]);

    const fetchStats = async () => {
        try {
            setLoading(true);

            const atletas = await api.get('/Atleta');
            const atletasDelClub = atletas.filter(a => a.idClub == user.clubId);

            const eventos = await api.get('/Evento');
            const eventosDelClub = eventos.filter(e => e.idClub == user.clubId);

            const inscripciones = await api.get('/Inscripcion');
            const inscripcionesDelClub = inscripciones.filter(i =>
                atletasDelClub.some(a => a.id === i.atletaId)
            );

            const hoy = new Date();
            const eventosProximos = eventos.filter(e => {
                const fechaEvento = new Date(e.fechaInicio);
                return fechaEvento >= hoy;
            });

            setStats({
                totalAtletas: atletasDelClub.length,
                eventosCreados: eventosDelClub.length,
                inscripcionesActivas: inscripcionesDelClub.length,
                proximosEventos: eventosProximos.length
            });

            const actividades = [];

            for (const atleta of atletasDelClub.slice(0, 3).sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0))) {
                let documento = 'Sin DNI';
                try {
                    
                    const persona = await api.get(`/Persona/${atleta.idPersona}`);
                    documento = persona.documento || 'Sin DNI';
                } catch (error) {
                    console.error('Error obteniendo datos de persona:', error);
                }

                actividades.push({
                    tipo: 'atleta',
                    titulo: `Atleta registrado: ${atleta.nombrePersona || 'Sin nombre'}`,
                    subtitulo: `DNI: ${documento}`,
                    fecha: atleta.fechaCreacion || new Date().toISOString()
                });
            }

            eventosDelClub
                .sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0))
                .slice(0, 2)
                .forEach(evento => {
                    actividades.push({
                        tipo: 'evento',
                        titulo: `Evento creado: ${evento.nombre}`,
                        fecha: evento.fechaCreacion || new Date().toISOString()
                    });
                });

            const actividadesOrdenadas = actividades
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .slice(0, 5);

            setActividadReciente(actividadesOrdenadas);

            const proximosEventosOrdenados = eventosProximos
                .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
                .slice(0, 5);

            setProximosEventos(proximosEventosOrdenados);

        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
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
            bgColor: 'rgba(34, 197, 94, 0.1)'
        },
        {
            title: 'Inscripciones Activas',
            value: stats.inscripcionesActivas,
            icon: Trophy,
            color: 'var(--warning)',
            bgColor: 'rgba(251, 146, 60, 0.1)'
        },
        {
            title: 'Próximos Eventos',
            value: stats.proximosEventos,
            icon: TrendingUp,
            color: 'var(--info)',
            bgColor: 'rgba(59, 130, 246, 0.1)'
        }
    ];

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
                <h1 className="text-gradient">Bienvenido, {user.nombre}</h1>
                <p className="dashboard-subtitle">Panel de gestión de tu club deportivo</p>
            </div>

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
                                        {actividad.tipo === 'atleta' ? <Users size={18} /> : <Calendar size={18} />}
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

                <div className="dashboard-section glass-panel">
                    <h2>Próximos Eventos</h2>
                    <div className="events-list">
                        {proximosEventos.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                No hay eventos próximos
                            </p>
                        ) : (
                            proximosEventos.map((evento) => {
                                const fecha = new Date(evento.fechaInicio);
                                const dia = fecha.getDate();
                                const mes = fecha.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase();

                                return (
                                    <div
                                        key={evento.idEvento}
                                        className="event-item"
                                        onClick={() => navigate('/club/eventos-disponibles')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="event-date">
                                            <span className="event-day">{dia}</span>
                                            <span className="event-month">{mes}</span>
                                        </div>
                                        <div className="event-details">
                                            <h4>{evento.nombre}</h4>
                                            <p>{evento.ubicacion}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubDashboard;
