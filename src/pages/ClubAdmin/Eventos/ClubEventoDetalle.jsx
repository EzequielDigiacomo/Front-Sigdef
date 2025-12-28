import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Calendar, Users, Trash2, Edit, MapPin, DollarSign, Info, Route } from 'lucide-react';
import { getCategoriaEdadLabel, getDistanciaShortLabel, getSexoLabel, getCategoriaLabel } from '../../../utils/enums';

const ClubEventoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [evento, setEvento] = useState(null);
    const [inscripciones, setInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);

    // States for delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedInscripcionId, setSelectedInscripcionId] = useState(null);

    // Payment States
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const handlePagarInscripcion = async (inscripcion, e) => {
        if (e) e.stopPropagation();

        try {
            setIsProcessingPayment(true);
            const precio = evento.precioBase || 0; // Usar precio del evento

            const pagoData = {
                concepto: `Inscripción Evento: ${evento.nombre} - Atleta: ${inscripcion.nombreCompleto}`,
                monto: precio,
                idClub: user.idClub, // Fix: Usa el club del usuario que está pagando
                idPersona: inscripcion.idAtleta,
                estado: 0 // Pendiente
            };

            // NOTA: Si el pago es a la Federación, el IdClub debería ser el de la Federación o null/0.
            // Asumiendo que el 'idClub' en pagoData es quien realiza el pago (el club del atleta) o quien lo recibe?
            // Re-check Controller: pagoTransaccion.IdClub = pagoDto.IdClub.
            // Usualmente el PAGO lo hace una Persona o un Club. Aquí es el Club pagando por el atleta?
            // O el Atleta pagando?
            // "IdClub" en PagoTransaccion parece ser el ORIGEN (quien paga) si es un pago de club.
            // Si es inscripción, paga el Club?
            // Usaremos el Club del atleta (inscripcion.IdClub no está en el DTO listado, pero podemos sacarlo).

            // Fix: necesitamos el ID del Club del atleta.
            // En 'inscripciones' tenemos 'nombreClub'. Si no tenemos ID, usar el del usuario actual si es ClubAdmin viendo sus inscripciones.

            // Asumiendo que el usuario actual es el ClubAdmin que paga:
            // pagoData.idClub = user.clubId; (Necesitamos context user aquí)

            const response = await api.post('/PagoTransaccion/preferencia', pagoData);

            if (response.paymentUrl) {
                window.location.href = response.paymentUrl;
            } else {
                alert('Error generando link de pago');
            }
        } catch (error) {
            console.error('Error al iniciar pago:', error);
            alert('Error al iniciar pago');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const tipoEventoMap = {
        1: 'Carrera Oficial',
        2: 'Campeonato',
        3: 'Recreativo',
        4: 'Entrenamiento',
        5: 'Clasificatorio'
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

    const isInscriptionOpen = () => {
        if (!evento || !evento.fechaFinInscripciones) return false;
        const now = new Date();
        const deadline = new Date(evento.fechaFinInscripciones);
        const endOfDayDeadline = new Date(deadline);
        endOfDayDeadline.setHours(23, 59, 59, 999);
        return now <= endOfDayDeadline;
    };

    const handleDeleteInscripcion = (inscripcionId) => {
        setSelectedInscripcionId(inscripcionId);
        setShowDeleteModal(true);
    };

    const confirmDeleteInscripcion = async () => {
        if (!selectedInscripcionId) return;

        try {
            await api.delete(`/Inscripcion/${selectedInscripcionId}`);
            loadEventoDetalle();
            setShowDeleteModal(false);
            setSelectedInscripcionId(null);
        } catch (error) {
            console.error('Error al eliminar inscripción:', error);
            alert('Error al eliminar la inscripción. Intente nuevamente.');
            setShowDeleteModal(false);
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

    const canDelete = isInscriptionOpen();

    return (
        <div className="evento-detalle-container">
            <div className="evento-header">
                <div className="evento-header-left">
                    <Button variant="ghost" onClick={() => navigate('/club/eventos')} className="back-button">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="evento-title-section">
                        <h1 className="evento-title">{evento.nombre}</h1>
                        <div className="evento-badges">
                            <span className="badge badge-primary">{tipoEventoMap[evento.tipoEvento] || 'Evento'}</span>
                            {evento.tieneCronometraje && <span className="badge badge-info">Cronometraje</span>}
                            {evento.estado === 'FINALIZADO' && <span className="badge badge-finalizado">Finalizado</span>}
                        </div>
                    </div>
                </div>
                <div className="evento-actions">
                    <Button variant="primary" onClick={() => navigate(`/club/eventos/editar/${id}`)}>
                        <Edit size={18} /> Editar
                    </Button>
                </div>
            </div>

            <div className="evento-grid">
                <div className="evento-details-column">
                    <Card className="detail-card">
                        <h3><Info size={20} /> Información General</h3>
                        <p className="evento-description">{evento.descripcion || 'Sin descripción'}</p>

                        <div className="detail-row">
                            <MapPin size={24} />
                            <div>
                                <strong>Ubicación</strong>
                                <p>{evento.ubicacion || '-'} {evento.ciudad ? `, ${evento.ciudad}` : ''} {evento.provincia ? `, ${evento.provincia}` : ''}</p>
                            </div>
                        </div>

                        <div className="detail-row">
                            <DollarSign size={24} />
                            <div>
                                <strong>Precio Base</strong>
                                <p>${evento.precioBase}</p>
                            </div>
                        </div>

                        <div className="detail-row">
                            <Users size={24} />
                            <div>
                                <strong>Cupo</strong>
                                <p>{inscripciones.length} / {evento.cupoMaximo} inscritos</p>
                            </div>
                        </div>
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

                    {/* New Card for Distances/Categories Configuration */}
                    {(evento.distancias && evento.distancias.length > 0) && (
                        <Card className="detail-card">
                            <h3><Route size={20} /> Categorías y Distancias</h3>
                            <div className="table-responsive">
                                <table className="data-table" style={{ fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr>
                                            <th>Distancia</th>
                                            <th>Categoría</th>
                                            <th>Sexo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {evento.distancias.map((d, idx) => (
                                            <tr key={idx}>
                                                <td>{getDistanciaShortLabel(d.distancia)}</td>
                                                <td>{getCategoriaEdadLabel(d.categoria)}</td>
                                                <td>{d.sexo ? getSexoLabel(d.sexo) : 'Mixto/Todos'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>

                <div className="evento-inscritos-column">
                    <Card className="inscritos-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>Atletas Inscritos ({inscripciones.length})</h3>
                            <Button size="sm" onClick={() => navigate(`/club/inscripciones/nuevo?eventoId=${id}`)}>
                                <Users size={16} /> Inscribir Nuevo
                            </Button>
                        </div>

                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Atleta</th>
                                        <th>Club</th>
                                        <th>Categoría</th>
                                        <th>Estado Pago</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inscripciones.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center">
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
                                                <td>
                                                    {inscripcion.estadoPago === 1 ? (
                                                        <span className="badge badge-success">Pagado</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <span className="badge badge-warning">Pendiente</span>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(e) => handlePagarInscripcion(inscripcion, e)}
                                                                disabled={isProcessingPayment}
                                                                title="Pagar Inscripción"
                                                                style={{ padding: '2px 8px', height: '24px', fontSize: '0.75rem' }}
                                                            >
                                                                <DollarSign size={12} />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {canDelete ? (
                                                        <Button
                                                            variant="danger"
                                                            size="icon"
                                                            onClick={() => handleDeleteInscripcion(inscripcion.idInscripcion)}
                                                            title="Eliminar inscripción"
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    ) : (
                                                        <span title="Inscripciones cerradas" style={{ color: '#999', cursor: 'not-allowed', display: 'inline-flex', padding: '0.5rem' }}>
                                                            <Trash2 size={16} />
                                                        </span>
                                                    )}
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

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDeleteInscripcion}
                title="Eliminar Inscripción"
                message="¿Estás seguro de que deseas eliminar la inscripción de este atleta? Esta acción liberará un cupo en el evento."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};

export default ClubEventoDetalle;
