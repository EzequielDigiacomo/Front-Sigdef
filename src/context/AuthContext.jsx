import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const isTokenValid = (token) => {
    if (!token || token.startsWith('mock-')) return false;
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp < currentTime) {
            console.log('Token expirado');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validando token:', error);
        return false;
    }
};
// En tu AuthContext, busca dónde se setea el usuario


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const storedUser = localStorage.getItem('user');

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);

                if (parsedUser.token && isTokenValid(parsedUser.token)) {
                    setUser(parsedUser);
                    console.log('Sesión válida restaurada');
                } else {

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
            const response = await api.post('/auth/login', { username, password });

            const { 
                token: responseToken, 
                Token: responseTokenPascal,
                idPersona, 
                username: responseUsername, 
                estaActivo, 
                nombreCompleto, 
                email, 
                rol, 
                rolFederacion,
                idClub, 
                idFederacion,
                clubId,
                nombre,
                apellido
            } = response;

            const token = responseToken || responseTokenPascal;
            if (!token) {
                throw new Error('El servidor no devolvió token de autenticación');
            }

            const decoded = jwtDecode(token);
            const jwtRoleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];
            const jwtFederacionId = decoded['FederacionId'];

            const roleClaim = jwtRoleClaim || rol || rolFederacion;

            let mappedRole = 'FEDERACION';

            if (roleClaim === 'SUPERADMIN' || roleClaim === 'SuperAdmin') {
                mappedRole = 'SUPERADMIN';
            } else if (roleClaim === 'Club') {
                mappedRole = 'CLUB';
            } else if (roleClaim === 'Federacion' || roleClaim === 'Admin') {
                mappedRole = 'FEDERACION';
            } else if (roleClaim === 'Usuario' && (idClub || clubId)) {
                mappedRole = 'CLUB';
            } else if (roleClaim === 'Usuario') {
                mappedRole = 'FEDERACION';
            }

            const finalFederacionId = idFederacion || response.IdFederacion || jwtFederacionId;
            const finalClubId = idClub || clubId;
            const finalNombreCompleto = nombreCompleto || (nombre && apellido ? `${nombre} ${apellido}` : nombre || '');

            const loggedUser = {
                username: responseUsername || decoded.unique_name || decoded.name,
                token,
                idPersona: idPersona || 0,
                nombreCompleto: finalNombreCompleto,
                email: email || '',
                role: mappedRole,
                idClub: finalClubId,
                idFederacion: finalFederacionId ? parseInt(finalFederacionId) : null,
                plan: response.plan || null
            };
            setUser(loggedUser);
            localStorage.setItem('user', JSON.stringify(loggedUser));

            return true;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    };

    const logout = (response) => {
        console.log('Cerrando sesión...');
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
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
