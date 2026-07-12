import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import Button from '../../../../components/common/Button';
import FormField from '../../../../components/forms/FormField';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import { withFederationScope } from '../../../../utils/apiHelpers';
import { Search, X, UserPlus, AlertCircle } from 'lucide-react';
import './AddCoachToSelectionModal.css';

const hasClub = (coach) => {
    const clubId = coach.idClub ?? coach.IdClub;
    return clubId != null && clubId !== 0 && clubId !== '0';
};

const AddCoachToSelectionModal = ({ isOpen, onClose, onSuccess, fedId }) => {
    const [coaches, setCoaches] = useState([]);
    const [filteredCoaches, setFilteredCoaches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationConfig, setConfirmationConfig] = useState({
        type: 'success',
        title: '',
        message: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadAvailableCoaches();
            setSearchTerm('');
            setSelectedCoach(null);
        }
    }, [isOpen, fedId]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredCoaches(coaches);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = coaches.filter(c =>
                (c.nombrePersona || '').toLowerCase().includes(term) ||
                (c.documento || '').includes(searchTerm) ||
                (c.nombreClub || '').toLowerCase().includes(term)
            );
            setFilteredCoaches(filtered);
        }
    }, [searchTerm, coaches]);

    const loadAvailableCoaches = async () => {
        setLoading(true);
        try {
            const coachesPromise = api.get(withFederationScope('/Entrenador', fedId));
            const clubesPromise = api
                .get(withFederationScope('/Clubes', fedId))
                .catch(() => api.get(withFederationScope('/Club', fedId)).catch(() => []));

            const coachesData = await coachesPromise;
            const available = (coachesData || []).filter((c) => {
                const inSeleccion = !!(c.perteneceSeleccion ?? c.PerteneceSeleccion);
                return hasClub(c) && !inSeleccion;
            });

            const mapEnriched = (list, clubMap = {}) =>
                list.map((coach) => {
                    const id =
                        coach.participanteId ??
                        coach.ParticipanteId ??
                        coach.idPersona ??
                        coach.IdPersona;
                    const clubId = coach.idClub ?? coach.IdClub;
                    return {
                        ...coach,
                        idPersona: id,
                        participanteId: id,
                        idClub: clubId,
                        nombrePersona: coach.nombrePersona || coach.NombrePersona || '-',
                        documento: coach.documento || coach.Documento || '-',
                        email: coach.email || coach.Email || '-',
                        licencia: coach.licencia || coach.Licencia || '',
                        nombreClub:
                            coach.nombreClub ||
                            coach.NombreClub ||
                            coach.club?.nombre ||
                            clubMap[clubId] ||
                            'Club',
                    };
                });

            const first = mapEnriched(available);
            setCoaches(first);
            setFilteredCoaches(first);
            setLoading(false);

            const clubesData = await clubesPromise;
            const clubMap = {};
            (clubesData || []).forEach((club) => {
                const id = club.idClub ?? club.IdClub;
                clubMap[id] = club.nombre || club.Nombre;
            });
            const withClubs = mapEnriched(available, clubMap);
            setCoaches(withClubs);
            setFilteredCoaches(withClubs);
        } catch (error) {
            console.error('Error loading coaches:', error);
            setCoaches([]);
            setFilteredCoaches([]);
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!selectedCoach) return;

        setSubmitting(true);
        try {
            const entrenadorData = {
                participanteId: selectedCoach.idPersona,
                ParticipanteId: selectedCoach.idPersona,
                idPersona: selectedCoach.idPersona,
                idClub: selectedCoach.idClub ?? selectedCoach.IdClub ?? null,
                licencia: selectedCoach.licencia || '',
                perteneceSeleccion: true,
                categoriaSeleccion: '0',
                becadoEnard: selectedCoach.becadoEnard || false,
                becadoSdn: selectedCoach.becadoSdn || false,
                montoBeca: selectedCoach.montoBeca || 0,
                presentoAptoMedico: selectedCoach.presentoAptoMedico || false,
            };

            await api.put(`/Entrenador/${selectedCoach.idPersona}`, entrenadorData);

            setConfirmationConfig({
                type: 'success',
                title: '¡Éxito!',
                message: `${selectedCoach.nombrePersona} quedó vinculado a la selección y sigue figurando como entrenador de ${selectedCoach.nombreClub}.`,
            });
            setShowConfirmation(true);
        } catch (error) {
            console.error('Error adding coach to selection:', error);
            setConfirmationConfig({
                type: 'danger',
                title: 'Error',
                message: 'Hubo un problema al vincular el entrenador. Por favor, intente nuevamente.',
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
                    <h3 className="modal-title">Vincular entrenador de club</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="modal-hint">
                        Se listan los entrenadores de club que todavía no forman parte del equipo de selección.
                        Al vincularlos figurarán en ambas grillas.
                    </p>
                    <div className="mb-4">
                        <FormField
                            icon={Search}
                            placeholder="Buscar por nombre, documento o club..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="coaches-list-container">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner"></div>
                                <p>Cargando entrenadores de club...</p>
                            </div>
                        ) : filteredCoaches.length === 0 ? (
                            <div className="search-prompt">
                                <AlertCircle size={48} color="var(--text-secondary)" />
                                <p>
                                    {searchTerm
                                        ? 'No se encontraron entrenadores con ese criterio de búsqueda'
                                        : 'No hay entrenadores de club disponibles para vincular'}
                                </p>
                            </div>
                        ) : (
                            <ul className="coaches-list">
                                {filteredCoaches.map((coach) => (
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
                        <UserPlus size={18} /> Vincular a Selección
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
