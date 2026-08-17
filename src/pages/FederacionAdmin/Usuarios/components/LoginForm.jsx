import React, { useEffect, useMemo, useState } from 'react';
import { Save, Eye, EyeOff, User } from 'lucide-react';
import Button from '../../../../components/common/Button';
import { useAuth } from '../../../../context/AuthContext';
import { pick } from '../../../../utils/apiHelpers';
import {
    canAccessControlesLive,
    canAccessDashboardClub,
    extractPlanFromUser,
    normalizePlan,
} from '../../../../utils/planHelpers';
import './GestionLogins.css';

const ROLES_JUEZ = ['Largador', 'Cronometrista', 'JuezControl', 'ControlTecnico'];
const DEFAULT_ROL = 'Admin';

const LoginForm = ({
    initialData,
    clubes = [],
    federaciones = [],
    effectiveFedId = null,
    onCancel,
    onSubmit,
    onChange,
    saving,
    isEditing,
    isEditingProfile,
    showFederationSelect = false,
    showClubSelect = false,
}) => {
    const { user } = useAuth();
    const isSuper = user?.role === 'SUPERADMIN';
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const targetFedId = initialData.federacionId || effectiveFedId || '';

    const federationPlan = useMemo(() => {
        if (targetFedId) {
            const fed = federaciones.find((f) => String(f.id) === String(targetFedId));
            if (fed?.plan) return normalizePlan(fed.plan);
            if (fed?.planSaaSId || fed?.planNombre) {
                return normalizePlan({
                    id: fed.planSaaSId,
                    nombre: fed.planNombre,
                });
            }
        }
        if (!isSuper) return normalizePlan(extractPlanFromUser(user) || user?.plan);
        return null;
    }, [targetFedId, federaciones, isSuper, user]);

    const planForGates = federationPlan ?? (!isSuper ? normalizePlan(extractPlanFromUser(user) || user?.plan) : null);

    const judgeRolesEnabled = isSuper
        ? (targetFedId ? canAccessControlesLive(federationPlan) : false)
        : canAccessControlesLive(planForGates);
    const clubRoleEnabled = isSuper
        ? (targetFedId ? canAccessDashboardClub(federationPlan) : false)
        : canAccessDashboardClub(planForGates);

    const isJuezRole = ROLES_JUEZ.includes(initialData.rol);
    const isClubRole = initialData.rol === 'Club';

    useEffect(() => {
        if (isEditing || isEditingProfile) return;
        if (isJuezRole && !judgeRolesEnabled) {
            onChange('rol', clubRoleEnabled ? 'Club' : DEFAULT_ROL);
            return;
        }
        if (isClubRole && !clubRoleEnabled) {
            onChange('rol', DEFAULT_ROL);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [judgeRolesEnabled, clubRoleEnabled, isJuezRole, isClubRole, isEditing, isEditingProfile]);

    const needsFedFirst = !targetFedId && showFederationSelect;
    const judgeLabel = needsFedFirst
        ? '(Seleccioná federación primero)'
        : '(Exclusivo Ecosistema / Pack Dúo)';
    const clubLabel = needsFedFirst
        ? '(Seleccioná federación primero)'
        : '(Desde plan Profesional)';

    return (
        <div className="glass-panel login-form-panel fade-in">
            <form onSubmit={onSubmit} className="login-form-grid">
                {!isEditing && !isEditingProfile ? (
                    <>
                        <section className="login-form-section">
                            <h4>Rol y permisos</h4>
                            {showFederationSelect && (
                                <div className="form-group fade-in">
                                    <label htmlFor="login-federacion">Federación *</label>
                                    <select
                                        id="login-federacion"
                                        className="form-input"
                                        name="federacionId"
                                        value={initialData.federacionId || ''}
                                        onChange={(e) => onChange('federacionId', e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar federación...</option>
                                        {federaciones.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.planNombre ? `${f.nombre} — ${f.planNombre}` : f.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {targetFedId && federationPlan && (
                                        <small className="login-muted">
                                            Plan: <strong>{federationPlan.nombre || 'Sin plan'}</strong>
                                            {clubRoleEnabled ? ' · Login Club OK' : ' · Sin login Club'}
                                        </small>
                                    )}
                                </div>
                            )}
                            <div className="form-group">
                                <label htmlFor="login-rol">Tipo de usuario / Rol *</label>
                                <select
                                    id="login-rol"
                                    className="form-input"
                                    name="rol"
                                    value={initialData.rol}
                                    onChange={(e) => onChange('rol', e.target.value)}
                                    required
                                >
                                    <option value="Admin">Administrador (acceso total)</option>
                                    <option value="Club" disabled={!clubRoleEnabled}>
                                        Club (representante) {!clubRoleEnabled ? clubLabel : ''}
                                    </option>
                                    <option value="Largador" disabled={!judgeRolesEnabled}>
                                        Juez: Largador {!judgeRolesEnabled ? judgeLabel : ''}
                                    </option>
                                    <option value="Cronometrista" disabled={!judgeRolesEnabled}>
                                        Juez: Cronometrista {!judgeRolesEnabled ? judgeLabel : ''}
                                    </option>
                                    <option value="JuezControl" disabled={!judgeRolesEnabled}>
                                        Juez de Control {!judgeRolesEnabled ? judgeLabel : ''}
                                    </option>
                                    <option value="ControlTecnico" disabled={!judgeRolesEnabled}>
                                        Control técnico {!judgeRolesEnabled ? judgeLabel : ''}
                                    </option>
                                </select>
                            </div>

                            {showClubSelect && (
                                <div className="form-group fade-in">
                                    <label htmlFor="login-club">Club a vincular *</label>
                                    <select
                                        id="login-club"
                                        className="form-input"
                                        name="clubId"
                                        value={initialData.clubId || ''}
                                        onChange={(e) => onChange('clubId', e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar club...</option>
                                        {clubes.map((c) => {
                                            const id = pick(c, 'idClub', 'IdClub', 'id', 'Id');
                                            return (
                                                <option key={id} value={id}>
                                                    {pick(c, 'nombre', 'Nombre') || id}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {clubes.length === 0 && (
                                        <small className="login-muted">
                                            Registrá primero un club en la federación.
                                        </small>
                                    )}
                                </div>
                            )}
                        </section>

                        <section className="login-form-section">
                            <h4>Credenciales de acceso</h4>
                            <div className="form-group">
                                <label htmlFor="login-username">Nombre de usuario *</label>
                                <input
                                    id="login-username"
                                    className="form-input"
                                    type="text"
                                    name="username"
                                    value={initialData.username}
                                    onChange={(e) => onChange('username', e.target.value)}
                                    required
                                    minLength={4}
                                    autoComplete="off"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="login-email">Email *</label>
                                <input
                                    id="login-email"
                                    className="form-input"
                                    type="email"
                                    name="email"
                                    value={initialData.email}
                                    onChange={(e) => onChange('email', e.target.value)}
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="login-password">Contraseña *</label>
                                <div className="login-password-wrap">
                                    <input
                                        id="login-password"
                                        className="form-input"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={initialData.password}
                                        onChange={(e) => onChange('password', e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="login-eye-btn"
                                        onClick={() => setShowPassword((v) => !v)}
                                        title={showPassword ? 'Ocultar' : 'Mostrar'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="login-confirm">Confirmar contraseña *</label>
                                <div className="login-password-wrap">
                                    <input
                                        id="login-confirm"
                                        className="form-input"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={initialData.confirmPassword}
                                        onChange={(e) => onChange('confirmPassword', e.target.value)}
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="login-eye-btn"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        title={showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="login-form-section login-form-section-full">
                            <h4>
                                <User size={16} />
                                Datos de contacto
                                <span className="login-optional">(opcional)</span>
                            </h4>
                            <div className="form-group">
                                <label htmlFor="login-telefono">Teléfono</label>
                                <input
                                    id="login-telefono"
                                    className="form-input"
                                    type="tel"
                                    name="telefono"
                                    value={initialData.telefono || ''}
                                    onChange={(e) => onChange('telefono', e.target.value)}
                                    placeholder="ej: +54 11 1234-5678"
                                />
                            </div>
                        </section>
                    </>
                ) : isEditing ? (
                    <section className="login-form-section login-form-section-full">
                        <h4>
                            Actualizar contraseña de <span className="text-gradient">{initialData.username}</span>
                        </h4>
                        <div className="form-group">
                            <label htmlFor="login-new-password">Nueva contraseña *</label>
                            <div className="login-password-wrap">
                                <input
                                    id="login-new-password"
                                    className="form-input"
                                    type={showPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    value={initialData.newPassword}
                                    onChange={(e) => onChange('newPassword', e.target.value)}
                                    required
                                    minLength={6}
                                    autoFocus
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="login-eye-btn"
                                    onClick={() => setShowPassword((v) => !v)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="login-confirm-new">Confirmar nueva contraseña *</label>
                            <div className="login-password-wrap">
                                <input
                                    id="login-confirm-new"
                                    className="form-input"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmNewPassword"
                                    value={initialData.confirmNewPassword}
                                    onChange={(e) => onChange('confirmNewPassword', e.target.value)}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="login-eye-btn"
                                    onClick={() => setShowConfirmPassword((v) => !v)}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="login-form-section login-form-section-full">
                        <h4>
                            Editar perfil de <span className="text-gradient">{initialData.username}</span>
                        </h4>
                        <div className="login-profile-grid">
                            <div className="form-group">
                                <label htmlFor="perfil-email">Email</label>
                                <input
                                    id="perfil-email"
                                    className="form-input"
                                    type="email"
                                    name="email"
                                    value={initialData.email || ''}
                                    onChange={(e) => onChange('email', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="perfil-telefono">Teléfono</label>
                                <input
                                    id="perfil-telefono"
                                    className="form-input"
                                    type="tel"
                                    name="telefono"
                                    value={initialData.telefono || ''}
                                    onChange={(e) => onChange('telefono', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="perfil-nombre">Nombre</label>
                                <input
                                    id="perfil-nombre"
                                    className="form-input"
                                    type="text"
                                    name="nombre"
                                    value={initialData.nombre || ''}
                                    onChange={(e) => onChange('nombre', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="perfil-apellido">Apellido</label>
                                <input
                                    id="perfil-apellido"
                                    className="form-input"
                                    type="text"
                                    name="apellido"
                                    value={initialData.apellido || ''}
                                    onChange={(e) => onChange('apellido', e.target.value)}
                                />
                            </div>
                        </div>
                    </section>
                )}

                <div className="login-form-actions">
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" isLoading={saving}>
                        <Save size={16} />
                        {isEditing
                            ? 'Actualizar contraseña'
                            : isEditingProfile
                              ? 'Actualizar perfil'
                              : 'Crear usuario'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;
