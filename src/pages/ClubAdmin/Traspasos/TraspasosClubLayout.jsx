import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ArrowRightLeft } from 'lucide-react';
import '../../Shared/Traspasos/Traspasos.css';

const TraspasosClubLayout = () => {
    const tabs = [
        { label: 'Solicitar traspaso', path: '/club/traspasos/solicitar' },
        { label: 'Mis solicitudes', path: '/club/traspasos/entrantes' },
        { label: 'Salidas pendientes', path: '/club/traspasos/salientes' },
    ];

    return (
        <div className="page-content container traspasos-page">
            <div className="traspasos-header">
                <div>
                    <h1><ArrowRightLeft size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />Traspasos</h1>
                    <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Gestione traspasos de atletas hacia o desde su club
                    </p>
                </div>
            </div>

            <nav className="traspasos-subnav">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) => (isActive ? 'active' : '')}
                    >
                        {tab.label}
                    </NavLink>
                ))}
            </nav>

            <Outlet />
        </div>
    );
};

export default TraspasosClubLayout;
