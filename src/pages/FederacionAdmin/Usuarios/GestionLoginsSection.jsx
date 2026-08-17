import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, KeyRound } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import SearchInput from '../../../components/common/SearchInput';
import AuthService from '../../../services/AuthService';
import { api } from '../../../services/api';
import { fetchFederacionesList } from '../../../services/saasService';
import { useAuth } from '../../../context/AuthContext';
import {
    pick,
    clubBelongsToFederation,
    filterClubesByFederation,
    getUsuarioFederationName,
} from '../../../utils/apiHelpers';
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

const emptyForm = {
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    clubId: '',
    federacionId: '',
    rol: 'Club',
    newPassword: '',
    confirmNewPassword: '',
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
};

const normalizeUsuario = (u, clubes = [], federaciones = []) => {
    const id = pick(u, 'id', 'Id', 'idUsuario', 'IdUsuario');
    const clubId = pick(u, 'clubId', 'ClubId', 'idClub', 'IdClub');
    const club = clubes.find((c) => String(pick(c, 'idClub', 'IdClub', 'id', 'Id')) === String(clubId));
    const activoRaw = pick(u, 'activo', 'Activo', 'estaActivo', 'EstaActivo');
    const federacionId = pick(u, 'federacionId', 'FederacionId', 'idFederacion', 'IdFederacion');

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
        federacionId,
        clubNombre: pick(u, 'clubNombre', 'ClubNombre')
            || pick(club, 'nombre', 'Nombre')
            || null,
        federacionNombre: getUsuarioFederationName(u, clubes, federaciones),
        activo: activoRaw !== false && activoRaw !== 0,
    };
};

const mapFederacionForLogins = (f) => {
    const id = pick(f, 'idFederacion', 'id', 'Id');
    const planNombre = pick(f, 'plan', 'planNombre', 'PlanNombre') || 'Sin plan';
    const planSaaSId = pick(f, 'planSaaSId', 'PlanSaaSId');
    return {
        id,
        nombre: pick(f, 'nombre', 'Nombre') || 'Federación',
        planSaaSId,
        planNombre,
        plan: normalizePlan({ id: planSaaSId, nombre: planNombre }),
    };
};

