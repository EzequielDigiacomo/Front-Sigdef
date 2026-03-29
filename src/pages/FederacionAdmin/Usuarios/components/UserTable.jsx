import React, { useState } from 'react';
import { Check, X, Key, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import DataTable from '../../../../components/common/DataTable';
import TableActions from '../../../../components/common/TableActions';
import EditUserModal from '../../../../components/modals/EditUserModal';
import { api } from '../../../../services/api';
import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';

const UserTable = ({ users, clubs = [], onUserUpdated }) => {
    const [editingUser, setEditingUser] = useState(null);
    const [resettingUser, setResettingUser] = useState(null);
    const [tempPassword, setTempPassword] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [loadingReset, setLoadingReset] = useState(false);
    const [copied, setCopied] = useState(false);

    const getClubName = (idClub) => {
        if (!idClub) return '-';
        const club = clubs.find(c => c.idClub === idClub);
        return club ? club.nombre : idClub;
    };

    const columns = [
        {
            key: 'username',
            label: 'Usuario',
            render: (value) => <strong>{value}</strong>
        },
        {
            key: 'password',
            label: 'Contraseña',
            render: () => (
                <span className="text-muted" style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>
                    ******
                </span>
            )
        },
        {
            key: 'rol',
            label: 'Rol',
            render: (value) => (
                <span className={`badge ${value === 'Admin' ? 'badge-primary' :
                        value === 'Club' ? 'badge-info' :
                            'badge-secondary'
                    }`}>
                    {value}
                </span>
            )
        },
        {
            key: 'idClub',
            label: 'Club',
            render: (value) => getClubName(value)
        },
        {
            key: 'estaActivo',
            label: 'Estado',
            render: (value) => value ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                    <Check size={16} /> Activo
                </span>
            ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                    <X size={16} /> Inactivo
                </span>
            )
        },
        {
            key: 'fechaCreacion',
            label: 'Fecha Creación',
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
    ];

    const handleEdit = (user) => {
        setEditingUser(user);
    };

    const handleCloseModal = () => {
        setEditingUser(null);
    };

    const handleResetPassword = async (user) => {
        if (!window.confirm(`¿Estás seguro de que deseas resetear la contraseña del usuario ${user.username}?`)) return;

        setLoadingReset(true);
        setResettingUser(user);
        try {
            const result = await api.post(`/Usuario/${user.idPersona}/reset-password`);
            setTempPassword(result);
            setShowResetModal(true);
        } catch (error) {
            console.error('Error reseteando contraseña:', error);
            alert('Error al resetear la contraseña. Intente nuevamente.');
        } finally {
            setLoadingReset(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(tempPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <DataTable
                columns={columns}
                data={users}
                keyField="idUsuario"
                emptyMessage="No hay usuarios registrados"
                actions={(row) => (
                    <TableActions
                        row={row}
                        onEdit={handleEdit}
                        customActions={[
                            {
                                title: 'Resetear Contraseña',
                                icon: loadingReset && resettingUser?.idPersona === row.idPersona ? <RefreshCw className="animate-spin" size={18} /> : <Key size={18} />,
                                onClick: handleResetPassword,
                                className: 'text-amber-500',
                                disabled: loadingReset
                            }
                        ]}
                    />
                )}
            />

            {editingUser && (
                <EditUserModal
                    isOpen={!!editingUser}
                    onClose={handleCloseModal}
                    user={editingUser}
                    onUserUpdated={onUserUpdated}
                />
            )}

            {showResetModal && (
                <Modal
                    isOpen={showResetModal}
                    onClose={() => {
                        setShowResetModal(false);
                        setTempPassword('');
                    }}
                    title="Contraseña Reseteada"
                    footer={
                        <Button variant="primary" onClick={() => {
                            setShowResetModal(false);
                            setTempPassword('');
                        }}>
                            Entendido
                        </Button>
                    }
                >
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Se ha generado una nueva contraseña temporal para <strong>{resettingUser?.username}</strong>:
                        </p>
                        <div style={{ 
                            backgroundColor: 'rgba(0,0,0,0.2)', 
                            padding: '1.5rem', 
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1rem'
                        }}>
                            <span style={{ 
                                fontSize: '1.5rem', 
                                fontWeight: 'bold', 
                                letterSpacing: '2px', 
                                fontFamily: 'monospace',
                                color: 'var(--info)'
                            }}>
                                {tempPassword}
                            </span>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={copyToClipboard}
                                title="Copiar al portapapeles"
                            >
                                {copied ? <CheckCircle size={18} className="text-success" /> : <Copy size={18} />}
                            </Button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--warning)', fontStyle: 'italic' }}>
                            <RefreshCw size={14} style={{ marginRight: '4px' }} />
                            Asegúrese de copiar esta contraseña antes de cerrar, ya que no se volverá a mostrar.
                        </p>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default UserTable;
