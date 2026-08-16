import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Globe, DollarSign, Activity, LogOut, User, Menu, ShieldAlert,
    Building2, Users, Award, Shield, Cloud, Mail, Database,
} from 'lucide-react';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
import useUnreadMessages from '../../hooks/useUnreadMessages';
import './MainLayout.css';

const NAV_SECTIONS = [
    {
        label: 'General',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin', exact: true },
            { icon: Globe, label: 'Federaciones', path: '/superadmin/federaciones' },
            { icon: Cloud, label: 'Planes SaaS', path: '/superadmin/planes' },
            { icon: DollarSign, label: 'Suscripciones', path: '/superadmin/suscripciones' },
            { icon: Activity, label: 'Auditoría', path: '/superadmin/auditoria' },
            { icon: Database, label: 'Backups DB', path: '/superadmin/backups' },
            { icon: Mail, label: 'Mensajes', path: '/superadmin/mensajes', showBadge: true },
        ],
    },
    {
        label: 'Gestión',
        items: [
            { icon: Building2, label: 'Clubes', path: '/superadmin/modulos/clubes' },
            { icon: Users, label: 'Atletas', path: '/superadmin/modulos/atletas' },
            { icon: Award, label: 'Entrenadores', path: '/superadmin/modulos/entrenadores' },
            { icon: Shield, label: 'Selección Nacional', path: '/superadmin/modulos/selecciones' },
        ],
    },
];

const isPathActive = (pathname, path, exact) => {
    if (exact) return pathname === path;
    return pathname === path || pathname.startsWith(`${path}/`);
};

const MainLayoutSuper = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasUnread, unreadCount } = useUnreadMessages(true);

    useEffect(() => {
        const onResize = () => {
            const desktop = window.innerWidth >= 1024;
            setIsDesktop(desktop);
            if (desktop) setSidebarOpen(true);
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const sidebarVisible = isDesktop || sidebarOpen;

    const handleNavigation = (e, path) => {
        e.preventDefault();
        navigate(path);
        if (!isDesktop) setSidebarOpen(false);
    };

    const renderNavItem = (item) => {
        const active = isPathActive(location.pathname, item.path, item.exact);
        return (
            <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={(e) => handleNavigation(e, item.path)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.4rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    color: active ? 'var(--primary)' : 'var(--text-secondary)',
                    backgroundColor: active ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    fontWeight: active ? '600' : 'normal',
                    transition: 'var(--transition)',
                    fontSize: '0.8rem',
                    position: 'relative',
                }}
            >
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                    <item.icon size={16} />
                    {item.showBadge && hasUnread && (
                        <span
                            className="nav-unread-dot"
                            aria-label={`${unreadCount} no leídos`}
                            style={{ position: 'absolute', top: -2, right: -4 }}
                        />
                    )}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.showBadge && hasUnread && (
                    <span className="nav-unread-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </NavLink>
        );
    };

    return (
        <div className="app-container">
            <aside
                className={`sidebar glass-panel ${sidebarVisible ? 'open' : ''}`}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    width: '220px',
                    zIndex: 101,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRight: 'var(--glass-border)',
                }}
            >
                <div className="sidebar-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.85rem',
                    paddingBottom: '0.65rem',
                    borderBottom: 'var(--glass-border)',
                }}>
                    <ShieldAlert size={20} color="var(--primary)" />
                    <span className="sidebar-title text-gradient" style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                        SIGDEF SaaS
                    </span>
                </div>

                <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, overflowY: 'auto' }}>
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.label}>
                            <p style={{
                                margin: '0 0 0.25rem 0.4rem',
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'var(--text-secondary)',
                                opacity: 0.8,
                            }}>
                                {section.label}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                {section.items.map(renderNavItem)}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '0.65rem', borderTop: 'var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' }}>
                        <div className="avatar" style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--primary)',
                            padding: '0.35rem',
                            borderRadius: '50%',
                        }}>
                            <User size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0 }}>Superadmin</p>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0 }}>Administrador Global</p>
                        </div>
                        <ThemeToggle />
                    </div>
                    <Button variant="danger" size="sm" onClick={logout} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.4rem 0.5rem' }}>
                        <LogOut size={14} />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {!isDesktop && sidebarOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 100,
                    }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {!isDesktop && !sidebarOpen && (
                <button
                    type="button"
                    className="menu-toggle"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Abrir menú"
                    style={{
                        position: 'fixed',
                        top: '0.75rem',
                        left: '0.75rem',
                        zIndex: 99,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: 'var(--glass-border)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-md)',
                    }}
                >
                    <Menu size={18} color="var(--text-secondary)" />
                </button>
            )}

            <div
                className="main-content"
                style={{
                    paddingLeft: isDesktop ? '220px' : '0',
                    transition: 'padding 0.3s ease',
                    minHeight: '100vh',
                }}
            >
                <main className="page-content container" style={{
                    padding: isDesktop ? '0.85rem 1rem 1.5rem' : '3rem 1rem 1.5rem',
                    maxWidth: '1600px',
                    margin: '0 auto',
                    width: '100%',
                }}>
                    <Outlet />
                </main>

                <footer className="footer" style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                    <p>&copy; {new Date().getFullYear()} SIGDEF Multi-Tenant SaaS Portal</p>
                </footer>
            </div>
        </div>
    );
};

export default MainLayoutSuper;
