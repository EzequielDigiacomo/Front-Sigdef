import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import Modal from '../../../components/common/Modal'; // Importar Modal
import { Plus, Edit, Trash2, Search, AlertTriangle } from 'lucide-react';
import '../Atletas/Atletas.css';
import './Evento.css';

const EventosList = () => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para el Modal de Eliminación
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [eventoToDelete, setEventoToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        loadEventos();
    }, []);

    const loadEventos = async () => {
        try {
            const dataResumen = await api.get('/Evento');

            // Enriquecer con detalles para tener fechas de inscripción
            const dataDetallada = await Promise.all(dataResumen.map(async (ev) => {
                try {
                    return await api.get(`/Evento/${ev.idEvento}`);
                } catch (err) {
                    console.error(`Error cargando detalle evento ${ev.idEvento}`, err);
                    return ev;
                }
            }));

            // Ordenar: Futuros/Actuales primero, Pasados al final
            const now = new Date();
            const sortedData = dataDetallada.sort((a, b) => {
                const endA = new Date(a.fechaFin);
                const endB = new Date(b.fechaFin);
                const isPastA = endA < now;
                const isPastB = endB < now;

                if (isPastA && !isPastB) return 1;
                if (!isPastA && isPastB) return -1;
                return endA - endB; // Ordenar por fecha dentro del mismo grupo
            });

            setEventos(sortedData);
        } catch (error) {
            console.error('Error cargando eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDeleteModal = (evento, e) => {
        e.stopPropagation();
        setEventoToDelete(evento);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!eventoToDelete) return;

        setDeleting(true);
        try {
            // Intento 1: Borrado normal
            await api.delete(`/Evento/${eventoToDelete.idEvento}`);

            // Éxito inmediato
            setEventos(prev => prev.filter(ev => ev.idEvento !== eventoToDelete.idEvento));
            setShowDeleteModal(false);
            setEventoToDelete(null);
        } catch (error) {
            console.warn('Borrado normal falló, intentando limpieza de dependencias...', error);

            // Si falla, asumimos que es por dependencias (FK). Intentamos limpiar.
            try {
                // 1. Obtener inscripciones ESPECÍFICAS de este evento (Endpoint optimizado)
                let inscripcionesDelEvento = [];
                try {
                    inscripcionesDelEvento = await api.get(`/Inscripcion/evento/${eventoToDelete.idEvento}`);
                } catch (err) {
                    // Si falla (ej: 404 porque no hay), asumimos array vacío
                    console.log('No se encontraron inscripciones o error al buscarlas:', err);
                    inscripcionesDelEvento = [];
                }

                if (inscripcionesDelEvento && inscripcionesDelEvento.length > 0) {
                    console.log(`Eliminando ${inscripcionesDelEvento.length} inscripciones vinculadas...`);
                    // 2. Borrar inscripciones en paralelo
                    await Promise.all(inscripcionesDelEvento.map((i) =>
                        api.delete(`/Inscripcion/${i.idInscripcion}`)
                    ));
                }

                // 3. Intento 2: Borrar evento nuevamente
                await api.delete(`/Evento/${eventoToDelete.idEvento}`);

                // Éxito tras limpieza
                setEventos(prev => prev.filter(ev => ev.idEvento !== eventoToDelete.idEvento));
                setShowDeleteModal(false);
                setEventoToDelete(null);

            } catch (cleanupError) {
                console.error('Error fatal al limpiar y eliminar evento:', cleanupError);
                alert('No se pudo eliminar el evento ni sus dependencias. Contacte a soporte.');
            }
        } finally {
            setDeleting(false);
        }
    };

    // 🔹 FUNCIÓN PARA MANEJAR CLICK EN FILA
    const handleRowClick = (eventoId) => {
        navigate(`/dashboard/eventos/${eventoId}`);
    };

    // Filtrar eventos por término de búsqueda
    const eventosFiltrados = eventos.filter(evento =>
        evento.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helpers para el modal
    const isInscripcionAbierta = eventoToDelete && eventoToDelete.fechaFinInscripciones
        ? new Date(eventoToDelete.fechaFinInscripciones) >= new Date()
        : false;

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">Gestión de Eventos</h2>
                <Button onClick={() => navigate('/dashboard/eventos/nuevo')}>
                    <Plus size={20} /> Nuevo Evento
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar evento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Fechas del Evento</th>
                                <th>Período Inscripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="text-center">Cargando...</td></tr>
                            ) : eventosFiltrados.map((evento) => {
                                const isPast = new Date(evento.fechaFin) < new Date();
                                return (
                                    <tr
                                        key={evento.idEvento}
                                        className="clickable-row"
                                        onClick={() => handleRowClick(evento.idEvento)}
                                        style={{
                                            cursor: 'pointer',
                                            ...(isPast ? { opacity: 0.6, backgroundColor: '#f9fafb20' } : {})
                                        }}
                                    >
                                        <td>
                                            <strong>{evento.nombre}</strong>
                                            {isPast && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(Finalizado)</span>}
                                        </td>
                                        <td>
                                            {new Date(evento.fechaInicio).toLocaleDateString()} - {new Date(evento.fechaFin).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {evento.fechaInicioInscripciones && evento.fechaFinInscripciones ? (
                                                <>
                                                    {new Date(evento.fechaInicioInscripciones).toLocaleDateString()} al {new Date(evento.fechaFinInscripciones).toLocaleDateString()}
                                                </>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/dashboard/eventos/editar/${evento.idEvento}`);
                                                    }}
                                                >
                                                    <Edit size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-danger"
                                                    onClick={(e) => handleOpenDeleteModal(evento, e)}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal de Confirmación de Eliminación */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirmar Eliminación"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', width: '100%' }}>
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={handleConfirmDelete} isLoading={deleting}>
                            {isInscripcionAbierta ? 'Sí, eliminar de todas formas' : 'Eliminar Evento'}
                        </Button>
                    </div>
                }
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        color: isInscripcionAbierta ? 'var(--warning)' : 'var(--danger)',
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <AlertTriangle size={48} />
                    </div>

                    <h4 style={{ marginBottom: '1rem' }}>
                        ¿Está seguro que desea eliminar el evento "{eventoToDelete?.nombre}"?
                    </h4>

                    {isInscripcionAbierta && (
                        <div style={{
                            backgroundColor: 'rgba(255, 193, 7, 0.1)',
                            border: '1px solid var(--warning)',
                            borderRadius: '8px',
                            padding: '1rem',
                            color: 'var(--warning)',
                            marginBottom: '1rem'
                        }}>
                            <strong>⚠️ ¡Atención!</strong>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                Las inscripciones para este evento están actualmente <strong>ABIERTAS</strong>.
                                Eliminarlo podría causar inconsistencias si ya hay atletas inscritos.
                            </p>
                        </div>
                    )}

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Esta acción no se puede deshacer. Se eliminarán permanentemente todos los datos asociados.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default EventosList;
