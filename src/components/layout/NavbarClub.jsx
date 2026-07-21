import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { LogOut, User, Menu, LayoutDashboard, Users, UserCheck, Award, Shield, Mail, ArrowRightLeft } from 'lucide-react';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
import useUnreadMessages from '../../hooks/useUnreadMessages';
import usePendingTraspasos from '../../hooks/usePendingTraspasos';
import './Navbar.css';

const NavbarClub = ({ toggleSidebar, hideSidebarToggle }) => {
    const { user, logout } = useAuth();
    const { hasUnread, unreadCount } = useUnreadMessages(true);
    const { hasPending, pendingCount } = usePendingTraspasos(true);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/club' },
        { icon: Users, label: 'Atletas', path: '/club/atletas' },
        { icon: ArrowRightLeft, label: 'Traspasos', path: '/club/traspasos', showBadge: true, badgeCount: pendingCount, hasBadge: hasPending },
        { icon: UserCheck, label: 'Tutores', path: '/club/tutores' },
        { icon: Award, label: 'Entrenadores', path: '/club/entrenadores' },
        { icon: Shield, label: 'Delegados', path: '/club/delegados' },
        { icon: Mail, label: 'Mensajes', path: '/club/mensajes', showBadge: true },
    ];

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-left">
                {!hideSidebarToggle && (
                    <button className="menu-toggle" onClick={toggleSidebar}>
                        <Menu size={24} color="var(--text-secondary)" />
                    </button>
                )}
                <h1 className="brand-logo text-gradient">SIGDEF</h1>
            </div>

            <div className="navbar-center desktop-only">
                <div className="nav-row">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            title={item.label}
                            end={item.path === '/club'}
                        >
                            <span className="nav-label">{item.label}</span>
                            {item.showBadge && (item.hasBadge ?? hasUnread) && (
                                <span className="nav-unread-dot" aria-label={`${item.badgeCount ?? unreadCount} pendientes`} />
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>

            <div className="navbar-right">
                <ThemeToggle />
                <div className="user-info">
                    <span className="user-name">{user?.nombreCompleto || 'Usuario'}</span>
                    <div className="avatar">
                        <User size={20} />
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} title="Cerrar Sesión">
                    <LogOut size={18} />
                </Button>
            </div>
        </nav>
    );
};

export default NavbarClub;
