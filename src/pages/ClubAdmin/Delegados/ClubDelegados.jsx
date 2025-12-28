import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { Plus, Edit, Trash2, Search, Shield } from 'lucide-react';
import DataTable from '../../../components/common/DataTable';
import '../Atletas/ClubAtletas.css';

const ClubDelegados = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [delegados, setDelegados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [delegadoToDelete, setDelegadoToDelete] = useState(null);
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        fetchDelegados();
    }, []);

    const fetchDelegados = async () => {
        try {
            setLoading(true);
            // El backend retorna IdClub en PascalCase y el contexto usa idClub
            const clubIdActual = user.idClub;

            // Traemos todos los delegados y filtramos por el club del usuario logueado
            const data = await api.get('/DelegadoClub');

            console.log('Filtrando delegados para el club:', clubIdActual);

            const delegadosFiltrados = data.filter(d => {
                const idClubDelegado = d.idClub || d.IdClub || d.clubId || d.ClubId;
                return parseInt(idClubDelegado) === parseInt(clubIdActual);
            });

            setDelegados(delegadosFiltrados);
        } catch (error) {
            console.error('Error cargando delegados:', error);
            setErrorModal({
                isOpen: true,
                title: 'Error',
                message: 'No se pudieron cargar los delegados de tu club.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (delegado) => {
        setDelegadoToDelete(delegado);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!delegadoToDelete) return;

        const id = delegadoToDelete.idPersona || delegadoToDelete.IdPersona;

        try {
            await api.delete(`/DelegadoClub/${id}`);
            setDelegados(delegados.filter(d => (d.idPersona || d.IdPersona) !== id));
            setShowDeleteModal(false);
            setDelegadoToDelete(null);
        } catch (error) {
            console.error('Error eliminando delegado:', error);
            setShowDeleteModal(false);
            setErrorModal({
                isOpen: true,
                title: 'Error al eliminar',
                message: 'Hubo un problema al intentar eliminar el delegado.'
            });
        }
    };

    const filteredDelegados = delegados.filter(delegado =>
        delegado.nombrePersona?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando delegados...</p>
            </div>
        );
    }

    return (
        <div className="club-atletas">
            <div className="page-header">
                <h2 className="page-title">Mis Delegados</h2>
                <Button onClick={() => navigate('/club/delegados/nuevo')}>
                    <Plus size={20} /> Nuevo Delegado
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="dark-focused" />
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'nombrePersona',
                            label: 'Nombre',
                            render: (_, row) => <strong>{row.nombrePersona || row.NombrePersona || 'Sin nombre'}</strong>
                        },
                        {
                            key: 'documento',
                            label: 'DNI',
                            render: (_, row) => row.documento || row.Documento || '-'
                        },
                        {
                            key: 'email',
                            label: 'Email',
                            render: (_, row) => row.email || row.Email || '-'
                        },
                        {
                            key: 'telefono',
                            label: 'Teléfono',
                            render: (_, row) => row.telefono || row.Telefono || '-'
                        },
                        {
                            key: 'nombreFederacion',
                            label: 'Federación',
                            render: (_, row) => row.nombreFederacion || row.NombreFederacion || '-'
                        }
                    ]}
                    data={filteredDelegados}
                    loading={loading}
                    keyField="idPersona"
                    emptyMessage="No hay delegados registrados para tu club"
                    actions={(delegado) => (
                        <div className="actions-cell">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/club/delegados/editar/${delegado.idPersona || delegado.IdPersona}`)}
                            >
                                <Edit size={18} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-danger"
                                onClick={() => handleDeleteClick(delegado)}
                            >
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    )}
                />
            </Card>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDelegadoToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Eliminar Delegado"
                message={`¿Estás seguro de que deseas eliminar a ${delegadoToDelete?.nombrePersona || 'este delegado'}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
            />

            <ConfirmationModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                onConfirm={() => setErrorModal({ ...errorModal, isOpen: false })}
                title={errorModal.title}
                message={errorModal.message}
                confirmText="Entendido"
                showCancel={false}
                type="danger"
            />
        </div>
    );
};

export default ClubDelegados;
