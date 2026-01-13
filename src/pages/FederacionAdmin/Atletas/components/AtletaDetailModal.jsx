import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Plus, FileText } from 'lucide-react';
import { api } from '../../../../services/api';
import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { getCategoriaLabel, getEstadoPagoLabel, getEstadoPagoColor } from '../../../../utils/enums';
import AssignTutorModal from './AssignTutorModal';

const AtletaDetailModal = ({ isOpen, onClose, athlete, onRefresh, returnPath = '/dashboard/atletas' }) => {
    const navigate = useNavigate();
    const [tutorInfo, setTutorInfo] = useState(athlete?.tutorInfo || null);
    const [loadingTutor, setLoadingTutor] = useState(false);
    const [showAssignTutorModal, setShowAssignTutorModal] = useState(false);
    const [updatingPago, setUpdatingPago] = useState(false);

    // Fetch tutor info if not provided and athlete is minor
    useEffect(() => {
        if (isOpen && athlete && athlete.edad < 18 && !athlete.tutorInfo) {
            fetchTutorInfo();
        } else if (athlete?.tutorInfo) {
            setTutorInfo(athlete.tutorInfo);
        }
    }, [isOpen, athlete]);

    const fetchTutorInfo = async () => {
        setLoadingTutor(true);
        try {
            const relRes = await api.get('/AtletaTutor');
            const relacion = relRes.find(r => (r.idAtleta || r.IdAtleta) === athlete.idPersona);
            if (relacion) {
                const tutorRes = await api.get(`/Persona/${relacion.idTutor || relacion.IdTutor}`);
                setTutorInfo({
                    id: relacion.idTutor || relacion.IdTutor,
                    nombre: tutorRes.nombre || tutorRes.Nombre,
                    apellido: tutorRes.apellido || tutorRes.Apellido,
                    documento: tutorRes.documento || tutorRes.Documento,
                    telefono: tutorRes.telefono || tutorRes.Telefono
                });
            } else {
                setTutorInfo(null);
            }
        } catch (error) {
            console.error('Error fetching tutor info:', error);
            setTutorInfo(null);
        } finally {
            setLoadingTutor(false);
        }
    };

    if (!athlete) return null;

    const handleAssignSuccess = () => {
        fetchTutorInfo();
        if (onRefresh) onRefresh();
    };

    const handleUpdatePago = async (nuevoEstado) => {
        setUpdatingPago(true);
        try {
            // Obtener el atleta completo para no perder datos en el PUT
            const fullAtleta = await api.get(`/Atleta/${athlete.idPersona}`);

            const payload = {
                ...fullAtleta,
                estadoPago: parseInt(nuevoEstado)
            };

            await api.put(`/Atleta/${athlete.idPersona}`, payload);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error actualizando estado de pago:', error);
            alert('Error al actualizar el estado de pago');
        } finally {
            setUpdatingPago(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Detalle del Atleta"
                size="large"
                footer={
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                        <Button variant="secondary" onClick={onClose}>Cerrar</Button>

                        {athlete.edad < 18 && !tutorInfo && !loadingTutor && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        onClose();
                                        navigate(`/dashboard/atletas/editar/${athlete.idPersona}`, {
                                            state: { returnPath, focusTutor: true }
                                        });
                                    }}
                                >
                                    <Plus size={18} /> Nuevo Tutor
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => setShowAssignTutorModal(true)}
                                >
                                    <Plus size={18} /> Elegir Tutor Existente
                                </Button>
                            </>
                        )}

                        <Button
                            variant="primary"
                            onClick={() => {
                                onClose();
                                navigate(`/dashboard/atletas/editar/${athlete.idPersona}`, {
                                    state: { returnPath }
                                });
                            }}
                        >
                            <Edit size={18} /> Editar Atleta
                        </Button>
                    </div>
                }
            >
                <div id="modal-content-export" className="atleta-detail-grid" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="atleta-detail-header" style={{ textAlign: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.2rem' }}>
                        <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.15rem' }}>Ficha del Atleta</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>SIGDEF - Sistema de Gestión Deportiva</p>
                    </div>

                    <div>
                        <label className="detail-label">Nombre Completo</label>
                        <div className="detail-value">{athlete.nombrePersona || `${athlete.nombre} ${athlete.apellido}`}</div>
                    </div>
                    <div>
                        <label className="detail-label">Documento</label>
                        <div className="detail-value">{athlete.documento || athlete.Documento}</div>
                    </div>
                    <div>
                        <label className="detail-label">Club</label>
                        <div className="detail-value">{athlete.nombreClub || 'Agente Libre'}</div>
                    </div>
                    <div>
                        <label className="detail-label">Categoría</label>
                        <div className="detail-value">{getCategoriaLabel(athlete.categoria)}</div>
                    </div>

                    {athlete.edad < 18 && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="detail-label">Tutor</label>
                            <div className="detail-value">
                                {loadingTutor ? (
                                    <span style={{ color: 'var(--text-secondary)' }}>Cargando datos del tutor...</span>
                                ) : tutorInfo ? (
                                    <>
                                        {tutorInfo.nombre} {tutorInfo.apellido}<br />
                                        DNI: {tutorInfo.documento}<br />
                                        Tel: {tutorInfo.telefono || 'N/A'}
                                    </>
                                ) : (
                                    <span style={{ color: 'var(--warning)', fontWeight: 500 }}>⚠️ Sin tutor asignado</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="detail-label">Selección Nacional</label>
                        <div className="detail-value">
                            {athlete.perteneceSeleccion ? (
                                <span className="badge badge-success">Sí</span>
                            ) : (
                                <span className="badge badge-secondary">No</span>
                            )}
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <label className="detail-label">Estado de Pago</label>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <select
                                className="form-input"
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.875rem',
                                    width: 'auto',
                                    backgroundColor: `var(--bg-secondary)`,
                                    border: `1px solid var(--border-color)`
                                }}
                                value={athlete.estadoPago}
                                onChange={(e) => handleUpdatePago(e.target.value)}
                                disabled={updatingPago}
                            >
                                <option value={0}>Pendiente</option>
                                <option value={1}>Pagado</option>
                                <option value={2}>Vencido</option>
                                <option value={3}>Parcial</option>
                            </select>
                            {updatingPago && <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>}
                        </div>
                    </div>

                    <div>
                        <label className="detail-label">Fecha de Nacimiento</label>
                        <div className="detail-value">
                            {athlete.fechaNacimiento ? new Date(athlete.fechaNacimiento).toLocaleDateString() : '-'}
                            {athlete.edad !== null && ` (${athlete.edad} años)`}
                        </div>
                    </div>
                </div>
            </Modal>

            {showAssignTutorModal && (
                <AssignTutorModal
                    isOpen={showAssignTutorModal}
                    onClose={() => setShowAssignTutorModal(false)}
                    athlete={athlete}
                    onSuccess={handleAssignSuccess}
                />
            )}
        </>
    );
};

export default AtletaDetailModal;
