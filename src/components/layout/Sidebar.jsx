import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Trophy, Calendar, Shield, DollarSign, UserCheck, ClipboardList, Award, ChevronLeft, ChevronRight, Lock, Briefcase } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, closeMobile, isCollapsed, toggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Shield, label: 'Clubes', path: '/dashboard/clubes' },
        { icon: Users, label: 'Atletas', path: '/dashboard/atletas' },
        { icon: Award, label: 'Entrenadores Club', path: '/dashboard/entrenadores' },
        { icon: Award, label: 'Entrenadores Selección', path: '/dashboard/entrenadores-seleccion' },
        //        { icon: Calendar, label: 'Eventos', path: '/dashboard/eventos' },
        //        { icon: ClipboardList, label: 'Inscripciones', path: '/dashboard/inscripciones' },
        { icon: Briefcase, label: 'Delegados Club', path: '/dashboard/delegados' },
        { icon: UserCheck, label: 'Tutores', path: '/dashboard/tutores' },
        { icon: DollarSign, label: 'Pagos', path: '/dashboard/pagos' },
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

export default Sidebar;