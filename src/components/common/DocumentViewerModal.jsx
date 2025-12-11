import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Trash2, Eye, Loader2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import ConfirmationModal from './ConfirmationModal';
import { api } from '../../services/api';
import { TIPO_DOCUMENTO_MAP } from '../../utils/enums';
import './DocumentViewerModal.css';

const DocumentViewerModal = ({ isOpen, onClose, personId, personName }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [showDeleteError, setShowDeleteError] = useState(false);
    const [docToDelete, setDocToDelete] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen && personId) {
            fetchDocuments();
        }
    }, [isOpen, personId]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const docs = await api.get(`/Documentacion/persona/${personId}`);
            setDocuments(docs || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (doc) => {
        setDocToDelete(doc);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!docToDelete) return;

        try {
            // El backend devuelve 'Id' (mayúscula) o 'id' (minúscula)
            const docId = docToDelete.id || docToDelete.Id || docToDelete.idDocumentacion;

            if (!docId) {
                throw new Error('No se pudo identificar el documento a eliminar');
            }

            await api.delete(`/Documentacion/${docId}`);
            setShowDeleteConfirm(false);
            setShowDeleteSuccess(true);
            setDocToDelete(null);
            fetchDocuments(); // Refresh list
        } catch (error) {
            console.error('Error deleting document:', error);

            // Mensaje amigable según el tipo de error
            let friendlyMessage = 'No se pudo eliminar el documento. Por favor, intente nuevamente.';

            if (error.message?.includes('404') || error.message?.includes('not found')) {
                friendlyMessage = 'El documento ya no existe o fue eliminado previamente.';
            } else if (error.message?.includes('403') || error.message?.includes('unauthorized')) {
                friendlyMessage = 'No tiene permisos para eliminar este documento.';
            } else if (error.message?.includes('Network') || error.message?.includes('network')) {
                friendlyMessage = 'Error de conexión. Verifique su conexión a internet.';
            }

            setErrorMessage(friendlyMessage);
            setShowDeleteConfirm(false);
            setShowDeleteError(true);
        }
    };

    const handlePreview = (doc) => {
        setSelectedDoc(doc);
        setShowPreview(true);
    };

    const handleDownload = (doc) => {
        // Open in new tab to download
        window.open(doc.urlArchivo, '_blank');
    };

    const renderPreview = () => {
        if (!selectedDoc) return null;

        const isImage = selectedDoc.urlArchivo?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const isPdf = selectedDoc.urlArchivo?.match(/\.pdf$/i);

        return (
            <Modal
                isOpen={showPreview}
                onClose={() => {
                    setShowPreview(false);
                    setSelectedDoc(null);
                }}
                title={TIPO_DOCUMENTO_MAP[selectedDoc.tipoDocumento] || 'Documento'}
                size="large"
                variant="document"
            >
                <div className="document-preview-container">
                    {isImage ? (
                        <img
                            src={selectedDoc.urlArchivo}
                            alt="Document preview"
                            className="document-preview-image"
                        />
                    ) : isPdf ? (
                        <iframe
                            src={selectedDoc.urlArchivo}
                            className="document-preview-iframe"
                            title="PDF Preview"
                        />
                    ) : (
                        <div className="text-center p-8">
                            <FileText size={64} className="text-secondary mx-auto mb-4" />
                            <p className="text-secondary">Vista previa no disponible</p>
                            <Button
                                variant="primary"
                                className="mt-4"
                                onClick={() => handleDownload(selectedDoc)}
                            >
                                <Download size={18} /> Descargar
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
        );
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`Documentos de ${personName}`}
                size="large"
                variant="document"
            >
                <div className="document-viewer-content">
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                            <p className="mt-2 text-secondary">Cargando documentos...</p>
                        </div>
                    ) : (
                        <div className="documents-list">
                            {Object.entries(TIPO_DOCUMENTO_MAP).map(([tipoId, tipoLabel]) => {
                                // Buscar si existe un documento de este tipo
                                const doc = documents.find(d => d.tipoDocumento === parseInt(tipoId));
                                const isLoaded = !!doc;

                                return (
                                    <div key={tipoId} className={`document-row ${!isLoaded ? 'document-row-empty' : ''}`}>
                                        {/* Column 1: Document Type */}
                                        <div className="document-type-column">
                                            <span className="document-type-label">
                                                {tipoLabel}
                                            </span>
                                            {isLoaded && (
                                                <span className="document-date">
                                                    {new Date(doc.fechaCarga).toLocaleDateString('es-AR')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Column 2: Thumbnail */}
                                        <div className="document-thumbnail-column">
                                            {isLoaded ? (
                                                doc.urlArchivo?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                    <div
                                                        className="document-thumbnail-small"
                                                        onClick={() => handlePreview(doc)}
                                                        title="Click para ver en tamaño completo"
                                                    >
                                                        <img
                                                            src={doc.urlArchivo}
                                                            alt="Miniatura"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="document-thumbnail-placeholder">
                                                        <FileText size={16} />
                                                    </div>
                                                )
                                            ) : (
                                                <span className="document-empty-indicator">-</span>
                                            )}
                                        </div>

                                        {/* Column 3: Actions */}
                                        <div className="document-actions-column">
                                            {isLoaded ? (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handlePreview(doc)}
                                                        title="Ver documento"
                                                    >
                                                        <Eye size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownload(doc)}
                                                        title="Descargar"
                                                    >
                                                        <Download size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-danger"
                                                        onClick={() => handleDelete(doc)}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </>
                                            ) : (
                                                <span className="document-empty-indicator">-</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Modal>

            {renderPreview()}

            {/* Modal de Confirmación - Eliminar */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setDocToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Confirmar eliminación"
                message={`¿Está seguro que desea eliminar el documento "${docToDelete ? TIPO_DOCUMENTO_MAP[docToDelete.tipoDocumento] : ''}"? Esta acción no se puede deshacer.`}
                type="danger"
                confirmText="Eliminar"
                cancelText="Cancelar"
                showCancel={true}
            />

            {/* Modal de Éxito - Eliminación */}
            <ConfirmationModal
                isOpen={showDeleteSuccess}
                onClose={() => setShowDeleteSuccess(false)}
                onConfirm={() => setShowDeleteSuccess(false)}
                title="Documento eliminado"
                message="El documento se ha eliminado correctamente."
                type="success"
                confirmText="Aceptar"
                showCancel={false}
            />

            {/* Modal de Error - Eliminación */}
            <ConfirmationModal
                isOpen={showDeleteError}
                onClose={() => setShowDeleteError(false)}
                onConfirm={() => setShowDeleteError(false)}
                title="Error al eliminar"
                message={`No se pudo eliminar el documento. ${errorMessage}`}
                type="danger"
                confirmText="Aceptar"
                showCancel={false}
            />
        </>
    );
};

export default DocumentViewerModal;
