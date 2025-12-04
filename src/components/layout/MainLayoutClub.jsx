import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import NavbarClub from './NavbarClub';
import SidebarClub from './SidebarClub';
import './MainLayout.css';

const MainLayoutClub = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        let inactivityTimer;

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            if (!sidebarCollapsed && !isHovering) {
                inactivityTimer = setTimeout(() => {
                    setSidebarCollapsed(true);
                }, 10000); 
            }
        };

        const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });

        resetTimer(); 

        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, [sidebarCollapsed, isHovering]);

    const handleSidebarHover = (hovering) => {
        setIsHovering(hovering);
        if (hovering && sidebarCollapsed) {
            setSidebarCollapsed(false);
        }
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="app-container">
            <div
                className="sidebar-wrapper"
                onMouseEnter={() => handleSidebarHover(true)}
                onMouseLeave={() => handleSidebarHover(false)}
            >
                <SidebarClub
                    isOpen={sidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    closeMobile={() => setSidebarOpen(false)}
                    toggleSidebar={toggleSidebar}
                />
            </div>
            <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <NavbarClub
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    toggleCollapse={toggleSidebar}
                    isCollapsed={sidebarCollapsed}
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

export default MainLayoutClub;
