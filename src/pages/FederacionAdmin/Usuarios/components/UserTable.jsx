import React, { useState } from 'react';
import { Check, X, Key, UserX, UserCheck } from 'lucide-react';
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

const isUserActive = (u) => u?.estaActivo ?? u?.EstaActivo ?? true;

const UserTable = ({ users, clubs = [], onUserUpdated }) => {
    const [editingUser, setEditingUser] = useState(null);
    const [passwordUser, setPasswordUser] = useState(null);
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [toggleUser, setToggleUser] = useState(null);
    const [loadingToggle, setLoadingToggle] = useState(false);
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
            label: 'Alta',
            render: (value, row) => {
                const fecha = value || row.FechaCreacion;
                return fecha ? new Date(fecha).toLocaleDateString() : '-';
            },
        },
    ];

    const handleEdit = (user) => setEditingUser(user);

    const handleCloseEditModal = () => setEditingUser(null);

    const handleToggleAccessClick = (user) => setToggleUser(user);

    const handleCloseToggleModal = () => {
        if (loadingToggle) return;
        setToggleUser(null);
    };

    const handleConfirmToggleAccess = async () => {
        if (!toggleUser) return;

        const id = getUserId(toggleUser);
        if (id == null) {
            setToggleUser(null);
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: 'No se pudo identificar el usuario.',
                type: 'danger',
            });
            return;
        }

        const username = getUsername(toggleUser);
        const wasActive = isUserActive(toggleUser);

        setLoadingToggle(true);
        try {
            await api.patch(`/Auth/usuarios/${id}/toggle-activo`);
            setToggleUser(null);
            setAlertModal({
                isOpen: true,
                title: wasActive ? 'Acceso deshabilitado' : 'Acceso habilitado',
                message: wasActive
                    ? `${username} quedó inactivo y no podrá iniciar sesión.`
                    : `${username} quedó activo y ya puede iniciar sesión.`,
                type: 'success',
            });
            onUserUpdated?.();
        } catch (error) {
            console.error('Error al cambiar estado de acceso:', error);
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message:
                    error?.message ||
                    'No se pudo cambiar el acceso del usuario. Intente nuevamente.',
                type: 'danger',
            });
        } finally {
            setLoadingToggle(false);
        }
    };

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
                className="users-access-table"
                actions={(row) => {
                    const activo = isUserActive(row);
                    return (
                        <TableActions
                            row={row}
                            onEdit={handleEdit}
                            customActions={[
                                {
                                    title: 'Editar contraseña',
                                    icon: <Key size={18} />,
                                    onClick: handleEditPasswordClick,
                                    className: 'text-amber-500',
                                },
                                {
                                    title: activo
                                        ? 'Deshabilitar acceso (bloquear login)'
                                        : 'Habilitar acceso (permitir login)',
                                    icon: activo ? (
                                        <UserX
                                            size={18}
                                            style={{ color: 'var(--danger)' }}
                                        />
                                    ) : (
                                        <UserCheck
                                            size={18}
                                            style={{ color: 'var(--success)' }}
                                        />
                                    ),
                                    onClick: handleToggleAccessClick,
                                },
                            ]}
                        />
                    );
                }}
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
                isOpen={!!toggleUser}
                onClose={handleCloseToggleModal}
                onConfirm={handleConfirmToggleAccess}
                title={
                    isUserActive(toggleUser)
                        ? 'Deshabilitar acceso'
                        : 'Habilitar acceso'
                }
                message={
                    isUserActive(toggleUser)
                        ? `¿Deshabilitar a ${getUsername(toggleUser)}? No podrá iniciar sesión hasta que lo vuelvas a habilitar.`
                        : `¿Habilitar a ${getUsername(toggleUser)}? Recuperará el acceso para iniciar sesión.`
                }
                type={isUserActive(toggleUser) ? 'danger' : 'info'}
                confirmText={
                    isUserActive(toggleUser) ? 'Deshabilitar' : 'Habilitar'
                }
                cancelText="Cancelar"
                isLoading={loadingToggle}
            />

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
