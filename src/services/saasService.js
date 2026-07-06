import { api } from './api';
import { mapFederacionFromApi, mapFederacionFromStatus, mapGlobalMetrics } from '../utils/apiHelpers';

export async function fetchPlanes() {
    const data = await api.get('/saas/planes');
    return data || [];
}

export async function fetchFederacionesList() {
    const [feds, planes] = await Promise.all([
        api.get('/Federaciones'),
        fetchPlanes().catch(() => []),
    ]);
    return (feds || []).map((f) => mapFederacionFromApi(f, planes));
}

export async function fetchFederacionesStatus() {
    const data = await api.get('/saas/clubes-status');
    return (data || []).map(mapFederacionFromStatus);
}

export async function fetchGlobalMetrics() {
    const data = await api.get('/saas/global-metrics');
    return mapGlobalMetrics(data);
}

export async function fetchAuditLogs(limit = 8) {
    const data = await api.get(`/support/logs?limit=${limit}`);
    return data || [];
}

/** Datos del dashboard SuperAdmin: métricas + federaciones + logs */
export async function fetchSuperAdminDashboard() {
    const [metricsResult, statusResult, logsResult, listResult] = await Promise.allSettled([
        fetchGlobalMetrics(),
        fetchFederacionesStatus(),
        fetchAuditLogs(8),
        fetchFederacionesList(),
    ]);

    const errors = [];
    if (metricsResult.status === 'rejected') errors.push('métricas globales');
    if (statusResult.status === 'rejected' && listResult.status === 'rejected') {
        errors.push('listado de federaciones');
    }
    if (logsResult.status === 'rejected') errors.push('auditoría');

    const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value : null;

    let federaciones = [];
    if (statusResult.status === 'fulfilled' && statusResult.value?.length) {
        federaciones = statusResult.value;
    } else if (listResult.status === 'fulfilled') {
        federaciones = (listResult.value || []).map((f) => ({
            ...f,
            fechaRegistro: f.fechaAltaPlan
                ? String(f.fechaAltaPlan).split('T')[0]
                : 'Sin fecha',
        }));
    }

    const logs = logsResult.status === 'fulfilled' ? logsResult.value : [];

    return { metrics, federaciones, logs, errors };
}

/** Suscripciones / facturación derivada del estado SaaS real */
export async function fetchSuscripcionesData() {
    const [status, planes, metrics] = await Promise.all([
        fetchFederacionesStatus().catch(() => []),
        fetchPlanes().catch(() => []),
        fetchGlobalMetrics().catch(() => null),
    ]);

    const planPrecio = (planSaaSId) => {
        const plan = planes.find((p) => (p.id ?? p.Id) === planSaaSId);
        return Number(plan?.precio ?? plan?.Precio ?? 0);
    };

    const facturas = status.map((fed) => {
        const monto = planPrecio(fed.planSaaSId) || fed.costoMensual || 0;
        const cobrado = fed.estado === 'Activo' && fed.planAlDia !== false;
        const mes = new Date().toISOString().slice(0, 7).replace('-', '');
        return {
            id: `${fed.sigla || 'FED'}-${mes}`,
            fed: fed.nombre,
            plan: fed.plan,
            monto,
            fechaEmision: fed.fechaAltaPlan
                ? String(fed.fechaAltaPlan).split('T')[0]
                : new Date().toISOString().split('T')[0],
            fechaVencimiento: fed.fechaVencimientoPlan
                ? String(fed.fechaVencimientoPlan).split('T')[0]
                : '—',
            estado: cobrado ? 'Cobrado' : 'Pendiente',
        };
    });

    const totalFacturado = facturas
        .filter((f) => f.estado === 'Cobrado')
        .reduce((sum, f) => sum + f.monto, 0);
    const montoPendiente = facturas
        .filter((f) => f.estado === 'Pendiente')
        .reduce((sum, f) => sum + f.monto, 0);
    const total = totalFacturado + montoPendiente;
    const porcentajeCobro = total > 0
        ? Math.round((totalFacturado / total) * 1000) / 10
        : 0;

    return {
        facturas,
        stats: {
            totalFacturado: metrics?.ingresosMensuales ?? totalFacturado,
            montoPendiente,
            porcentajeCobro,
        },
        planes,
    };
}
