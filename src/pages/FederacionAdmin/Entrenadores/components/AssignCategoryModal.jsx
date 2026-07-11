import React, { useState } from 'react';
import { api } from '../../../../services/api';
import Button from '../../../../components/common/Button';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import { X, Award } from 'lucide-react';
import { CATEGORIA_MAP } from '../../../../utils/enums';
import './AssignCategoryModal.css';

const AssignCategoryModal = ({ isOpen, onClose, onSuccess, coach }) => {
    const [selectedCategory, setSelectedCategory] = useState(
        String(coach?.categoriaSeleccion || coach?.CategoriaSeleccion || '0')
    );

    const [submitting, setSubmitting] = useState(false);

    React.useEffect(() => {
        setSelectedCategory(String(coach?.categoriaSeleccion || coach?.CategoriaSeleccion || '0'));
    }, [coach]);

    // Confirmation Modal State
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationConfig, setConfirmationConfig] = useState({
        type: 'success',
        title: '',
        message: ''
    });

    const handleAssign = async () => {
        setSubmitting(true);
        try {
            // Prepare the DTO with the correct format expected by the backend
            const entrenadorData = {
                participanteId: coach.idPersona,
                ParticipanteId: coach.idPersona,
                idPersona: coach.idPersona,
                idClub: coach.idClub || null,
                licencia: coach.licencia || '',
                perteneceSeleccion: true,
                categoriaSeleccion: selectedCategory, // Already a string
                becadoEnard: coach.becadoEnard || false,
                becadoSdn: coach.becadoSdn || false,
                montoBeca: coach.montoBeca || 0,
                presentoAptoMedico: coach.presentoAptoMedico || false
            };

            console.log('📤 Asignando categoría al entrenador:', entrenadorData);
            await api.put(`/Entrenador/${coach.idPersona}`, entrenadorData);

            // Show success modal
            const categoryName = CATEGORIA_MAP[selectedCategory] || 'Sin Asignar';
            setConfirmationConfig({
                type: 'success',
                title: '¡Éxito!',
                message: `La categoría ${categoryName} ha sido asignada correctamente al entrenador ${coach.nombrePersona || coach.nombre + ' ' + coach.apellido}.`
            });
            setShowConfirmation(true);
        } catch (error) {
            console.error('Error assigning category:', error);
            // Show error modal
            setConfirmationConfig({
                type: 'danger',
                title: 'Error',
                message: 'Hubo un problema al asignar la categoría. Por favor, intente nuevamente.'
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
        <div className="modal-overlay">
            <div className="modal-content-category">
                <div className="modal-header">
                    <h3 className="modal-title">
                        Asignar Categoría - {coach.nombrePersona || `${coach.nombre} ${coach.apellido}`}
                    </h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="modal-description">
                        Seleccione la categoría de selección para este entrenador:
                    </p>

                    <div className="categories-grid">
                        {Object.entries(CATEGORIA_MAP).map(([key, label]) => (
                            <div
                                key={key}
                                className={`category-card ${selectedCategory === key ? 'selected' : ''}`}
                                onClick={() => setSelectedCategory(key)}
                            >
                                <div className="category-icon">
                                    <Award size={24} />
                                </div>
                                <div className="category-label">{label}</div>
                                {selectedCategory === key && (
                                    <div className="category-check">✓</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={submitting}
                        isLoading={submitting}
                    >
                        <Award size={18} /> Asignar Categoría
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
