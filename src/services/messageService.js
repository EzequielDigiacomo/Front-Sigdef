import { api } from './api';

const MessageService = {
    getHilos: async (campanaId = null) => {
        const qs = campanaId != null ? `?campanaId=${encodeURIComponent(campanaId)}` : '';
        return api.get(`/mensajes/hilos${qs}`);
    },

    getHilo: async (hiloId) => api.get(`/mensajes/hilos/${hiloId}`),

    crearHilo: async ({ destinatarioId, asunto, cuerpo }) =>
        api.post('/mensajes/hilos', { destinatarioId, asunto, cuerpo }),

    enviarMasivo: async ({ asunto, cuerpo, destinatarioIds }) =>
        api.post('/mensajes/hilos/masivo', { asunto, cuerpo, destinatarioIds }),

    getCampanas: async () => api.get('/mensajes/campanas'),

    getCampana: async (campanaId) => api.get(`/mensajes/campanas/${campanaId}`),

    responderHilo: async (hiloId, cuerpo) =>
        api.post(`/mensajes/hilos/${hiloId}/responder`, { cuerpo }),

    marcarLeido: async (hiloId) => api.patch(`/mensajes/hilos/${hiloId}/leer`),

    getNoLeidosCount: async () => api.get('/mensajes/no-leidos/count'),
};

export default MessageService;
