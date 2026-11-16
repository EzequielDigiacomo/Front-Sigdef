import { api } from './api';

const FichajeService = {
    getFichajes: (estado) => {
        const q = estado != null && estado !== '' ? `?estado=${estado}` : '';
        return api.get(`/Atleta/fichajes${q}`);
    },

    aprobar: (id) => api.post(`/Atleta/${id}/fichaje/aprobar`),

    observar: (id, motivo) => api.post(`/Atleta/${id}/fichaje/observar`, { motivo }),

    rechazar: (id, motivo) => api.post(`/Atleta/${id}/fichaje/rechazar`, { motivo }),

    getHistorial: (id) => api.get(`/Atleta/${id}/fichaje/historial`),

    getPadron: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.clubId != null) qs.set('clubId', params.clubId);
        if (params.categoria != null) qs.set('categoria', params.categoria);
        if (params.soloHabilitados != null) qs.set('soloHabilitados', params.soloHabilitados);
        if (params.estadoFichaje != null && params.estadoFichaje !== '') qs.set('estadoFichaje', params.estadoFichaje);
        if (params.busqueda) qs.set('busqueda', params.busqueda);
        const query = qs.toString();
        return api.get(`/Atleta/padron${query ? `?${query}` : ''}`);
    },

    getResumen: () => api.get('/Atleta/reportes/resumen'),
};

export default FichajeService;
