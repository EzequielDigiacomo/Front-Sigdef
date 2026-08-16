import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import Button from '../../../../components/common/Button';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import { X, Award, Check } from 'lucide-react';
import { CATEGORIA_MAP } from '../../../../utils/enums';
import './AssignCategoryModal.css';

const AssignCategoryModal = ({ isOpen, onClose, onSuccess, coach }) => {
    const [selectedCategory, setSelectedCategory] = useState(
        String(coach?.categoriaSeleccion || coach?.CategoriaSeleccion || '0')
    );
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationConfig, setConfirmationConfig] = useState({
        type: 'success',
        title: '',
        message: '',
    });

    useEffect(() => {
        setSelectedCategory(String(coach?.categoriaSeleccion || coach?.CategoriaSeleccion || '0'));
    }, [coach]);

    const coachName =
        coach?.nombrePersona || `${coach?.nombre || ''} ${coach?.apellido || ''}`.trim() || 'entrenador';

    const handleAssign = async () => {
        setSubmitting(true);
        try {
            const entrenadorData = {
                participanteId: coach.idPersona,
                ParticipanteId: coach.idPersona,
                idPersona: coach.idPersona,
                idClub: coach.idClub || null,
                licencia: coach.licencia || '',
                perteneceSeleccion: true,
                categoriaSeleccion: selectedCategory,
                becadoEnard: coach.becadoEnard || false,
                becadoSdn: coach.becadoSdn || false,
                montoBeca: coach.montoBeca || 0,
                presentoAptoMedico: coach.presentoAptoMedico || false,
            };

            await api.put(`/Entrenador/${coach.idPersona}`, entrenadorData);

            const categoryName = CATEGORIA_MAP[selectedCategory] || 'Sin Asignar';
            setConfirmationConfig({
                type: 'success',
                title: 'Categoría asignada',
                message: `${categoryName} quedó asignada a ${coachName}.`,
            });
            setShowConfirmation(true);
        } catch (error) {
            console.error('Error assigning category:', error);
            setConfirmationConfig({
                type: 'danger',
                title: 'Error',
                message: 'No se pudo asignar la categoría. Intentá de nuevo.',
            });
            setShowConfirmation(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmationClose = () => {
        setShowConfirmation(false);
        if (confirmationConfig.type === 'success') {
            onSuccess();
        }
    };

    if (!isOpen || !coach) return null;

    return (
        <div className="acm-overlay" onClick={onClose}>
            <div
                className="acm-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="acm-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="acm-header">
                    <div className="acm-header-text">
                        <h3 id="acm-title" className="acm-title">Asignar categoría</h3>
                        <p className="acm-subtitle">{coachName}</p>
                    </div>
                    <button type="button" className="acm-close" onClick={onClose} aria-label="Cerrar">
                        <X size={18} />
                    </button>
                </div>

                <div className="acm-body">
                    <p className="acm-hint">Elegí la categoría de selección</p>
                    <div className="acm-list" role="listbox" aria-label="Categorías">
                        {Object.entries(CATEGORIA_MAP).map(([key, label]) => {
                            const selected = selectedCategory === key;
                            return (
                                <button
                                    type="button"
                                    key={key}
                                    role="option"
                                    aria-selected={selected}
                                    className={`acm-option${selected ? ' is-selected' : ''}`}
                                    onClick={() => setSelectedCategory(key)}
                                >
                                    <span className="acm-option-icon" aria-hidden>
                                        <Award size={14} />
                                    </span>
                                    <span className="acm-option-label">{label}</span>
                                    {selected && (
                                        <span className="acm-option-check" aria-hidden>
                                            <Check size={14} />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="acm-footer">
                    <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={Award}
                        onClick={handleAssign}
                        disabled={submitting}
                        isLoading={submitting}
                    >
                        Asignar
                    </Button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showConfirmation}
                onClose={handleConfirmationClose}
                onConfirm={handleConfirmationClose}
                title={confirmationConfig.title}
                message={confirmationConfig.message}
                type={confirmationConfig.type}
                confirmText="Entendido"
                showCancel={false}
            />
        </div>
    );
};

export default AssignCategoryModal;
