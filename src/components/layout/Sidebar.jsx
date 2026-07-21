import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Users, Trophy, Shield, UserCheck, Award,
    ChevronLeft, ChevronRight, Lock, Briefcase, Mail, ClipboardList,
    ArrowRightLeft,
} from 'lucide-react';
import useUnreadMessages from '../../hooks/useUnreadMessages';
import usePendingTraspasos from '../../hooks/usePendingTraspasos';
import './Sidebar.css';

const Sidebar = ({ isOpen, closeMobile, isCollapsed, toggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { hasUnread, unreadCount } = useUnreadMessages(true);
    const { hasPending, pendingCount } = usePendingTraspasos(true);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Shield, label: 'Clubes', path: '/dashboard/clubes' },
        { icon: Users, label: 'Atletas', path: '/dashboard/atletas' },
        { icon: ArrowRightLeft, label: 'Traspasos', path: '/dashboard/traspasos', showBadge: true, badgeCount: pendingCount, hasBadge: hasPending },
        { icon: Award, label: 'Entrenadores', path: '/dashboard/entrenadores' },
        { icon: Briefcase, label: 'Delegados Club', path: '/dashboard/delegados' },
        { icon: UserCheck, label: 'Tutores', path: '/dashboard/tutores' },
        { icon: ClipboardList, label: 'Registro Inscripciones', path: '/dashboard/registro-inscripciones' },
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
                                {item.showBadge && (item.hasBadge ?? hasUnread) && (
                                    <span className="nav-unread-dot" aria-label={`${item.badgeCount ?? unreadCount} pendientes`} />
                                )}
                            </span>
                            <span className="nav-label">{item.label}</span>
                            {item.showBadge && (item.hasBadge ?? hasUnread) && (
                                <span className="nav-unread-count">
                                    {(item.badgeCount ?? unreadCount) > 99 ? '99+' : (item.badgeCount ?? unreadCount)}
                                </span>
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
