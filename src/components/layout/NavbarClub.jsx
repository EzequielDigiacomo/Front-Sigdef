import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { LogOut, User, Menu, LayoutDashboard, Users, Calendar, Trophy, Info, UserCheck, Award, Shield } from 'lucide-react';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
import './Navbar.css';

const NavbarClub = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/club' },
        { icon: Info, label: 'Mi Club', path: '/club/info' },
        { icon: Users, label: 'Atletas', path: '/club/atletas' },
        { icon: UserCheck, label: 'Tutores', path: '/club/tutores' },
        { icon: Award, label: 'Entrenadores', path: '/club/entrenadores' },
        { icon: Shield, label: 'Delegados', path: '/club/delegados' },
        //        { icon: Calendar, label: 'Eventos', path: '/club/eventos' },
        //        { icon: Trophy, label: 'Disponibles', path: '/club/eventos-disponibles' },
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
                <div className="nav-row">
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