const GestionLoginsSection = () => {
    const { user } = useAuth();
    const { fedId: fedIdFromParams } = useParams();
    const isSuper = user?.role === 'SUPERADMIN';
    const scopeFedId = fedIdFromParams || null;

    const userPlan = useMemo(
        () => normalizePlan(extractPlanFromUser(user) || user?.plan),
        [user]
    );

    const [clubes, setClubes] = useState([]);
    const [federaciones, setFederaciones] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('lista');
    const [selectedUser, setSelectedUser] = useState(null);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFedId, setFilterFedId] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: null,
    });

    const [form, setForm] = useState(emptyForm);

    const showAlert = (type, text) => {
        setAlert({ type, text });
        window.setTimeout(() => setAlert(null), 4000);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, clubsRes, fedsRes] = await Promise.all([
                AuthService.getUsuarios(),
                api.get('/Club').catch(() => []),
                isSuper ? fetchFederacionesList().catch(() => []) : Promise.resolve([]),
            ]);
            const clubs = Array.isArray(clubsRes) ? clubsRes : [];
            const feds = (Array.isArray(fedsRes) ? fedsRes : []).map(mapFederacionForLogins);
            setClubes(clubs);
            setFederaciones(feds);
            setUsuarios((usersRes || []).map((u) => normalizeUsuario(u, clubs, feds)));
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuper, scopeFedId]);

    const resolvePlanForForm = () => {
        const fedId = form.federacionId || scopeFedId;
        if (fedId) {
            const fed = federaciones.find((f) => String(f.id) === String(fedId));
            return fed?.plan ?? null;
        }
        if (!isSuper) return userPlan;
        return null;
    };

    const handleOpenCrear = () => {
        const plan = scopeFedId
            ? (federaciones.find((f) => String(f.id) === String(scopeFedId))?.plan ?? userPlan)
            : userPlan;
        const defaultRol = (!isSuper || scopeFedId) && canAccessDashboardClub(plan) ? 'Club' : DEFAULT_ROL;
        setSelectedUser(null);
        setForm({
            ...emptyForm,
            federacionId: scopeFedId || '',
            rol: defaultRol,
        });
        setView('crear');
    };

    const handleOpenEditar = (loginUser) => {
        setSelectedUser(loginUser);
        setForm({
            ...emptyForm,
            username: loginUser.username,
            nombre: loginUser.nombre || '',
            apellido: loginUser.apellido || '',
        });
        setView('editar');
    };

    const handleOpenEditarPerfil = (loginUser) => {
        setSelectedUser(loginUser);
        setForm({
            ...emptyForm,
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
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            if (name === 'federacionId') {
                next.clubId = '';
                const fed = federaciones.find((f) => String(f.id) === String(value));
                if (ROLES_JUEZ.includes(next.rol) && !fed?.plan?.accesoControlesLive) {
                    next.rol = fed?.plan?.accesoDashboardClub ? 'Club' : DEFAULT_ROL;
                } else if (next.rol === 'Club' && !fed?.plan?.accesoDashboardClub) {
                    next.rol = DEFAULT_ROL;
                }
            }
            return next;
        });
    };

    const federacionIdUsuario = user?.idFederacion || user?.federacionId || null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (view === 'editar') {
            if (!form.newPassword || form.newPassword.length < 6) {
                showAlert('error', 'La contraseña debe tener al menos 6 caracteres');
                return;
            }
            if (form.newPassword !== form.confirmNewPassword) {
                showAlert('error', 'Las contraseñas no coinciden');
                return;
            }
        } else if (view === 'crear') {
            if (form.password !== form.confirmPassword) {
                showAlert('error', 'Las contraseñas no coinciden');
                return;
            }
            if (isSuper && !scopeFedId && !form.federacionId) {
                showAlert('error', 'Seleccioná la federación de esta credencial.');
                return;
            }
            if (form.rol === 'Club' && !form.clubId) {
                showAlert('error', 'Seleccioná el club al que vincular esta credencial.');
                return;
            }
            if (form.rol === 'Club' && !canAccessDashboardClub(resolvePlanForForm())) {
                showAlert('error', 'El plan no incluye dashboard/login Club (desde Profesional).');
                return;
            }
            if (ROLES_JUEZ.includes(form.rol) && !canAccessControlesLive(resolvePlanForForm())) {
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
                const resolvedFedId = form.federacionId || scopeFedId || federacionIdUsuario;
                await AuthService.register({
                    username: form.username,
                    password: form.password,
                    email: form.email,
                    telefono: form.telefono,
                    nombre: form.nombre,
                    apellido: form.apellido,
                    dni: form.dni,
                    clubId: form.clubId ? parseInt(form.clubId, 10) : null,
                    federacionId: resolvedFedId ? parseInt(resolvedFedId, 10) : null,
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

    const filteredUsuarios = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        const fedFilter = filterFedId || scopeFedId;

        return usuarios.filter((u) => {
            if (fedFilter) {
                const userFedId = pick(u, 'federacionId', 'FederacionId');
                if (userFedId) {
                    if (String(userFedId) !== String(fedFilter)) return false;
                } else if (u.clubId) {
                    const userClub = clubes.find((c) => String(pick(c, 'idClub', 'IdClub', 'id', 'Id')) === String(u.clubId));
                    if (!userClub || !clubBelongsToFederation(userClub, fedFilter)) return false;
                } else {
                    const rol = String(u.rol || '').toLowerCase();
                    if (rol === 'superadmin') return false;
                    return false;
                }
            }

            if (!q) return true;
            return [
                u.username,
                u.email,
                u.clubNombre,
                u.federacionNombre,
                u.rol,
                u.nombre,
                u.apellido,
            ].some((v) => String(v || '').toLowerCase().includes(q));
        });
    }, [usuarios, clubes, searchTerm, filterFedId, scopeFedId]);

    const clubsForForm = useMemo(() => {
        const fedFilter = form.federacionId || scopeFedId;
        return filterClubesByFederation(clubes, fedFilter);
    }, [clubes, form.federacionId, scopeFedId]);

    const headerTitle =
        view === 'crear'
            ? 'Nueva credencial'
            : view === 'editar'
              ? 'Cambiar contraseña'
              : view === 'editarPerfil'
                ? 'Editar perfil'
                : isSuper && !scopeFedId
                  ? 'Logins de todo el sistema'
                  : 'Gestión de Logins';

    const headerSubtitle = isSuper && !scopeFedId
        ? 'Buscá cualquier usuario y modificá su contraseña, perfil o estado.'
        : isSuper
            ? 'Administrá credenciales y contraseñas de esta federación.'
            : 'Administrá credenciales, contraseñas y datos de acceso de la federación.';

    const backTo = isSuper
        ? (scopeFedId ? `/superadmin/federacion/${scopeFedId}` : '/superadmin')
        : '/dashboard';

    const showFederationColumn = isSuper && !scopeFedId;

    return (
        <div className={`user-management-container fade-in${isSuper ? ' is-wide' : ''}`}>
            <PageHeader
                title={headerTitle}
                subtitle={headerSubtitle}
                icon={KeyRound}
                backTo={view === 'lista' ? backTo : false}
                backLabel={isSuper && scopeFedId ? 'Dashboard federación' : 'Volver'}
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
                    <>
                        <div className="login-toolbar">
                            <SearchInput
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por usuario, email, federación o club..."
                            />
                            {showFederationColumn && (
                                <select
                                    className="form-input login-filter-select"
                                    value={filterFedId}
                                    onChange={(e) => setFilterFedId(e.target.value)}
                                    aria-label="Filtrar por federación"
                                >
                                    <option value="">Todas las federaciones</option>
                                    {federaciones.map((f) => (
                                        <option key={f.id} value={f.id}>{f.nombre}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <LoginGrid
                            usuarios={filteredUsuarios}
                            onEditPassword={handleOpenEditar}
                            onEditProfile={handleOpenEditarPerfil}
                            onToggleActivo={handleToggleActivo}
                            showFederation={showFederationColumn}
                        />
                    </>
                )
            ) : (
                <LoginForm
                    initialData={form}
                    clubes={clubsForForm}
                    federaciones={federaciones}
                    effectiveFedId={scopeFedId}
                    saving={saving}
                    isEditing={view === 'editar'}
                    isEditingProfile={view === 'editarPerfil'}
                    showFederationSelect={isSuper && !scopeFedId}
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
