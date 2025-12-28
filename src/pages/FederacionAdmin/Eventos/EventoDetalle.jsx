import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Calendar, Users, Shield, Trash2, Edit, MapPin, DollarSign, Info } from 'lucide-react';
import { getCategoriaLabel } from '../../../utils/enums';
import './EventoDetalle.css';

const EventoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [evento, setEvento] = useState(null);
    const [inscripciones, setInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);

    const tipoEventoMap = {
        1: 'Carrera Oficial',
        2: 'Campeonato',
        3: 'Recreativo',
        4: 'Entrenamiento',
        5: 'Clasificatorio'
    };

    const distanciaRegataMap = {
        1: '200 Metros',
        2: '350 Metros',
        3: '400 Metros',
        4: '500 Metros',
        5: '1000 Metros',
        6: '2 Kilómetros',
        7: '3 Kilómetros',
        8: '5 Kilómetros',
        9: '10 Kilómetros',
        10: '15 Kilómetros',
        11: '22 Kilómetros',
        12: '25 Kilómetros',
        13: '32 Kilómetros',

        'DoscientosMetros': '200 Metros',
        'TrecientosCincuentaMetros': '350 Metros',
        'QuatroCientosMetros': '400 Metros',
        'QuinientosMetros': '500 Metros',
        'MilMetros': '1000 Metros',
        'DosKilometros': '2 Kilómetros',
        'TresKilometros': '3 Kilómetros',
        'CincoKilometros': '5 Kilómetros',
        'DiezKilometros': '10 Kilómetros',
        'QuinceKilometros': '15 Kilómetros',
        'VeintiDosKilometros': '22 Kilómetros',
        'VeintiCincoKilometros': '25 Kilómetros',
        'TreintaDosKilometros': '32 Kilómetros'
    };

    useEffect(() => {
        loadEventoDetalle();
    }, [id]);

    const loadEventoDetalle = async () => {
        try {
            const eventoData = await api.get(`/Evento/${id}`);
            setEvento(eventoData);

            const inscripcionesData = await api.get(`/Inscripcion/evento/${id}`);

            const atletasData = await api.get('/Atleta');

            const inscripcionesConDetalles = await Promise.all(inscripcionesData.map(async (inscripcion) => {
                const atleta = atletasData.find(a => a.idPersona === inscripcion.idAtleta);
                let nombreCompleto = 'Desconocido';

                if (atleta) {

                    try {
                        const persona = await api.get(`/Persona/${atleta.idPersona}`);
                        if (persona && persona.nombre && persona.apellido) {
                            nombreCompleto = `${persona.nombre} ${persona.apellido}`;
                        } else if (atleta.nombrePersona) {
                            nombreCompleto = atleta.nombrePersona;
                        }
                    } catch (err) {
                        console.error(`Error cargando persona ${atleta.idPersona}`, err);

                        if (atleta.nombrePersona) {
                            nombreCompleto = atleta.nombrePersona;
                        }
                    }
                }

                return {
                    ...inscripcion,
                    categoria: atleta ? atleta.categoria : null,
                    nombreCompleto
                };
            }));

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
                navigate('/dashboard/eventos');
            } catch (error) {
                console.error('Error eliminando evento:', error);
                alert('Error al eliminar el evento');
            }
        }
    };

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
            { }
            <div className="evento-header">
                <div className="evento-header-left">
                    <Button variant="ghost" onClick={() => navigate('/dashboard/eventos')} className="back-button">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="evento-title-section">
                        <h1 className="evento-title">{evento.nombre}</h1>
                        <div className="evento-badges">
                            <span className="badge badge-primary">{tipoEventoMap[evento.tipoEvento] || 'Evento'}</span>
                            {evento.tieneCronometraje && <span className="badge badge-info">Cronometraje</span>}
                        </div>
                    </div>
                </div>
                <div className="evento-actions">
                    <Button variant="secondary" onClick={() => navigate(`/dashboard/eventos/${id}/distancias`)}>
                        <Calendar size={18} /> Cronograma
                    </Button>
                    <Button variant="primary" onClick={() => navigate(`/dashboard/eventos/editar/${id}`)}>
                        <Edit size={18} /> Editar
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        <Trash2 size={18} /> Eliminar
                    </Button>
                </div>
            </div>

            <div className="evento-grid">
                { }
                <div className="evento-details-column">
                    <Card className="detail-card">
                        <h3><Info size={20} /> Información General</h3>
                        <p className="evento-description">{evento.descripcion || 'Sin descripción'}</p>

                        <div className="detail-row">
                            <MapPin size={24} />
                            <strong>Ubicación</strong>
                            <p>{evento.ubicacion || '-'}</p>
                        </div>

                        {evento.ciudad && (
                            <div className="detail-row">
                                <div style={{ width: 24 }}></div> {/* Spacer for icon alignment if needed, or use MapPin again */}
                                <strong>Ciudad</strong>
                                <p>{evento.ciudad}</p>
                            </div>
                        )}

                        {evento.provincia && (
                            <div className="detail-row">
                                <div style={{ width: 24 }}></div>
                                <strong>Provincia</strong>
                                <p>{evento.provincia}</p>
                            </div>
                        )}

                        <div className="detail-row">
                            <DollarSign size={24} />
                            <strong>Precio Base</strong>
                            <p>${evento.precioBase}</p>
                        </div>

                        <div className="detail-row">
                            <Users size={24} />
                            <strong>Cupo</strong>
                            <p>{inscripciones.length} / {evento.cupoMaximo} inscritos</p>
                        </div>

                        {evento.observaciones && (
                            <div className="detail-row" style={{ alignItems: 'flex-start', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <Info size={24} />
                                <div>
                                    <strong>Observaciones</strong>
                                    <p style={{ marginTop: '0.25rem' }}>{evento.observaciones}</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card className="detail-card">
                        <h3><Calendar size={20} /> Fechas Importantes</h3>
                        <div className="fechas-grid">
                            <div className="fecha-item">
                                <span className="label">Inicio Evento</span>
                                <span className="value">{new Date(evento.fechaInicio).toLocaleDateString()}</span>
                            </div>
                            <div className="fecha-item">
                                <span className="label">Fin Evento</span>
                                <span className="value">{new Date(evento.fechaFin).toLocaleDateString()}</span>
                            </div>
                            <div className="fecha-item">
                                <span className="label">Inicio Inscripciones</span>
                                <span className="value">{evento.fechaInicioInscripciones ? new Date(evento.fechaInicioInscripciones).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className="fecha-item">
                                <span className="label">Cierre Inscripciones</span>
                                <span className="value">{evento.fechaFinInscripciones ? new Date(evento.fechaFinInscripciones).toLocaleDateString() : '-'}</span>
                            </div>
                        </div>
                    </Card>


                </div>

                { }
                <div className="evento-inscritos-column">
                    <Card className="inscritos-section">
                        <h3 className="section-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Atletas Inscritos ({inscripciones.length})</h3>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Atleta</th>
                                        <th>Club</th>
                                        <th>Categoría</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inscripciones.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="text-center">
                                                No hay atletas inscritos
                                            </td>
                                        </tr>
                                    ) : (
                                        inscripciones.map(inscripcion => (
                                            <tr key={inscripcion.idInscripcion}>
                                                <td>{inscripcion.nombreCompleto}</td>
                                                <td>{inscripcion.nombreClub || '-'}</td>
                                                <td>
                                                    {inscripcion.categoria !== null ?
                                                        getCategoriaLabel(inscripcion.categoria) : '-'
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
            </div>
        </div>
    );
};

export default EventoDetalle;
