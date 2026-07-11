import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import { Plus, Edit, Trash2, Search, Award, CheckCircle, XCircle, Eye } from 'lucide-react';
import DataTable from '../../../components/common/DataTable';
import { useDevice } from '../../../hooks/useDevice';
import MobileCard from '../../../components/common/MobileCard';
import '../Entrenadores/ClubEntrenadores.css';

const ClubEntrenadores = () => {
    const { isNative } = useDevice();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [entrenadores, setEntrenadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entrenadorToDelete, setEntrenadorToDelete] = useState(null);
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });

    // Document Modals State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedEntrenadorForDocs, setSelectedEntrenadorForDocs] = useState(null);
    const [existingDocuments, setExistingDocuments] = useState([]);

    useEffect(() => {
        const clubId = user?.IdClub || user?.idClub || user?.club?.id;
        if (clubId) fetchEntrenadores(clubId);
        else setLoading(false);
    }, [user]);

    const fetchEntrenadores = async (clubId) => {
        try {
            setLoading(true);
            const todosEntrenadores = await api.get('/Entrenador');

            const clubEntrenadores = todosEntrenadores.filter(e => {
                const eClubId = e.idClub ?? e.IdClub;
                return String(eClubId) === String(clubId);
            });

            const enrichedData = clubEntrenadores.map(entrenador => {
                const trainerId = entrenador.participanteId ?? entrenador.ParticipanteId ?? entrenador.idPersona ?? entrenador.IdPersona;

                return {
                    ...entrenador,
                    idPersona: trainerId,
                    participanteId: trainerId,
                    nombrePersona: entrenador.nombrePersona || entrenador.NombrePersona || '-',
                    documento: entrenador.documento || entrenador.Documento || '-',
                    email: entrenador.email || entrenador.Email || '-',
                    telefono: entrenador.telefono || entrenador.Telefono || '-',
                    licencia: entrenador.licencia || entrenador.Licencia || '-',
                };
            });

            setEntrenadores(enrichedData);
        } catch (error) {
            console.error('Error fetching entrenadores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (entrenador) => {
        setEntrenadorToDelete(entrenador);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!entrenadorToDelete) return;
        try {
            await api.delete(`/Entrenador/${entrenadorToDelete.idPersona}`);
            setEntrenadores(entrenadores.filter(e => e.idPersona !== entrenadorToDelete.idPersona));
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Error eliminando:', error);
        }
    };

    const loadDocuments = async (personId) => {
        try {
            const docs = await api.get(`/Documentacion/persona/${personId}`);
            setExistingDocuments(docs || []);
        } catch (error) {
            console.error('Error cargando documentos:', error);
        }
    };

    const filteredEntrenadores = entrenadores.filter(entrenador =>
        entrenador.nombrePersona?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className={`club-entrenadores ${isNative ? 'mobile-view' : ''}`}>
            <div className="page-header">
                <h2 className="page-title">{isNative ? 'Entrenadores' : 'Mis Entrenadores'}</h2>
                <Button onClick={() => navigate('/club/entrenadores/nuevo')} variant="primary" icon={Plus}>
                    {isNative ? 'Nuevo' : 'Nuevo Entrenador'}
                </Button>
            </div>

            <Card className="mb-4">
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="dark-focused" />
                </div>
            </Card>

            {isNative ? (
                <div className="mobile-list-container">
                    {filteredEntrenadores.length === 0 ? (
                        <p className="text-center">No hay entrenadores registrados</p>
                    ) : (
                        filteredEntrenadores.map(entrenador => (
                            <MobileCard 
                                key={entrenador.idPersona}
                                title={entrenador.nombrePersona}
                                subtitle={entrenador.email}
                                badge={entrenador.licencia ? <span className="badge badge-secondary">{entrenador.licencia}</span> : null}
                                details={[
                                    { label: 'DNI', value: entrenador.documento || '-' },
                                    { label: 'Tel', value: entrenador.telefono || '-' }
                                ]}
                                    actions={
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" icon={Edit} onClick={() => navigate(`/club/entrenadores/editar/${entrenador.idPersona}`)} />
                                            <Button variant="ghost" size="sm" icon={Plus} onClick={() => { setSelectedEntrenadorForDocs(entrenador); loadDocuments(entrenador.idPersona); setShowUploadModal(true); }} />
                                            <Button variant="ghost" size="sm" icon={Eye} onClick={() => { setSelectedEntrenadorForDocs(entrenador); setShowViewerModal(true); }} />
                                        </div>
                                    }
                            />
                        ))
                    )}
                </div>
            ) : (
                <DataTable
                    columns={[
                        { key: 'nombrePersona', label: 'Nombre' },
                        { key: 'documento', label: 'DNI', render: (val) => val || '-' },
                        { key: 'licencia', label: 'Licencia', render: (val) => val || '-' },
                        { key: 'email', label: 'Email', render: (val) => val || '-' },
                        { key: 'telefono', label: 'Teléfono', render: (val) => val || '-' },
                        {
                            key: 'documentacion', label: 'Documentación',
                            render: (value, entrenador) => (
                                <div className="flex items-center justify-center gap-2">
                                    <Button variant="ghost" size="sm" className="p-1 h-auto" title="Subir" onClick={(e) => { e.stopPropagation(); setSelectedEntrenadorForDocs(entrenador); loadDocuments(entrenador.idPersona); setShowUploadModal(true); }}><Plus size={18} className="text-primary" /></Button>
                                    <Button variant="ghost" size="sm" className="p-1 h-auto" title="Ver" onClick={(e) => { e.stopPropagation(); setSelectedEntrenadorForDocs(entrenador); setShowViewerModal(true); }}><Eye size={18} className="text-primary" /></Button>
                                </div>
                            )
                        }
                    ]}
                    data={filteredEntrenadores}
                    loading={loading}
                    emptyMessage="No hay entrenadores registrados"
                    actions={(entrenador) => (
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" icon={Edit} onClick={() => navigate(`/club/entrenadores/editar/${entrenador.idPersona}`)} />
                            <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteClick(entrenador)} />
                        </div>
                    )}
                />
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setEntrenadorToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Eliminar Entrenador"
                message={`¿Estás seguro de que deseas eliminar a ${entrenadorToDelete?.nombrePersona || 'este entrenador'}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
            />

            <ConfirmationModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                onConfirm={() => setErrorModal({ ...errorModal, isOpen: false })}
                title={errorModal.title}
                message={errorModal.message}
                confirmText="Entendido"
                showCancel={false}
                type="danger"
            />

            {/* Document Upload Modal */}
            {showUploadModal && selectedEntrenadorForDocs && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedEntrenadorForDocs(null);
                    }}
                    onSuccess={() => {
                        const clubId = user?.IdClub || user?.idClub || user?.club?.id;
                        if (clubId) fetchEntrenadores(clubId);
                    }}
                    personName={selectedEntrenadorForDocs.nombrePersona}
                    personId={selectedEntrenadorForDocs.idPersona}
                    existingDocuments={existingDocuments}
                />
            )}

            {/* Document Viewer Modal */}
            {showViewerModal && selectedEntrenadorForDocs && (
                <DocumentViewerModal
                    isOpen={showViewerModal}
                    onClose={() => {
                        setShowViewerModal(false);
                        setSelectedEntrenadorForDocs(null);
                    }}
                    personName={selectedEntrenadorForDocs.nombrePersona}
                    personDocumento={selectedEntrenadorForDocs.documento || selectedEntrenadorForDocs.dni}
                    personId={selectedEntrenadorForDocs.idPersona}
                />
            )}
        </div>
    );
};

export default ClubEntrenadores;