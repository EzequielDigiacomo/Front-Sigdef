import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Info, ChevronLeft, ChevronRight, Trophy, UserCheck, Award, Shield } from 'lucide-react';
import './Sidebar.css';

const SidebarClub = ({ isOpen, closeMobile, isCollapsed, toggleSidebar }) => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/club' },
        { icon: Info, label: 'Mi Club', path: '/club/info' },
        { icon: Users, label: 'Mis Atletas', path: '/club/atletas' },
        { icon: UserCheck, label: 'Mis Tutores', path: '/club/tutores' },
        { icon: Award, label: 'Mis Entrenadores', path: '/club/entrenadores' },
        { icon: Shield, label: 'Mis Delegados', path: '/club/delegados' },
        //        { icon: Calendar, label: 'Mis Eventos', path: '/club/eventos' },
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
                            style={{ position: 'relative', zIndex: 102 }} // Ensure clickable
                        >
                            <item.icon size={20} />
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
            {isOpen && <div className="sidebar-overlay" onClick={closeMobile}></div>}
        </>
    );
};

export default SidebarClub;
