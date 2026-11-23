/** Utilidades de visualización de auditoría: amigable (federación) vs técnica (SuperAdmin). */

export const AUDIT_ACTION_LABELS = {
    CLICK_UI: 'Click en pantalla',
    CLICK_SAVE_DELEGADO: 'Intento guardar delegado',
    SAVE_DELEGADO_OK: 'Delegado guardado',
    SAVE_DELEGADO_VALIDATION: 'Error al validar delegado',
    SAVE_DELEGADO_FAILED: 'Error al guardar delegado',
    CLICK_SAVE_ATHLETE: 'Intento guardar atleta',
    SAVE_ATHLETE_OK: 'Atleta guardado',
    SAVE_ATHLETE_FAILED: 'Error al guardar atleta',
    SAVE_ATHLETE_VALIDATION: 'Error al validar atleta',
    CLICK_UPLOAD_DOCUMENT: 'Intento cargar documento',
    UPLOAD_DOCUMENT_FAILED: 'Error al cargar documento',
    API_ERROR: 'Error del sistema',
    FRONTEND_CRASH: 'Error en la aplicación',
    ERROR_FATAL: 'Error grave del sistema',
    LOGIN_SUCCESS: 'Inicio de sesión correcto',
    LOGIN_FAILED: 'Ingreso erróneo',
    LOGIN_BLOCKED: 'Acceso bloqueado',
    ACCOUNT_LOCKED: 'Cuenta bloqueada',
    CREATE_ATHLETE: 'Alta de atleta',
    UPDATE_ATHLETE: 'Actualización de atleta',
    DELETE_ATHLETE: 'Baja de atleta',
    CREATE_COACH: 'Alta de entrenador',
    CREATE_TUTOR: 'Alta de tutor',
    CREATE_DELEGATE: 'Alta de delegado',
    CREATE_USER: 'Alta de usuario',
    REGISTER_USER: 'Registro de usuario',
    REGISTRAR_PAGO: 'Pago registrado',
    TOGGLE_PAGO_CLUB: 'Cambio de pago de club',
    TOGGLE_PAGO_ATLETA: 'Cambio de pago de atleta',
    LOGOUT: 'Cierre de sesión',
};

export const tryParseDetalle = (detalle) => {
    if (!detalle || typeof detalle !== 'string') return null;
    const trimmed = detalle.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
    try {
        return JSON.parse(trimmed);
    } catch {
        return null;
    }
};

const humanizeAccion = (accion = '') => {
    if (AUDIT_ACTION_LABELS[accion]) return AUDIT_ACTION_LABELS[accion];
    return String(accion).replaceAll('_', ' ').trim() || 'Actividad';
};

const normalizeText = (value) => String(value || '').toLowerCase();

/**
 * Título corto para el admin de federación (sin JSON ni jerga técnica).
 */
export const formatAuditFriendlyTitle = (accion = '', detalle = '') => {
    const parsed = tryParseDetalle(detalle) || {};
    const message = String(parsed.message || parsed.userHint || '').trim();
    const technical = String(parsed.technicalHint || '').trim();
    const label = String(parsed.label || parsed.lastClick?.label || '').trim();
    const resultado = String(parsed.resultado || '').toUpperCase();
    const upper = String(accion).toUpperCase();
    const blob = normalizeText([message, technical, label, detalle].join(' '));

    if (upper.includes('LOGIN_SUCCESS') || (upper.includes('LOGIN') && resultado === 'OK')) {
        return 'Inicio de sesión correcto';
    }

    if (
        upper.includes('LOGIN_FAILED')
        || upper.includes('LOGIN_BLOCK')
        || (resultado === 'ERROR' && (blob.includes('contraseña') || blob.includes('usuario o contraseña')))
    ) {
        if (blob.includes('bloque')) return 'Acceso bloqueado por intentos fallidos';
        if (blob.includes('contraseña')) return 'Ingreso erróneo por contraseña incorrecta';
        if (blob.includes('usuario')) return 'Ingreso erróneo: usuario o contraseña incorrectos';
        return 'Ingreso erróneo';
    }

    if (upper.includes('ACCOUNT_LOCKED') || upper.includes('LOGIN_BLOCKED')) {
        return 'Acceso bloqueado';
    }

    if (label && (upper === 'CLICK_UI' || upper.startsWith('CLICK_'))) {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('mostrar contraseña')) return 'Uso de mostrar contraseña';
        if (lowerLabel.includes('ocultar contraseña')) return 'Ocultó la contraseña';
        if (lowerLabel.includes('iniciar sesión')) {
            if (resultado === 'ERROR') return 'Intento de inicio de sesión fallido';
            if (resultado === 'OK') return 'Inicio de sesión correcto';
            return 'Clic en Iniciar sesión';
        }
        return label;
    }

    if (message && !message.startsWith('{') && message.length < 120) {
        // Evitar mensajes demasiado técnicos tipo stack / HTTP
        if (!/\b(http|endpoint|stack|exception|nullreference)\b/i.test(message)) {
            return message;
        }
    }

    if (AUDIT_ACTION_LABELS[accion]) return AUDIT_ACTION_LABELS[accion];
    return humanizeAccion(accion);
};

/**
 * Detalle técnico para SuperAdmin / soporte (endpoint, HTTP, hints, etc.).
 */
export const formatAuditTechnicalDetalle = (detalle = '') => {
    const parsed = tryParseDetalle(detalle);
    if (!parsed || typeof parsed !== 'object') return detalle || '';

    const parts = [];
    if (parsed.resultado) parts.push(`Resultado: ${parsed.resultado}`);
    if (Array.isArray(parsed.validationErrors) && parsed.validationErrors.length) {
        parts.push(parsed.validationErrors.join(' | '));
    } else if (parsed.message) {
        parts.push(parsed.message);
    }
    if (parsed.label && !parsed.message) parts.push(`Click: ${parsed.label}`);
    if (parsed.endpoint) parts.push(`${parsed.method || 'REQ'} ${parsed.endpoint}`);
    if (parsed.httpStatus) parts.push(`HTTP ${parsed.httpStatus}`);
    if (parsed.path) parts.push(`Pantalla: ${parsed.path}`);
    if (parsed.lastClick?.label) parts.push(`Último click: ${parsed.lastClick.label}`);
    if (parsed.documento) parts.push(`DNI: ${parsed.documento}`);
    if (parsed.nombre || parsed.apellido) {
        parts.push(`Persona: ${[parsed.nombre, parsed.apellido].filter(Boolean).join(' ')}`);
    }
    if (parsed.tipoLabel || parsed.tipoDocumento != null) {
        parts.push(`Doc: ${parsed.tipoLabel || parsed.tipoDocumento}`);
    }
    if (parsed.fileName) parts.push(`Archivo: ${parsed.fileName}`);
    if (parsed.technicalHint) parts.push(`Detalle: ${parsed.technicalHint}`);

    return parts.length > 0 ? parts.join(' · ') : detalle;
};
