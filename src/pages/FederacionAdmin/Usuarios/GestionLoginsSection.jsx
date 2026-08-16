import React, { useEffect, useMemo, useState } from 'react';
import { Plus, KeyRound } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import AuthService from '../../../services/AuthService';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { pick } from '../../../utils/apiHelpers';
import {
    canAccessControlesLive,
    canAccessDashboardClub,
    extractPlanFromUser,
    normalizePlan,
} from '../../../utils/planHelpers';
import LoginGrid from './components/LoginGrid';
import LoginForm from './components/LoginForm';
import './UserManagement.css';
import './components/GestionLogins.css';

const ROLES_JUEZ = ['Largador', 'Cronometrista', 'JuezControl', 'ControlTecnico'];
const DEFAULT_ROL = 'Admin';

const normalizeUsuario = (u, clubes = []) => {
    const id = pick(u, 'id', 'Id', 'idUsuario', 'IdUsuario');
    const clubId = pick(u, 'clubId', 'ClubId', 'idClub', 'IdClub');
    const club = clubes.find((c) => String(pick(c, 'idClub', 'IdClub', 'id', 'Id')) === String(clubId));
    const activoRaw = pick(u, 'activo', 'Activo', 'estaActivo', 'EstaActivo');

    return {
        ...u,
        id,
        username: pick(u, 'username', 'Username') || '',
        email: pick(u, 'email', 'Email') || '',
        telefono: pick(u, 'telefono', 'Telefono') || '',
        nombre: pick(u, 'nombre', 'Nombre') || '',
        apellido: pick(u, 'apellido', 'Apellido') || '',
        dni: pick(u, 'dni', 'Dni') || '',
        rol: pick(u, 'rol', 'Rol', 'rolFederacion', 'RolFederacion') || '',
        clubId,
        clubNombre: pick(u, 'clubNombre', 'ClubNombre')
            || pick(club, 'nombre', 'Nombre')
            || null,
        activo: activoRaw !== false && activoRaw !== 0,
    };
};

