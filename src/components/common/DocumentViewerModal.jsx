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

        return () => {
            setDocuments([]);
            setLoading(true);
        };
    }, [isOpen, personId]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/Documentacion/persona/${personId}`);

            console.log('API Response:', response);

            // Extraer documentos correctamente
            let docsArray = [];

            // Si response.data tiene documentos
            if (response && response.data && response.data.documentos &&
                Array.isArray(response.data.documentos)) {
                docsArray = response.data.documentos;
            }
            // Si response directamente tiene documentos
            else if (response && response.documentos && Array.isArray(response.documentos)) {
                docsArray = response.documentos;
            }
            // Si es directamente un array
            else if (Array.isArray(response)) {
                docsArray = response;
            }
            // Si response.data es directamente el array
            else if (response && response.data && Array.isArray(response.data)) {
                docsArray = response.data;
            }

            console.log('Documentos extraídos:', docsArray);
            setDocuments(docsArray);
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
        if (doc && doc.urlArchivo) {
            window.open(doc.urlArchivo, '_blank');
        }
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
                            {!Array.isArray(documents) ? (
                                <div className="text-center py-8 text-danger">
                                    <p>Error: Los documentos no se cargaron correctamente</p>
                                    <p className="text-sm mt-2">Tipo recibido: {typeof documents}</p>
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-8 text-secondary">
                                    No hay documentos cargados
                                </div>
                            ) : (
                                Object.entries(TIPO_DOCUMENTO_MAP).map(([tipoId, tipoLabel]) => {
                                    // DEBUG: Ver qué estamos comparando
                                    console.log('Comparando:', {
                                        tipoId,
                                        tipoLabel,
                                        tipoIdType: typeof tipoId,
                                        documents
                                    });

                                    // Buscar documento por tipoDocumento
                                    const doc = documents.find(d => {
                                        if (!d || d.tipoDocumento === undefined) return false;

                                        // Convertir ambos a string para comparación segura
                                        const docTipoStr = d.tipoDocumento.toString();
                                        const tipoIdStr = tipoId.toString();

                                        return docTipoStr === tipoIdStr;
                                    });

                                    const isLoaded = !!doc;

                                    // DEBUG: Ver si encontró el documento
                                    if (isLoaded) {
                                        console.log('Documento encontrado para tipo', tipoId, ':', doc);
                                    }

                                    return (
                                        <div key={tipoId} className={`document-row ${!isLoaded ? 'document-row-empty' : ''}`}>
                                            {/* Column 1: Document Type */}
                                            <div className="document-type-column">
                                                <span className="document-type-label">
                                                    {tipoLabel}
                                                </span>
                                                {isLoaded && doc.fechaCarga && (
                                                    <span className="document-date">
                                                        {new Date(doc.fechaCarga).toLocaleDateString('es-AR')}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Column 2: Thumbnail */}
                                            <div className="document-thumbnail-column">
                                                {isLoaded ? (
                                                    // Verificar si es imagen (jpg, jpeg, png, gif, webp)
                                                    doc.urlArchivo && doc.urlArchivo.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                        <div
                                                            className="document-thumbnail-small"
                                                            onClick={() => handlePreview(doc)}
                                                            title="Click para ver en tamaño completo"
                                                        >
                                                            <img
                                                                src={doc.urlArchivo}
                                                                alt={`Miniatura ${tipoLabel}`}
                                                                onError={(e) => {
                                                                    console.error('Error cargando miniatura:', doc.urlArchivo);
                                                                    e.target.style.display = 'none';
                                                                    // Crear placeholder en caso de error
                                                                    const placeholder = document.createElement('div');
                                                                    placeholder.className = 'document-thumbnail-placeholder';
                                                                    placeholder.innerHTML = '<FileText size={16} />';
                                                                    e.target.parentElement.appendChild(placeholder);
                                                                }}
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
                                })
                            )}
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