import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Card from '../components/common/Card';
import { Users, Shield, DollarSign, Calendar } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
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
        const fetchData = async () => {
            try {
                let atletas = [];
                let clubes = [];
                let eventos = [];
                let inscripciones = [];

                try {
                    atletas = await api.get('/Atleta');
                } catch (error) {
                    console.error('Error cargando atletas:', error);
                }

                try {
                    clubes = await api.get('/Club');
                } catch (error) {
                    console.error('Error cargando clubes:', error);
                }

                try {
                    eventos = await api.get('/Evento');
                } catch (error) {
                    console.error('Error cargando eventos:', error);
                }

                try {
                    inscripciones = await api.get('/Inscripcion');
                } catch (error) {
                    console.error('Error cargando inscripciones:', error);
                }

                const totalAtletas = atletas.length;
                const totalClubes = clubes.length;
                const atletasConDeuda = atletas.filter(a => a.estadoPago === 2).length;

                const eventosProcesados = eventos.map(evento => {
                    const inscripcionesEvento = inscripciones.filter(i => i.idEvento === evento.idEvento);
                    const atletasInscritos = inscripcionesEvento.map(i => i.idAtleta);

                    const clubesInscritos = new Set();
                    inscripcionesEvento.forEach(inscripcion => {
                        const atleta = atletas.find(a => a.idPersona === inscripcion.idAtleta);
                        if (atleta && atleta.idClub) {
                            clubesInscritos.add(atleta.idClub);
                        }
                    });

                    const hoy = new Date();
                    const fechaFin = new Date(evento.fechaFin);
                    let estadoTexto = 'Pendiente';
                    let estadoColor = 'warning';

                    const fechaFinNorm = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate());
                    const hoyNorm = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

                    if (fechaFinNorm < hoyNorm) {
                        estadoTexto = 'Finalizado';
                        estadoColor = 'secondary'; 
                    } else if (evento.estado === 1) {
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
                });

                eventosProcesados.sort((a, b) => {
                    const fechaA = new Date(a.fechaInicio);
                    const fechaB = new Date(b.fechaInicio);
                    const hoy = new Date();

                    const aEsFuturo = new Date(a.fechaFin) >= hoy;
                    const bEsFuturo = new Date(b.fechaFin) >= hoy;

                    if (aEsFuturo && !bEsFuturo) return -1;
                    if (!aEsFuturo && bEsFuturo) return 1;

                    if (aEsFuturo) return fechaA - fechaB;

                    return fechaB - fechaA;
                });

                setStats([
                    {
                        label: 'Total Atletas',
                        value: totalAtletas,
                        icon: Users,
                        color: 'var(--primary)',
                        route: '/dashboard/atletas'
                    },
                    {
                        label: 'Clubes Registrados',
                        value: totalClubes,
                        icon: Shield,
                        color: 'var(--success)',
                        route: '/dashboard/clubes'
                    },
                    {
                        label: 'Atletas con Deuda',
                        value: atletasConDeuda,
                        icon: DollarSign,
                        color: 'var(--danger)',
                        route: '/dashboard/atletas?filter=deuda'
                    },
                    {
                        label: 'Próximos Eventos',
                        value: eventosProcesados.filter(e => new Date(e.fechaFin) >= new Date()).length,
                        icon: Calendar,
                        color: 'var(--warning)',
                        route: '/dashboard/eventos'
                    },
                ]);

                setProximosEventos(eventosProcesados.slice(0, 10));

            } catch (error) {
                console.error("Error general en dashboard:", error);
            } finally {
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
            <h2 className="page-title">Panel Principal</h2>

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
                                    <th>Fecha Inicio</th>
                                    <th>Fecha Fin</th>
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
                                            key={evento.idEvento}
                                            onClick={() => handleEventoClick(evento.idEvento)}
                                            className={`clickable-row row-status-${evento.estadoColor}`}
                                        >
                                            <td>{evento.nombre}</td>
                                            <td>{new Date(evento.fechaInicio).toLocaleDateString()}</td>
                                            <td>{new Date(evento.fechaFin).toLocaleDateString()}</td>
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