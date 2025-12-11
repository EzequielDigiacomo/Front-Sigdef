import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import ConfirmationModal from './ConfirmationModal';
import { api } from '../../services/api';
import { TIPO_DOCUMENTO_MAP } from '../../utils/enums';
import './DocumentUploadModal.css';

const DocumentUploadModal = ({ isOpen, onClose, onSuccess, personId, personName, existingDocuments = [] }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [docType, setDocType] = useState('0'); // Default to DNI Frente
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleFileSelect = (file) => {
        console.log('📁 Archivo seleccionado:', file.name, 'Tamaño:', file.size, 'bytes');

        // Validate type
        if (!file.type.match('image.*') && file.type !== 'application/pdf') {
            alert('Solo se permiten imágenes (JPG, PNG) o PDF.');
            return;
        }
        // Validate size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('El archivo es demasiado grande (Máx 5MB).');
            return;
        }

        setSelectedFile(file);

        // Crear preview para todas las imágenes
        if (file.type.match('image.*')) {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    console.log('✅ Preview cargado exitosamente');
                    setPreviewUrl(e.target.result);
                };
                reader.onerror = (error) => {
                    console.error('❌ Error al cargar preview:', error);
                    setPreviewUrl(null);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('❌ Error en FileReader:', error);
                setPreviewUrl(null);
            }
        } else {
            console.log('ℹ️ No se crea preview (archivo PDF)');
            setPreviewUrl(null); // No preview para PDFs
        }
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = async () => {
        if (!selectedFile || !personId) return;

        // Verificar si ya existe un documento de este tipo
        const documentoExistente = existingDocuments.find(
            doc => doc.tipoDocumento === parseInt(docType)
        );

        if (documentoExistente) {
            setShowDuplicateModal(true);
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('personaId', personId);
            formData.append('tipoDocumento', docType);

            // This endpoint must be implemented in the backend
            const response = await api.upload('/Documentacion/upload', formData);

            // Limpiar el formulario
            setSelectedFile(null);
            setPreviewUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            // Mostrar modal de éxito
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error uploading document:', error);
            // Mostrar modal de error
            setErrorMessage(error.message || 'Error desconocido');
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`Subir Documentación - ${personName}`}
                size="medium"
                variant="form"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="ghost" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpload}
                            disabled={!selectedFile || loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} /> Subiendo...
                                </>
                            ) : (
                                'Guardar Documento'
                            )}
                        </Button>
                    </div>
                }
            >
                <div className="p-1">
                    <div className="mb-4">
                        <label className="form-group-label">Tipo de Documento</label>
                        <select
                            className="doc-type-select"
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            disabled={loading}
                        >
                            {Object.entries(TIPO_DOCUMENTO_MAP).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {!selectedFile ? (
                        <div
                            className="upload-area"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*,.pdf"
                                hidden
                            />
                            <div className="upload-placeholder">
                                <UploadCloud size={48} className="text-primary" />
                                <p className="font-medium text-lg">Haga clic o arrastre un archivo aquí</p>
                                <p className="text-sm">Soporta JPG, PNG, PDF (Máx 5MB)</p>
                            </div>
                        </div>
                    ) : (
                        <div className="upload-preview text-center">
                            {previewUrl ? (
                                <div className="relative inline-block">
                                    <img src={previewUrl} alt="Preview" className="preview-image" />
                                    <button className="remove-file-btn" onClick={handleRemoveFile} title="Quitar archivo">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="p-6 bg-secondary-alpha rounded-md relative border border-secondary flex flex-col items-center gap-2">
                                    <button className="remove-file-btn" onClick={handleRemoveFile} title="Quitar archivo">
                                        <X size={14} />
                                    </button>
                                    <FileText size={48} className="text-primary" />
                                    <span className="font-medium">{selectedFile.name}</span>
                                    <span className="text-xs text-secondary">{Math.round(selectedFile.size / 1024)} KB</span>
                                </div>
                            )}
                            <p className="mt-2 text-sm text-success font-medium flex items-center justify-center gap-1">
                                <ImageIcon size={14} /> Listo para subir
                            </p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Modal de Éxito */}
            <ConfirmationModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    if (onSuccess) onSuccess();
                    onClose();
                }}
                onConfirm={() => {
                    setShowSuccessModal(false);
                    if (onSuccess) onSuccess();
                    onClose();
                }}
                title="Documento subido correctamente"
                message="El documento se ha cargado exitosamente."
                type="success"
                confirmText="Aceptar"
                showCancel={false}
            />

            {/* Modal de Error */}
            <ConfirmationModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                onConfirm={() => setShowErrorModal(false)}
                title="Error al subir documento"
                message={`No se pudo subir el documento. ${errorMessage}`}
                type="danger"
                confirmText="Aceptar"
                showCancel={false}
            />
            {/* Modal de Advertencia - Documento Duplicado */}
            {/* Modal de Error */}
            <ConfirmationModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                onConfirm={() => setShowErrorModal(false)}
                title="Error al subir documento"
                message={`No se pudo subir el documento. ${errorMessage}`}
                type="danger"
                confirmText="Aceptar"
                showCancel={false}
            />

            {/* Modal de Advertencia - Documento Duplicado */}
            <ConfirmationModal
                isOpen={showDuplicateModal}
                onClose={() => setShowDuplicateModal(false)}
                onConfirm={() => setShowDuplicateModal(false)}
                title="Documento ya existe"
                message={`Ya existe un documento de tipo "${TIPO_DOCUMENTO_MAP[docType]}" cargado. Por favor, elimine el documento existente antes de subir uno nuevo.`}
                type="info"
                confirmText="Entendido"
                showCancel={false}
            />
        </>
    );
};

export default DocumentUploadModal;

