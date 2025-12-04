import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { Plus, Edit, Trash2, Search, Shield } from 'lucide-react';
import './ClubAtletas.css';

const ClubDelegados = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [delegados, setDelegados] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [delegadoToDelete, setDelegadoToDelete] = useState(null);
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        fetchDelegados();
    }, []);

    const fetchDelegados = async () => {
        try {
            setLoading(true);
            const data = await api.get('/DelegadoClub');

            setDelegados(data);
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
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">Mis Delegados</h2>
                <Button onClick={() => navigate('/club/delegados/nuevo')}>
                    <Plus size={20} /> Nuevo Delegado
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Rol</th>
                                <th>Federación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDelegados.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center">
                                        No hay delegados registrados
                                    </td>
                                </tr>
                            ) : (
                                filteredDelegados.map((delegado) => (
                                    <tr key={delegado.idPersona}>
                                        <td>
                                            <strong>{delegado.nombrePersona || 'Sin nombre'}</strong>
                                        </td>
                                        <td>
                                            <span className="badge badge-primary">
                                                Rol ID: {delegado.idRol}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-info">
                                                Fed ID: {delegado.idFederacion}
                                            </span>
                                        </td>
                                        <td>
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
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
