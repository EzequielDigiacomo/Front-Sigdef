import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import Button from '../../../../components/common/Button';
import FormField from '../../../../components/forms/FormField';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { Search, X, UserPlus, AlertCircle, Plus } from 'lucide-react';
import './AddCoachToSelectionModal.css';

const AddCoachToSelectionModal = ({ isOpen, onClose, onSuccess }) => {
    const [coaches, setCoaches] = useState([]);
    const [filteredCoaches, setFilteredCoaches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

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
            loadAvailableCoaches();
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

    const loadAvailableCoaches = async () => {
        setLoading(true);
        try {
            const [coachesData, personasData, clubesData] = await Promise.all([
                api.get('/Entrenador'),
                api.get('/Persona'),
                api.get('/Club')
            ]);

            // Create club map for quick lookup
            const clubMap = {};
            (clubesData || []).forEach(club => {
                clubMap[club.idClub] = club.nombre;
            });

            // Filter coaches NOT in selection
            const available = (coachesData || []).filter(c => !c.perteneceSeleccion);

            // Enrich coaches with persona data
            const enriched = available.map(coach => {
                const persona = (personasData || []).find(p => p.idPersona === coach.idPersona);

                return {
                    ...coach,
                    nombrePersona: persona?.nombre && persona?.apellido
                        ? `${persona.nombre} ${persona.apellido}`
                        : coach.nombrePersona,
                    documento: persona?.documento || coach.documento || '-',
                    email: persona?.email || coach.email || '-',
                    nombreClub: coach.club?.nombre ||
                        (coach.idClub ? clubMap[coach.idClub] : null) ||
                        'Sin Club'
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

    const handleAdd = async () => {
        if (!selectedCoach) return;

        setSubmitting(true);
        try {
            // Prepare the DTO to mark coach as part of selection
            const entrenadorData = {
                idPersona: selectedCoach.idPersona,
                idClub: selectedCoach.idClub || null,
                licencia: selectedCoach.licencia || '',
                perteneceSeleccion: true, // Mark as part of selection
                categoriaSeleccion: '0', // Default to "Sin Asignar"
                becadoEnard: selectedCoach.becadoEnard || false,
                becadoSdn: selectedCoach.becadoSdn || false,
                montoBeca: selectedCoach.montoBeca || 0,
                presentoAptoMedico: selectedCoach.presentoAptoMedico || false
            };

            console.log('📤 Agregando entrenador a selección:', entrenadorData);
            await api.put(`/Entrenador/${selectedCoach.idPersona}`, entrenadorData);

            // Show success modal
            setConfirmationConfig({
                type: 'success',
                title: '¡Éxito!',
                message: `El entrenador ${selectedCoach.nombrePersona} ha sido agregado a la selección correctamente.`
            });
            setShowConfirmation(true);
        } catch (error) {
            console.error('Error adding coach to selection:', error);
            // Show error modal
            setConfirmationConfig({
                type: 'danger',
                title: 'Error',
                message: 'Hubo un problema al agregar el entrenador a la selección. Por favor, intente nuevamente.'
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
                    <h3 className="modal-title">Agregar Entrenador a Selección</h3>
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
                                        : 'No hay entrenadores disponibles para agregar'}
                                </p>
                                {!searchTerm && (
                                    <Button
                                        className="mt-4"
                                        onClick={() => {
                                            onClose();
                                            navigate('/dashboard/entrenadores-seleccion/nuevo');
                                        }}
                                    >
                                        <Plus size={18} /> Crear Entrenador Nuevo
                                    </Button>
                                )}
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
                                        <div className="coach-club">{coach.nombreClub}</div>
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
                        onClick={handleAdd}
                        disabled={!selectedCoach || submitting}
                        isLoading={submitting}
                    >
                        <UserPlus size={18} /> Agregar a Selección
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

export default AddCoachToSelectionModal;
