import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import Button from '../../../../components/common/Button';
import FormField from '../../../../components/forms/FormField';
import { AlertCircle, Search, X, Check, Loader2, UserPlus } from 'lucide-react';
import { CATEGORY_RANGES } from '../../../../utils/categoryConfig';
import { getCategoriaLabel } from '../../../../utils/enums';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import { buildAtletaUpdatePayload, getParticipanteId } from '../../../../utils/atletaUtils';
import './AddAtletaSeleccionModal.css';

const AddAtletaSeleccionModal = ({ isOpen, onClose, onSuccess, categoryId }) => {
    const [athletes, setAthletes] = useState([]);
    const [filteredAthletes, setFilteredAthletes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAthlete, setSelectedAthlete] = useState(null);
    const [adding, setAdding] = useState(false);

    // Confirmation Modal State
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationConfig, setConfirmationConfig] = useState({
        type: 'danger',
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Load athletes when modal opens
    useEffect(() => {
        if (isOpen) {
            loadAthletesByCategory();
            setSearchTerm('');
            setSelectedAthlete(null);
        }
    }, [isOpen, categoryId]);

    // Filter athletes when search term changes
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredAthletes(athletes);
        } else {
            const filtered = athletes.filter(a =>
                (a.nombrePersona || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.documento || '').includes(searchTerm)
            );
            setFilteredAthletes(filtered);
        }
    }, [searchTerm, athletes]);

    const loadAthletesByCategory = async () => {
        setLoading(true);
        try {
            const athletesPromise = api.get('/Atleta');
            const clubesPromise = api.get('/Club').catch(() => []);

            const athletesData = await athletesPromise;
            const available = (athletesData || []).filter(
                (a) => !(a.perteneceSeleccion ?? a.PerteneceSeleccion)
            );

            const mapEnriched = (list, clubMap = {}) =>
                list.map((athlete) => {
                    const persona = athlete.participante || athlete.Participante || {};
                    const fechaNac =
                        athlete.fechaNacimiento ||
                        athlete.FechaNacimiento ||
                        persona.fechaNacimiento ||
                        persona.FechaNacimiento;

                    let edad = athlete.edad ?? athlete.Edad ?? null;
                    if (edad == null && fechaNac) {
                        const hoy = new Date();
                        const nacimiento = new Date(fechaNac);
                        edad = hoy.getFullYear() - nacimiento.getFullYear();
                        const mes = hoy.getMonth() - nacimiento.getMonth();
                        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                            edad--;
                        }
                    }

                    const clubName =
                        athlete.nombreClub ||
                        athlete.NombreClub ||
                        athlete.club?.nombre ||
                        athlete.Club?.Nombre ||
                        (athlete.idClub ? clubMap[athlete.idClub] : null) ||
                        'Agente Libre';

                    const nombreFromPersona =
                        persona.nombre || persona.Nombre
                            ? `${persona.nombre || persona.Nombre} ${persona.apellido || persona.Apellido || ''}`.trim()
                            : '';

                    return {
                        ...athlete,
                        edad,
                        nombrePersona:
                            athlete.nombrePersona || athlete.NombrePersona || nombreFromPersona || '-',
                        documento:
                            athlete.documento ||
                            athlete.Documento ||
                            persona.documento ||
                            persona.Documento ||
                            '-',
                        nombreClub: clubName,
                    };
                });

            const filterByCategory = (enriched) => {
                const categoryRange = CATEGORY_RANGES.find((r) => r.categoryId === categoryId);
                return enriched.filter((athlete) => {
                    if (athlete.edad == null) return false;
                    if (categoryRange.minAge && categoryRange.maxAge) {
                        return athlete.edad >= categoryRange.minAge && athlete.edad <= categoryRange.maxAge;
                    }
                    if (categoryRange.maxAge) return athlete.edad <= categoryRange.maxAge;
                    if (categoryRange.minAge) return athlete.edad >= categoryRange.minAge;
                    return false;
                });
            };

            const firstPass = filterByCategory(mapEnriched(available));
            setAthletes(firstPass);
            setFilteredAthletes(firstPass);
            setLoading(false);

            const clubesData = await clubesPromise;
            const clubMap = {};
            (clubesData || []).forEach((club) => {
                clubMap[club.idClub ?? club.IdClub] = club.nombre || club.Nombre;
            });
            const withClubs = filterByCategory(mapEnriched(available, clubMap));
            setAthletes(withClubs);
            setFilteredAthletes(withClubs);
        } catch (error) {
            console.error('Error loading athletes:', error);
            setAthletes([]);
            setFilteredAthletes([]);
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!selectedAthlete) return;

        setAdding(true);
        try {
            const updatedAthlete = buildAtletaUpdatePayload(selectedAthlete, {
                perteneceSeleccion: true,
                categoria: categoryId,
                becadoEnard: false,
                becadoSdn: false,
                montoBeca: 0,
            });

            const participanteId = getParticipanteId(selectedAthlete);
            await api.put(`/Atleta/${participanteId}`, updatedAthlete);
            onSuccess();
        } catch (error) {
            console.error('Error adding athlete:', error);
            // Show error modal
            setConfirmationConfig({
                type: 'danger',
                title: 'Error',
                message: 'Hubo un error al agregar el atleta a la selección. Por favor, intente nuevamente.',
                onConfirm: () => setShowConfirmation(false),
                showCancel: false,
                confirmText: 'Entendido'
            });
            setShowConfirmation(true);
        } finally {
            setAdding(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="legacy-picker-modal-overlay">
            <div className="legacy-picker-modal">
                <div className="legacy-picker-modal-header">
                    <h3 className="legacy-picker-modal-title">Agregar Atleta a Selección</h3>
                    <button className="legacy-picker-modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="legacy-picker-modal-body">
                    <div className="mb-4">
                        <FormField
                            icon={Search}
                            placeholder="Buscar por nombre o documento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="athletes-list-container">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner"></div>
                                <p>Cargando atletas de la categoría...</p>
                            </div>
                        ) : filteredAthletes.length === 0 ? (
                            <div className="search-prompt">
                                <AlertCircle size={48} color="var(--text-secondary)" />
                                <p>
                                    {searchTerm
                                        ? 'No se encontraron atletas con ese criterio de búsqueda'
                                        : 'No hay atletas disponibles para esta categoría'}
                                </p>
                            </div>
                        ) : (
                            <ul className="athletes-list">
                                {filteredAthletes.map(athlete => (
                                    <li
                                        key={athlete.idPersona}
                                        className={`athlete-item ${selectedAthlete?.idPersona === athlete.idPersona ? 'selected' : ''}`}
                                        onClick={() => setSelectedAthlete(athlete)}
                                    >
                                        <div className="athlete-info">
                                            <span className="athlete-name">{athlete.nombrePersona}</span>
                                            <span className="athlete-doc">{athlete.documento}</span>
                                        </div>
                                        <div className="athlete-club">{athlete.nombreClub}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="legacy-picker-modal-footer">
                    <Button variant="ghost" onClick={onClose} disabled={adding}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={!selectedAthlete || adding}
                        isLoading={adding}
                    >
                        <UserPlus size={18} /> Agregar
                    </Button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={confirmationConfig.onConfirm}
                title={confirmationConfig.title}
                message={confirmationConfig.message}
                type={confirmationConfig.type}
                confirmText={confirmationConfig.confirmText || 'Confirmar'}
                cancelText={confirmationConfig.cancelText || 'Cancelar'}
                showCancel={confirmationConfig.showCancel !== false}
            />
        </div>
    );
};

export default AddAtletaSeleccionModal;
