/**
 * Convierte cualquier error de API/red a un mensaje amigable en español.
 * Nunca mostrar textos técnicos (EF, SQL, stack, inglés de framework).
 */

const DEFAULT_FALLBACK =
    'No se pudo completar la operación. Revisá los datos e intentá nuevamente.';

const isTechnical = (text) => {
    if (!text || typeof text !== 'string') return true;
    const t = text.trim();
    if (!t) return true;
    const lower = t.toLowerCase();

    const technicalBits = [
        'saving the entity',
        'see the inner',
        'inner exception',
        'dbupdate',
        'entity framework',
        'npgsql',
        'postgres',
        'sqlstate',
        '23505',
        '23503',
        'duplicate key',
        'unique constraint',
        'violation of',
        'cannot insert',
        'foreign key',
        'null reference',
        'object reference',
        'stack trace',
        'system.',
        'microsoft.',
        'failed to fetch',
        'networkerror',
        'econnrefused',
        ' --> ',
    ];
    if (technicalBits.some((b) => lower.includes(b))) return true;
    if (/exception\b/i.test(t) && !/operaci[oó]n/i.test(t)) return true;
    if (/^[A-Z][a-zA-Z]+(Error|Exception)\b/.test(t)) return true;
    if (/\bat\s+[\w.]+\(/.test(t)) return true;
    return false;
};

const isBusinessSpanish = (text) => {
    if (!text || isTechnical(text)) return false;
    const t = text.trim();
    if (t.length > 280) return false;
    if (/[áéíóúñÁÉÍÓÚÑ¿¡]/.test(t)) return true;
    return /^(El |La |Los |Las |No |Ya |Tu |Su |Debe |Ingrese |Falta |Un |Una |Ese |Esa |Hay |Ocurrió |Ocurrio )/i.test(t);
};

const mapKnownCases = (text, status) => {
    const lower = String(text || '').toLowerCase();

    if (status === 401) {
        return lower.includes('contraseña') || lower.includes('password') || lower.includes('credencial')
            ? 'Usuario o contraseña incorrectos.'
            : 'Tu sesión expiró. Volvé a iniciar sesión.';
    }
    if (status === 403) return 'No tenés permisos para realizar esta acción.';
    // 404: respetar mensajes de negocio del backend (p.ej. DNI no disponible)
    if (status === 404) {
        if (isBusinessSpanish(text)) return String(text).trim();
        return 'No encontramos lo que buscabas.';
    }
    if (lower.includes('email') && (lower.includes('unique') || lower.includes('ya existe') || lower.includes('duplicate'))) {
        return 'Ese email ya está en uso. Probá con otro.';
    }
    if (
        (lower.includes('username') || lower.includes('usuario') || lower.includes('dni') || lower.includes('documento')) &&
        (lower.includes('unique') || lower.includes('ya existe') || lower.includes('duplicate') || lower.includes('registrado'))
    ) {
        return 'Ese DNI o usuario ya está registrado. Buscalo e intentá de nuevo.';
    }
    if (lower.includes('23505') || lower.includes('duplicate key') || lower.includes('unique constraint')) {
        return 'Hay datos duplicados. Revisá DNI, email o usuario e intentá de nuevo.';
    }
    if (lower.includes('saving the entity') || lower.includes('dbupdate') || lower.includes('inner exception')) {
        return DEFAULT_FALLBACK;
    }
    if (lower.includes('timeout') || lower.includes('abort')) {
        return 'La operación tardó demasiado. Intentá nuevamente.';
    }
    if (lower.includes('failed to fetch') || lower.includes('network')) {
        return 'No se pudo conectar con el servidor. Revisá tu conexión.';
    }

    return null;
};

/**
 * @param {unknown} errorOrMessage
 * @param {{ status?: number, fallback?: string }} [opts]
 * @returns {string}
 */
export const toFriendlyErrorMessage = (errorOrMessage, opts = {}) => {
    const fallback = opts.fallback || DEFAULT_FALLBACK;

    let raw = '';
    let status = opts.status;

    if (typeof errorOrMessage === 'string') {
        raw = errorOrMessage;
    } else if (errorOrMessage && typeof errorOrMessage === 'object') {
        raw =
            errorOrMessage.message ||
            errorOrMessage.Message ||
            errorOrMessage.error ||
            errorOrMessage.Error ||
            '';
        status = status ?? errorOrMessage.status ?? errorOrMessage.statusCode;
    }

    const mapped = mapKnownCases(raw, status);
    if (mapped) return mapped;

    if (isBusinessSpanish(raw)) return raw.trim();

    return fallback;
};

export default toFriendlyErrorMessage;
