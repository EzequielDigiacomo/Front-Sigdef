import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import Button from '../../../../components/common/Button';
import FormField from '../../../../components/forms/FormField';
import { AlertCircle, Search, X, Check, Loader2, UserPlus } from 'lucide-react';
import { CATEGORY_RANGES } from '../../../../utils/categoryConfig';
import { getCategoriaLabel } from '../../../../utils/enums';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
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
            const [athletesData, personasData, clubesData] = await Promise.all([
                api.get('/Atleta'),
                api.get('/Persona'),
                api.get('/Club')
            ]);

            // Create club map for quick lookup
            const clubMap = {};
            (clubesData || []).forEach(club => {
                clubMap[club.idClub] = club.nombre;
            });

            // Filter athletes NOT in selection
            const available = (athletesData || []).filter(a => !a.perteneceSeleccion);

            // Enrich with persona data and age calculation
            const enriched = available.map(athlete => {
                const persona = (personasData || []).find(p => p.idPersona === athlete.idPersona);
                const fechaNac = persona?.fechaNacimiento || athlete.fechaNacimiento;

                let edad = null;
                if (fechaNac) {
                    const hoy = new Date();
                    const nacimiento = new Date(fechaNac);
                    edad = hoy.getFullYear() - nacimiento.getFullYear();
                    const mes = hoy.getMonth() - nacimiento.getMonth();
                    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                        edad--;
                    }
                }

                // Get club name from club object or map
                const clubName = athlete.club?.nombre ||
                    (athlete.idClub ? clubMap[athlete.idClub] : null) ||
                    'Agente Libre';

                return {
                    ...athlete,
                    edad,
                    nombrePersona: persona?.nombre && persona?.apellido
                        ? `${persona.nombre} ${persona.apellido}`
                        : athlete.nombrePersona,
                    documento: persona?.documento || athlete.documento,
                    nombreClub: clubName
                };
            });

            // Filter by category age range
            const categoryRange = CATEGORY_RANGES.find(r => r.categoryId === categoryId);
            const filtered = enriched.filter(athlete => {
                if (!athlete.edad) return false; // Skip athletes without age

                if (categoryRange.minAge && categoryRange.maxAge) {
                    return athlete.edad >= categoryRange.minAge && athlete.edad <= categoryRange.maxAge;
                }
                if (categoryRange.maxAge) {
                    return athlete.edad <= categoryRange.maxAge;
                }
                if (categoryRange.minAge) {
                    return athlete.edad >= categoryRange.minAge;
                }
                return false;
            });

            setAthletes(filtered);
            setFilteredAthletes(filtered);
        } catch (error) {
            console.error('Error loading athletes:', error);
            setAthletes([]);
            setFilteredAthletes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!selectedAthlete) return;

        setAdding(true);
        try {
            const updatedAthlete = {
                ...selectedAthlete,
                perteneceSeleccion: true,
                categoria: categoryId,
                // Add default values for new selection members if needed
                becadoEnard: false,
                becadoSdn: false,
                montoBeca: 0
            };

            await api.put(`/Atleta/${selectedAthlete.idPersona}`, updatedAthlete);
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
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Agregar Atleta a Selección</h3>
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

                <div className="modal-footer">
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
