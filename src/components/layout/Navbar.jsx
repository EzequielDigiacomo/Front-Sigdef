import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { LogOut, User, Menu, LayoutDashboard, Shield, Users, Award, Calendar, ClipboardList, UserCheck, DollarSign, Trophy, Lock, Briefcase } from 'lucide-react';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Shield, label: 'Clubes', path: '/dashboard/clubes' },
        { icon: Users, label: 'Atletas', path: '/dashboard/atletas' },
        { icon: Award, label: 'Entrenadores Club', path: '/dashboard/entrenadores' },
        { icon: Award, label: 'Entrenadores Selección', path: '/dashboard/entrenadores-seleccion' },
        { icon: Trophy, label: 'Selecciones', path: '/dashboard/selecciones' },
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

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-left">
                <button className="menu-toggle" onClick={toggleSidebar}>
                    <Menu size={24} color="var(--text-secondary)" />
                </button>
                <h1 className="brand-logo text-gradient">SIGDEF</h1>
            </div>

            <div className="navbar-center desktop-only">
                <div className="nav-row">
                    {navItems.slice(0, 8).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            title={item.label}
                        >
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
                <div className="nav-row">
                    {navItems.slice(8).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            title={item.label}
                        >
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>

            <div className="navbar-right">
                <ThemeToggle />
                <div className="user-info">
                    <span className="user-name">{user?.nombre || 'Usuario'}</span>
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

export default Navbar;
