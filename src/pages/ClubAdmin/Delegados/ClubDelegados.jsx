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
import { useDevice } from '../../../hooks/useDevice';
import MobileCard from '../../../components/common/MobileCard';
import {
    getUsuarioClubId,
    getUsuarioRol,
    isDelegadoClubRole,
    mapAuthUserToDelegado,
    getUsuarioNombre,
} from '../../../utils/delegadoHelpers';
import '../Atletas/ClubAtletas.css';

const ClubDelegados = () => {
    const { isNative } = useDevice();
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
    }, [user?.idClub, user?.clubId]);

    const fetchDelegados = async () => {
        try {
            setLoading(true);
            const clubIdActual = user?.idClub || user?.IdClub || user?.clubId || user?.ClubId;
            const data = await api.get('/Auth/usuarios');
            const list = Array.isArray(data) ? data : [];
            const delegadosFiltrados = list
                .filter((d) => {
                    const idClubDelegado = getUsuarioClubId(d);
                    const rol = getUsuarioRol(d);
                    return (
                        clubIdActual != null &&
                        String(idClubDelegado) === String(clubIdActual) &&
                        isDelegadoClubRole(rol)
                    );
                })
                .map(mapAuthUserToDelegado);
            setDelegados(delegadosFiltrados);
        } catch (error) {
            console.error('Error cargando delegados:', error);
            setDelegados([]);
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
        const id = delegadoToDelete.id || delegadoToDelete.idPersona || delegadoToDelete.IdPersona;
        try {
            await api.delete(`/Auth/usuarios/${id}`);
            setDelegados(delegados.filter(d => (d.id || d.idPersona || d.IdPersona) !== id));
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Error eliminando:', error);
        }
    };

    const filteredDelegados = delegados.filter((delegado) =>
        getUsuarioNombre(delegado).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className={`club-atletas ${isNative ? 'mobile-view' : ''}`}>
            <div className="page-header">
                <h2 className="page-title">{isNative ? 'Delegados' : 'Mis Delegados'}</h2>
                <Button onClick={() => navigate('/club/delegados/nuevo')} variant="primary" icon={Plus}>
                    {isNative ? 'Nuevo' : 'Nuevo Delegado'}
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="dark-focused" />
                </div>

                {isNative ? (
                    <div className="mobile-list-container">
                        {filteredDelegados.length === 0 ? (
                            <p className="text-center">No hay delegados registrados</p>
                        ) : (
                            filteredDelegados.map(delegado => (
                                <MobileCard 
                                    key={delegado.id || delegado.idPersona || delegado.IdPersona}
                                    title={delegado.nombreCompleto || delegado.nombrePersona || delegado.NombrePersona || 'Sin nombre'}
                                    subtitle={delegado.clubNombre || delegado.nombreFederacion || delegado.NombreFederacion || '-'}
                                    details={[
                                        { label: 'DNI', value: delegado.dni || delegado.documento || delegado.Documento || '-' },
                                        { label: 'Email', value: delegado.email || delegado.Email || '-' },
                                        { label: 'Tel', value: delegado.telefono || delegado.Telefono || '-' }
                                    ]}
                                    actions={
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" icon={Edit} onClick={() => navigate(`/club/delegados/editar/${delegado.id || delegado.idPersona || delegado.IdPersona}`)} />
                                            <Button variant="ghost" size="sm" icon={Trash2} className="text-danger" onClick={() => handleDeleteClick(delegado)} />
                                        </div>
                                    }
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <DataTable
                        columns={[
                            { key: 'nombrePersona', label: 'Nombre', render: (_, row) => <strong>{row.nombreCompleto || row.nombrePersona || row.NombrePersona || 'Sin nombre'}</strong> },
                            { key: 'documento', label: 'DNI', render: (_, row) => row.dni || row.documento || row.Documento || '-' },
                            { key: 'email', label: 'Email', render: (_, row) => row.email || row.Email || '-' },
                            { key: 'telefono', label: 'Teléfono', render: (_, row) => row.telefono || row.Telefono || '-' },
                            { key: 'nombreFederacion', label: 'Federación / Club', render: (_, row) => row.clubNombre || row.nombreFederacion || row.NombreFederacion || '-' }
                        ]}
                        data={filteredDelegados}
                        loading={loading}
                        keyField="id"
                        emptyMessage="No hay delegados registrados para tu club"
                        actions={(delegado) => (
                            <div className="actions-cell">
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/club/delegados/editar/${delegado.id || delegado.idPersona || delegado.IdPersona}`)}>
                                    <Edit size={18} />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDeleteClick(delegado)}>
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        )}
                    />
                )}
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
