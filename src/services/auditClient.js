const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5029/api';

const AUDIT_ENDPOINTS = [
    '/auditoria/client-action',
    '/support/client-action',
    '/support/frontend-error',
    '/support/logs',
];

let lastClick = null;
let clickCaptureReady = false;
let lastSentClickKey = '';
let lastSentClickAt = 0;

const IMPORTANT_CLICK_RE =
    /(guardar|enviar|cargar|subir|crear|nuevo|eliminar|borrar|confirmar|aceptar|rechazar|aprobar|suspender|activar|buscar|filtrar|export|import|registrar|actualizar|editar|save|submit|upload|delete|create)/i;

const getAuthToken = () => {
    try {
        const raw = localStorage.getItem('user');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.token) return parsed.token;
            if (parsed?.Token) return parsed.Token;
        }
    } catch {
        /* ignore */
    }
    return localStorage.getItem('token') || null;
};

const getCurrentUserLabel = () => {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.username || parsed?.Username || parsed?.nombreUsuario || null;
    } catch {
        return null;
    }
};

export const isAuditEndpoint = (endpoint = '') => {
    const lower = String(endpoint).toLowerCase();
    return AUDIT_ENDPOINTS.some((p) => lower.includes(p));
};

const postAuditRaw = async (endpoint, body) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'X-Client-App': 'sigdef',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`audit ${response.status}`);
    }
};

const resolveClickLabel = (el) => {
    if (!el) return '';
    return (
        el.getAttribute('data-audit')
        || el.getAttribute('aria-label')
        || el.getAttribute('title')
        || (el.tagName === 'INPUT' ? el.value : '')
        || (el.innerText || '').replace(/\s+/g, ' ')
        || ''
    ).trim().slice(0, 120);
};

const shouldSendClick = (el, label) => {
    if (!label || label.length < 2) return false;
    if (el.getAttribute('data-audit')) return true;
    if (el.type === 'submit') return true;
    if (el.closest('form')) return true;
    return IMPORTANT_CLICK_RE.test(label);
};

/**
 * Envía una acción de UI/cliente a la bitácora (no bloquea la UI).
 */
export const trackClientAction = ({ accion, detalle, modulo = 'Frontend' } = {}) => {
    if (!accion) return;

    const payload = {
        accion: String(accion).slice(0, 100),
        modulo: String(modulo || 'Frontend').slice(0, 80),
        detalle: typeof detalle === 'string'
            ? detalle
            : JSON.stringify({
                ...(detalle || {}),
                path: detalle?.path || (typeof window !== 'undefined' ? window.location.pathname : null),
                occurredAt: detalle?.occurredAt || new Date().toISOString(),
                userHint: getCurrentUserLabel(),
            }),
    };

    (async () => {
        try {
            await postAuditRaw('/Auditoria/client-action', payload);
        } catch {
            try {
                await postAuditRaw('/support/client-action', payload);
            } catch {
                /* no romper UX si falla la telemetría */
            }
        }
    })();
};

export const rememberClick = (info) => {
    lastClick = {
        ...info,
        at: new Date().toISOString(),
    };
};

export const getLastClick = () => lastClick;

/**
 * Registra un fallo de API con contexto de pantalla y último click.
 */
export const trackApiError = ({
    method,
    endpoint,
    message,
    status,
    rawMessage,
} = {}) => {
    if (!endpoint || isAuditEndpoint(endpoint)) return;

    trackClientAction({
        accion: 'API_ERROR',
        modulo: 'Frontend',
        detalle: {
            message: message || 'Error de API',
            method: method || null,
            endpoint,
            httpStatus: status ?? null,
            technicalHint: rawMessage && rawMessage !== message
                ? String(rawMessage).slice(0, 220)
                : null,
            path: typeof window !== 'undefined' ? window.location.pathname : null,
            lastClick,
            online: typeof navigator !== 'undefined' ? navigator.onLine : null,
        },
    });
};

/**
 * Captura clicks relevantes (guardar/cargar/enviar/etc.) para contexto de errores.
 */
export const initClickCapture = () => {
    if (clickCaptureReady || typeof document === 'undefined') return;
    clickCaptureReady = true;

    document.addEventListener('click', (event) => {
        const el = event.target?.closest?.(
            'button, a, [role="button"], input[type="submit"], input[type="button"]'
        );
        if (!el) return;

        const label = resolveClickLabel(el);
        if (!label) return;

        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const info = {
            label,
            path,
            tag: el.tagName,
            href: el.getAttribute?.('href') || null,
            auditKey: el.getAttribute?.('data-audit') || null,
        };
        rememberClick(info);

        if (!shouldSendClick(el, label)) return;

        const key = `${path}|${label}`;
        const now = Date.now();
        if (key === lastSentClickKey && now - lastSentClickAt < 1500) return;
        lastSentClickKey = key;
        lastSentClickAt = now;

        trackClientAction({
            accion: 'CLICK_UI',
            modulo: 'UI',
            detalle: info,
        });
    }, true);
};