const GestionLoginsSection = () => {
    const { user } = useAuth();
    const plan = useMemo(
        () => normalizePlan(extractPlanFromUser(user) || user?.plan),
        [user]
    );

    const [clubes, setClubes] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('lista');
    const [selectedUser, setSelectedUser] = useState(null);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: null,
    });

    const [form, setForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        clubId: '',
        rol: 'Club',
        newPassword: '',
        confirmNewPassword: '',
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
    });

    const showAlert = (type, text) => {
        setAlert({ type, text });
        window.setTimeout(() => setAlert(null), 4000);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, clubsRes] = await Promise.all([
                AuthService.getUsuarios(),
                api.get('/Club').catch(() => []),
            ]);
            const clubs = Array.isArray(clubsRes) ? clubsRes : [];
            setClubes(clubs);
            setUsuarios((usersRes || []).map((u) => normalizeUsuario(u, clubs)));
        } catch (err) {
            console.error(err);
            showAlert('error', err.message || 'Error al cargar logins');
            setUsuarios([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenCrear = () => {
        const defaultRol = canAccessDashboardClub(plan) ? 'Club' : DEFAULT_ROL;
        setSelectedUser(null);
        setForm({
            username: '',
            password: '',
            confirmPassword: '',
            email: '',
            clubId: '',
            rol: defaultRol,
            newPassword: '',
            confirmNewPassword: '',
            nombre: '',
            apellido: '',
            dni: '',
            telefono: '',
        });
        setView('crear');
    };

    const handleOpenEditar = (loginUser) => {
        setSelectedUser(loginUser);
        setForm({
            username: loginUser.username,
            newPassword: '',
            confirmNewPassword: '',
            nombre: loginUser.nombre || '',
            apellido: loginUser.apellido || '',
        });
        setView('editar');
    };

    const handleOpenEditarPerfil = (loginUser) => {
        setSelectedUser(loginUser);
        setForm({
            username: loginUser.username,
            email: loginUser.email || '',
            nombre: loginUser.nombre || '',
            apellido: loginUser.apellido || '',
            dni: loginUser.dni || '',
            telefono: loginUser.telefono || '',
        });
        setView('editarPerfil');
    };

    const handleFieldChange = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const federacionId = user?.idFederacion || user?.federacionId || null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (view === 'editar') {
            if (form.newPassword !== form.confirmNewPassword) {
                showAlert('error', 'Las contraseñas no coinciden');
                return;
            }
        } else if (view === 'crear') {
            if (form.password !== form.confirmPassword) {
                showAlert('error', 'Las contraseñas no coinciden');
                return;
            }
            if (form.rol === 'Club' && !form.clubId) {
                showAlert('error', 'Seleccioná el club al que vincular esta credencial.');
                return;
            }
            if (form.rol === 'Club' && !canAccessDashboardClub(plan)) {
                showAlert('error', 'El plan no incluye dashboard/login Club (desde Profesional).');
                return;
            }
            if (ROLES_JUEZ.includes(form.rol) && !canAccessControlesLive(plan)) {
                showAlert('error', 'El plan no incluye consolas de juez (Ecosistema SportTrack o Pack Dúo).');
                return;
            }
        }

        setSaving(true);
        try {
            if (view === 'editar') {
                await AuthService.updatePassword(selectedUser.id, form.newPassword);
                showAlert('success', 'Contraseña actualizada correctamente');
            } else if (view === 'editarPerfil') {
                await AuthService.updatePerfil(selectedUser.id, {
                    nombre: form.nombre,
                    apellido: form.apellido,
                    dni: form.dni,
                    telefono: form.telefono,
                    email: form.email,
                });
                showAlert('success', 'Perfil actualizado correctamente');
            } else {
                await AuthService.register({
                    username: form.username,
                    password: form.password,
                    email: form.email,
                    telefono: form.telefono,
                    nombre: form.nombre,
                    apellido: form.apellido,
                    dni: form.dni,
                    clubId: form.clubId ? parseInt(form.clubId, 10) : null,
                    federacionId: federacionId ? parseInt(federacionId, 10) : null,
                    rol: form.rol,
                });
                showAlert('success', 'Usuario creado exitosamente');
            }
            setView('lista');
            await loadData();
        } catch (err) {
            showAlert('error', err.message || 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActivo = (loginUser) => {
        const accion = loginUser.activo ? 'deshabilitar' : 'habilitar';
        setConfirmDialog({
            isOpen: true,
            title: loginUser.activo ? 'Deshabilitar cuenta' : 'Habilitar cuenta',
            message: `¿Confirmar ${accion} la cuenta de "${loginUser.username}"?`,
            type: loginUser.activo ? 'danger' : 'info',
            onConfirm: async () => {
                try {
                    await AuthService.toggleActivo(loginUser.id);
                    setUsuarios((prev) =>
                        prev.map((u) =>
                            u.id === loginUser.id ? { ...u, activo: !u.activo } : u
                        )
                    );
                    showAlert(
                        'success',
                        `Cuenta "${loginUser.username}" ${loginUser.activo ? 'deshabilitada' : 'habilitada'}.`
                    );
                } catch (err) {
                    showAlert('error', err.message || 'No se pudo cambiar el estado.');
                } finally {
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                }
            },
        });
    };

    const headerTitle =
        view === 'crear'
            ? 'Nueva credencial'
            : view === 'editar'
              ? 'Cambiar contraseña'
              : view === 'editarPerfil'
                ? 'Editar perfil'
                : 'Gestión de Logins';

    return (
        <div className="user-management-container fade-in">
            <PageHeader
                title={headerTitle}
                subtitle="Administrá credenciales, contraseñas y datos de acceso de la federación."
                icon={KeyRound}
                backTo={view === 'lista' ? '/dashboard' : false}
                actions={
                    view === 'lista' ? (
                        <Button variant="primary" onClick={handleOpenCrear}>
                            <Plus size={16} />
                            Nueva credencial
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={() => setView('lista')}>
                            Volver al listado
                        </Button>
                    )
                }
            />

            {alert && (
                <div className={`login-alert login-alert-${alert.type}`}>
                    {alert.text}
                </div>
            )}

            {view === 'lista' ? (
                loading ? (
                    <div className="login-loading">Cargando credenciales...</div>
                ) : (
                    <LoginGrid
                        usuarios={usuarios}
                        onEditPassword={handleOpenEditar}
                        onEditProfile={handleOpenEditarPerfil}
                        onToggleActivo={handleToggleActivo}
                    />
                )
            ) : (
                <LoginForm
                    initialData={form}
                    clubes={clubes}
                    saving={saving}
                    isEditing={view === 'editar'}
                    isEditingProfile={view === 'editarPerfil'}
                    showClubSelect={form.rol === 'Club'}
                    onCancel={() => setView('lista')}
                    onSubmit={handleSubmit}
                    onChange={handleFieldChange}
                />
            )}

            <ConfirmationModal
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type === 'warning' ? 'danger' : confirmDialog.type}
                confirmText="Confirmar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default GestionLoginsSection;
