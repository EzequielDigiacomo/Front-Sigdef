import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Globe, DollarSign, Activity, LogOut, User, Menu, ShieldAlert,
    Building2, Users, Award, Shield, Cloud,
} from 'lucide-react';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
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
                    gap: '0.75rem',
                    padding: '0.65rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    color: active ? 'var(--primary)' : 'var(--text-secondary)',
                    backgroundColor: active ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    fontWeight: active ? '600' : 'normal',
                    transition: 'var(--transition)',
                    fontSize: '0.9rem',
                }}
            >
                <item.icon size={18} />
                <span>{item.label}</span>
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
                    width: '280px',
                    zIndex: 101,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRight: 'var(--glass-border)',
                }}
            >
                <div className="sidebar-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: 'var(--glass-border)',
                }}>
                    <ShieldAlert size={28} color="var(--primary)" />
                    <span className="sidebar-title text-gradient" style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>
                        SIGDEF SaaS
                    </span>
                </div>

                <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.label}>
                            <p style={{
                                margin: '0 0 0.4rem 0.5rem',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'var(--text-secondary)',
                                opacity: 0.8,
                            }}>
                                {section.label}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {section.items.map(renderNavItem)}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: 'var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div className="avatar" style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--primary)',
                            padding: '0.5rem',
                            borderRadius: '50%',
                        }}>
                            <User size={20} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>Superadmin</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Administrador Global</p>
                        </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={logout} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        <LogOut size={16} />
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

            <div
                className="main-content"
                style={{
                    paddingLeft: isDesktop ? '280px' : '0',
                    transition: 'padding 0.3s ease',
                    minHeight: '100vh',
                }}
            >
                <nav className="navbar glass-panel" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.5rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 99,
                    borderBottom: 'var(--glass-border)',
                    margin: '0 0 1.5rem 0',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            type="button"
                            className="menu-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'none', border: 'none' }}
                        >
                            <Menu size={24} color="var(--text-secondary)" />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldAlert size={22} color="var(--primary)" />
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>SIGDEF Superadmin</span>
                        </div>
                    </div>

                    <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" onClick={logout} title="Cerrar Sesión">
                            <LogOut size={18} />
                        </Button>
                    </div>
                </nav>

                <main className="page-content container" style={{
                    padding: '0 1.5rem 3rem',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    width: '100%',
                }}>
                    <Outlet />
                </main>

                <footer className="footer">
                    <p>&copy; {new Date().getFullYear()} SIGDEF Multi-Tenant SaaS Portal</p>
                </footer>
            </div>
        </div>
    );
};

export default MainLayoutSuper;
