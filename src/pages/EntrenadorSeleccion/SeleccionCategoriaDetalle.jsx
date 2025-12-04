import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Users, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { getCategoriaLabel } from '../../utils/enums';
import AddAtletaSeleccionModal from './components/AddAtletaSeleccionModal';

const SeleccionCategoriaDetalle = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [athletes, setAthletes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const categoryLabel = getCategoriaLabel(parseInt(categoryId));

    useEffect(() => {
        fetchAthletes();
    }, [categoryId]);

    const fetchAthletes = async () => {
        setLoading(true);
        try {
            // Fetch all athletes and filter
            // Ideally backend supports filtering by category and selection
            const allAthletes = await api.get('/Atleta');
            const filtered = (allAthletes || []).filter(a =>
                a.perteneceSeleccion &&
                a.categoria === parseInt(categoryId)
            );
            setAthletes(filtered);
        } catch (error) {
            console.error('Error fetching athletes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAthlete = async (athlete) => {
        if (window.confirm(`¿Quitar a ${athlete.nombrePersona} de la selección?`)) {
            try {
                // Update athlete to remove from selection
                // We need to send the full object or patch
                // Assuming PUT /Atleta updates the record
                const updatedAthlete = {
                    ...athlete,
                    perteneceSeleccion: false,
                    categoria: 0 // Reset category or keep it? Usually reset if bound to selection category
                };

                // We need to map back to DTO expected by backend if needed
                // But usually PUT accepts the entity. 
                // Let's assume PUT /Atleta works.
                // If not, we might need a specific endpoint.

                await api.put('/Atleta', updatedAthlete);
                fetchAthletes();
            } catch (error) {
                console.error('Error removing athlete:', error);
                alert('Error al quitar el atleta');
            }
        }
    };

    const columns = [
        { label: 'Nombre', key: 'nombrePersona' },
        { label: 'Documento', key: 'documento' },
        { label: 'Club', key: 'nombreClub' },
        { label: 'Email', key: 'email' },
        {
            label: 'Acciones',
            key: 'actions',
            render: (value, row) => (
                <Button
                    variant="ghost"
                    className="text-danger"
                    onClick={() => handleRemoveAthlete(row)}
                    title="Quitar de la selección"
                >
                    <Trash2 size={18} />
                </Button>
            )
        }
    ];

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/entrenadores-seleccion')}>
                        <ArrowLeft size={24} />
                    </Button>
                    <div>
                        <h1 className="page-title">
                            Categoría {categoryLabel}
                        </h1>
                        <p className="page-subtitle">Gestión de atletas seleccionados</p>
                    </div>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus size={20} /> Agregar Atleta
                </Button>
            </div>

            <Card>
                <DataTable
                    columns={columns}
                    data={athletes}
                    loading={loading}
                    pagination={true}
                    itemsPerPage={10}
                    emptyMessage="No hay atletas en esta categoría de selección."
                />
            </Card>

            {showAddModal && (
                <AddAtletaSeleccionModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchAthletes();
                    }}
                    categoryId={parseInt(categoryId)}
                />
            )}
        </div>
    );
};

export default SeleccionCategoriaDetalle;
