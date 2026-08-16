import { api } from './api';

const AuthService = {
    register: async (userData) => {
        const clubId = userData.clubId != null && userData.clubId !== ''
            ? parseInt(userData.clubId, 10)
            : null;
        const federacionId = userData.federacionId != null && userData.federacionId !== ''
            ? parseInt(userData.federacionId, 10)
            : null;
        const rolFederacion = userData.rolFederacion || userData.rol || 'Club';

        if (String(rolFederacion).toLowerCase() === 'club' && (!clubId || Number.isNaN(clubId))) {
            throw new Error('Un login de club debe estar vinculado a un club.');
        }

        return api.post('/Auth/register', {
            username: userData.username,
            password: userData.password,
            email: userData.email,
            telefono: userData.telefono,
            nombre: userData.nombre,
            apellido: userData.apellido,
            dni: userData.dni,
            clubId: clubId && !Number.isNaN(clubId) ? clubId : null,
            federacionId: federacionId && !Number.isNaN(federacionId) ? federacionId : null,
            rolFederacion,
        });
    },

    getUsuarios: async () => {
        const data = await api.get('/Auth/usuarios');
        return Array.isArray(data) ? data : [];
    },

    updatePassword: async (id, newPassword) => {
        return api.put(`/Auth/usuarios/${id}/password`, newPassword);
    },

    updatePerfil: async (id, data) => {
        return api.put(`/Auth/usuarios/${id}/perfil`, data);
    },

    toggleActivo: async (id) => {
        return api.patch(`/Auth/usuarios/${id}/toggle-activo`);
    },
};

export default AuthService;
