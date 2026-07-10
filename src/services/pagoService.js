import { api } from './api';

const PagoService = {
    getHistorial: async () => {
        return api.get('/pagos/historial');
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
};

export default PagoService;
