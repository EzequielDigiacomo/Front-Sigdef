import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import NavbarClub from './NavbarClub';
import SidebarClub from './SidebarClub';
import MobileNavBar from './MobileNavBar';
import GlobalSearch from '../common/GlobalSearch';
import { useDevice } from '../../hooks/useDevice';
import { useAuth } from '../../context/AuthContext';
import { warmupApi } from '../../services/api';
import './MainLayout.css';

const MainLayoutClub = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const { isNative } = useDevice();
    const { user } = useAuth();

    useEffect(() => {
        if (user) warmupApi(user);
    }, [user?.idClub, user?.idFederacion]);

    useEffect(() => {
        if (isNative) return; // No necesitamos temporizador de inactividad en mobile app

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
    }, [sidebarCollapsed, isHovering, isNative]);

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
        <div className={`app-container ${isNative ? 'is-mobile' : ''}`}>
            {!isNative && (
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
            )}
            
            <div className={`main-content ${sidebarCollapsed || isNative ? 'sidebar-collapsed full-width' : ''}`}>
                <NavbarClub
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    toggleCollapse={toggleSidebar}
                    isCollapsed={sidebarCollapsed}
                    hideSidebarToggle={isNative}
                />
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

export default MainLayoutClub;
