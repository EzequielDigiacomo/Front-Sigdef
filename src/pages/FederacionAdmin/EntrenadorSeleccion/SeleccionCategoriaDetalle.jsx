import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import DataTable from '../../../components/common/DataTable';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { Users, ArrowLeft, Plus, Trash2, Edit, Eye, UserCog } from 'lucide-react';
import { getCategoriaLabel } from '../../../utils/enums';
import AddAtletaSeleccionModal from './components/AddAtletaSeleccionModal';
import AssignCoachModal from './components/AssignCoachModal';

import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import './SeleccionCategoriaDetalle.css';

const SeleccionCategoriaDetalle = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [athletes, setAthletes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCoachModal, setShowCoachModal] = useState(false);

    // New state for Upload Modal
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedAthleteForUpload, setSelectedAthleteForUpload] = useState(null);

    // New state for Document Viewer Modal
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedAthleteForViewer, setSelectedAthleteForViewer] = useState(null);

    // Confirmation Modal State
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationConfig, setConfirmationConfig] = useState({
        type: 'danger',
        title: '',
        message: '',
        onConfirm: () => { }
    });

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
                    // Ensure we have a valid ID
                    const idReal = athlete.idPersona || athlete.IdPersona || (persona ? (persona.idPersona || persona.IdPersona) : null);

                    return {
                        ...athlete,
                        idPersona: idReal, // Normalize to camelCase
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

    const handleRemoveAthlete = (athlete) => {
        setConfirmationConfig({
            type: 'danger',
            title: 'Confirmar eliminación',
            message: `¿Estás seguro de que deseas quitar a ${athlete.nombrePersona} de la selección?`,
            onConfirm: async () => {
                try {
                    // Update athlete to remove from selection
                    const updatedAthlete = {
                        ...athlete,
                        perteneceSeleccion: false,
                        categoria: 0
                    };

                    await api.put('/Atleta', updatedAthlete);
                    fetchAthletes();
                    setShowConfirmation(false);
                } catch (error) {
                    console.error('Error removing athlete:', error);
                    // Show error modal
                    setConfirmationConfig({
                        type: 'danger',
                        title: 'Error',
                        message: 'Hubo un error al quitar el atleta de la selección.',
                        onConfirm: () => setShowConfirmation(false),
                        showCancel: false,
                        confirmText: 'Entendido'
                    });
                    // Re-open modal for error display
                    setShowConfirmation(true);
                }
            },
            showCancel: true,
            confirmText: 'Quitar',
            cancelText: 'Cancelar'
        });
        setShowConfirmation(true);
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
                return (
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto"
                            title="Subir documentos"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAthleteForUpload(row);
                                setShowUploadModal(true);
                            }}
                        >
                            <Plus size={18} className="text-primary" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto"
                            title="Ver documentos"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAthleteForViewer(row);
                                setShowViewerModal(true);
                            }}
                        >
                            <Eye size={18} className="text-primary" />
                        </Button>
                    </div>
                );
            }
        },
        {
            label: 'Acciones',
            key: 'actions',
            render: (value, row) => {
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (row.idPersona) {
                                    /* alert('DEBUG: Navegando a editar ID ' + row.idPersona); // Uncomment for extreme debug */
                                    navigate(`/dashboard/atletas/editar/${row.idPersona}`);
                                } else {
                                    setConfirmationConfig({
                                        type: 'danger',
                                        title: 'Error',
                                        message: 'No se encontró el ID del atleta para editar.',
                                        onConfirm: () => setShowConfirmation(false),
                                        showCancel: false,
                                        confirmText: 'Entendido'
                                    });
                                    setShowConfirmation(true);
                                    console.error('Fila sin ID:', row);
                                }
                            }}
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
                );
            }
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
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="secondary" onClick={() => setShowCoachModal(true)}>
                        <UserCog size={20} /> Asignar Entrenador
                    </Button>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus size={20} /> Agregar Atleta
                    </Button>
                </div>
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

            {showCoachModal && (
                <AssignCoachModal
                    isOpen={showCoachModal}
                    onClose={() => setShowCoachModal(false)}
                    onSuccess={() => {
                        setShowCoachModal(false);
                    }}
                    categoryId={parseInt(categoryId)}
                    categoryLabel={categoryLabel}
                />
            )}

            {showUploadModal && selectedAthleteForUpload && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedAthleteForUpload(null);
                    }}
                    onSuccess={() => {
                        // Optional: Refresh list or just show notification
                        fetchAthletes();
                    }}
                    personName={selectedAthleteForUpload.nombrePersona}
                    personId={selectedAthleteForUpload.idPersona || selectedAthleteForUpload.IdPersona}
                />
            )}

            {showViewerModal && selectedAthleteForViewer && (
                <DocumentViewerModal
                    isOpen={showViewerModal}
                    onClose={() => {
                        setShowViewerModal(false);
                        setSelectedAthleteForViewer(null);
                    }}
                    personName={selectedAthleteForViewer.nombrePersona}
                    personId={selectedAthleteForViewer.idPersona || selectedAthleteForViewer.IdPersona}
                />
            )}

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

export default SeleccionCategoriaDetalle;
