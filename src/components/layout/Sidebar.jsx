import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Users, Trophy, Shield, UserCheck, Award,
    ChevronLeft, ChevronRight, Lock, Briefcase, Mail,
} from 'lucide-react';
import useUnreadMessages from '../../hooks/useUnreadMessages';
import './Sidebar.css';

const Sidebar = ({ isOpen, closeMobile, isCollapsed, toggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { hasUnread, unreadCount } = useUnreadMessages(true);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Shield, label: 'Clubes', path: '/dashboard/clubes' },
        { icon: Users, label: 'Atletas', path: '/dashboard/atletas' },
        { icon: Award, label: 'Entrenadores', path: '/dashboard/entrenadores' },
        { icon: Briefcase, label: 'Delegados Club', path: '/dashboard/delegados' },
        { icon: UserCheck, label: 'Tutores', path: '/dashboard/tutores' },
        { icon: Mail, label: 'Mensajes', path: '/dashboard/mensajes', showBadge: true },
        { icon: Trophy, label: 'Federación', path: '/dashboard/federacion' },
    ];

    if (user?.role === 'FEDERACION') {
        navItems.push({ icon: Lock, label: 'Gestión de Accesos', path: '/dashboard/usuarios' });
    }

    const handleNavigation = (e, path) => {
        e.preventDefault();
        navigate(path);
        if (closeMobile) closeMobile();
    };

    return (
        <>
            <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-placeholder">
                        <Shield size={32} color="var(--primary)" />
                    </div>
                    <span className="sidebar-title">Panel Admin</span>
                    <button
                        className="collapse-toggle"
                        onClick={toggleSidebar}
                        title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={(e) => handleNavigation(e, item.path)}
                            title={isCollapsed ? item.label : ''}
                            end={item.path === '/dashboard'}
                        >
                            <span className="nav-item-icon-wrap">
                                <item.icon size={20} />
                                {item.showBadge && hasUnread && (
                                    <span className="nav-unread-dot" aria-label={`${unreadCount} no leídos`} />
                                )}
                            </span>
                            <span className="nav-label">{item.label}</span>
                            {item.showBadge && hasUnread && (
                                <span className="nav-unread-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </aside>
            {isOpen && <div className="sidebar-overlay" onClick={closeMobile}></div>}
        </>
    );
};

export default Sidebar;
