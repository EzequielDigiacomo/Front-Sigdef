import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Plus, FileText, XCircle, Eye } from 'lucide-react';
import { api } from '../../../../services/api';
import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import DocumentUploadModal from '../../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../../components/common/DocumentViewerModal';
import { CATEGORIA_MAP, getCategoriaLabel, getEstadoPagoColor } from '../../../../utils/enums';
import AssignTutorModal from './AssignTutorModal';
import { buildAtletaUpdatePayload, getParticipanteId } from '../../../../utils/atletaUtils';
import './AtletaDetailModal.css';

const selectBadgeStyle = {
    fontSize: '0.7rem',
    padding: '0px 20px 0px 6px',
    border: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 4px center',
    backgroundSize: '12px',
};

const AtletaDetailModal = ({ isOpen, onClose, athlete, onRefresh, returnPath = '/dashboard/atletas' }) => {
    const navigate = useNavigate();
    const [localAthlete, setLocalAthlete] = useState(athlete);
    const [savingField, setSavingField] = useState(null);
    const [tutores, setTutores] = useState([]);
    const [loadingTutor, setLoadingTutor] = useState(false);
    const [showAssignTutorModal, setShowAssignTutorModal] = useState(false);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [existingDocuments, setExistingDocuments] = useState([]);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'danger',
    });

    useEffect(() => {
        if (isOpen && athlete) {
            setLocalAthlete(athlete);
        }
    }, [isOpen, athlete]);

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
                            parentesco: rel.idParentesco || rel.IdParentesco,
                        };
                    } catch {
                        return { idTutor: tutorId, nombre: 'Error', apellido: 'al cargar' };
                    }
                });
                setTutores(await Promise.all(tutoresPromesas));
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

    const showError = (message) => {
        setConfirmModal({
            isOpen: true,
            title: 'Error',
            message,
            type: 'danger',
            showCancel: false,
            onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
        });
    };

    const showSuccess = (message) => {
        setConfirmModal({
            isOpen: true,
            title: 'Cambio guardado',
            message,
            type: 'success',
            showCancel: false,
            onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
        });
    };

    const persistAtleta = async (overrides, fieldKey, successMessage) => {
        const base = localAthlete || athlete;
        const participanteId = getParticipanteId(base);
        if (participanteId == null) {
            throw new Error('No se pudo identificar al atleta.');
        }

        const updatedPayload = buildAtletaUpdatePayload(base, overrides);
        setSavingField(fieldKey);
        try {
            await api.put(`/Atleta/${participanteId}`, updatedPayload);
            setLocalAthlete((prev) => ({
                ...(prev || athlete),
                ...overrides,
                categoriaNombre: overrides.categoria != null
                    ? getCategoriaLabel(overrides.categoria)
                    : prev?.categoriaNombre,
            }));
            if (onRefresh) await onRefresh();
            if (successMessage) showSuccess(successMessage);
        } finally {
            setSavingField(null);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            const label = ({ 0: 'Pendiente', 1: 'Pagado', 2: 'Vencido', 3: 'Parcial' })[newStatus] || 'actualizado';
            await persistAtleta(
                { estadoPago: newStatus },
                'pago',
                `El estado de pago se actualizó a "${label}".`
            );
        } catch (error) {
            console.error('Error updating status:', error);
            showError('No se pudo actualizar el estado de pago.');
        }
    };

    const handleUpdateSeleccion = async (rawValue) => {
        const perteneceSeleccion = String(rawValue) === '1';
        const current = localAthlete || athlete;
        const categoria = current.categoria ?? current.Categoria ?? null;

        if (perteneceSeleccion && (categoria == null || categoria === '' || Number(categoria) === 0)) {
            showError('Asigná una categoría antes de incluir al atleta en Selección Nacional.');
            return;
        }

        try {
            const catLabel = getCategoriaLabel(categoria) || 'su categoría';
            await persistAtleta(
                { perteneceSeleccion, categoria },
                'seleccion',
                perteneceSeleccion
                    ? `El atleta ahora pertenece a Selección Nacional en la categoría ${catLabel}.`
                    : 'El atleta ya no pertenece a Selección Nacional.'
            );
        } catch (error) {
            console.error('Error updating selección:', error);
            showError('No se pudo actualizar la pertenencia a Selección Nacional.');
        }
    };

    const handleUpdateCategoria = async (rawValue) => {
        const categoria = rawValue === '' || rawValue == null ? null : Number(rawValue);
        const current = localAthlete || athlete;
        const perteneceSeleccion = !!(current.perteneceSeleccion ?? current.PerteneceSeleccion);

        if (perteneceSeleccion && !categoria) {
            showError('Un atleta en Selección Nacional debe tener categoría asignada.');
            return;
        }

        try {
            const catLabel = categoria ? getCategoriaLabel(categoria) : 'Sin asignar';
            await persistAtleta(
                { categoria, perteneceSeleccion },
                'categoria',
                perteneceSeleccion
                    ? `Categoría actualizada a "${catLabel}". El atleta figura en Selección Nacional en esa categoría.`
                    : `Categoría actualizada a "${catLabel}".`
            );
        } catch (error) {
            console.error('Error updating categoría:', error);
            showError('No se pudo actualizar la categoría.');
        }
    };

    const handleUnlinkTutor = (idRelacion, idTutor) => {
        setConfirmModal({
            isOpen: true,
            title: 'Desvincular Tutor',
            message: '¿Estás seguro de desvincular este tutor del atleta?',
            type: 'danger',
            onConfirm: () => executeUnlink(idRelacion, idTutor),
        });
    };

    const executeUnlink = async (idRelacion, idTutor) => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
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
            showError('No se pudo desvincular el tutor.');
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

    const view = localAthlete || athlete;
    const perteneceSeleccion = !!(view.perteneceSeleccion ?? view.PerteneceSeleccion);
    const categoriaValue = view.categoria ?? view.Categoria ?? '';
    const edadNum = Number(view.edad);
    const hasEdad = Number.isFinite(edadNum) && edadNum >= 0 && edadNum <= 120;

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
                                    state: { returnPath },
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
                        <div className="detail-value">
                            {view.nombrePersona || `${view.nombre || ''} ${view.apellido || ''}`.trim() || '—'}
                        </div>
                    </div>
                    <div>
                        <label className="detail-label">Documento</label>
                        <div className="detail-value">{view.documento || view.Documento || '—'}</div>
                    </div>
                    <div>
                        <label className="detail-label">Club</label>
                        <div className="detail-value">{view.nombreClub || 'Agente Libre'}</div>
                    </div>

                    <div>
                        <label className="detail-label">Categoría</label>
                        <div className="detail-value">
                            <select
                                value={categoriaValue === null || categoriaValue === undefined ? '' : String(categoriaValue)}
                                onChange={(e) => handleUpdateCategoria(e.target.value)}
                                disabled={savingField === 'categoria'}
                                className="badge badge-secondary"
                                style={selectBadgeStyle}
                                title={perteneceSeleccion ? 'Categoría en la que integra Selección Nacional' : 'Categoría del atleta'}
                            >
                                <option value="" style={{ backgroundColor: '#4b5563', color: 'white' }}>Sin asignar</option>
                                {Object.entries(CATEGORIA_MAP).map(([id, label]) => (
                                    <option key={id} value={id} style={{ backgroundColor: '#4b5563', color: 'white' }}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            {perteneceSeleccion && (
                                <div className="detail-hint">
                                    En Selección Nacional figura en {getCategoriaLabel(categoriaValue) || 'su categoría'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="detail-label">Selección Nacional</label>
                        <div className="detail-value">
                            <select
                                value={perteneceSeleccion ? '1' : '0'}
                                onChange={(e) => handleUpdateSeleccion(e.target.value)}
                                disabled={savingField === 'seleccion'}
                                className={`badge ${perteneceSeleccion ? 'badge-success' : 'badge-secondary'}`}
                                style={selectBadgeStyle}
                            >
                                <option value="0" style={{ backgroundColor: '#4b5563', color: 'white' }}>No</option>
                                <option value="1" style={{ backgroundColor: '#059669', color: 'white' }}>Sí</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="detail-label">Estado de Pago</label>
                        <div className="detail-value">
                            <select
                                value={view.estadoPago ?? 0}
                                onChange={(e) => handleUpdateStatus(parseInt(e.target.value, 10))}
                                disabled={savingField === 'pago'}
                                className={`badge badge-${getEstadoPagoColor(view.estadoPago)}`}
                                style={selectBadgeStyle}
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
                            {view.fechaNacimiento ? new Date(view.fechaNacimiento).toLocaleDateString() : '—'}
                            {hasEdad ? ` (${edadNum} años)` : ''}
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
                                        <div
                                            key={idx}
                                            style={{
                                                padding: '0.3rem 0.6rem',
                                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-color)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
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
                                    <div
                                        style={{
                                            padding: '0.3rem 0.6rem',
                                            backgroundColor: 'var(--warning-light)',
                                            color: 'var(--warning)',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
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
                onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
            />
        </>
    );
};

export default AtletaDetailModal;
