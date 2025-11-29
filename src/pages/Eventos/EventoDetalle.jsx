import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ArrowLeft, Calendar, Users, Shield, Trash2, Edit } from 'lucide-react';
import { getCategoriaLabel } from '../../utils/enums';
import './EventoDetalle.css';

const EventoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [evento, setEvento] = useState(null);
    const [inscripciones, setInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEventoDetalle();
    }, [id]);

    const loadEventoDetalle = async () => {
        try {
            const eventoData = await api.get(`/Evento/${id}`);
            setEvento(eventoData);

            // Cargar inscripciones del evento
            const inscripcionesData = await api.get(`/Inscripcion/evento/${id}`);

            // Si necesitas más datos de atletas, puedes cargarlos aquí
            const atletasData = await api.get('/Atleta');

            // Enriquecer inscripciones con datos de atletas
            const inscripcionesConDetalles = inscripcionesData.map(inscripcion => {
                const atleta = atletasData.find(a => a.idPersona === inscripcion.idAtleta);
                return {
                    ...inscripcion,
                    categoria: atleta ? atleta.categoria : null,
                    nombreCompleto: atleta ? `${atleta.nombre} ${atleta.apellido}` : 'N/A'
                };
            });

            setInscripciones(inscripcionesConDetalles);
        } catch (error) {
            console.error('Error cargando detalle del evento:', error);
            alert('Error al cargar el detalle del evento');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.')) {
            try {
                await api.delete(`/Evento/${id}`);
                navigate('/eventos');
            } catch (error) {
                console.error('Error eliminando evento:', error);
                alert('Error al eliminar el evento');
            }
        }
    };

    // Estadísticas
    const totalAtletas = inscripciones.length;
    const clubesUnicos = [...new Set(inscripciones.map(i => i.nombreClub))].length;
    const diasDuracion = evento ? Math.ceil((new Date(evento.fechaFin) - new Date(evento.fechaInicio)) / (1000 * 60 * 60 * 24)) + 1 : 0;

    // Estadísticas por categoría
    const categoriasStats = Object.entries(
        inscripciones.reduce((acc, curr) => {
            const cat = curr.categoria;
            if (cat !== null && cat !== undefined) {
                acc[cat] = (acc[cat] || 0) + 1;
            }
            return acc;
        }, {})
    );

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading">Cargando...</div>
            </div>
        );
    }

    if (!evento) {
        return (
            <div className="page-container">
                <div className="error">Evento no encontrado</div>
            </div>
        );
    }

    return (
        <div className="evento-detalle-container">
            {/* Header */}
            <div className="evento-header">
                <div className="evento-header-left">
                    <Button variant="ghost" onClick={() => navigate('/eventos')} className="back-button">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="evento-title-section">
                        <h1 className="evento-title">{evento.nombre}</h1>
                        <p className="evento-fechas">
                            {new Date(evento.fechaInicio).toLocaleDateString()} - {new Date(evento.fechaFin).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="evento-actions">
                    <Button variant="primary" onClick={() => navigate(`/eventos/editar/${id}`)}>
                        <Edit size={18} /> Editar
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        <Trash2 size={18} /> Eliminar
                    </Button>
                </div>
            </div>

            {/* Primera Fila: Estadísticas Principales */}
            <div className="estadisticas-principales">
                <Card className="stat-card principal">
                    <div className="stat-content">
                        <div className="stat-icon-wrapper atletas">
                            <Users size={24} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{totalAtletas}</div>
                            <div className="stat-label">Atletas Inscritos</div>
                        </div>
                    </div>
                </Card>

                <Card className="stat-card principal">
                    <div className="stat-content">
                        <div className="stat-icon-wrapper clubes">
                            <Shield size={24} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{clubesUnicos}</div>
                            <div className="stat-label">Clubes Participantes</div>
                        </div>
                    </div>
                </Card>

                <Card className="stat-card principal">
                    <div className="stat-content">
                        <div className="stat-icon-wrapper dias">
                            <Calendar size={24} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{diasDuracion}</div>
                            <div className="stat-label">Días de Duración</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Segunda Fila: Estadísticas por Categoría */}
            <div className="estadisticas-categorias">
                <h3 className="categorias-title">Atletas por Categoría</h3>
                <div className="categorias-grid">
                    {categoriasStats.length === 0 ? (
                        <div className="no-categorias">
                            No hay atletas inscritos por categoría
                        </div>
                    ) : (
                        categoriasStats.map(([catId, count]) => (
                            <Card key={catId} className="categoria-card">
                                <div className="categoria-content">
                                    <div className="categoria-value">{count}</div>
                                    <div className="categoria-label">
                                        {getCategoriaLabel(parseInt(catId))}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Lista de inscritos */}
            <Card className="inscritos-section">
                <h3 className="section-title">Atletas Inscritos</h3>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Atleta</th>
                                <th>Club</th>
                                <th>Categoría</th>
                                <th>Fecha Inscripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inscripciones.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center">
                                        No hay atletas inscritos en este evento
                                    </td>
                                </tr>
                            ) : (
                                inscripciones.map(inscripcion => (
                                    <tr key={inscripcion.idInscripcion} className="clickable-row">
                                        <td>{inscripcion.nombreCompleto}</td>
                                        <td>{inscripcion.nombreClub || '-'}</td>
                                        <td>
                                            {inscripcion.categoria !== null ?
                                                getCategoriaLabel(inscripcion.categoria) : '-'
                                            }
                                        </td>
                                        <td>
                                            {inscripcion.fechaInscripcion ?
                                                new Date(inscripcion.fechaInscripcion).toLocaleDateString() : '-'
                                            }
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default EventoDetalle;