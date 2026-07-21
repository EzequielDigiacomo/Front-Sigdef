import { api } from './api';

const PagoService = {
    getHistorial: async (fedId) => {
        const endpoint =
            fedId != null && fedId !== ''
                ? `/pagos/historial?idFederacion=${encodeURIComponent(String(fedId))}`
                : '/pagos/historial';
        return api.get(endpoint);
    },

    registrarPago: async (pagoData) => {
        return api.post('/pagos/registrar', pagoData);
    },

    toggleClubStatus: async (clubId, alDia) => {
        return api.put(`/pagos/clubes/${clubId}/toggle`, alDia);
    },

    toggleAtletaStatus: async (atletaId, alDia) => {
        return api.put(`/pagos/atletas/${atletaId}/toggle`, alDia);
    },

    toggleInscripcionStatus: async (inscripcionId, pagado) => {
        return api.put(`/pagos/inscripciones/${inscripcionId}/toggle`, pagado);
    },

    eliminarPago: async (pagoId) => {
        return api.delete(`/pagos/${pagoId}`);
    },

    eliminarPagos: async (ids) => {
        return api.delete('/pagos/bulk', {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ids),
        });
    },
};

export default PagoService;
