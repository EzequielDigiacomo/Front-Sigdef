import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import Button from './Button';
import './ConfirmationModal.css';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger', 
    isLoading = false,
    showCancel = true
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <AlertTriangle size={48} className="modal-icon danger" />;
            case 'success':
                return <CheckCircle size={48} className="modal-icon success" />;
            case 'info':
            default:
                return <Info size={48} className="modal-icon info" />;
        }
    };

    const getConfirmButtonVariant = () => {
        switch (type) {
            case 'danger': return 'danger';
            case 'success': return 'success'; 
            case 'info': return 'primary';
            default: return 'primary';
        }
    };

    return (
        <div className="confirmation-modal-overlay" onClick={onClose}>
            <div className="confirmation-modal-content glass-panel" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-body">
                    <div className="icon-container">
                        {getIcon()}
                    </div>
                    <h3 className="modal-title">{title}</h3>
                    <p className="modal-message">{message}</p>
                </div>

                <div className="modal-actions">
                    {showCancel && (
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        variant={getConfirmButtonVariant()}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
