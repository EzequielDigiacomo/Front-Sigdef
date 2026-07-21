import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Plus, FileText, XCircle, Eye } from 'lucide-react';
import { api } from '../../../../services/api';
import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import DocumentUploadModal from '../../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../../components/common/DocumentViewerModal';
import { getCategoriaLabel, getEstadoPagoLabel, getEstadoPagoColor } from '../../../../utils/enums';
import AssignTutorModal from './AssignTutorModal';
import { buildAtletaUpdatePayload, getParticipanteId } from '../../../../utils/atletaUtils';
import './AtletaDetailModal.css';

const AtletaDetailModal = ({ isOpen, onClose, athlete, onRefresh, returnPath = '/dashboard/atletas' }) => {
    const navigate = useNavigate();
    const [tutores, setTutores] = useState([]);
    const [loadingTutor, setLoadingTutor] = useState(false);
    const [showAssignTutorModal, setShowAssignTutorModal] = useState(false);
    
    // Documentation State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [existingDocuments, setExistingDocuments] = useState([]);
    
    // Confirmation Modal States
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'danger'
    });

    // Fetch tutor info if athlete is minor
    useEffect(() => {
        if (isOpen && athlete && athlete.edad < 18) {
            fetchTutorInfo();
        } else {
            setTutores([]);
        }
    }, [isOpen, athlete]);

    const fetchTutorInfo = async () => {
        setLoadingTutor(true);
        try {
            const relRes = await api.get('/AtletaTutor');
            const relaciones = (relRes || []).filter((r) => {
                const relAtletaId = Number(
                    r.idAtleta ?? r.IdAtleta ?? r.participanteId ?? r.ParticipanteId
                );
                return relAtletaId === Number(athlete.idPersona ?? athlete.participanteId);
            });

            if (relaciones.length > 0) {
                const tutoresPromesas = relaciones.map(async (rel) => {
                    const tutorId = rel.idTutor || rel.IdTutor;
                    try {
                        const tutorRes = await api.get(`/Persona/${tutorId}`);
                        return {
                            idRelacion: rel.id || rel.idAtletaTutor,
                            idTutor: tutorId,
                            nombre: tutorRes.nombre || tutorRes.Nombre,
                            apellido: tutorRes.apellido || tutorRes.Apellido,
                            documento: tutorRes.documento || tutorRes.Documento,
                            telefono: tutorRes.telefono || tutorRes.Telefono,
                            parentesco: rel.idParentesco || rel.IdParentesco
                        };
                    } catch (err) {
                        return { idTutor: tutorId, nombre: 'Error', apellido: 'al cargar' };
                    }
                });
                const data = await Promise.all(tutoresPromesas);
                setTutores(data);
            } else {
                setTutores([]);
            }
        } catch (error) {
            console.error('Error fetching tutor info:', error);
            setTutores([]);
        } finally {
            setLoadingTutor(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            const participanteId = getParticipanteId(athlete);
            const updatedPayload = buildAtletaUpdatePayload(athlete, { estadoPago: newStatus });

            await api.put(`/Atleta/${participanteId}`, updatedPayload);
            
            // Update local state if needed (or just refresh)
            if (onRefresh) onRefresh();
            onClose(); // Close to show refresh in grid
        } catch (error) {
            console.error('Error updating status:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'No se pudo actualizar el estado de pago.',
                type: 'danger',
                showCancel: false,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const handleUnlinkTutor = (idRelacion, idTutor) => {
        setConfirmModal({
            isOpen: true,
            title: 'Desvincular Tutor',
            message: '¿Estás seguro de desvincular este tutor del atleta?',
            type: 'danger',
            onConfirm: () => executeUnlink(idRelacion, idTutor)
        });
    };

    const executeUnlink = async (idRelacion, idTutor) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
            if (idRelacion) {
                await api.delete(`/AtletaTutor/${idRelacion}`);
            } else {
                await api.delete(`/AtletaTutor/${athlete.idPersona}/${idTutor}`);
            }
            fetchTutorInfo();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error unlinking tutor:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'No se pudo desvincular el tutor.',
                type: 'danger',
                showCancel: false,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const loadDocuments = async () => {
        try {
            const docs = await api.get(`/Documentacion/persona/${athlete.idPersona}`);
            setExistingDocuments(docs || []);
        } catch (error) {
            console.error('Error cargando documentos:', error);
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
                    <div className="atleta-ficha-footer-actions">
                        <Button variant="secondary" onClick={onClose}>Cerrar</Button>

                        {athlete.edad < 18 && (
                            <Button
                                variant="primary"
                                onClick={() => setShowAssignTutorModal(true)}
                                icon={Plus}
                            >
                                {tutores.length > 0 ? 'Agregar otro Tutor' : 'Asignar Tutor'}
                            </Button>
                        )}

                        <Button
                            variant="primary"
                            onClick={() => {
                                onClose();
                                navigate(`/dashboard/atletas/editar/${athlete.idPersona}`, {
                                    state: { returnPath }
                                });
                            }}
                            icon={Edit}
                        >
                            Editar Atleta
                        </Button>
                    </div>
                }
            >
                <div id="modal-content-export" className="atleta-ficha">
                    <div className="atleta-ficha-header">
                        <h2>
                            <FileText size={18} /> Ficha del Atleta
                        </h2>
                        <p>SIGDEF - Sistema de Gestión Deportiva</p>
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
                    <div>
                        <label className="detail-label">Selección Nacional</label>
                        <div className="detail-value">
                            {athlete.perteneceSeleccion ? (
                                <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0px 6px' }}>Sí</span>
                            ) : (
                                <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0px 6px' }}>No</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="detail-label">Estado de Pago</label>
                        <div className="detail-value">
                            <select 
                                value={athlete.estadoPago ?? 0}
                                onChange={(e) => handleUpdateStatus(parseInt(e.target.value))}
                                className={`badge badge-${getEstadoPagoColor(athlete.estadoPago)}`}
                                style={{ 
                                    fontSize: '0.7rem', 
                                    padding: '0px 20px 0px 6px', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 4px center',
                                    backgroundSize: '12px'
                                }}
                            >
                                <option value={0} style={{ backgroundColor: '#4b5563', color: 'white' }}>Pendiente</option>
                                <option value={1} style={{ backgroundColor: '#059669', color: 'white' }}>Pagado</option>
                                <option value={2} style={{ backgroundColor: '#dc2626', color: 'white' }}>Vencido</option>
                                <option value={3} style={{ backgroundColor: '#d97706', color: 'white' }}>Parcial</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="detail-label">Fecha de Nacimiento</label>
                        <div className="detail-value">
                            {athlete.fechaNacimiento ? new Date(athlete.fechaNacimiento).toLocaleDateString() : '-'}
                            {athlete.edad !== null && ` (${athlete.edad} años)`}
                        </div>
                    </div>

                    {athlete.edad < 18 && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="detail-label">Tutor(es) Responsables</label>
                            <div className="detail-value" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {loadingTutor ? (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Cargando...</span>
                                ) : tutores.length > 0 ? (
                                    tutores.map((t, idx) => (
                                        <div key={idx} style={{ 
                                            padding: '0.3rem 0.6rem', 
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                                            borderRadius: '4px',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ fontSize: '0.8rem' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{t.nombre} {t.apellido}</span>
                                                <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '0.75rem' }}>
                                                    DNI: {t.documento} | Tel: {t.telefono || 'N/A'}
                                                </span>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-danger" 
                                                onClick={() => handleUnlinkTutor(t.idRelacion, t.idTutor)}
                                                style={{ padding: '0px' }}
                                            >
                                                <XCircle size={12} />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ 
                                        padding: '0.3rem 0.6rem', 
                                        backgroundColor: 'var(--warning-light)', 
                                        color: 'var(--warning)', 
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        ⚠️ Sin tutor asignado
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="atleta-ficha-docs">
                        <label className="detail-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={14} /> Documentación del Atleta
                        </label>
                        <div className="atleta-ficha-docs-actions">
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={Eye}
                                onClick={() => setShowViewerModal(true)}
                            >
                                Ver / Gestionar
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                icon={Plus}
                                onClick={() => {
                                    loadDocuments();
                                    setShowUploadModal(true);
                                }}
                            >
                                Subir Nueva
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modales de Documentación */}
            {showUploadModal && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => {
                        if (onRefresh) onRefresh();
                        loadDocuments();
                    }}
                    personName={athlete.nombrePersona || `${athlete.nombre} ${athlete.apellido}`}
                    personId={athlete.idPersona}
                    existingDocuments={existingDocuments}
                />
            )}

            {showViewerModal && (
                <DocumentViewerModal
                    isOpen={showViewerModal}
                    onClose={() => setShowViewerModal(false)}
                    personName={athlete.nombrePersona || `${athlete.nombre} ${athlete.apellido}`}
                    personDocumento={athlete.documento || athlete.dni}
                    personId={athlete.idPersona}
                />
            )}

            {showAssignTutorModal && (
                <AssignTutorModal
                    isOpen={showAssignTutorModal}
                    onClose={() => setShowAssignTutorModal(false)}
                    athlete={athlete}
                    onSuccess={handleAssignSuccess}
                />
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.showCancel === false ? 'Aceptar' : 'Confirmar'}
                showCancel={confirmModal.showCancel !== false}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
};

export default AtletaDetailModal;
