import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar sesión existente
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            // ========================================
            // CREDENCIALES TEMPORALES PARA DESARROLLO
            // ========================================

            // Login de Federación (Administrador)
            if (username === 'admin' && password === 'admin') {
                const mockUser = {
                    username,
                    role: 'FEDERACION',
                    nombre: 'Administrador Federación',
                    email: 'admin@federacion.com'
                };
                setUser(mockUser);
                localStorage.setItem('user', JSON.stringify(mockUser));
                return true;
            }

            // ========================================
            // CREDENCIALES TEMPORALES PARA CLUBES
            // ========================================

            // Club 1: Club Deportivo Central
            if (username === 'central' && password === 'central') {
                const clubUser = {
                    username: 'central',
                    role: 'CLUB',
                    nombre: 'Club Deportivo Central',
                    email: '351-6047890',
                    clubId: 1,
                    clubData: {
                        direccion: 'Av. Deportiva 1234',
                        telefono: '351-6047890',
                        presidente: 'Presidente Central',
                        fechaFundacion: '2010-01-01'
                    }
                };
                setUser(clubUser);
                localStorage.setItem('user', JSON.stringify(clubUser));
                return true;
            }

            // Club 2: Club Argentino
            if (username === 'argentino' && password === 'argentino') {
                const clubUser = {
                    username: 'argentino',
                    role: 'CLUB',
                    nombre: 'Club Argentino',
                    email: '3412290901',
                    clubId: 2,
                    clubData: {
                        direccion: 'Calle 4',
                        telefono: '3412290901',
                        presidente: 'Presidente Argentino',
                        fechaFundacion: '2010-01-01'
                    }
                };
                setUser(clubUser);
                localStorage.setItem('user', JSON.stringify(clubUser));
                return true;
            }

            // Club 3: Reserva Nautica de Baigorria
            if (username === 'nautica' && password === 'nautica') {
                const clubUser = {
                    username: 'nautica',
                    role: 'CLUB',
                    nombre: 'Reserva Nautica de Baigorria',
                    email: '3414710930',
                    clubId: 3,
                    clubData: {
                        direccion: 'Calle4',
                        telefono: '3414710930',
                        presidente: 'Presidente Nautica',
                        fechaFundacion: '2010-01-01'
                    }
                };
                setUser(clubUser);
                localStorage.setItem('user', JSON.stringify(clubUser));
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error en login:', error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
