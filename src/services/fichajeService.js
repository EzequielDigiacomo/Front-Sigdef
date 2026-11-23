import { api } from './api';
import { withFederationScope } from '../utils/apiHelpers';

const FichajeService = {
    getFichajes: (estado, fedId) => {
        const q = estado != null && estado !== '' ? `?estado=${estado}` : '';
        return api.get(withFederationScope(`/Atleta/fichajes${q}`, fedId));
    },

    aprobar: (id, fedId) => api.post(withFederationScope(`/Atleta/${id}/fichaje/aprobar`, fedId)),

    observar: (id, motivo, fedId) =>
        api.post(withFederationScope(`/Atleta/${id}/fichaje/observar`, fedId), { motivo }),

    rechazar: (id, motivo, fedId) =>
        api.post(withFederationScope(`/Atleta/${id}/fichaje/rechazar`, fedId), { motivo }),

    getHistorial: (id, fedId) =>
        api.get(withFederationScope(`/Atleta/${id}/fichaje/historial`, fedId)),

    getPadron: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.clubId != null) qs.set('clubId', params.clubId);
        if (params.categoria != null) qs.set('categoria', params.categoria);
        if (params.soloHabilitados != null) qs.set('soloHabilitados', params.soloHabilitados);
        if (params.estadoFichaje != null && params.estadoFichaje !== '') qs.set('estadoFichaje', params.estadoFichaje);
        if (params.busqueda) qs.set('busqueda', params.busqueda);
        const query = qs.toString();
        return api.get(withFederationScope(`/Atleta/padron${query ? `?${query}` : ''}`, params.fedId));
    },

    getResumen: (fedId) => api.get(withFederationScope('/Atleta/reportes/resumen', fedId)),
};

export default FichajeService;
