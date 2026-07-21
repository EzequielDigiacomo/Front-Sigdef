import { api } from './api';

const TraspasoService = {
    getPeriodos: async () => api.get('/Traspaso/periodos'),

    getPeriodoActivo: async () => api.get('/Traspaso/periodo-activo'),

    createPeriodo: async (dto) => api.post('/Traspaso/periodos', dto),

    updatePeriodo: async (id, dto) => api.put(`/Traspaso/periodos/${id}`, dto),

    getSolicitudes: async (estado) => {
        const qs = estado ? `?estado=${encodeURIComponent(estado)}` : '';
        return api.get(`/Traspaso${qs}`);
    },

    getSolicitud: async (id) => api.get(`/Traspaso/${id}`),

    getValidaciones: async (id) => api.get(`/Traspaso/${id}/validaciones`),

    buscarAtletas: async (term) =>
        api.get(`/Traspaso/buscar-atletas?term=${encodeURIComponent(term)}`),

    crearSolicitud: async (dto) => api.post('/Traspaso', dto),

    aceptarOrigen: async (id) => api.post(`/Traspaso/${id}/aceptar-origen`),

    rechazarOrigen: async (id, motivo) =>
        api.post(`/Traspaso/${id}/rechazar-origen`, { motivo }),

    aprobar: async (id, forzar = false) =>
        api.post(`/Traspaso/${id}/aprobar${forzar ? '?forzar=true' : ''}`),

    rechazar: async (id, motivo) =>
        api.post(`/Traspaso/${id}/rechazar`, { motivo }),

    cancelar: async (id) => api.post(`/Traspaso/${id}/cancelar`),

    getAuditoria: async (limit = 50) =>
        api.get(`/Traspaso/auditoria?limit=${limit}`),

    exportCsv: async ({ periodoId, estado } = {}) => {
        const params = new URLSearchParams();
        if (periodoId) params.set('periodoId', String(periodoId));
        if (estado) params.set('estado', estado);

        const base = import.meta.env.VITE_API_URL || 'http://localhost:5029/api';
        let token = null;
        try {
            const raw = localStorage.getItem('user');
            if (raw) token = JSON.parse(raw)?.token ?? JSON.parse(raw)?.Token;
        } catch { /* ignore */ }

        const response = await fetch(`${base}/Traspaso/export/csv?${params}`, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                'X-Client-App': 'sigdef',
            },
        });

        if (!response.ok) {
            throw new Error('No se pudo exportar el CSV de traspasos.');
        }

        return response.blob();
    },
};

export default TraspasoService;
