import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Key } from 'lucide-react';
import RegisterClubForm from './components/RegisterClubForm';
import RegisterPersonForm from './components/RegisterPersonForm';
import ChangePasswordForm from './components/ChangePasswordForm';
import UserTable from './components/UserTable';
import { api } from '../../../services/api';
import './UserManagement.css';

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('club');
    const [users, setUsers] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(false);

    const tabs = [
        { id: 'club', label: 'Registrar Club', icon: Shield },
        { id: 'person', label: 'Registrar Usuario', icon: UserPlus },
        { id: 'password', label: 'Cambiar Contraseña', icon: Key },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, clubsData] = await Promise.all([
                api.get('/Usuario'),
                api.get('/Club')
            ]);
            setUsers(usersData || []);
            setClubs(clubsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-management-container fade-in">
            <div className="page-header">
                <h1 className="text-gradient">Gestión de Accesos</h1>
                <p className="text-secondary">Administración de usuarios y credenciales</p>
            </div>

            <div className="tabs-container glass-panel">
                <div className="tabs-header">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="tab-content">
                    {activeTab === 'club' && <RegisterClubForm onUserCreated={fetchData} />}
                    {activeTab === 'person' && <RegisterPersonForm onUserCreated={fetchData} />}
                    {activeTab === 'password' && <ChangePasswordForm />}
                </div>
            </div>

            <div className="glass-panel mt-6">
                <h3 className="text-lg font-semibold mb-4 px-4 pt-4">Usuarios Registrados</h3>
                <UserTable users={users} clubs={clubs} />
            </div>
        </div>
    );
};

export default UserManagement;
