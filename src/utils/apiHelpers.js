/** Agrega ?idFederacion= para vistas SuperAdmin scoped por federación */
export function withFederationScope(endpoint, fedId) {
    if (fedId == null || fedId === '') return endpoint;
    const id = encodeURIComponent(String(fedId));
    return endpoint.includes('?') ? `${endpoint}&idFederacion=${id}` : `${endpoint}?idFederacion=${id}`;
}

/** Lee un campo con soporte camelCase / PascalCase */
export const pick = (obj, ...keys) => {
    if (!obj) return undefined;
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return undefined;
};

/** Variantes que puede mandar el API/JWT. Solo se usan al normalizar, no al leer. */
const LEGACY_CLUB_ID_KEYS = ['idClub', 'IdClub', 'clubId', 'ClubId'];

const coercePositiveId = (value) => {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
};

/** Une IdClub/clubId/ClubId → idClub (una sola vez, en el borde del API). */
const extractIncomingClubId = (obj) => {
    if (obj == null || obj === '') return null;
    if (typeof obj !== 'object') return coercePositiveId(obj);
    const direct = coercePositiveId(pick(obj, ...LEGACY_CLUB_ID_KEYS));
    if (direct) return direct;
    if (obj.club && typeof obj.club === 'object') {
        return coercePositiveId(pick(obj.club, ...LEGACY_CLUB_ID_KEYS, 'id', 'Id'));
    }
    return null;
};

/**
 * Normaliza cualquier payload: deja solo `idClub` como ID de club.
 * Borrar IdClub / clubId / ClubId para que el front no dependa de variantes.
 */
export function normalizeClubIdFields(data, depth = 0) {
    if (data == null || depth > 10) return data;
    if (Array.isArray(data)) return data.map((item) => normalizeClubIdFields(item, depth + 1));
    if (typeof data !== 'object') return data;
    if (data instanceof Date || data instanceof Blob || data instanceof File) return data;

    const out = { ...data };
    const canonical = extractIncomingClubId(out);
    if (canonical != null) out.idClub = canonical;
    delete out.IdClub;
    delete out.clubId;
    delete out.ClubId;

    for (const key of Object.keys(out)) {
        if (key === 'idClub') continue;
        const value = out[key];
        if (value && typeof value === 'object') {
            out[key] = normalizeClubIdFields(value, depth + 1);
        }
    }
    return out;
}

/**
 * Lee el ID de club canónico (`idClub`).
 * Los datos deben pasar antes por normalizeClubIdFields (api client / login).
 * @param {{ allowBareId?: boolean }} [opts] allowBareId: también lee id/Id (solo entidades Club)
 */
export function getClubId(obj, { allowBareId = false } = {}) {
    if (obj == null || obj === '') return null;
    if (typeof obj !== 'object') return coercePositiveId(obj);

    const canonical = coercePositiveId(obj.idClub);
    if (canonical) return canonical;

    if (allowBareId) {
        const bare = coercePositiveId(obj.id ?? obj.Id);
        if (bare) return bare;
    }

    if (obj.club && typeof obj.club === 'object') {
        return getClubId(obj.club, { allowBareId: true });
    }

    return null;
}

/** Compara dos club IDs (objetos o valores) usando solo idClub canónico. */
export function sameClubId(a, b) {
    const idA = getClubId(a);
    const idB = getClubId(b);
    if (idA == null || idB == null) return false;
    return String(idA) === String(idB);
}

/** Normaliza id de federación en objetos club */
export function getClubFederationId(club) {
    return club?.idFederacion ?? club?.federacionId ?? club?.FederacionId ?? null;
}

export function clubBelongsToFederation(club, fedId) {
    if (fedId == null || fedId === '') return true;
    return String(getClubFederationId(club) ?? '') === String(fedId);
}

export function filterClubesByFederation(clubes, fedId) {
    if (fedId == null || fedId === '') return clubes || [];
    return (clubes || []).filter((c) => clubBelongsToFederation(c, fedId));
}

export function getFederationNameById(federaciones, fedId) {
    if (fedId == null || fedId === '') return null;
    const fed = (federaciones || []).find((f) =>
        String(pick(f, 'id', 'idFederacion', 'IdFederacion') ?? '') === String(fedId)
    );
    return pick(fed, 'nombre', 'Nombre') || null;
}

export function getUsuarioFederationName(usuario, clubes = [], federaciones = []) {
    const direct = pick(usuario, 'federacionNombre', 'FederacionNombre');
    if (direct) return direct;

    const fedId = pick(usuario, 'federacionId', 'FederacionId', 'idFederacion', 'IdFederacion');
    if (fedId != null && fedId !== '') {
        return getFederationNameById(federaciones, fedId) || `ID ${fedId}`;
    }

    const clubId = getClubId(usuario);
    if (clubId != null) {
        const club = (clubes || []).find(
            (c) => String(getClubId(c, { allowBareId: true }) ?? '') === String(clubId)
        );
        const clubFedId = getClubFederationId(club);
        if (clubFedId != null) return getFederationNameById(federaciones, clubFedId) || `ID ${clubFedId}`;
    }

    const rol = String(pick(usuario, 'rol', 'Rol', 'rolFederacion', 'RolFederacion') || '').toLowerCase();
    if (rol === 'superadmin') return 'SIGDEF (global)';
    return '—';
}

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
        // /saas/clubes-status usa clubId como id de federación (tenant);
        // tras normalizeClubIdFields queda en idClub.
        idFederacion: pick(c, 'idFederacion', 'IdFederacion', 'idClub', 'clubId', 'ClubId'),
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
