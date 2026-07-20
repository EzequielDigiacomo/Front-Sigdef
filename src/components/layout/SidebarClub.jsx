import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Users, Trophy, UserCheck, Award, Shield, Mail,
    ChevronLeft, ChevronRight, ClipboardList,
} from 'lucide-react';
import useUnreadMessages from '../../hooks/useUnreadMessages';
import './Sidebar.css';

const SidebarClub = ({ isOpen, closeMobile, isCollapsed, toggleSidebar }) => {
    const { hasUnread, unreadCount } = useUnreadMessages(true);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/club' },
        { icon: Users, label: 'Mis Atletas', path: '/club/atletas' },
        { icon: UserCheck, label: 'Mis Tutores', path: '/club/tutores' },
        { icon: Award, label: 'Mis Entrenadores', path: '/club/entrenadores' },
        { icon: Shield, label: 'Mis Delegados', path: '/club/delegados' },
        { icon: ClipboardList, label: 'Mis Inscripciones', path: '/club/registro-inscripciones' },
        { icon: Mail, label: 'Mensajes', path: '/club/mensajes', showBadge: true },
    ];

    return (
        <>
            <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-placeholder">
                        <Trophy size={32} color="var(--primary)" />
                    </div>
                    <span className="sidebar-title">Panel Club</span>
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
                            onClick={closeMobile}
                            title={isCollapsed ? item.label : ''}
                            end={item.path === '/club'}
                            style={{ position: 'relative', zIndex: 102 }}
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

export default SidebarClub;
