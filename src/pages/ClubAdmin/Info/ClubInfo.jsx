import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { MapPin, Phone, Mail, Users, Award, User } from 'lucide-react';
import { pick } from '../../../utils/apiHelpers';
import './ClubInfo.css';

const ClubInfo = () => {
    const { user } = useAuth();
    const [clubData, setClubData] = useState(null);
    const [entrenadores, setEntrenadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [afiliacionAlDia, setAfiliacionAlDia] = useState(false);

    useEffect(() => {
        if (user?.idClub) {
            fetchClubData();
        }
    }, [user.idClub]);

    const fetchClubData = async () => {
        try {
            setLoading(true);

            const club = await api.get(`/Club/${user.idClub}`);
            const alDia = pick(club, 'pagoAfiliacionAlDia', 'PagoAfiliacionAlDia') !== false;
            setAfiliacionAlDia(alDia);

            const atletas = await api.get('/Atleta');
            const atletasDelClub = (Array.isArray(atletas) ? atletas : []).filter(
                (a) => String(a.idClub ?? a.IdClub) === String(user.idClub)
            );

            let entrenadoresDelClub = [];
            try {
                const todosEntrenadores = await api.get('/Entrenador');
                entrenadoresDelClub = (Array.isArray(todosEntrenadores) ? todosEntrenadores : []).filter(
                    (e) => String(e.idClub ?? e.IdClub) === String(user.idClub)
                );

                const entrenadoresConPersona = await Promise.all(
                    entrenadoresDelClub.map(async (entrenador) => {
                        try {
                            const persona = await api.get(`/Persona/${entrenador.idPersona}`);
                            return { ...entrenador, persona };
                        } catch (error) {
                            console.error(`Error obteniendo persona para entrenador ${entrenador.idPersona}:`, error);
                            return { ...entrenador, persona: null };
                        }
                    })
                );

                setEntrenadores(entrenadoresConPersona);
            } catch (error) {
                console.error('Error al cargar entrenadores:', error);
                setEntrenadores([]);
            }

            setClubData({
                ...club,
                nombre: pick(club, 'nombre', 'Nombre') || user.clubNombre || user.nombre,
                direccion: pick(club, 'direccion', 'Direccion') || 'No especificada',
                telefono: pick(club, 'telefono', 'Telefono') || 'No especificado',
                email: pick(club, 'email', 'Email') || user.email,
                totalAtletas: atletasDelClub.length,
                totalEntrenadores: entrenadoresDelClub.length,
                logros: club.logros || [],
            });
        } catch (error) {
            console.error('Error al cargar información del club:', error);

            setClubData({
                id: user.idClub,
                nombre: user.clubNombre || user.nombre,
                direccion: user.clubData?.direccion || 'No especificada',
                telefono: user.clubData?.telefono || 'No especificado',
                email: user.email,
                totalAtletas: 0,
                totalEntrenadores: 0,
                logros: [],
            });
            setAfiliacionAlDia(false);
            setEntrenadores([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando información del club...</p>
            </div>
        );
    }

    return (
        <div className="club-info">
            <div className="page-header">
                <h1 className="text-gradient">Información del Club</h1>
                <p className="page-subtitle">Detalles y datos de tu club deportivo</p>
            </div>

            <div className="club-info-grid">
                <div className="info-section glass-panel">
                    <h2>Estado de Membresía</h2>
                    <div
                        className="afiliacion-content"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '1rem',
                            flexWrap: 'wrap',
                            gap: '1rem',
                        }}
                    >
                        <div className="afiliacion-info">
                            <p
                                style={{
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: afiliacionAlDia ? 'var(--success)' : 'var(--danger)',
                                }}
                            >
                                {afiliacionAlDia ? 'AFILIACIÓN ACTIVA' : 'MEMBRESÍA PENDIENTE'}
                            </p>
                            <p className="text-muted">
                                {afiliacionAlDia
                                    ? `Cuota anual al día (vencimiento 31/12/${new Date().getFullYear()}).`
                                    : 'Tu club debe regularizar la cuota anual para participar en eventos.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="info-section glass-panel">
                    <h2>Datos Principales</h2>
                    <div className="info-list">
                        <div className="info-item">
                            <div className="info-icon">
                                <Award size={20} />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Nombre del Club</span>
                                <span className="info-value">{clubData.nombre}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-icon">
                                <MapPin size={20} />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Dirección</span>
                                <span className="info-value">{clubData.direccion}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-icon">
                                <Phone size={20} />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Teléfono</span>
                                <span className="info-value">{clubData.telefono}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-icon">
                                <Mail size={20} />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Email</span>
                                <span className="info-value">{clubData.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="info-section glass-panel">
                    <h2>Entrenadores</h2>
                    <div className="entrenadores-list">
                        {entrenadores.length > 0 ? (
                            entrenadores.map((entrenador) => (
                                <div key={entrenador.idPersona} className="entrenador-item">
                                    <div className="entrenador-avatar">
                                        <User size={24} />
                                    </div>
                                    <div className="entrenador-info">
                                        <span className="entrenador-nombre">
                                            {entrenador.persona
                                                ? `${entrenador.persona.nombre} ${entrenador.persona.apellido}`
                                                : 'Entrenador'}
                                        </span>
                                        <div className="entrenador-details">
                                            <span className="entrenador-licencia">
                                                Licencia: {entrenador.licencia || 'No especificada'}
                                            </span>
                                            {entrenador.persona && (
                                                <span className="entrenador-contacto">
                                                    {entrenador.persona.telefono && `Tel: ${entrenador.persona.telefono}`}
                                                    {entrenador.persona.email && ` | Email: ${entrenador.persona.email}`}
                                                </span>
                                            )}
                                        </div>
                                        <div className="entrenador-estado">
                                            {entrenador.perteneceSeleccion && (
                                                <span className="badge seleccion">Selección Nacional</span>
                                            )}
                                            {entrenador.becadoEnard && (
                                                <span className="badge beca-enard">Beca ENARD</span>
                                            )}
                                            {entrenador.becadoSdn && (
                                                <span className="badge beca-sdn">Beca SDN</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-entrenadores">
                                <User size={32} color="var(--text-secondary)" />
                                <p>No hay entrenadores asignados a este club</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="info-section glass-panel">
                    <h2>Estadísticas</h2>
                    <div className="stats-list">
                        <div className="stat-box">
                            <div className="stat-icon-wrapper">
                                <Users size={32} color="var(--primary)" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-number">{clubData.totalAtletas}</span>
                                <span className="stat-label">Atletas Activos</span>
                            </div>
                        </div>

                        <div className="stat-box">
                            <div className="stat-icon-wrapper">
                                <User size={32} color="var(--success)" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-number">{clubData.totalEntrenadores}</span>
                                <span className="stat-label">Entrenadores</span>
                            </div>
                        </div>
                    </div>
                </div>

                {clubData.logros && clubData.logros.length > 0 && (
                    <div className="info-section glass-panel logros-section">
                        <h2>Logros y Reconocimientos</h2>
                        <div className="logros-list">
                            {clubData.logros.map((logro, index) => (
                                <div key={index} className="logro-item">
                                    <Award size={18} color="var(--warning)" />
                                    <span>{logro}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubInfo;
