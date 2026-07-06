/** Agrega ?idFederacion= para vistas SuperAdmin scoped por federación */
export function withFederationScope(endpoint, fedId) {
    if (fedId == null || fedId === '') return endpoint;
    const id = encodeURIComponent(String(fedId));
    return endpoint.includes('?') ? `${endpoint}&idFederacion=${id}` : `${endpoint}?idFederacion=${id}`;
}

/** Normaliza id de federación en objetos club */
export function getClubFederationId(club) {
    return club?.idFederacion ?? club?.federacionId ?? club?.FederacionId ?? null;
}

/** Lee un campo con soporte camelCase / PascalCase */
export const pick = (obj, ...keys) => {
    if (!obj) return undefined;
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return undefined;
};

export const getSiglaFromNombre = (nombre) => {
    if (!nombre) return 'FED';
    const words = nombre.trim().toUpperCase().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 3);
    const filtered = words.filter((w) => w.length > 2);
    if (filtered.length === 0) return words.map((w) => w[0]).join('').substring(0, 3);
    return filtered.map((w) => w[0]).join('').substring(0, 4);
};

export const mapFederacionFromApi = (f, planes = []) => {
    const id = pick(f, 'idFederacion', 'IdFederacion', 'id', 'Id');
    const planSaaSId = pick(f, 'planSaaSId', 'PlanSaaSId') ?? 1;
    const plan = planes.find((p) => pick(p, 'id', 'Id') === planSaaSId)
        || planes[0]
        || { nombre: 'Sin plan', precio: 0 };

    return {
        idFederacion: id,
        nombre: pick(f, 'nombre', 'Nombre') || 'Federación',
        sigla: pick(f, 'sigla', 'Sigla') || getSiglaFromNombre(pick(f, 'nombre', 'Nombre')),
        email: pick(f, 'email', 'Email') || '',
        telefono: pick(f, 'telefono', 'Telefono') || '',
        direccion: pick(f, 'direccion', 'Direccion') || '',
        planSaaSId,
        plan: pick(plan, 'nombre', 'Nombre') || 'Sin plan',
        costoMensual: Number(pick(plan, 'precio', 'Precio') ?? 0),
        estado: pick(f, 'activo', 'Activo') !== false ? 'Activo' : 'Suspendido',
        fechaAltaPlan: pick(f, 'fechaAltaPlan', 'FechaAltaPlan'),
        fechaVencimientoPlan: pick(f, 'fechaVencimientoPlan', 'FechaVencimientoPlan'),
        frecuenciaPago: pick(f, 'frecuenciaPago', 'FrecuenciaPago') || 'Mensual',
        bloqueadaPorFaltaDePago: pick(f, 'bloqueadaPorFaltaDePago', 'BloqueadaPorFaltaDePago') || false,
        activo: pick(f, 'activo', 'Activo') !== false,
        cuit: pick(f, 'cuit', 'Cuit') || '',
        bancoNombre: pick(f, 'bancoNombre', 'BancoNombre') || '',
        tipoCuenta: pick(f, 'tipoCuenta', 'TipoCuenta') || '',
        numeroCuenta: pick(f, 'numeroCuenta', 'NumeroCuenta') || '',
        titularCuenta: pick(f, 'titularCuenta', 'TitularCuenta') || '',
        emailCobro: pick(f, 'emailCobro', 'EmailCobro') || '',
    };
};

export const mapFederacionFromStatus = (c) => {
    const activo = pick(c, 'activo', 'Activo') !== false;
    const bloqueado = pick(c, 'bloqueadoPorFaltaDePago', 'BloqueadaPorFaltaDePago');
    const planAlDia = pick(c, 'planAlDia', 'PlanAlDia') !== false;

    let estado = 'Activo';
    if (!activo) estado = 'Suspendido';
    else if (bloqueado) estado = 'Pendiente de Pago';
    else if (!planAlDia) estado = 'Vencido';

    const fechaAlta = pick(c, 'fechaAltaPlan', 'FechaAltaPlan');
    const nombre = pick(c, 'clubNombre', 'ClubNombre') || 'Federación';

    return {
        idFederacion: pick(c, 'clubId', 'ClubId'),
        nombre,
        sigla: pick(c, 'sigla', 'Sigla') || getSiglaFromNombre(nombre),
        email: pick(c, 'email', 'Email') || '',
        telefono: pick(c, 'telefono', 'Telefono') || '',
        plan: pick(c, 'planNombre', 'PlanNombre') || 'Sin plan',
        planSaaSId: pick(c, 'planSaaSId', 'PlanSaaSId'),
        costoMensual: 0,
        estado,
        fechaRegistro: fechaAlta ? String(fechaAlta).split('T')[0] : 'Sin fecha',
        fechaAltaPlan: fechaAlta,
        fechaVencimientoPlan: pick(c, 'fechaVencimientoPlan', 'FechaVencimientoPlan'),
        activo,
        bloqueadaPorFaltaDePago: bloqueado,
        planAlDia,
        clubesAfiliados: pick(c, 'clubesAfiliadosCount', 'ClubesAfiliadosCount') ?? 0,
        atletasRegistrados: pick(c, 'atletasRegistrados', 'AtletasRegistrados') ?? 0,
    };
};

export const mapGlobalMetrics = (metrics) => {
    if (!metrics) return null;
    return {
        totalFederaciones: pick(metrics, 'totalFederaciones', 'TotalFederaciones') ?? 0,
        totalClubes: pick(metrics, 'totalClubesAfiliados', 'TotalClubesAfiliados') ?? 0,
        totalAtletas: pick(metrics, 'totalAtletasGlobales', 'TotalAtletasGlobales') ?? 0,
        ingresosMensuales: Number(pick(metrics, 'ingresosMensuales', 'IngresosMensuales') ?? 0),
        federacionesFacturando: pick(metrics, 'federacionesFacturando', 'FederacionesFacturando') ?? 0,
        porcentajeCrecimiento: Number(pick(metrics, 'porcentajeCrecimientoAtletas', 'PorcentajeCrecimientoAtletas') ?? 0),
        crecimiento: pick(metrics, 'crecimientoMensual', 'CrecimientoMensual') ?? [],
        distribucionPlanes: pick(metrics, 'distribucionPlanes', 'DistribucionPlanes') ?? [],
    };
};
