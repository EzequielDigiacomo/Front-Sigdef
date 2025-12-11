import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Trophy, Calendar, Shield, DollarSign, UserCheck, ClipboardList, Award, ChevronLeft, ChevronRight, Lock, Briefcase } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, closeMobile, isCollapsed, toggleSidebar }) => {
    const { user } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Shield, label: 'Clubes', path: '/clubes' },
        { icon: Users, label: 'Atletas', path: '/atletas' },
        { icon: Award, label: 'Entrenadores Club', path: '/entrenadores' },
        { icon: Award, label: 'Entrenadores Selección', path: '/entrenadores-seleccion' },
        { icon: Calendar, label: 'Eventos', path: '/eventos' },
        { icon: ClipboardList, label: 'Inscripciones', path: '/inscripciones' },
        { icon: Briefcase, label: 'Delegados Club', path: '/delegados' },
        { icon: UserCheck, label: 'Tutores', path: '/tutores' },
        { icon: DollarSign, label: 'Pagos', path: '/pagos' },
        { icon: Trophy, label: 'Federación', path: '/federacion' },
    ];

    if (user?.role === 'FEDERACION') {
        navItems.push({ icon: Lock, label: 'Gestión de Accesos', path: '/dashboard/usuarios' });
    }

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
                            onClick={closeMobile}
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