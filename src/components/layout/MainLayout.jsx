import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNavBar from './MobileNavBar';
import GlobalSearch from '../common/GlobalSearch';
import { useDevice } from '../../hooks/useDevice';
import { useAuth } from '../../context/AuthContext';
import { warmupApi } from '../../services/api';
import './MainLayout.css';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const { isNative } = useDevice();
    const { user } = useAuth();

    React.useEffect(() => {
        if (user) warmupApi(user);
    }, [user?.idFederacion, user?.federacionId]);

    return (
        <div className={`app-container ${isNative ? 'is-mobile' : ''}`}>
            {!isNative && (
                <div className="sidebar-wrapper">
                    <Sidebar
                        isOpen={sidebarOpen}
                        closeMobile={() => setSidebarOpen(false)}
                    />
                </div>
            )}
            <div className={`main-content ${isNative ? 'full-width' : ''}`}>
                <Navbar
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
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
                    <p>&copy; {new Date().getFullYear()} SIGDEF — Gestión Adm. de Federaciones</p>
                </footer>
            </div>
        </div>
    );
};

export default MainLayout;