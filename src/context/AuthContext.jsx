import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { normalizePlan, canAccessSigdef } from '../utils/planHelpers';

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
        const restoreSession = async () => {
            const storedUser = localStorage.getItem('user');

            if (!storedUser) {
                setLoading(false);
                return;
            }

            try {
                const parsedUser = JSON.parse(storedUser);

                if (!parsedUser.token || !isTokenValid(parsedUser.token)) {
                    localStorage.removeItem('user');
                    setLoading(false);
                    return;
                }

                let plan = normalizePlan(parsedUser.plan || parsedUser.Plan);

                try {
                    const me = await api.get('/auth/me');
                    plan = normalizePlan(me?.plan || me?.Plan) || plan;
                } catch {
                    /* usar plan de localStorage si /me falla */
                }

                const restoredUser = {
                    ...parsedUser,
                    plan,
                };

                if (restoredUser.role !== 'SUPERADMIN' && plan && !canAccessSigdef(plan)) {
                    localStorage.removeItem('user');
                    setLoading(false);
                    return;
                }

                setUser(restoredUser);
                localStorage.setItem('user', JSON.stringify(restoredUser));
            } catch (error) {
                console.error('Error al restaurar sesión:', error);
                localStorage.removeItem('user');
            }

            setLoading(false);
        };

        restoreSession();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });

            const {
                token: responseToken,
                Token: responseTokenPascal,
                idPersona,
                username: responseUsername,
                email,
                rol,
                rolFederacion,
                idClub,
                idFederacion,
                clubId,
                nombre,
                apellido,
                nombreCompleto,
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

            const plan = normalizePlan(response.plan || response.Plan);

            if (mappedRole !== 'SUPERADMIN' && !canAccessSigdef(plan)) {
                throw new Error(
                    plan
                        ? `Tu plan actual (${plan.nombre}) no incluye acceso a SIGDEF. Necesitás un plan SIGDEF o Pack Dúo.`
                        : 'Tu cuenta no tiene un plan SaaS asignado. Contactá al administrador.'
                );
            }

            const finalFederacionId = idFederacion || response.IdFederacion || response.federacionId || jwtFederacionId;
            const finalClubId = idClub || clubId || response.ClubId || response.clubId;
            const finalNombreCompleto = nombreCompleto || (nombre && apellido ? `${nombre} ${apellido}` : nombre || '');

            const loggedUser = {
                username: responseUsername || decoded.unique_name || decoded.name,
                token,
                idPersona: idPersona || 0,
                nombreCompleto: finalNombreCompleto,
                email: email || '',
                role: mappedRole,
                idClub: finalClubId,
                idFederacion: finalFederacionId ? parseInt(finalFederacionId, 10) : null,
                plan,
            };

            setUser(loggedUser);
            localStorage.setItem('user', JSON.stringify(loggedUser));

            return true;
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
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
