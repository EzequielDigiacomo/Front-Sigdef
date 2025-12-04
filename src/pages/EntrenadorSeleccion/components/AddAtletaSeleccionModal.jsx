import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import { Search, X, UserPlus } from 'lucide-react';
import { CATEGORY_RANGES } from '../../../utils/categoryConfig';
import './AddAtletaSeleccionModal.css';

const AddAtletaSeleccionModal = ({ isOpen, onClose, onSuccess, categoryId }) => {
    const [athletes, setAthletes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAthlete, setSelectedAthlete] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAvailableAthletes();
            setSearchTerm('');
            setSelectedAthlete(null);
        }
    }, [isOpen]);

    const fetchAvailableAthletes = async () => {
        setLoading(true);
        try {
            const [athletesData, personasData] = await Promise.all([
                api.get('/Atleta'),
                api.get('/Persona')
            ]);

            // Filter athletes NOT in selection
            const available = (athletesData || []).filter(a => !a.perteneceSeleccion);

            // Enrich with age calculation
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

                return { ...athlete, edad };
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
        } catch (error) {
            console.error('Error fetching athletes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!selectedAthlete) return;

        setSubmitting(true);
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

            await api.put('/Atleta', updatedAthlete);
            onSuccess();
        } catch (error) {
            console.error('Error adding athlete to selection:', error);
            alert('Error al agregar el atleta');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAthletes = athletes.filter(a =>
        (a.nombrePersona || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.documento || '').includes(searchTerm)
    );

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
                            <div className="text-center py-4">Cargando atletas...</div>
                        ) : filteredAthletes.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                {searchTerm ? 'No se encontraron atletas' : 'No hay atletas disponibles'}
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
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={!selectedAthlete || submitting}
                        isLoading={submitting}
                    >
                        <UserPlus size={18} /> Agregar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AddAtletaSeleccionModal;
