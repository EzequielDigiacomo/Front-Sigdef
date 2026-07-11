import React, { useState } from 'react';
import { Check, X, Key } from 'lucide-react';
import DataTable from '../../../../components/common/DataTable';
import TableActions from '../../../../components/common/TableActions';
import EditUserModal from '../../../../components/modals/EditUserModal';
import { api } from '../../../../services/api';
import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import './UserTable.css';

const getUserId = (u) =>
    u?.idUsuario ?? u?.IdUsuario ?? u?.id ?? u?.Id ?? null;

const getUsername = (u) => u?.username || u?.Username || '';

const UserTable = ({ users, clubs = [], onUserUpdated }) => {
    const [editingUser, setEditingUser] = useState(null);
    const [passwordUser, setPasswordUser] = useState(null);
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'success',
    });

    const getClubName = (idClub) => {
        if (!idClub) return '-';
        const club = clubs.find(
            (c) => String(c.idClub ?? c.IdClub) === String(idClub)
        );
        return club ? club.nombre || club.Nombre : idClub;
    };

    const columns = [
        {
            key: 'username',
            label: 'Usuario',
            render: (value, row) => <strong>{value || getUsername(row)}</strong>,
        },
        {
            key: 'password',
            label: 'Contraseña',
            render: () => (
                <span
                    className="text-muted"
                    style={{ fontFamily: 'monospace', letterSpacing: '2px' }}
                >
                    ******
                </span>
            ),
        },
        {
            key: 'rol',
            label: 'Rol',
            render: (value, row) => {
                const rol = value || row.rolFederacion || row.RolFederacion || '-';
                return (
                    <span
                        className={`badge ${
                            rol === 'Admin'
                                ? 'badge-primary'
                                : rol === 'Club'
                                  ? 'badge-info'
                                  : 'badge-secondary'
                        }`}
                    >
                        {rol}
                    </span>
                );
            },
        },
        {
            key: 'idClub',
            label: 'Club',
            render: (value, row) => getClubName(value ?? row.IdClub),
        },
        {
            key: 'estaActivo',
            label: 'Estado',
            render: (value, row) => {
                const activo = value ?? row.EstaActivo;
                return activo ? (
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--success)',
                        }}
                    >
                        <Check size={16} /> Activo
                    </span>
                ) : (
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--danger)',
                        }}
                    >
                        <X size={16} /> Inactivo
                    </span>
                );
            },
        },
        {
            key: 'fechaCreacion',
            label: 'Fecha Creación',
            render: (value, row) => {
                const fecha = value || row.FechaCreacion;
                return fecha ? new Date(fecha).toLocaleDateString() : '-';
            },
        },
    ];

    const handleEdit = (user) => setEditingUser(user);

    const handleCloseEditModal = () => setEditingUser(null);

    const handleEditPasswordClick = (user) => {
        setPasswordUser(user);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
        setPasswordError('');
    };

    const handleClosePasswordModal = () => {
        if (loadingPassword) return;
        setPasswordUser(null);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
        setPasswordError('');
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
        setPasswordError('');
    };

    const handleSavePassword = async (e) => {
        e?.preventDefault?.();
        if (!passwordUser) return;

        const id = getUserId(passwordUser);
        if (id == null) {
            setPasswordError('No se pudo identificar el usuario.');
            return;
        }

        const { newPassword, confirmPassword } = passwordForm;
        if (!newPassword || newPassword.length < 6) {
            setPasswordError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Las contraseñas no coinciden.');
            return;
        }

        setLoadingPassword(true);
        setPasswordError('');
        try {
            const username = getUsername(passwordUser);
            // Auth espera un string JSON en el body; FindAsync usa IdUsuario
            await api.put(`/Auth/usuarios/${id}/password`, newPassword);
            setPasswordUser(null);
            setPasswordForm({ newPassword: '', confirmPassword: '' });
            setAlertModal({
                isOpen: true,
                title: 'Contraseña actualizada',
                message: `La contraseña de ${username} se actualizó correctamente.`,
                type: 'success',
            });
            onUserUpdated?.();
        } catch (error) {
            console.error('Error actualizando contraseña:', error);
            setPasswordError(
                error?.message ||
                    'No se pudo actualizar la contraseña. Intente nuevamente.'
            );
        } finally {
            setLoadingPassword(false);
        }
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
                                title: 'Editar contraseña',
                                icon: <Key size={18} />,
                                children: ' ',
                                onClick: handleEditPasswordClick,
                                className: 'text-amber-500',
                            },
                        ]}
                    />
                )}
            />

            {editingUser && (
                <EditUserModal
                    isOpen={!!editingUser}
                    onClose={handleCloseEditModal}
                    user={editingUser}
                    onUserUpdated={onUserUpdated}
                />
            )}

            <Modal
                isOpen={!!passwordUser}
                onClose={handleClosePasswordModal}
                title="Editar contraseña"
                size="small"
                className="edit-password-modal"
                footer={
                    <div className="edit-password-modal-actions">
                        <Button
                            variant="secondary"
                            onClick={handleClosePasswordModal}
                            disabled={loadingPassword}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSavePassword}
                            isLoading={loadingPassword}
                        >
                            Guardar
                        </Button>
                    </div>
                }
            >
                <form
                    onSubmit={handleSavePassword}
                    className="edit-password-form"
                >
                    <p className="edit-password-hint">
                        Definí una nueva contraseña para{' '}
                        <strong>{getUsername(passwordUser)}</strong>.
                    </p>

                    {passwordError && (
                        <div className="alert alert-error">{passwordError}</div>
                    )}

                    <div className="edit-password-field">
                        <label htmlFor="edit-newPassword">
                            Nueva contraseña <span className="text-danger">*</span>
                        </label>
                        <input
                            id="edit-newPassword"
                            name="newPassword"
                            type="password"
                            className="form-input"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Mínimo 6 caracteres"
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="edit-password-field">
                        <label htmlFor="edit-confirmPassword">
                            Confirmar contraseña <span className="text-danger">*</span>
                        </label>
                        <input
                            id="edit-confirmPassword"
                            name="confirmPassword"
                            type="password"
                            className="form-input"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange}
                            placeholder="Repetí la contraseña"
                            required
                            autoComplete="new-password"
                        />
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                confirmText="Entendido"
                showCancel={false}
            />
        </>
    );
};

export default UserTable;
