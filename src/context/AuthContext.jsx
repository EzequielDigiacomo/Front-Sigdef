import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const isTokenValid = (token) => {
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

        const storedUser = sessionStorage.getItem('user');

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);

                if (parsedUser.token && isTokenValid(parsedUser.token)) {
                    setUser(parsedUser);
                    console.log('Sesión válida restaurada');
                } else {

                    console.log('Token expirado o inválido, limpiando sesión');
                    sessionStorage.removeItem('user');
                }
            } catch (error) {
                console.error('Error al parsear usuario almacenado:', error);
                sessionStorage.removeItem('user');
            }
        }

        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {

            const response = await api.post('/auth/login', { username, password });

            const { token, idPersona, username: responseUsername, estaActivo, nombreCompleto, email, rol, idClub } = response;

            const decoded = jwtDecode(token);
            const jwtRoleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];

            const roleClaim = jwtRoleClaim || rol;

            let mappedRole = 'FEDERACION';

            if (roleClaim === 'Club') {
                mappedRole = 'CLUB';
            } else if (roleClaim === 'Federacion' || roleClaim === 'Admin') {
                mappedRole = 'FEDERACION';
            } else if (roleClaim === 'Usuario' && idClub) {

                mappedRole = 'CLUB';
            } else if (roleClaim === 'Usuario') {

                mappedRole = 'FEDERACION';
            }

            const loggedUser = {
                username: responseUsername,
                token,
                idPersona: idPersona,
                nombreCompleto: nombreCompleto,
                email: email,
                role: mappedRole,
                idClub: idClub
            };
            setUser(loggedUser);
            sessionStorage.setItem('user', JSON.stringify(loggedUser));

            return true;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    };

    const logout = () => {
        console.log('Cerrando sesión...');
        setUser(null);
        sessionStorage.removeItem('user');

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
