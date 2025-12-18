import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import ConfirmationModal from './ConfirmationModal';
import { api } from '../../services/api';
import { TIPO_DOCUMENTO_MAP } from '../../utils/enums';
import './DocumentUploadModal.css';

const DocumentUploadModal = ({ isOpen, onClose, onSuccess, personId, personName }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [tipoDocumento, setTipoDocumento] = useState('0');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
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

        // Validar tipo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Solo se permiten imágenes (JPG, PNG, GIF) o PDF.');
            return;
        }

        // Validar tamaño (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('El archivo es demasiado grande (Máx 5MB).');
            return;
        }

        setSelectedFile(file);

        // Crear preview para imágenes
        if (file.type.match('image.*')) {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
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
        if (!selectedFile || !personId || !tipoDocumento) {
            setErrorMessage('Todos los campos son obligatorios');
            setShowErrorModal(true);
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            // Crear FormData con las claves EXACTAS que espera el backend
            const formData = new FormData();
            formData.append('File', selectedFile); // 'File' con F mayúscula
            formData.append('PersonaId', personId.toString()); // 'PersonaId' con P mayúscula
            formData.append('TipoDocumento', tipoDocumento.toString()); // 'TipoDocumento' con T mayúscula

            console.log('📤 Enviando FormData:');
            for (let pair of formData.entries()) {
                console.log(`${pair[0]}:`, pair[1]);
            }

            // USAR EL MÉTODO UPLOAD ESPECÍFICO PARA FORMDATA
            const response = await api.upload('/Documentacion/upload', formData);

            console.log('✅ Upload response:', response);

            if (response && response.success) {
                setShowSuccessModal(true);

                if (onSuccess) {
                    onSuccess(response);
                }

                // Cerrar automáticamente después de 2 segundos
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                const errorMsg = response?.error || 'Error al subir el documento';
                setErrorMessage(errorMsg);
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('❌ Upload error:', error);

            // Manejo de errores detallado
            let errorMsg = 'Error al subir el documento';

            if (error.message) {
                // Intentar extraer el mensaje de error del JSON
                try {
                    const errorObj = JSON.parse(error.message);
                    errorMsg = errorObj.error || errorObj.message || error.message;
                } catch {
                    errorMsg = error.message;
                }
            }

            setErrorMessage(errorMsg);
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

    const handleClose = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setTipoDocumento('0');
        setLoading(false);
        setErrorMessage('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title={`Subir Documentación - ${personName}`}
                size="medium"
                variant="form"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="ghost" onClick={handleClose} disabled={loading}>
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
                            value={tipoDocumento}
                            onChange={(e) => setTipoDocumento(e.target.value)}
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
                                <p className="text-sm">Soporta JPG, PNG, GIF, PDF (Máx 5MB)</p>
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
                    handleClose();
                }}
                onConfirm={() => {
                    setShowSuccessModal(false);
                    handleClose();
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
                message={errorMessage || "No se pudo subir el documento."}
                type="danger"
                confirmText="Aceptar"
                showCancel={false}
            />
        </>
    );
};

export default DocumentUploadModal;