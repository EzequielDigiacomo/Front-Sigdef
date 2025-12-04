import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Función para validar si un token JWT es válido y no ha expirado
const isTokenValid = (token) => {
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Convertir a segundos

        // Verificar si el token tiene exp (expiration) y si no ha expirado
        if (decoded.exp && decoded.exp < currentTime) {
            console.log('Token expirado');
            return false; // Token expirado
        }

        return true; // Token válido
    } catch (error) {
        console.error('Error validando token:', error);
        return false; // Token inválido
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar sesión existente y validar token
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);

                // Validar que el token existe y es válido
                if (parsedUser.token && isTokenValid(parsedUser.token)) {
                    setUser(parsedUser);
                    console.log('Sesión válida restaurada');
                } else {
                    // Token expirado o inválido, limpiar
                    console.log('Token expirado o inválido, limpiando sesión');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('Error al parsear usuario almacenado:', error);
                localStorage.removeItem('user');
            }
        }

        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            // Attempt real authentication against the backend
            const response = await api.post('/auth/login', { username, password });
            // Backend returns token and user info
            const { token, idPersona, username: responseUsername, estaActivo, nombreCompleto, email, rol, idClub } = response;

            // Decode token to get role
            const decoded = jwtDecode(token);
            const jwtRoleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];

            // Priorizar el rol del JWT, pero si no existe, usar el rol de la respuesta
            const roleClaim = jwtRoleClaim || rol;

            // Mapear el rol del backend al formato esperado por el frontend
            let mappedRole = 'FEDERACION'; // Default

            if (roleClaim === 'Club') {
                mappedRole = 'CLUB';
            } else if (roleClaim === 'Federacion' || roleClaim === 'Admin') {
                mappedRole = 'FEDERACION';
            } else if (roleClaim === 'Usuario' && idClub) {
                // Si el rol es 'Usuario' pero tiene idClub, es un usuario de club
                mappedRole = 'CLUB';
            } else if (roleClaim === 'Usuario') {
                // Usuario sin club asociado, tratarlo como federación
                mappedRole = 'FEDERACION';
            }

            // Build a minimal user object to store in context and localStorage
            const loggedUser = {
                username: responseUsername,
                token,
                idPersona: idPersona,
                nombreCompleto: nombreCompleto,
                email: email,
                role: mappedRole,
                idClub: idClub // Guardar el idClub si existe
            };
            setUser(loggedUser);
            localStorage.setItem('user', JSON.stringify(loggedUser));
            // Set default Authorization header for future API calls
            // (api.js already reads token from stored user)
            return true;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    };

    const logout = () => {
        console.log('Cerrando sesión...');
        setUser(null);
        localStorage.removeItem('user');
        // Nota: Si en el futuro se agregan más datos de sesión, limpiarlos aquí
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
            {children}
        </AuthContext.Provider>
    );
};
