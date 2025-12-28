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

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Detalle del Atleta"
                size="large"
                footer={
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                        <Button variant="secondary" onClick={onClose}>Cerrar</Button>

                        {athlete.edad < 18 && !tutorInfo && !loadingTutor && (
                            <>
                                <Button
                                    variant="warning"
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
                <div id="modal-content-export" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <h2 style={{ margin: 0, color: 'var(--primary)' }}>Ficha del Atleta</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>SIGDEF - Sistema de Gestión Deportiva</p>
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

                    <div>
                        <label className="detail-label">Estado de Pago</label>
                        <div>
                            <span className={`badge badge-${getEstadoPagoColor(athlete.estadoPago)}`}>
                                {getEstadoPagoLabel(athlete.estadoPago)}
                            </span>
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
