import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import DataTable from '../../../../components/common/DataTable';
import TableActions from '../../../../components/common/TableActions';
import EditUserModal from '../../../../components/modals/EditUserModal';

const UserTable = ({ users, clubs = [], onUserUpdated }) => {
    const [editingUser, setEditingUser] = useState(null);

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
        </>
    );
};

export default UserTable;
