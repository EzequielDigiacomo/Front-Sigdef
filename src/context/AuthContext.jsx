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

/** Acepta id válido (>0); trata 0/null/undefined/'' como ausente. */
const pickPositiveId = (...values) => {
    for (const value of values) {
        if (value == null || value === '') continue;
        const n = Number(value);
        if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
};

const decodeTokenSafe = (token) => {
    try {
        return jwtDecode(token);
    } catch {
        return null;
    }
};

const resolveClubId = (sources = {}, decoded = null) =>
    pickPositiveId(
        sources.idClub,
        sources.IdClub,
        sources.clubId,
        sources.ClubId,
        decoded?.ClubId,
        decoded?.clubId
    );

const resolveFederacionId = (sources = {}, decoded = null) =>
    pickPositiveId(
        sources.idFederacion,
        sources.IdFederacion,
        sources.federacionId,
        sources.FederacionId,
        decoded?.FederacionId,
        decoded?.federacionId
    );

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

                const decoded = decodeTokenSafe(parsedUser.token);
                let plan = normalizePlan(parsedUser.plan || parsedUser.Plan);
                let me = null;

                try {
                    me = await api.get('/auth/me');
                    plan = normalizePlan(me?.plan || me?.Plan) || plan;
                } catch {
                    /* usar plan de localStorage si /me falla */
                }

                const idClub = resolveClubId({ ...parsedUser, ...(me || {}) }, decoded);
                const idFederacion = resolveFederacionId({ ...parsedUser, ...(me || {}) }, decoded);
                const clubNombre =
                    me?.clubNombre || me?.ClubNombre || parsedUser.clubNombre || parsedUser.ClubNombre || null;

                const restoredUser = {
                    ...parsedUser,
                    plan,
                    idClub,
                    clubId: idClub,
                    idFederacion,
                    clubNombre,
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
                nombre,
                apellido,
                nombreCompleto,
                clubNombre,
                ClubNombre,
            } = response;

            const token = responseToken || responseTokenPascal;
            if (!token) {
                throw new Error('El servidor no devolvió token de autenticación');
            }

            const decoded = decodeTokenSafe(token);
            const jwtRoleClaim =
                decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded?.role;
            const roleClaim = jwtRoleClaim || rol || rolFederacion || response.RolFederacion;

            const finalClubId = resolveClubId(response, decoded);
            const finalFederacionId = resolveFederacionId(response, decoded);

            let mappedRole = 'FEDERACION';
            if (roleClaim === 'SUPERADMIN' || roleClaim === 'SuperAdmin') {
                mappedRole = 'SUPERADMIN';
            } else if (roleClaim === 'Club') {
                mappedRole = 'CLUB';
            } else if (roleClaim === 'Federacion' || roleClaim === 'Admin') {
                mappedRole = 'FEDERACION';
            } else if (roleClaim === 'Usuario' && finalClubId) {
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

            if (mappedRole === 'CLUB' && !finalClubId) {
                throw new Error(
                    'La cuenta de club no tiene un club asociado (IdClub vacío). Pedile al administrador que vincule el usuario al club.'
                );
            }

            const finalNombreCompleto =
                nombreCompleto || (nombre && apellido ? `${nombre} ${apellido}` : nombre || '');

            const loggedUser = {
                username: responseUsername || decoded?.unique_name || decoded?.name,
                token,
                idPersona: idPersona || 0,
                nombreCompleto: finalNombreCompleto,
                email: email || '',
                role: mappedRole,
                idClub: finalClubId,
                clubId: finalClubId,
                idFederacion: finalFederacionId,
                clubNombre: clubNombre || ClubNombre || null,
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

    const logout = () => {
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
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
