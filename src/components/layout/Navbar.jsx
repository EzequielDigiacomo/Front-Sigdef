import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { LogOut, User, Menu, LayoutDashboard, Shield, Users, Award, Calendar, ClipboardList, UserCheck, DollarSign, Trophy } from 'lucide-react';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Shield, label: 'Clubes', path: '/clubes' },
        { icon: Users, label: 'Atletas', path: '/atletas' },
        { icon: Award, label: 'Selección', path: '/entrenadores-seleccion' },
        { icon: Calendar, label: 'Eventos', path: '/eventos' },
        { icon: ClipboardList, label: 'Inscripciones', path: '/inscripciones' },
        { icon: UserCheck, label: 'Tutores', path: '/tutores' },
        { icon: DollarSign, label: 'Pagos', path: '/pagos' },
        { icon: Trophy, label: 'Federación', path: '/federacion' },
    ];

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-left">
                <button className="menu-toggle" onClick={toggleSidebar}>
                    <Menu size={24} color="var(--text-secondary)" />
                </button>
                <h1 className="brand-logo text-gradient">SIGDEF</h1>
            </div>

            <div className="navbar-center desktop-only">
                {navItems.map((item) => (
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
