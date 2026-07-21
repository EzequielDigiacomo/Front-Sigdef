import { pick } from './apiHelpers';

export const ESTADOS_TRASPASO = {
    PendienteOrigen: { label: 'Pendiente club origen', color: 'warning' },
    RechazadoOrigen: { label: 'Rechazado origen', color: 'danger' },
    PendienteFederacion: { label: 'Pendiente verificación fed.', color: 'info' },
    Aprobado: { label: 'Aprobado', color: 'success' },
    RechazadoFederacion: { label: 'Rechazado federación', color: 'danger' },
    Cancelado: { label: 'Cancelado', color: 'secondary' },
    Vencido: { label: 'Vencido', color: 'secondary' },
};

export const normalizeSolicitud = (s) => ({
    id: pick(s, 'id', 'Id', 'idSolicitudTraspaso', 'IdSolicitudTraspaso'),
    idFederacion: pick(s, 'idFederacion', 'IdFederacion'),
    participanteId: pick(s, 'participanteId', 'ParticipanteId'),
    participanteNombre: pick(s, 'participanteNombre', 'ParticipanteNombre') || '—',
    participanteDocumento: pick(s, 'participanteDocumento', 'ParticipanteDocumento') || '—',
    idClubOrigen: pick(s, 'idClubOrigen', 'IdClubOrigen'),
    clubOrigenNombre: pick(s, 'clubOrigenNombre', 'ClubOrigenNombre') || '—',
    idClubDestino: pick(s, 'idClubDestino', 'IdClubDestino'),
    clubDestinoNombre: pick(s, 'clubDestinoNombre', 'ClubDestinoNombre') || '—',
    estado: pick(s, 'estado', 'Estado') || '',
    motivoSolicitud: pick(s, 'motivoSolicitud', 'MotivoSolicitud'),
    motivoRechazo: pick(s, 'motivoRechazo', 'MotivoRechazo'),
    fechaSolicitud: pick(s, 'fechaSolicitud', 'FechaSolicitud'),
    fechaRespuestaOrigen: pick(s, 'fechaRespuestaOrigen', 'FechaRespuestaOrigen'),
    fechaRespuestaFederacion: pick(s, 'fechaRespuestaFederacion', 'FechaRespuestaFederacion'),
    fechaEjecucion: pick(s, 'fechaEjecucion', 'FechaEjecucion'),
});

export const normalizePeriodo = (p) => ({
    id: pick(p, 'id', 'Id', 'idPeriodoTraspaso', 'IdPeriodoTraspaso'),
    idFederacion: pick(p, 'idFederacion', 'IdFederacion'),
    fechaInicio: pick(p, 'fechaInicio', 'FechaInicio'),
    fechaFin: pick(p, 'fechaFin', 'FechaFin'),
    activo: pick(p, 'activo', 'Activo') !== false,
    observaciones: pick(p, 'observaciones', 'Observaciones') || '',
    esVigente: !!pick(p, 'esVigente', 'EsVigente'),
});

export const normalizeAtletaBusqueda = (a) => ({
    participanteId: pick(a, 'participanteId', 'ParticipanteId'),
    nombre: pick(a, 'nombre', 'Nombre') || '—',
    documento: pick(a, 'documento', 'Documento') || '—',
    idClub: pick(a, 'idClub', 'IdClub'),
    clubNombre: pick(a, 'clubNombre', 'ClubNombre') || '—',
});

export const normalizeValidaciones = (v) => ({
    solicitudId: pick(v, 'solicitudId', 'SolicitudId'),
    puedeAprobar: !!pick(v, 'puedeAprobar', 'PuedeAprobar'),
    items: (pick(v, 'items', 'Items') || []).map((item) => ({
        codigo: pick(item, 'codigo', 'Codigo'),
        descripcion: pick(item, 'descripcion', 'Descripcion'),
        ok: !!pick(item, 'ok', 'Ok'),
        bloqueante: !!pick(item, 'bloqueante', 'Bloqueante'),
        detalle: pick(item, 'detalle', 'Detalle'),
    })),
});

export const getEstadoTraspasoMeta = (estado) =>
    ESTADOS_TRASPASO[estado] || { label: estado || '—', color: 'secondary' };

export const formatFecha = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const toDateInputValue = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
};

export const notifyTraspasosChanged = () => {
    window.dispatchEvent(new Event('traspasos:refresh-pending'));
};

export const notifyMensajesChanged = () => {
    window.dispatchEvent(new Event('mensajes:refresh-unread'));
};

export const normalizeAuditoria = (a) => ({
    id: pick(a, 'id', 'Id'),
    fecha: pick(a, 'fecha', 'Fecha'),
    accion: pick(a, 'accion', 'Accion') || '—',
    detalle: pick(a, 'detalle', 'Detalle') || '—',
    usuario: pick(a, 'usuario', 'Usuario') || 'Sistema',
});
