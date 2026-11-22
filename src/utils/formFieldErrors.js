/**
 * Normaliza errores de validación ASP.NET / ProblemDetails
 * { errors: { Documento: ["msg"], "Persona.Email": ["..."] } }
 * a claves de formulario en camelCase.
 */

const FIELD_ALIASES = {
    Documento: 'documento',
    Dni: 'documento',
    dni: 'documento',
    Nombre: 'nombre',
    Apellido: 'apellido',
    Email: 'email',
    Telefono: 'telefono',
    Direccion: 'direccion',
    FechaNacimiento: 'fechaNacimiento',
    SexoId: 'sexo',
    Sexo: 'sexo',
    IdClub: 'idClub',
    ClubId: 'idClub',
    IdFederacion: 'idFederacion',
    FederacionId: 'idFederacion',
    IdRol: 'idRol',
    Categoria: 'categoria',
    CategoriaId: 'categoriaId',
    EstadoPago: 'estadoPago',
    Sigla: 'siglas',
    Siglas: 'siglas',
    NombreInstitucional: 'nombre',
    Password: 'password',
    Username: 'username',
    Parentesco: 'parentesco',
};

const toCamel = (value) => {
    if (!value || typeof value !== 'string') return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
};

const leafKey = (key) => {
    if (!key || typeof key !== 'string') return '';
    const parts = key.replace(/\[(\d+)\]/g, '').split(/[./]/).filter(Boolean);
    return parts[parts.length - 1] || key;
};

const firstMessage = (value) => {
    if (Array.isArray(value)) return String(value[0] || '').trim();
    if (typeof value === 'string') return value.trim();
    if (value && typeof value === 'object') {
        const nested = value.errors || value.message || value.Message;
        return firstMessage(nested);
    }
    return '';
};

/** { Documento: ["x"] } -> { documento: "x", Documento: "x" } */
export const normalizeAspNetFieldErrors = (errors) => {
    if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {};
    const out = {};
    Object.entries(errors).forEach(([rawKey, rawVal]) => {
        const msg = firstMessage(rawVal);
        if (!msg) return;
        const leaf = leafKey(rawKey);
        const mapped = FIELD_ALIASES[leaf] || FIELD_ALIASES[toCamel(leaf)] || toCamel(leaf);
        if (mapped) out[mapped] = msg;
        if (leaf && leaf !== mapped) out[leaf] = msg;
        out[rawKey] = msg;
    });
    return out;
};

/** Extrae fieldErrors desde Error enriquecido por api.js o desde un body crudo. */
export const extractFieldErrors = (errorOrBody) => {
    if (!errorOrBody) return {};
    if (errorOrBody.fieldErrors && typeof errorOrBody.fieldErrors === 'object') {
        return { ...errorOrBody.fieldErrors };
    }
    const body = errorOrBody.body || errorOrBody.response?.data || errorOrBody;
    if (body?.errors) return normalizeAspNetFieldErrors(body.errors);
    return {};
};

/**
 * Mapea errores API a claves del formulario.
 * @param {Error|object} error
 * @param {Record<string,string>} [extraMap] alias adicionales (API -> form)
 */
export const mapApiFieldErrors = (error, extraMap = {}) => {
    const raw = extractFieldErrors(error);
    if (!Object.keys(raw).length) return {};
    const out = {};
    Object.entries(raw).forEach(([key, msg]) => {
        const mapped = extraMap[key] || FIELD_ALIASES[key] || key;
        if (!out[mapped]) out[mapped] = msg;
    });
    return out;
};

/**
 * Variante para formularios con datos de persona + tutor (atletas).
 * Los errores cuya ruta contiene "Tutor" (ej. TutorFederacion.PersonaTutor.Documento)
 * se mapean a claves prefijadas: tutorDocumento, tutorNombre, tutorApellido, etc.
 * El resto usa las claves normales (documento, nombre, ...).
 */
export const mapApiFieldErrorsWithTutor = (error) => {
    const rawErrors = error?.body?.errors;
    if (!rawErrors || typeof rawErrors !== 'object' || Array.isArray(rawErrors)) {
        return mapApiFieldErrors(error);
    }
    const out = {};
    Object.entries(rawErrors).forEach(([rawKey, rawVal]) => {
        const msg = firstMessage(rawVal);
        if (!msg) return;
        const leaf = leafKey(rawKey);
        const single = mapApiFieldErrors({ fieldErrors: normalizeAspNetFieldErrors({ [leaf]: msg }) });
        const base = Object.keys(single)[0] || toCamel(leaf);
        const pathHasTutor = /tutor/i.test(rawKey);
        const isTutorOnly = /^parentesco$/i.test(leaf) || /^idpersonatutor$/i.test(leaf);
        let key = base;
        if (pathHasTutor || isTutorOnly) {
            key = /^idpersonatutor$/i.test(leaf)
                ? 'tutorDocumento'
                : `tutor${base.charAt(0).toUpperCase()}${base.slice(1)}`;
        }
        if (!out[key]) out[key] = msg;
    });
    return out;
};

/** Resumen legible para banner/modal. */
export const summarizeFieldErrors = (fieldErrors, labels = {}) => {
    const entries = Object.entries(fieldErrors || {}).filter(([, msg]) => msg);
    // Evitar duplicados por alias (documento + Documento)
    const seen = new Set();
    const lines = [];
    entries.forEach(([key, msg]) => {
        const norm = key.toLowerCase();
        if (seen.has(norm) || seen.has(msg)) return;
        seen.add(norm);
        seen.add(msg);
        const label = labels[key] || key;
        lines.push(`${label}: ${msg}`);
    });
    return lines;
};

/**
 * Validación client-side de campos requeridos.
 * rules: { documento: 'El DNI es obligatorio', nombre: '...' }
 * values: formData
 * normalize opcional por campo (ej. solo dígitos)
 */
export const validateRequiredFields = (values, rules, { normalize = {} } = {}) => {
    const errors = {};
    Object.entries(rules || {}).forEach(([key, message]) => {
        let raw = values?.[key];
        if (typeof normalize[key] === 'function') raw = normalize[key](raw);
        const empty =
            raw == null
            || (typeof raw === 'string' && !String(raw).trim())
            || (typeof raw === 'number' && Number.isNaN(raw));
        if (empty) errors[key] = message;
    });
    return errors;
};

export const scrollToFirstFieldError = (fieldErrors) => {
    const firstKey = Object.keys(fieldErrors || {})[0];
    if (!firstKey || typeof document === 'undefined') return;
    const el =
        document.querySelector(`[name="${firstKey}"]`)
        || document.querySelector(`#${firstKey}`)
        || document.querySelector(`[data-field="${firstKey}"]`);
    if (el?.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof el.focus === 'function') {
            try { el.focus({ preventScroll: true }); } catch { el.focus(); }
        }
    }
};
