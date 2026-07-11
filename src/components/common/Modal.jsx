import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'medium',
    variant = 'default',
    className = '',
}) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className={`modal-overlay modal-overlay-${variant}`} onClick={onClose}>
            <div
                className={`modal-container modal-${size} modal-variant-${variant} ${className}`.trim()}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`modal-header modal-header-${variant}`}>
                    <h3 className={`modal-title modal-title-${variant}`}>{title}</h3>
                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className={`modal-content modal-content-${variant}`}>
                    {children}
                </div>
                {footer && (
                    <div className={`modal-footer modal-footer-${variant}`}>
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
