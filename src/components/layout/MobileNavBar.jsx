import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Search, User, Briefcase } from 'lucide-react';
import './MobileNavBar.css';

const MobileNavBar = ({ role, onSearchClick }) => {
    return (
        <nav className="mobile-navbar">
            <NavLink to={role === 'CLUB' ? '/club' : '/dashboard'} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} end>
                <Home size={24} />
                <span>Inicio</span>
            </NavLink>
            
            <NavLink to={role === 'CLUB' ? '/club/atletas' : '/dashboard/atletas'} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Users size={24} />
                <span>Atletas</span>
            </NavLink>

            <div className="mobile-nav-item search-btn" onClick={onSearchClick}>
                <div className="search-icon-wrapper">
                    <Search size={28} />
                </div>
                <span>Buscar</span>
            </div>

            <NavLink to={role === 'CLUB' ? '/club/delegados' : '/dashboard/delegados'} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Briefcase size={24} />
                <span>Gestión</span>
            </NavLink>

            <NavLink to={role === 'CLUB' ? '/club/info' : '/dashboard/federacion'} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                <User size={24} />
                <span>Perfil</span>
            </NavLink>
        </nav>
    );
};

export default MobileNavBar;
