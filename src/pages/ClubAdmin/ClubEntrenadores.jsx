import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { Plus, Edit, Trash2, Search, Award, CheckCircle, XCircle } from 'lucide-react';
import './ClubAtletas.css';

const ClubEntrenadores = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [entrenadores, setEntrenadores] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entrenadorToDelete, setEntrenadorToDelete] = useState(null);
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        fetchEntrenadores();
    }, []);

    const fetchEntrenadores = async () => {
        try {
            setLoading(true);
            const data = await api.get('/Entrenador');

            // Filtrar solo entrenadores del club actual
            const entrenadoresDelClub = data.filter(e => e.idClub == user.clubId);

            setEntrenadores(entrenadoresDelClub);
        } catch (error) {
            console.error('Error cargando entrenadores:', error);
            setErrorModal({
                isOpen: true,
                title: 'Error',
                message: 'No se pudieron cargar los entrenadores. Por favor, intenta nuevamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (entrenador) => {
        setEntrenadorToDelete(entrenador);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!entrenadorToDelete) return;

        try {
            await api.delete(`/Entrenador/${entrenadorToDelete.idPersona}`);
            setEntrenadores(entrenadores.filter(e => e.idPersona !== entrenadorToDelete.idPersona));
            setShowDeleteModal(false);
            setEntrenadorToDelete(null);
        } catch (error) {
            console.error('Error eliminando entrenador:', error);
            setShowDeleteModal(false);
            setErrorModal({
                isOpen: true,
                title: 'Error al eliminar',
                message: 'Hubo un problema al intentar eliminar el entrenador.'
            });
        }
    };

    const filteredEntrenadores = entrenadores.filter(entrenador =>
        entrenador.nombrePersona?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando entrenadores...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">Mis Entrenadores</h2>
                <Button onClick={() => navigate('/club/entrenadores/nuevo')}>
                    <Plus size={20} /> Nuevo Entrenador
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
                                <th>Licencia</th>
                                <th>Selección</th>
                                <th>Becas</th>
                                <th>Apto Médico</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntrenadores.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">
                                        No hay entrenadores registrados
                                    </td>
                                </tr>
                            ) : (
                                filteredEntrenadores.map((entrenador) => (
                                    <tr key={entrenador.idPersona}>
                                        <td>
                                            <strong>{entrenador.nombrePersona || 'Sin nombre'}</strong>
                                        </td>
                                        <td>{entrenador.licencia || '-'}</td>
                                        <td>
                                            {entrenador.perteneceSeleccion ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                                                    <CheckCircle size={16} />
                                                    {entrenador.categoriaSeleccion || 'Sí'}
                                                </span>
                                            ) : (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                                    <XCircle size={16} />
                                                    No
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                {entrenador.becadoEnard && <span className="badge badge-primary">ENARD</span>}
                                                {entrenador.becadoSdn && <span className="badge badge-info">SDN</span>}
                                                {!entrenador.becadoEnard && !entrenador.becadoSdn && <span>-</span>}
                                            </div>
                                        </td>
                                        <td>
                                            {entrenador.presentoAptoMedico ? (
                                                <CheckCircle size={18} color="var(--success)" />
                                            ) : (
                                                <XCircle size={18} color="var(--danger)" />
                                            )}
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/club/entrenadores/editar/${entrenador.idPersona}`)}
                                                >
                                                    <Edit size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-danger"
                                                    onClick={() => handleDeleteClick(entrenador)}
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
                    setEntrenadorToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Eliminar Entrenador"
                message={`¿Estás seguro de que deseas eliminar a ${entrenadorToDelete?.nombrePersona || 'este entrenador'}? Esta acción no se puede deshacer.`}
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

export default ClubEntrenadores;
