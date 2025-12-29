import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Card from '../components/common/Card';
import { Users, Shield, DollarSign, Calendar, LayoutDashboard, Award, Trophy, ClipboardList, Briefcase, UserCheck, Lock, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

import DataGenerationModal from '../components/common/DataGenerationModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { DataGenerator } from '../utils/DataGenerator';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [federacionNombre, setFederacionNombre] = useState('...');

    // Data Generation Modal State
    const [showGenModal, setShowGenModal] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const [stats, setStats] = useState([
        {
            label: 'Total Atletas Registrados',
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
        /*
                {
                    label: 'Próximos Eventos',
                    value: '...',
                    icon: Calendar,
                    color: 'var(--warning)',
                    route: '/dashboard/eventos'
                },
        */
    ]);
    const [proximosEventos, setProximosEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    // Trigger to refresh data after generation
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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
                setLoading(true); // Ensure loading state shows during refresh
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
                    { label: 'Atletas Registrados', value: totalAtletas, icon: Users, color: 'var(--primary)', route: '/dashboard/atletas' },
                    { label: 'Clubes Registrados', value: totalClubes, icon: Shield, color: 'var(--success)', route: '/dashboard/clubes' },
                    { label: 'Atletas con Deuda', value: atletasConDeuda, icon: DollarSign, color: 'var(--danger)', route: '/dashboard/atletas?filter=deuda' },
                    //                    { label: 'Próximos Eventos', value: eventosBasicos.filter(e => new Date(e.fechaFin || e.FechaFin) >= new Date()).length, icon: Calendar, color: 'var(--warning)', route: '/dashboard/eventos' },
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
    }, [refreshTrigger]); // Depend on refreshTrigger

    const handleEventoClick = (idEvento) => {
        navigate(`/dashboard/eventos/${idEvento}`);
    };

    const navCards = [
        { label: 'Clubes', icon: Shield, path: '/dashboard/clubes', color: '#3b82f6', description: 'Gestión de clubes y sedes' },
        { label: 'Atletas', icon: Users, path: '/dashboard/atletas', color: '#10b981', description: 'Listado y registro de atletas' },
        { label: 'Entrenadores Club', icon: Award, path: '/dashboard/entrenadores', color: '#f59e0b', description: 'Gestión de técnicos de clubes' },
        { label: 'Entrenadores Selección', icon: Briefcase, path: '/dashboard/entrenadores-seleccion', color: '#8b5cf6', description: 'Gestión de técnicos de selección' },
        { label: 'Selecciones', icon: Trophy, path: '/dashboard/selecciones', color: '#ef4444', description: 'Selecciones nacionales por categoría' },
        { label: 'Delegados', icon: Briefcase, path: '/dashboard/delegados', color: '#64748b', description: 'Representantes de clubes' },
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

    const handleClearDB = async () => {
        setIsClearing(true);
        try {
            await DataGenerator.clearAllData();
            setRefreshTrigger(prev => prev + 1);
            setShowClearConfirm(false);
        } catch (error) {
            console.error("Error clearing DB:", error);
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                        Bienvenido, {user?.nombreCompleto || user?.username || 'Administrador'}
                    </h1>
                    <p className="dashboard-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                        Panel de control de <strong>{federacionNombre}</strong>
                    </p>
                </div>
                <div>
                    <button
                        className="btn btn-danger"
                        onClick={() => setShowClearConfirm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '1rem' }}
                    >
                        <Trash2 size={16} /> Limpiar DB
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowGenModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed var(--text-secondary)' }}
                    >
                        ⚡ Generar Datos
                    </button>
                </div>
            </div>

            {/* Modal de Confirmación para Limpiar */}
            <ConfirmationModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClearDB}
                title="¿Limpiar Base de Datos?"
                message="Esta acción eliminará Atletas, Clubes, Eventos y toda la información generada. Esta acción no se puede deshacer."
                type="danger"
                confirmText={isClearing ? "Limpiando..." : "Sí, Limpiar Todo"}
                cancelText="Cancelar"
                isLoading={isClearing}
            />

            {/* Modal de Generación */}
            <DataGenerationModal
                isOpen={showGenModal}
                onClose={() => setShowGenModal(false)}
                onDataGenerated={() => setRefreshTrigger(prev => prev + 1)}
            />

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
                <div className="section-header mb-4">
                    <h2 className="section-title">Módulos de Gestión</h2>
                    <p className="section-subtitle">Seleccione una sección para administrar</p>
                </div>

                <div className="nav-cards-grid">
                    {navCards.map((card, index) => (
                        <Card
                            key={index}
                            className="nav-module-card clickable-card"
                            onClick={() => handleCardClick(card.path)}
                        >
                            <div className="nav-card-icon" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                                <card.icon size={32} />
                            </div>
                            <div className="nav-card-info">
                                <h3 className="nav-card-label">{card.label}</h3>
                                <p className="nav-card-description">{card.description}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;