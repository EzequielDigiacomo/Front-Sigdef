import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import Button from '../../../../components/common/Button';
import FormField from '../../../../components/forms/FormField';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import { Search, X, UserPlus, AlertCircle } from 'lucide-react';
import './AssignCoachModal.css';

const AssignCoachModal = ({ isOpen, onClose, onSuccess, categoryId, categoryLabel }) => {
    const [coaches, setCoaches] = useState([]);
    const [filteredCoaches, setFilteredCoaches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Confirmation Modal State
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationConfig, setConfirmationConfig] = useState({
        type: 'success',
        title: '',
        message: ''
    });

    // Load coaches when modal opens
    useEffect(() => {
        if (isOpen) {
            loadCoaches();
            setSearchTerm('');
            setSelectedCoach(null);
        }
    }, [isOpen]);

    // Filter coaches when search term changes
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredCoaches(coaches);
        } else {
            const filtered = coaches.filter(c =>
                (c.nombrePersona || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.documento || '').includes(searchTerm)
            );
            setFilteredCoaches(filtered);
        }
    }, [searchTerm, coaches]);

    const loadCoaches = async () => {
        setLoading(true);
        try {
            const [coachesData, personasData] = await Promise.all([
                api.get('/Entrenador'),
                api.get('/Persona')
            ]);

            // Enrich coaches with persona data
            const enriched = (coachesData || []).map(coach => {
                const persona = (personasData || []).find(p => p.idPersona === coach.idPersona);

                return {
                    ...coach,
                    nombrePersona: persona?.nombre && persona?.apellido
                        ? `${persona.nombre} ${persona.apellido}`
                        : coach.nombrePersona,
                    documento: persona?.documento || coach.documento || '-',
                    email: persona?.email || coach.email || '-'
                };
            });

            setCoaches(enriched);
            setFilteredCoaches(enriched);
        } catch (error) {
            console.error('Error loading coaches:', error);
            setCoaches([]);
            setFilteredCoaches([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedCoach) return;

        setSubmitting(true);
        try {
            // Prepare the DTO with the correct format expected by the backend
            const entrenadorData = {
                idPersona: selectedCoach.idPersona,
                idClub: selectedCoach.idClub || null,
                licencia: selectedCoach.licencia || '',
                perteneceSeleccion: true,
                categoriaSeleccion: categoryId.toString(), // Convert to string as expected by backend
                becadoEnard: selectedCoach.becadoEnard || false,
                becadoSdn: selectedCoach.becadoSdn || false,
                montoBeca: selectedCoach.montoBeca || 0,
                presentoAptoMedico: selectedCoach.presentoAptoMedico || false
            };

            console.log('📤 Asignando entrenador:', entrenadorData);
            await api.put(`/Entrenador/${selectedCoach.idPersona}`, entrenadorData);

            // Show success modal
            setConfirmationConfig({
                type: 'success',
                title: '¡Éxito!',
                message: `El entrenador ${selectedCoach.nombrePersona} ha sido asignado a la categoría ${categoryLabel} correctamente.`
            });
            setShowConfirmation(true);
        } catch (error) {
            console.error('Error assigning coach:', error);
            // Show error modal
            setConfirmationConfig({
                type: 'danger',
                title: 'Error',
                message: 'Hubo un problema al asignar el entrenador. Por favor, intente nuevamente.'
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

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Asignar Entrenador - {categoryLabel}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="mb-4">
                        <FormField
                            icon={Search}
                            placeholder="Buscar por nombre o documento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="coaches-list-container">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner"></div>
                                <p>Cargando entrenadores...</p>
                            </div>
                        ) : filteredCoaches.length === 0 ? (
                            <div className="search-prompt">
                                <AlertCircle size={48} color="var(--text-secondary)" />
                                <p>
                                    {searchTerm
                                        ? 'No se encontraron entrenadores con ese criterio de búsqueda'
                                        : 'No hay entrenadores disponibles'}
                                </p>
                            </div>
                        ) : (
                            <ul className="coaches-list">
                                {filteredCoaches.map(coach => (
                                    <li
                                        key={coach.idPersona}
                                        className={`coach-item ${selectedCoach?.idPersona === coach.idPersona ? 'selected' : ''}`}
                                        onClick={() => setSelectedCoach(coach)}
                                    >
                                        <div className="coach-info">
                                            <span className="coach-name">{coach.nombrePersona}</span>
                                            <span className="coach-doc">{coach.documento}</span>
                                        </div>
                                        <div className="coach-email">{coach.email}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedCoach || submitting}
                        isLoading={submitting}
                    >
                        <UserPlus size={18} /> Asignar Entrenador
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

export default AssignCoachModal;
