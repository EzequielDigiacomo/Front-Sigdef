import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Globe, DollarSign, Activity, LogOut, User, Menu, ShieldAlert } from 'lucide-react';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
import './MainLayout.css';

const MainLayoutSuper = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin' },
        { icon: Globe, label: 'Federaciones', path: '/superadmin/federaciones' },
        { icon: DollarSign, label: 'Suscripciones', path: '/superadmin/suscripciones' },
        { icon: Activity, label: 'Auditoría', path: '/superadmin/auditoria' },
    ];

    const handleNavigation = (e, path) => {
        e.preventDefault();
        navigate(path);
        setSidebarOpen(false);
    };

    return (
        <div className="app-container">
            {/* Sidebar para Superadmin */}
            <aside className={`sidebar glass-panel ${sidebarOpen ? 'open' : ''}`} style={{
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100vh',
                width: '280px',
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRight: 'var(--glass-border)'
            }}>
                <div className="sidebar-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '2rem',
                    paddingBottom: '1rem',
                    borderBottom: 'var(--glass-border)'
                }}>
                    <ShieldAlert size={32} color="var(--primary)" />
                    <span className="sidebar-title text-gradient" style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold'
                    }}>SIGDEF SaaS</span>
                </div>

                <nav className="sidebar-nav" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    flex: 1
                }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={(e) => handleNavigation(e, item.path)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                    fontWeight: isActive ? '600' : 'normal',
                                    transition: 'var(--transition)'
                                }}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-footer" style={{
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: 'var(--glass-border)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                    }}>
                        <div className="avatar" style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--primary)',
                            padding: '0.5rem',
                            borderRadius: '50%'
                        }}>
                            <User size={20} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Superadmin</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Administrador Global</p>
                        </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={logout} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        <LogOut size={16} />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Sidebar mobile overlay */}
            {sidebarOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100
                }} onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main content wrapper */}
            <div className="main-content" style={{
                paddingLeft: '0px',
                transition: 'padding 0.3s ease',
            }}>
                {/* Navbar para Superadmin */}
                <nav className="navbar glass-panel" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 2rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 99,
                    borderBottom: 'var(--glass-border)',
                    margin: '0 0 2rem 0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}>
                            <Menu size={24} color="var(--text-secondary)" />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldAlert size={24} color="var(--primary)" />
                            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-primary)' }}>SIGDEF Superadmin</span>
                            <span className="desktop-only" style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--success)',
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '20px',
                                fontWeight: 'bold',
                                border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>SaaS Multi-tenant</span>
                        </div>
                    </div>

                    {/* Nav Links para desktop */}
                    <div className="desktop-only" style={{ display: 'flex', gap: '1.5rem' }}>
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    style={{
                                        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                        fontWeight: isActive ? 'bold' : '500',
                                        fontSize: '0.95rem',
                                        transition: 'var(--transition)'
                                    }}
                                >
                                    {item.label}
                                </NavLink>
                            );
                        })}
                    </div>

                    <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <ThemeToggle />
                        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="user-name desktop-only" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Superadmin Global</span>
                            <div className="avatar" style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--primary)',
                                padding: '0.4rem',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <User size={18} />
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={logout} title="Cerrar Sesión">
                            <LogOut size={18} />
                        </Button>
                    </div>
                </nav>

                {/* Contenedor de páginas principales */}
                <main className="page-content container" style={{
                    padding: '0 2rem 3rem 2rem',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    width: '100%'
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
