import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User, Calendar, Award, DollarSign } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import Modal from '../../../components/common/Modal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import DataTable from '../../../components/common/DataTable';
import { useDevice } from '../../../hooks/useDevice';
import MobileCard from '../../../components/common/MobileCard';
import { getEstadoPagoLabel, getEstadoPagoColor, getCategoriaLabel, CATEGORIA_MAP, PARENTESCO_MAP } from '../../../utils/enums';
import { getCategoryByAge } from '../../../utils/categoryConfig';
import './ClubAtletas.css';

const ClubAtletas = () => {
    const { isNative } = useDevice();
    const { user } = useAuth();
    // ... rest of component
    const navigate = useNavigate();
    const [atletas, setAtletas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAtleta, setSelectedAtleta] = useState(null);
    const [atletaDetails, setAtletaDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [atletaToDelete, setAtletaToDelete] = useState(null);
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    // Payment State
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrLink, setQrLink] = useState('');

    const handlePagarAfiliacionAtleta = async (atleta) => {
        try {
            setIsProcessingPayment(true);
            const currentYear = new Date().getFullYear();

            const pagoData = {
                concepto: `Afiliación Anual Atleta ${currentYear} - ${atleta.nombrePersona}`,
                monto: 30000,
                idClub: user.idClub,
                idPersona: atleta.idPersona,
                estado: 0 // Pendiente
            };

            const response = await api.post('/PagoTransaccion/preferencia', pagoData);

            if (response.paymentUrl) {
                setQrLink(response.paymentUrl);
                setShowQRModal(true);
            } else {
                setFeedbackModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'No se pudo generar el link de pago',
                    type: 'danger'
                });
            }
        } catch (error) {
            console.error('Error al iniciar pago:', error);
            setFeedbackModal({
                isOpen: true,
                title: 'Error',
                message: 'Error al iniciar el proceso de pago',
                type: 'danger'
            });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // States for "Assign Existing Tutor"
    const [showSelectTutorModal, setShowSelectTutorModal] = useState(false);
    const [existingTutores, setExistingTutores] = useState([]);
    const [selectedTutorIdToAssign, setSelectedTutorIdToAssign] = useState('');
    const [loadingTutores, setLoadingTutores] = useState(false);

    useEffect(() => {
        const clubId = user?.IdClub || user?.idClub || user?.club?.id;
        if (clubId) fetchAtletas(clubId);
    }, [user]);

    const fetchAtletas = async (clubId) => {
        try {
            setLoading(true);
            const personasPromise = api.get('/Persona');
            let data = [];
            try {
                data = await api.get(`/Atleta/club/${clubId}`, { silentErrors: true });
            } catch (e1) {
                data = await api.get('/Atleta');
                data = data.filter(a => String(a.idClub) === String(clubId));
            }
            const personas = await personasPromise;
            const personasMap = new Map(personas.map(p => [p.idPersona, p]));
            const enrichedData = (data || []).map(atleta => {
                const persona = personasMap.get(atleta.idPersona);
                return {
                    ...atleta,
                    nombrePersona: persona ? `${persona.nombre} ${persona.apellido}` : (atleta.nombrePersona || '-'),
                    documento: persona ? persona.documento : (atleta.documento || '-')
                };
            });
            setAtletas(enrichedData);
        } catch (error) {
            console.error('Error cargando atletas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpdate = async () => {
        const clubId = user?.IdClub || user?.idClub || user?.club?.id;
        if (!clubId) return;

        setFeedbackModal({
            isOpen: true,
            title: 'Confirmar Actualización',
            message: '¿Estás seguro de marcar a TODOS los atletas de tu club como PAGADO?',
            type: 'info',
            confirmText: 'Sí, Actualizar',
            onConfirm: async () => {
                setFeedbackModal(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                try {
                    for (const atleta of atletas) {
                        if (atleta.estadoPago !== 1) {
                            await api.put(`/Atleta/${atleta.idPersona}`, { ...atleta, estadoPago: 1 });
                        }
                    }
                    setFeedbackModal({
                        isOpen: true,
                        title: 'Éxito',
                        message: 'Se han actualizado los estados de pago correctamente.',
                        type: 'success',
                        showCancel: false
                    });
                    fetchAtletas(clubId);
                } catch (error) {
                    console.error('Error en actualización masiva:', error);
                    setFeedbackModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'No se pudieron actualizar algunos atletas.',
                        type: 'danger',
                        showCancel: false
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleDeleteClick = (atleta) => {
        setAtletaToDelete(atleta);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!atletaToDelete) return;
        try {
            await api.delete(`/Atleta/${atletaToDelete.idPersona}`);
            setAtletas(atletas.filter(a => a.idPersona !== atletaToDelete.idPersona));
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

    const handleCardClick = async (atleta) => {
        setSelectedAtleta(atleta);
        setShowModal(true);
        setLoadingDetails(true);
        try {
            const persona = await api.get(`/Persona/${atleta.idPersona}`);
            setAtletaDetails({ ...atleta, personaCompleta: persona });
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedAtleta(null);
        setAtletaDetails(null);
    };

    const getCategoriaTexto = (categoria) => {
        return getCategoriaLabel(categoria);
    };

    const filteredAtletas = atletas.filter(atleta => (atleta.nombrePersona || '').toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className={`club-atletas ${isNative ? 'mobile-view' : ''}`}>
            <div className="page-header">
                <div>
                    <h1 className="text-gradient">Atletas</h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" onClick={handleBulkUpdate} disabled={loading}>
                        Marcar Pagados
                    </Button>
                    <Button variant="primary" icon={Plus} onClick={() => navigate('/club/atletas/nuevo')}>
                        {isNative ? 'Nuevo' : 'Agregar Atleta'}
                    </Button>
                </div>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="dark-focused" />
                </div>

                {isNative ? (
                    <div className="mobile-list-container">
                        {filteredAtletas.length === 0 ? (
                            <p className="text-center">Sin resultados</p>
                        ) : (
                            filteredAtletas.map(atleta => (
                                <MobileCard 
                                    key={atleta.idPersona}
                                    title={atleta.nombrePersona}
                                    subtitle={atleta.documento}
                                    badge={<span className={`badge badge-${getEstadoPagoColor(atleta.estadoPago)}`}>
                                        {getEstadoPagoLabel(atleta.estadoPago)}
                                    </span>}
                                    details={[
                                        { label: 'Categoría', value: getCategoriaLabel(atleta.categoria) },
                                        { label: 'Apto', value: atleta.presentoAptoMedico ? '✅' : '❌' }
                                    ]}
                                    actions={
                                        <Button variant="ghost" size="sm" icon={Edit} onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/club/atletas/editar/${atleta.idPersona}`);
                                        }} />
                                    }
                                    onClick={() => handleCardClick(atleta)}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <DataTable
                        columns={[
                            { key: 'nombrePersona', label: 'Nombre' },
                            { key: 'documento', label: 'DNI' },
                            { key: 'categoria', label: 'Categoría', render: (value) => getCategoriaTexto(value) },
                            {
                                key: 'estadoPago', label: 'Estado Pago',
                                render: (value) => <span className={`badge badge-${getEstadoPagoColor(value)}`}>{getEstadoPagoLabel(value)}</span>
                            },
                            { key: 'perteneceSeleccion', label: 'Selección', render: (value) => value ? '⭐ Sí' : 'No' },
                            { key: 'presentoAptoMedico', label: 'Apto Médico', render: (value) => value ? '✅ Presentado' : '❌ Pendiente' }
                        ]}
                        data={filteredAtletas}
                        loading={loading}
                        onRowClick={handleCardClick}
                        actions={(atleta) => (
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" icon={Edit} onClick={(e) => { e.stopPropagation(); navigate(`/club/atletas/editar/${atleta.idPersona}`); }} />
                                <Button variant="danger" size="sm" icon={Trash2} onClick={(e) => { e.stopPropagation(); handleDeleteClick(atleta); }} />
                            </div>
                        )}
                    />
                )}
            </Card>

            {/* Modal de detalles */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={`Detalles de ${selectedAtleta?.nombrePersona || 'Atleta'}`}
            >
                {loadingDetails ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner"></div>
                        <p>Cargando detalles...</p>
                    </div>
                ) : atletaDetails ? (
                    <div className="atleta-details-modal">
                        <div className="detail-section">
                            <h4><User size={18} /> Información Personal</h4>
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <span className="label">Nombre Completo:</span>
                                    <span className="value">{atletaDetails.nombrePersona}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">DNI:</span>
                                    <span className="value">{atletaDetails.personaCompleta?.dni || 'No especificado'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Fecha de Nacimiento:</span>
                                    <span className="value">
                                        {atletaDetails.personaCompleta?.fechaNacimiento
                                            ? new Date(atletaDetails.personaCompleta.fechaNacimiento).toLocaleDateString('es-AR')
                                            : 'No especificada'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Sexo:</span>
                                    <span className="value">{atletaDetails.personaCompleta?.sexo || 'No especificado'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4><Phone size={18} /> Contacto</h4>
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <Phone size={16} />
                                    <span className="value">{atletaDetails.personaCompleta?.telefono || 'No especificado'}</span>
                                </div>
                                <div className="detail-row">
                                    <Mail size={16} />
                                    <span className="value">{atletaDetails.personaCompleta?.email || 'No especificado'}</span>
                                </div>
                                <div className="detail-row">
                                    <MapPin size={16} />
                                    <span className="value">{atletaDetails.personaCompleta?.direccion || 'No especificada'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4><Award size={18} /> Información Deportiva</h4>
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <span className="label">Categoría:</span>
                                    <span className="value">{getCategoriaTexto(atletaDetails.categoria)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Pertenece a Selección:</span>
                                    <span className="value">{atletaDetails.perteneceSeleccion ? '⭐ Sí' : 'No'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Estado de Pago:</span>
                                    <span className={`badge badge-${getEstadoPagoColor(atletaDetails.estadoPago)}`}>
                                        {getEstadoPagoLabel(atletaDetails.estadoPago)}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Apto Médico:</span>
                                    <span className="value">
                                        {atletaDetails.presentoAptoMedico
                                            ? `✅ Presentado (${new Date(atletaDetails.fechaAptoMedico).toLocaleDateString('es-AR')})`
                                            : '❌ Pendiente'}
                                    </span>
                                </div>
                                <div className="detail-row" style={{ alignItems: 'center' }}>
                                    <span className="label">Cuota Anual:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span className={`badge badge-${getEstadoPagoColor(atletaDetails.estadoPago)}`}>
                                            {getEstadoPagoLabel(atletaDetails.estadoPago)}
                                        </span>
                                        {atletaDetails.estadoPago !== 1 && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handlePagarAfiliacionAtleta(atletaDetails)}
                                                disabled={isProcessingPayment}
                                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                                            >
                                                {isProcessingPayment ? '...' : 'Pagar ($30.000)'} <DollarSign size={14} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {atletaDetails.montoBeca > 0 && (
                                    <div className="detail-row">
                                        <span className="label">Beca:</span>
                                        <span className="value">
                                            ${atletaDetails.montoBeca}
                                            {atletaDetails.becadoEnard && ' (ENARD)'}
                                            {atletaDetails.becadoSdn && ' (SDN)'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><Users size={18} /> Tutor</span>
                                {atletaDetails.tutor && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        icon={Trash2}
                                        onClick={handleUnlinkTutor}
                                        title="Desvincular tutor"
                                        style={{ padding: '0.25rem 0.5rem' }}
                                    />
                                )}
                            </h4>
                            {atletaDetails.tutor ? (
                                <div className="detail-grid">
                                    <div className="detail-row">
                                        <span className="label">Nombre:</span>
                                        <span className="value">{atletaDetails.tutor.nombre || 'No especificado'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Phone size={16} />
                                        <span className="value">{atletaDetails.tutor.telefono || 'No especificado'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Mail size={16} />
                                        <span className="value">{atletaDetails.tutor.email || 'No especificado'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                        Este atleta no tiene tutor asignado
                                    </p>
                                    <Button
                                        variant="primary"
                                        icon={Plus}
                                        onClick={() => {
                                            handleCloseModal();
                                            navigate(`/club/tutores/nuevo?atletaId=${atletaDetails.idPersona}`);
                                        }}
                                    >
                                        Agregar Nuevo Tutor
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        icon={Users}
                                        onClick={() => {
                                            setShowSelectTutorModal(true);
                                            fetchClubTutores();
                                        }}
                                        style={{ marginLeft: '10px' }}
                                    >
                                        Asignar Existente
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <Button
                                variant="secondary"
                                icon={Edit}
                                onClick={() => {
                                    handleCloseModal();
                                    navigate(`/club/atletas/editar/${atletaDetails.idPersona}`);
                                }}
                            >
                                Editar Atleta
                            </Button>
                            <Button
                                variant="danger"
                                icon={Trash2}
                                onClick={() => {
                                    handleCloseModal();
                                    handleDeleteClick(atletaDetails);
                                }}
                            >
                                Eliminar
                            </Button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            {/* Modal para Seleccionar Tutor Existente */}
            <Modal
                isOpen={showSelectTutorModal}
                onClose={() => setShowSelectTutorModal(false)}
                title="Asignar Tutor Existente"
            >
                <div className="p-4">
                    <p style={{ marginBottom: '1rem' }}>Selecciona un tutor de la lista (familiares de otros atletas del club):</p>

                    {loadingTutores ? (
                        <div className="spinner"></div>
                    ) : (
                        <select
                            className="form-input"
                            value={selectedTutorIdToAssign}
                            onChange={(e) => setSelectedTutorIdToAssign(e.target.value)}
                            style={{ width: '100%', marginBottom: '1rem' }}
                        >
                            <option value="">-- Seleccionar Tutor --</option>
                            {existingTutores.map(t => (
                                <option key={t.idPersona} value={t.idPersona}>
                                    {t.nombreCompleto} (DNI: {t.documento || '-'})
                                </option>
                            ))}
                        </select>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="secondary" onClick={() => setShowSelectTutorModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleAssignTutor} disabled={!selectedTutorIdToAssign}>Asignar</Button>
                    </div>
                </div>
            </Modal>

            {/* QR Modal */}
            <Modal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                title="Escanear QR para Pagar"
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '1.5rem' }}>
                    <p style={{ textAlign: 'center', color: '#ccc' }}>
                        Escanea este código QR con la App de Mercado Pago o tu billetera virtual favorita.
                    </p>

                    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                        {qrLink && <QRCodeCanvas value={qrLink} size={250} />}
                    </div>

                    <div style={{ width: '100%', textAlign: 'center' }}>
                        <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>¿Prefieres pagar en el navegador?</p>
                        <Button
                            variant="primary"
                            onClick={() => window.open(qrLink, '_blank')}
                            style={{ width: '100%' }}
                        >
                            Ir a Mercado Pago
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setAtletaToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Eliminar Atleta"
                message={`¿Estás seguro de que deseas eliminar a ${atletaToDelete?.nombrePersona || 'este atleta'}?`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
            />

            <ConfirmationModal
                isOpen={feedbackModal.isOpen}
                onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                onConfirm={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                title={feedbackModal.title}
                message={feedbackModal.message}
                confirmText="Entendido"
                showCancel={false}
                type={feedbackModal.type || 'info'}
            />
        </div >
    );
};

export default ClubAtletas;