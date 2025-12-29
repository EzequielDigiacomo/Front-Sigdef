import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './MainLayout.css';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Ocultar Sidebar y Navbar si estamos en la raíz del Dashboard de Federación
    const isDashboardRoot = location.pathname === '/dashboard';

    return (
        <div className={`app-container ${isDashboardRoot ? 'no-nav' : ''}`}>
            {!isDashboardRoot && (
                <div className="sidebar-wrapper">
                    <Sidebar
                        isOpen={sidebarOpen}
                        closeMobile={() => setSidebarOpen(false)}
                    />
                </div>
            )}
            <div className={`main-content ${isDashboardRoot ? 'full-width' : ''}`}>
                <Navbar
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />
                <main className="page-content container">
                    <Outlet />
                </main>
                <footer className="footer">
                    <p>&copy; {new Date().getFullYear()} SIGDEF - Sistema de Gestión Deportiva</p>
                </footer>
            </div>
        </div>
    );
};

export default MainLayout;