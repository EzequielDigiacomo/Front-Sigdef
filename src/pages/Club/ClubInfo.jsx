
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MapPin, Phone, Mail, Users, Award, User, Shield } from 'lucide-react';
import './ClubInfo.css';

const ClubInfo = () => {
    const { user } = useAuth();
    const [clubData, setClubData] = useState(null);
    const [entrenadores, setEntrenadores] = useState([]);
    const [delegados, setDelegados] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClubData();
    }, [user.clubId, user.idClub]);

    const fetchClubData = async () => {
        try {
            setLoading(true);
            const clubId = user.idClub || user.clubId;

            const club = await api.get(`/Club/${clubId}`);

            let entrenadoresDelClub = [];
            try {
                const todosEntrenadores = await api.get('/Entrenador');
                entrenadoresDelClub = todosEntrenadores.filter(e => {
                    const eClubId = e.idClub || e.clubId;
                    return eClubId == clubId;
                });

                const entrenadoresConPersona = await Promise.all(
                    entrenadoresDelClub.map(async (entrenador) => {
                        try {
                            const persona = await api.get(`/Persona/${entrenador.idPersona}`);
                            return { ...entrenador, persona };
                        } catch (error) {
                            return { ...entrenador, persona: null };
                        }
                    })
                );
                setEntrenadores(entrenadoresConPersona);
            } catch (error) {
                console.error('Error al cargar entrenadores:', error);
            }

            try {
                const todosDelegados = await api.get('/DelegadoClub');
                const delegadosDelClub = todosDelegados.filter(d => {
                    const dClubId = d.idClub || d.clubId;
                    return dClubId == clubId;
                });

                const delegadosConPersona = await Promise.all(
                    delegadosDelClub.map(async (delegado) => {
                        try {
                            const persona = await api.get(`/Persona/${delegado.idPersona}`);
                            return { ...delegado, persona };
                        } catch (error) {
                            return { ...delegado, persona: null };
                        }
                    })
                );

                setDelegados(delegadosConPersona);
            } catch (error) {
                console.error('Error al cargar delegados:', error);
            }

            setClubData({
                ...club,
                logros: club.logros || []
            });
        } catch (error) {
            console.error('Error al cargar información del club:', error);
            
            setClubData({
                id: user.clubId,
                nombre: user.clubNombre || user.nombre,
                direccion: user.clubData?.direccion || 'No especificada',
                telefono: user.clubData?.telefono || 'No especificado',
                email: user.email,
                logros: []
            });
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
                {}
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
                                <span className="info-value">{clubData.direccion || 'No especificada'}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-icon">
                                <Phone size={20} />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Teléfono</span>
                                <span className="info-value">{clubData.telefono || 'No especificado'}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-icon">
                                <Mail size={20} />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Email</span>
                                <span className="info-value">{clubData.email || 'No especificado'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {}
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
                                                : 'Entrenador'
                                            }
                                        </span>
                                        <div className="entrenador-details">
                                            {entrenador.persona && (
                                                <span className="entrenador-contacto">
                                                    {entrenador.persona.telefono && `Tel: ${entrenador.persona.telefono}`}
                                                    {entrenador.persona.email && ` | Email: ${entrenador.persona.email}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-entrenadores">
                                <User size={32} color="var(--text-secondary)" />
                                <p>No hay entrenadores asignados</p>
                            </div>
                        )}
                    </div>
                </div>

                {}
                <div className="info-section glass-panel">
                    <h2>Delegados</h2>
                    <div className="entrenadores-list"> {}
                        {delegados.length > 0 ? (
                            delegados.map((delegado) => (
                                <div key={delegado.idPersona} className="entrenador-item">
                                    <div className="entrenador-avatar">
                                        <Shield size={24} />
                                    </div>
                                    <div className="entrenador-info">
                                        <span className="entrenador-nombre">
                                            {delegado.persona
                                                ? `${delegado.persona.nombre} ${delegado.persona.apellido}`
                                                : 'Delegado'
                                            }
                                        </span>
                                        <div className="entrenador-details">
                                            {delegado.persona && (
                                                <span className="entrenador-contacto">
                                                    {delegado.persona.telefono && `Tel: ${delegado.persona.telefono}`}
                                                    {delegado.persona.email && ` | Email: ${delegado.persona.email}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-entrenadores">
                                <Shield size={32} color="var(--text-secondary)" />
                                <p>No hay delegados asignados</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ClubInfo;