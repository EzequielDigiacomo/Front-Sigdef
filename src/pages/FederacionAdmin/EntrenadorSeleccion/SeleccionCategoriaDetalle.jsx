import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import DataTable from '../../../components/common/DataTable';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { Users, ArrowLeft, Plus, Trash2, Edit, CheckCircle, AlertTriangle } from 'lucide-react';
import { getCategoriaLabel } from '../../../utils/enums';
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
            const [allAthletes, allPersonas] = await Promise.all([
                api.get('/Atleta'),
                api.get('/Persona')
            ]);

            const filteredAndEnriched = (allAthletes || [])
                .filter(a => a.perteneceSeleccion && a.categoria === parseInt(categoryId))
                .map(athlete => {
                    const persona = (allPersonas || []).find(p => p.idPersona === athlete.idPersona);
                    return {
                        ...athlete,
                        // Priorizar datos de persona si existen, o fallback a lo que tenga atleta
                        documento: persona?.documento || persona?.Documento || '-',
                        email: persona?.email || persona?.Email || athlete.email || '-',
                        nombrePersona: persona ? (persona.nombre + ' ' + persona.apellido) : athlete.nombrePersona,
                        // Asegurar que nombres de campos coincidan con columnas
                        telefono: persona?.telefono || persona?.Telefono || '-',
                        direccion: persona?.direccion || persona?.Direccion || '-'
                    };
                });

            setAthletes(filteredAndEnriched);
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
        {
            label: 'Nombre y Apellido',
            key: 'nombrePersona',
            render: (value, row) => <span className="font-medium text-primary">{row.nombrePersona}</span>
        },
        { label: 'Documento', key: 'documento' },
        { label: 'Club', key: 'nombreClub', render: (val) => val || 'Sin Club' },
        { label: 'Email', key: 'email', render: (val) => val || '-' },
        {
            label: 'Beca ENARD',
            key: 'becadoEnard',
            render: (val) => val ? (
                <span className="badge badge-success">SÍ</span>
            ) : (
                <span className="badge badge-secondary">NO</span>
            )
        },
        {
            label: 'Beca SND',
            key: 'becadoSdn',
            render: (val) => val ? (
                <span className="badge badge-success">SÍ</span>
            ) : (
                <span className="badge badge-secondary">NO</span>
            )
        },
        {
            label: 'Monto',
            key: 'montoBeca',
            render: (val) => val ? `$${val.toLocaleString()}` : '$0'
        },
        {
            label: 'Apto Médico',
            key: 'presentoAptoMedico',
            render: (val) => val ? (
                <span className="badge badge-success">SÍ</span>
            ) : (
                <span className="badge badge-danger">NO</span>
            )
        },
        {
            label: 'Documentación',
            key: 'documentacion',
            render: (val, row) => {
                const completo = row.documento && row.presentoAptoMedico;
                return completo ? (
                    <div className="flex items-center gap-1 text-success font-medium">
                        <CheckCircle size={16} /> <span>Completa</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-warning font-medium">
                        <AlertTriangle size={16} /> <span>Incompleta</span>
                    </div>
                );
            }
        },
        {
            label: 'Acciones',
            key: 'actions',
            render: (value, row) => (
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/atletas/editar/${row.idPersona}`); }}
                        title="Editar Atleta"
                    >
                        <Edit size={18} className="text-primary" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger action-btn"
                        onClick={(e) => { e.stopPropagation(); handleRemoveAthlete(row); }}
                        title="Quitar de la selección"
                    >
                        <Trash2 size={18} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/dashboard/selecciones')}>
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
