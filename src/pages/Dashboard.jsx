import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Card from '../components/common/Card';
import { Users, Shield, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [federacionNombre, setFederacionNombre] = useState('...');
    const [stats, setStats] = useState([
        {
            label: 'Total Atletas',
            value: '...',
            icon: Users,
            color: 'var(--primary)',
            route: '/dashboard/atletas'
        },
        {
            label: 'Clubes Registrados',
            value: '...',
            icon: Shield,
            color: 'var(--success)',
            route: '/dashboard/clubes'
        },
        {
            label: 'Atletas con Deuda',
            value: '...',
            icon: DollarSign,
            color: 'var(--danger)',
            route: '/dashboard/atletas?filter=deuda'
        },
        {
            label: 'Próximos Eventos',
            value: '...',
            icon: Calendar,
            color: 'var(--warning)',
            route: '/dashboard/eventos'
        },
    ]);
    const [proximosEventos, setProximosEventos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFederacion = async () => {
            try {
                const data = await api.get('/Federacion/1');
                setFederacionNombre(data.nombre || data.Nombre || 'Federación Principal');
            } catch (err) {
                setFederacionNombre('Federación SIGDEF');
            }
        };
        fetchFederacion();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Lanzar peticiones BASE en paralelo
                const [atletasData, clubesData, eventosResumen, inscripcionesData] = await Promise.all([
                    api.get('/Atleta').catch(err => { console.error('Error atletas', err); return []; }),
                    api.get('/Club').catch(err => { console.error('Error clubes', err); return []; }),
                    api.get('/Evento').catch(err => { console.error('Error eventos', err); return []; }),
                    api.get('/Inscripcion').catch(err => { console.error('Error inscripciones', err); return []; })
                ]);

                // Función auxiliar para procesar eventos
                const procesarEventos = (listaEventos) => {
                    return listaEventos.map(evento => {
                        const inscripcionesEvento = inscripcionesData.filter(i => i.idEvento === (evento.idEvento || evento.IdEvento));
                        const atletasInscritos = inscripcionesEvento.map(i => i.idAtleta || i.IdAtleta);
                        const clubesInscritos = new Set();
                        inscripcionesEvento.forEach(inscripcion => {
                            const atleta = atletasData.find(a => (a.idPersona || a.IdPersona) === (inscripcion.idAtleta || inscripcion.IdAtleta));
                            if (atleta && (atleta.idClub || atleta.IdClub)) clubesInscritos.add(atleta.idClub || atleta.IdClub);
                        });

                        const hoy = new Date();
                        const fechaFin = new Date(evento.fechaFin || evento.FechaFin);
                        let estadoTexto = 'Pendiente';
                        let estadoColor = 'warning';
                        const fechaFinNorm = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate());
                        const hoyNorm = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

                        if (fechaFinNorm < hoyNorm) {
                            estadoTexto = 'Finalizado';
                            estadoColor = 'secondary';
                        } else if (evento.estado === 1 || evento.Estado === 1) {
                            estadoTexto = 'Confirmado';
                            estadoColor = 'success';
                        }

                        return {
                            ...evento,
                            totalAtletas: atletasInscritos.length,
                            totalClubes: clubesInscritos.size,
                            estadoTexto,
                            estadoColor
                        };
                    }).sort((a, b) => {
                        const now = new Date();
                        const endA = new Date(a.fechaFin || a.FechaFin);
                        const endB = new Date(b.fechaFin || b.FechaFin);
                        const isPastA = endA < now;
                        const isPastB = endB < now;
                        if (isPastA && !isPastB) return 1;
                        if (!isPastA && isPastB) return -1;
                        return endA - endB;
                    });
                };

                const eventosBasicos = procesarEventos(eventosResumen);
                const totalAtletas = atletasData.length;
                const totalClubes = clubesData.length;
                const atletasConDeuda = atletasData.filter(a => (a.estadoPago || a.EstadoPago) === 2).length;

                setStats([
                    { label: 'Total Atletas', value: totalAtletas, icon: Users, color: 'var(--primary)', route: '/dashboard/atletas' },
                    { label: 'Clubes Registrados', value: totalClubes, icon: Shield, color: 'var(--success)', route: '/dashboard/clubes' },
                    { label: 'Atletas con Deuda', value: atletasConDeuda, icon: DollarSign, color: 'var(--danger)', route: '/dashboard/atletas?filter=deuda' },
                    { label: 'Próximos Eventos', value: eventosBasicos.filter(e => new Date(e.fechaFin || e.FechaFin) >= new Date()).length, icon: Calendar, color: 'var(--warning)', route: '/dashboard/eventos' },
                ]);

                setProximosEventos(eventosBasicos.slice(0, 10));
                setLoading(false);

                // Carga de detalles en segundo plano
                const eventosDetallados = await Promise.all(eventosResumen.map(async (ev) => {
                    try {
                        return await api.get(`/Evento/${ev.idEvento || ev.IdEvento}`);
                    } catch (err) {
                        return ev;
                    }
                }));

                const eventosCompletos = procesarEventos(eventosDetallados);
                setProximosEventos(eventosCompletos.slice(0, 10));

            } catch (error) {
                console.error("Error general en dashboard:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleEventoClick = (idEvento) => {
        navigate(`/dashboard/eventos/${idEvento}`);
    };

    const handleCardClick = (route) => {
        navigate(route);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header mb-8">
                <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                    Bienvenido, {user?.nombreCompleto || user?.username || 'Administrador'}
                </h1>
                <p className="dashboard-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                    Panel de control de <strong>{federacionNombre}</strong>
                </p>
            </div>

            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <Card
                        key={index}
                        className="stat-card clickable-card"
                        onClick={() => handleCardClick(stat.route)}
                    >
                        <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="dashboard-content">
                <Card title="Eventos Recientes" className="events-card">
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Evento</th>
                                    <th>Fechas del Evento</th>
                                    <th>Período Inscripción</th>
                                    <th>Atletas</th>
                                    <th>Clubes</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>Cargando datos...</td></tr>
                                ) : proximosEventos.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>No hay eventos registrados</td></tr>
                                ) : (
                                    proximosEventos.map(evento => (
                                        <tr
                                            key={evento.idEvento || evento.IdEvento}
                                            onClick={() => handleEventoClick(evento.idEvento || evento.IdEvento)}
                                            className={`clickable-row row-status-${evento.estadoColor}`}
                                        >
                                            <td>{evento.nombre || evento.Nombre}</td>
                                            <td>
                                                {new Date(evento.fechaInicio || evento.FechaInicio).toLocaleDateString()} - {new Date(evento.fechaFin || evento.FechaFin).toLocaleDateString()}
                                            </td>
                                            <td>
                                                {(evento.fechaInicioInscripciones || evento.FechaInicioInscripciones) && (evento.fechaFinInscripciones || evento.FechaFinInscripciones) ? (
                                                    <>
                                                        {new Date(evento.fechaInicioInscripciones || evento.FechaInicioInscripciones).toLocaleDateString()} al {new Date(evento.fechaFinInscripciones || evento.FechaFinInscripciones).toLocaleDateString()}
                                                    </>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${evento.totalAtletas > 0 ? 'primary' : 'secondary'}`}>
                                                    {evento.totalAtletas || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${evento.totalClubes > 0 ? 'info' : 'secondary'}`}>
                                                    {evento.totalClubes || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${evento.estadoColor}`}>
                                                    {evento.estadoTexto}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;