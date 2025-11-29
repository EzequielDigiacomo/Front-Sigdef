import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import './ClubEventos.css';

const ClubEventos = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEventos();
    }, [user.clubId]);

    const fetchEventos = async () => {
        try {
            setLoading(true);
            const todosEventos = await api.get('/Evento');
            // Filtrar solo eventos del club actual
            const eventosDelClub = todosEventos.filter(e => e.idClub == user.clubId);

            // Obtener inscripciones para cada evento
            const inscripciones = await api.get('/Inscripcion');

            // Agregar contador de inscritos a cada evento
            const eventosConInscritos = eventosDelClub.map(evento => ({
                ...evento,
                inscritos: inscripciones.filter(i => i.idEvento === evento.idEvento).length
            }));

            setEventos(eventosConInscritos);
        } catch (error) {
            console.error('Error al cargar eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
            try {
                await api.delete(`/Evento/${id}`);
                // Actualizar lista local
                setEventos(eventos.filter(e => e.idEvento !== id));
            } catch (error) {
                console.error('Error al eliminar evento:', error);
                alert('Error al eliminar el evento. Por favor, intenta nuevamente.');
            }
        }
    };

    const getEstadoBadgeClass = (estado) => {
        switch (estado) {
            case 'PROGRAMADO':
                return 'badge-programado';
            case 'EN_CURSO':
                return 'badge-en-curso';
            case 'FINALIZADO':
                return 'badge-finalizado';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando eventos...</p>
            </div>
        );
    }

    return (
        <div className="club-eventos">
            <div className="page-header">
                <div>
                    <h1 className="text-gradient">Mis Eventos</h1>
                    <p className="page-subtitle">Eventos creados por tu club</p>
                </div>
                <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => navigate('/club/eventos/nuevo')}
                >
                    Crear Evento
                </Button>
            </div>

            <div className="eventos-list">
                {eventos.length === 0 ? (
                    <div className="empty-state glass-panel">
                        <Calendar size={48} color="var(--text-secondary)" />
                        <h3>No hay eventos creados</h3>
                        <p>Comienza creando tu primer evento</p>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => navigate('/club/eventos/nuevo')}
                        >
                            Crear Primer Evento
                        </Button>
                    </div>
                ) : (
                    eventos.map(evento => (
                        <div key={evento.idEvento} className="evento-card glass-panel">
                            <div className="evento-header">
                                <div className="evento-icon">
                                    <Calendar size={24} />
                                </div>
                                <div className="evento-info">
                                    <h3>{evento.nombre}</h3>
                                    <span className={`evento-badge ${getEstadoBadgeClass(evento.estado)}`}>
                                        {evento.estado.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="evento-details">
                                <div className="detail-row">
                                    <Calendar size={16} />
                                    <span>{new Date(evento.fecha).toLocaleDateString('es-AR')}</span>
                                </div>
                                <div className="detail-row">
                                    <MapPin size={16} />
                                    <span>{evento.ubicacion}</span>
                                </div>
                                <div className="detail-row">
                                    <Users size={16} />
                                    <span>{evento.inscritos} atletas inscritos</span>
                                </div>
                            </div>

                            <div className="evento-actions">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={Edit}
                                    onClick={() => navigate(`/club/eventos/editar/${evento.idEvento}`)}
                                >
                                    Editar
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => handleDelete(evento.idEvento)}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ClubEventos;
