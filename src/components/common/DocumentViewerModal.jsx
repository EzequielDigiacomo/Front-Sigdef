import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Eye, Loader2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import ConfirmationModal from './ConfirmationModal';
import { api } from '../../services/api';
import { TIPO_DOCUMENTO_MAP } from '../../utils/enums';
import './DocumentViewerModal.css';

const getDocUrl = (doc) =>
    doc?.urlArchivo || doc?.UrlArchivo || doc?.url || doc?.Url || '';

const isImageUrl = (url) => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    if (/\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(url)) return true;
    // Cloudinary image delivery (a menudo sin extensión en el public_id)
    if (/\/image\/upload\//i.test(url)) return true;
    return false;
};

const isPdfUrl = (url) => {
    if (!url) return false;
    if (url.startsWith('data:application/pdf')) return true;
    if (/\.pdf(\?|#|$)/i.test(url)) return true;
    return false;
};

const sanitizeFilePart = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s.-]/g, '')
        .trim()
        .replace(/\s+/g, '_');

const getExtensionFromUrl = (url) => {
    if (!url) return 'jpg';
    if (url.startsWith('data:image/png')) return 'png';
    if (url.startsWith('data:image/gif')) return 'gif';
    if (url.startsWith('data:image/webp')) return 'webp';
    if (url.startsWith('data:application/pdf') || isPdfUrl(url)) return 'pdf';
    const match = url.match(/\.(jpg|jpeg|png|gif|webp|pdf)(\?|#|$)/i);
    if (match) return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    if (isImageUrl(url)) return 'jpg';
    return 'bin';
};

const buildDownloadFileName = ({ personName, personDocumento, tipoDocumento, url }) => {
    const nombre = sanitizeFilePart(personName) || 'persona';
    const documento = sanitizeFilePart(personDocumento) || 'sin_documento';
    const tipo = sanitizeFilePart(TIPO_DOCUMENTO_MAP[tipoDocumento] || `tipo_${tipoDocumento ?? 'doc'}`);
    const ext = getExtensionFromUrl(url);
    return `${nombre}_${documento}_${tipo}.${ext}`;
};

const DocumentViewerModal = ({ isOpen, onClose, personId, personName, personDocumento }) => {
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

            let docsArray = [];

            if (response && response.data && response.data.documentos &&
                Array.isArray(response.data.documentos)) {
                docsArray = response.data.documentos;
            } else if (response && response.documentos && Array.isArray(response.documentos)) {
                docsArray = response.documentos;
            } else if (Array.isArray(response)) {
                docsArray = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                docsArray = response.data;
            }

            const normalized = docsArray.map((doc) => ({
                ...doc,
                id: doc.id ?? doc.Id,
                tipoDocumento: doc.tipoDocumento ?? doc.TipoDocumento,
                urlArchivo: getDocUrl(doc),
                fechaCarga: doc.fechaCarga ?? doc.FechaCarga,
            }));

            setDocuments(normalized);
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
            const docId = docToDelete.id || docToDelete.Id || docToDelete.idDocumentacion;

            if (!docId) {
                throw new Error('No se pudo identificar el documento a eliminar');
            }

            await api.delete(`/Documentacion/${docId}`);
            setShowDeleteConfirm(false);
            setShowDeleteSuccess(true);
            setDocToDelete(null);
            fetchDocuments();
        } catch (error) {
            console.error('Error deleting document:', error);

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
        const url = getDocUrl(doc);
        if (!url) return;

        const fileName = buildDownloadFileName({
            personName,
            personDocumento,
            tipoDocumento: doc.tipoDocumento,
            url,
        });

        if (url.startsWith('data:')) {
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }

        // Forzar nombre también en URLs remotas (Cloudinary, etc.)
        fetch(url)
            .then((res) => res.blob())
            .then((blob) => {
                const objectUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(objectUrl);
            })
            .catch(() => {
                window.open(url, '_blank', 'noopener,noreferrer');
            });
    };

    const renderPreview = () => {
        if (!selectedDoc) return null;

        const url = getDocUrl(selectedDoc);
        const isImage = isImageUrl(url);
        const isPdf = isPdfUrl(url);

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
                            src={url}
                            alt="Document preview"
                            className="document-preview-image"
                        />
                    ) : isPdf ? (
                        <iframe
                            src={url}
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
                            {documents.length === 0 ? (
                                <div className="text-center py-8 text-secondary">
                                    No hay documentos cargados
                                </div>
                            ) : (
                                documents.map((doc, index) => {
                                    const tipoLabel = TIPO_DOCUMENTO_MAP[doc.tipoDocumento] || 'Documento';
                                    const url = getDocUrl(doc);
                                    const showThumb = isImageUrl(url);

                                    return (
                                        <div key={doc.id || index} className="document-row">
                                            <div className="document-type-column">
                                                <span className="document-type-label">
                                                    {tipoLabel}
                                                </span>
                                                {doc.fechaCarga && (
                                                    <span className="document-date">
                                                        {new Date(doc.fechaCarga).toLocaleDateString('es-AR')}
                                                        <span className="ml-1 text-xs opacity-50">
                                                            {new Date(doc.fechaCarga).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="document-thumbnail-column">
                                                {showThumb ? (
                                                    <div
                                                        className="document-thumbnail-small"
                                                        onClick={() => handlePreview(doc)}
                                                        title="Click para ver en tamaño completo"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Miniatura ${tipoLabel}`}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                const parent = e.target.parentElement;
                                                                if (parent && !parent.querySelector('.error-icon')) {
                                                                    const icon = document.createElement('div');
                                                                    icon.className = 'error-icon';
                                                                    icon.innerHTML = '⚠️';
                                                                    parent.appendChild(icon);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="document-thumbnail-placeholder">
                                                        <FileText size={16} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="document-actions-column">
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
