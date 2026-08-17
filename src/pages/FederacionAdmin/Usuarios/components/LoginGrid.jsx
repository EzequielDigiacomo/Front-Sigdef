import React, { useEffect, useMemo, useState } from 'react';
import { Key, Power, PowerOff, Mail, Phone, Building2, Edit } from 'lucide-react';
import Pagination from '../../../../components/common/Pagination';
import './GestionLogins.css';

const PAGE_SIZE = 10;

const getLoginRole = (u) => u?.rol || u?.rolFederacion || u?.RolFederacion || '';

const ROL_LABEL = {
    SUPERADMIN: { label: 'SuperAdmin', color: '#3b82f6' },
    SuperAdmin: { label: 'SuperAdmin', color: '#3b82f6' },
    Admin: { label: 'Admin', color: '#ef4444' },
    Federacion: { label: 'Federación', color: '#ef4444' },
    Club: { label: 'Club', color: '#22c55e' },
    Entrenador: { label: 'Entrenador', color: '#f59e0b' },
    Delegado: { label: 'Delegado', color: '#06b6d4' },
    Largador: { label: 'Largador', color: '#f59e0b' },
    Cronometrista: { label: 'Cronometrista', color: '#3b82f6' },
    JuezControl: { label: 'Juez de Control', color: '#8b5cf6' },
    ControlTecnico: { label: 'Control técnico', color: '#14b8a6' },
};

const RolBadge = ({ rol }) => {
    const meta = ROL_LABEL[rol] || { label: rol || '—', color: '#94a3b8' };
    return (
        <span
            className="login-rol-badge"
            style={{
                background: `${meta.color}18`,
                color: meta.color,
                borderColor: `${meta.color}44`,
            }}
        >
            {meta.label}
        </span>
    );
};

const EstadoBadge = ({ activo }) => (
    <span className={`login-estado-badge ${activo !== false ? 'is-active' : 'is-inactive'}`}>
        <span className="login-estado-dot" />
        {activo !== false ? 'Activa' : 'Inactiva'}
    </span>
);

const LoginGrid = ({ usuarios, onEditPassword, onEditProfile, onToggleActivo, showFederation = false }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil((usuarios?.length || 0) / PAGE_SIZE));

    useEffect(() => {
        setCurrentPage(1);
    }, [usuarios]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const pageUsuarios = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return (usuarios || []).slice(start, start + PAGE_SIZE);
    }, [usuarios, currentPage]);

    if (!usuarios?.length) {
        return (
            <div className="glass-panel login-empty">
                No hay credenciales registradas todavía.
            </div>
        );
    }

    return (
        <div className="login-grid-container fade-in">
            <div className="logins-mobile-list">
                {pageUsuarios.map((u) => (
                    <div
                        key={u.id}
                        className="glass-panel login-mobile-card"
                        style={{ opacity: u.activo === false ? 0.65 : 1 }}
                    >
                        <div className="login-mobile-head">
                            <strong>{u.username}</strong>
                            <div className="login-badge-row">
                                <RolBadge rol={getLoginRole(u)} />
                                <EstadoBadge activo={u.activo} />
                            </div>
                        </div>
                        <p><Mail size={14} /> {u.email || 'Sin email'}</p>
                        <p>
                            <Building2 size={14} />
                            {u.clubNombre || '(Sin institución)'}
                        </p>
                        {showFederation && (
                            <p className="login-fed-line">
                                Federación: {u.federacionNombre || '—'}
                            </p>
                        )}
                        {u.telefono && <p><Phone size={14} /> {u.telefono}</p>}
                        <div className="login-actions-row">
                            <button type="button" className="login-action-btn" onClick={() => onEditProfile(u)} title="Editar perfil">
                                <Edit size={16} />
                            </button>
                            <button type="button" className="login-action-btn" onClick={() => onEditPassword(u)} title="Cambiar contraseña">
                                <Key size={16} />
                            </button>
                            <button
                                type="button"
                                className={`login-action-btn ${u.activo === false ? 'is-enable' : 'is-disable'}`}
                                onClick={() => onToggleActivo(u)}
                                title={u.activo === false ? 'Habilitar cuenta' : 'Deshabilitar cuenta'}
                            >
                                {u.activo === false ? <Power size={15} /> : <PowerOff size={15} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-panel logins-desktop-table">
                <table className="login-table">
                    <thead>
                        <tr>
                            <th>Estado</th>
                            <th>Usuario</th>
                            {showFederation && <th>Federación</th>}
                            <th>Institución</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th style={{ width: 120, textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageUsuarios.map((u) => (
                            <tr key={u.id} style={{ opacity: u.activo === false ? 0.55 : 1 }}>
                                <td><EstadoBadge activo={u.activo} /></td>
                                <td><strong>{u.username}</strong></td>
                                {showFederation && (
                                    <td>
                                        <span className="login-fed-chip">{u.federacionNombre || '—'}</span>
                                    </td>
                                )}
                                <td>
                                    {u.clubNombre || (
                                        <span className="login-muted">(Sin institución)</span>
                                    )}
                                </td>
                                <td>{u.email || '—'}</td>
                                <td><RolBadge rol={getLoginRole(u)} /></td>
                                <td>
                                    <div className="login-actions-row is-center">
                                        <button type="button" className="login-action-btn" onClick={() => onEditProfile(u)} title="Editar perfil">
                                            <Edit size={16} />
                                        </button>
                                        <button type="button" className="login-action-btn" onClick={() => onEditPassword(u)} title="Cambiar contraseña">
                                            <Key size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className={`login-action-btn ${u.activo === false ? 'is-enable' : 'is-disable'}`}
                                            onClick={() => onToggleActivo(u)}
                                            title={u.activo === false ? 'Habilitar cuenta' : 'Deshabilitar cuenta'}
                                        >
                                            {u.activo === false ? <Power size={15} /> : <PowerOff size={15} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {(usuarios?.length || 0) > PAGE_SIZE && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
};

export default LoginGrid;
