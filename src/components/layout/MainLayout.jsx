import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './MainLayout.css';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-container">
            <div
                className="sidebar-wrapper"
            >
                <Sidebar
                    isOpen={sidebarOpen}
                    closeMobile={() => setSidebarOpen(false)}
                />
            </div>
            <div className={`main-content`}>
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