import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNavBar from './MobileNavBar';
import GlobalSearch from '../common/GlobalSearch';
import { useDevice } from '../../hooks/useDevice';
import { useAuth } from '../../context/AuthContext';
import './MainLayout.css';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const { isNative } = useDevice();
    const { user } = useAuth();
    const location = useLocation();

    // Ocultar Sidebar y Navbar si estamos en la raíz del Dashboard de Federación
    const isDashboardRoot = location.pathname === '/dashboard';

    return (
        <div className={`app-container ${isDashboardRoot ? 'no-nav' : ''} ${isNative ? 'is-mobile' : ''}`}>
            {!isDashboardRoot && !isNative && (
                <div className="sidebar-wrapper">
                    <Sidebar
                        isOpen={sidebarOpen}
                        closeMobile={() => setSidebarOpen(false)}
                    />
                </div>
            )}
            <div className={`main-content ${isDashboardRoot || isNative ? 'full-width' : ''}`}>
                {!isDashboardRoot && (
                    <Navbar
                        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                        hideSidebarToggle={isNative}
                    />
                )}
                <main className="page-content container">
                    <Outlet />
                </main>

                {isNative && (
                    <>
                        <MobileNavBar 
                            role={user?.role} 
                            onSearchClick={() => setSearchOpen(true)} 
                        />
                        <GlobalSearch 
                            isOpen={searchOpen} 
                            onClose={() => setSearchOpen(false)} 
                            role={user?.role}
                        />
                    </>
                )}

                <footer className="footer">
                    <p>&copy; {new Date().getFullYear()} SIGDEF - Sistema de Gestión Deportiva</p>
                </footer>
            </div>
        </div>
    );
};

export default MainLayout;