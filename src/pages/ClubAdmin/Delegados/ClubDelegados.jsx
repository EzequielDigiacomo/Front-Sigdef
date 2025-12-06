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
            // Intentar endpoint específico por club
            try {
                // Patrón probable: /DelegadoClub/club/{id} o similar si existiera
                const data = await api.get(`/DelegadoClub/club/${user.clubId}`, { silentErrors: true });
                setDelegados(data);
            } catch (specificError) {
                console.warn('⚠️ Endpoint específico falló, usando fallback:', specificError);

                // Fallback: Traer todos y filtrar
                const data = await api.get('/DelegadoClub');
                const delegadosFiltrados = data.filter(d =>
                    (d.idClub || d.clubId) == user.clubId
                );
                setDelegados(delegadosFiltrados);
            }
        } catch (error) {
            console.error('Error cargando delegados:', error);
            setErrorModal({
                isOpen: true,
                title: 'Error',
                message: 'No se pudieron cargar los delegados. Por favor, intenta nuevamente.'
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

        try {
            await api.delete(`/DelegadoClub/${delegadoToDelete.idPersona}`);
            setDelegados(delegados.filter(d => d.idPersona !== delegadoToDelete.idPersona));
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
                            render: (value) => <strong>{value || 'Sin nombre'}</strong>
                        },
                        {
                            key: 'idRol',
                            label: 'Rol',
                            render: (value) => <span className="badge badge-primary">Rol ID: {value}</span>
                        },
                        {
                            key: 'idFederacion',
                            label: 'Federación',
                            render: (value) => <span className="badge badge-info">Fed ID: {value}</span>
                        }
                    ]}
                    data={filteredDelegados}
                    loading={loading}
                    emptyMessage="No hay delegados registrados"
                    actions={(delegado) => (
                        <div className="actions-cell">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/club/delegados/editar/${delegado.idPersona}`)}
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
