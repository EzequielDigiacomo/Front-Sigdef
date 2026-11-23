import { PARENTESCO_MAP } from '../utils/enums';
import { toFriendlyErrorMessage } from '../utils/friendlyError';
import { normalizeAspNetFieldErrors } from '../utils/formFieldErrors';
import { isAuditEndpoint, trackApiError } from './auditClient';
import { getClubId, normalizeClubIdFields } from '../utils/apiHelpers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5029/api';
const CLIENT_APP = 'sigdef';

const DEFAULT_TIMEOUT = 45000;
const LOGIN_TIMEOUT = 90000;
const MAX_RETRIES = 2;

const defaultHeaders = {
    'Content-Type': 'application/json',
};

const attachErrorMeta = (error, { status, endpoint, method, raw, fieldErrors, body } = {}) => {
    if (!error || typeof error !== 'object') return error;
    if (status != null) error.status = status;
    if (endpoint) error.endpoint = endpoint;
    if (method) error.method = method;
    if (raw) error.rawMessage = raw;
    if (fieldErrors && typeof fieldErrors === 'object') error.fieldErrors = fieldErrors;
    if (body != null) error.body = body;
    return error;
};

const firstFieldErrorMessage = (fieldErrors) => {
    if (!fieldErrors || typeof fieldErrors !== 'object') return '';
    const values = Object.values(fieldErrors).filter(Boolean);
    return values.length ? String(values[0]) : '';
};

const getAuthToken = () => {
    try {
        const raw = localStorage.getItem('user');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.token) return parsed.token;
            if (parsed?.Token) return parsed.Token;
        }
    } catch {
        /* ignorar */
    }
    return localStorage.getItem('token') || null;
};

const throwFriendly = (raw, status, fallback, meta = {}) => {
    const error = new Error(toFriendlyErrorMessage(raw, { status, fallback }));
    throw attachErrorMeta(error, { status, raw, ...meta });
};

const handleResponse = async (response, options = {}) => {
    const { silentErrors = false } = options;

    if (response.status === 204) {
        return null;
    }

    let responseText = '';
    try {
        responseText = await response.text();
    } catch (e) {
        console.warn('No se pudo leer el cuerpo de la respuesta');
    }

    if (response.status === 401) {
        let serverMessage = '';
        try {
            const errorObj = JSON.parse(responseText);
            serverMessage = errorObj.message || errorObj.Message || '';
        } catch {
            /* ignorar parse */
        }

        const hadSession = !!getAuthToken();
        const isLoginRequest = response.url?.includes('/auth/login');

        if (hadSession && !isLoginRequest) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        if (isLoginRequest) {
            throwFriendly(serverMessage, 401, 'Usuario o contraseña incorrectos.');
        }

        throwFriendly(serverMessage, 401, 'Tu sesión expiró. Volvé a iniciar sesión.');
    }

    if (!response.ok) {
        // Detalle técnico solo en consola — la UI recibe mensaje amigable
        if (!silentErrors) {
            console.error('Error del servidor:', response.status, responseText, 'URL:', response.url);
        }

        let raw = '';
        let fieldErrors = {};
        let body = null;
        try {
            const errorObj = JSON.parse(responseText || '{}');
            body = errorObj;
            fieldErrors = normalizeAspNetFieldErrors(errorObj.errors);
            raw =
                errorObj.message
                || errorObj.Message
                || errorObj.error
                || errorObj.Error
                || errorObj.detail
                || errorObj.title
                || firstFieldErrorMessage(fieldErrors)
                || '';
        } catch {
            raw = '';
        }

        const error = new Error(toFriendlyErrorMessage(raw, {
            status: response.status,
            fallback: Object.keys(fieldErrors).length
                ? 'Revisá los campos marcados e intentá nuevamente.'
                : 'No se pudo completar la operación. Revisá los datos e intentá nuevamente.',
        }));
        throw attachErrorMeta(error, {
            status: response.status,
            raw,
            fieldErrors,
            body,
        });
    }

    if (!responseText) return { success: true };

    try {
        return JSON.parse(responseText);
    } catch {
        return { message: responseText, success: true };
    }
};

const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = DEFAULT_TIMEOUT } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error(toFriendlyErrorMessage('timeout', {
                fallback: 'La operación tardó demasiado. Intentá nuevamente.',
            }));
        }
        throw new Error(toFriendlyErrorMessage(error, {
            fallback: 'No se pudo conectar con el servidor. Revisá tu conexión.',
        }));
    }
};

const normalizeEndpoint = (endpoint) => {
    if (endpoint === '/Club') return '/Clubes';
    if (endpoint.startsWith('/Club/')) return endpoint.replace('/Club/', '/Clubes/');
    // Compatibilidad con rutas legacy del backend unificado
    if (endpoint === '/federacion' || endpoint === '/Federacion') return '/Federaciones';
    if (endpoint.startsWith('/federacion/') || endpoint.startsWith('/Federacion/')) {
        return endpoint.replace(/^\/[Ff]ederacion\//, '/Federaciones/');
    }
    return endpoint;
};

const request = async (endpoint, options = {}, retries = MAX_RETRIES) => {
    const { silentErrors = false, skipAudit = false, timeout, ...fetchOptions } = options;
    const finalEndpoint = normalizeEndpoint(endpoint);
    const url = `${API_URL}${finalEndpoint}`;
    const method = (fetchOptions.method || 'GET').toUpperCase();

    const token = getAuthToken();
    const headers = {
        'X-Client-App': CLIENT_APP,
        ...fetchOptions.headers,
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetchWithTimeout(url, {
            ...fetchOptions,
            headers,
            credentials: 'include',
            timeout: timeout ?? DEFAULT_TIMEOUT,
        });

        if (response.status >= 500 && retries > 0) {
            console.warn(`Retrying... (${MAX_RETRIES - retries + 1})`);
            await new Promise((res) => setTimeout(res, 1000));
            return request(endpoint, options, retries - 1);
        }

        let data;
        try {
            data = await handleResponse(response, { silentErrors });
        } catch (responseError) {
            attachErrorMeta(responseError, {
                status: responseError.status ?? response.status,
                endpoint: finalEndpoint,
                method,
            });
            throw responseError;
        }

        // Unifica IdClub/clubId/ClubId → solo idClub en todo el front
        data = normalizeClubIdFields(data);

        if (finalEndpoint.startsWith('/Clubes')) {
            if (Array.isArray(data)) {
                data = data.map((c) => ({
                    ...c,
                    idClub: getClubId(c, { allowBareId: true }),
                    siglas: c.sigla ?? c.Sigla ?? c.siglas ?? c.Siglas ?? '',
                }));
            } else if (data && typeof data === 'object') {
                data.idClub = getClubId(data, { allowBareId: true });
                data.siglas = data.sigla ?? data.Sigla ?? data.siglas ?? data.Siglas ?? '';
            }
        }

        return data;
    } catch (error) {
        if (retries > 0 && error.message.includes('Timeout')) {
            return request(endpoint, options, retries - 1);
        }
        if (!silentErrors) console.error(`Error en ${url}:`, error);

        // TypeError "Failed to fetch" = red, CORS, API dormida o URL incorrecta
        if (error?.message === 'Failed to fetch' || error?.name === 'TypeError') {
            const netError = new Error(
                'No se pudo conectar con el servidor (Failed to fetch). ' +
                'Si el API en Render estaba dormido, esperá ~1 min y reintentá. ' +
                'Si usás un dominio distinto a https://sigdef.pro, hay que agregarlo a CORS (AllowedOrigins).'
            );
            attachErrorMeta(netError, { endpoint: finalEndpoint, method, raw: error.message });

            if (!silentErrors && !skipAudit && !isAuditEndpoint(finalEndpoint)) {
                trackApiError({
                    method,
                    endpoint: finalEndpoint,
                    message: netError.message,
                    status: null,
                    rawMessage: error.message,
                });
            }
            throw netError;
        }

        if (!silentErrors && !skipAudit && !isAuditEndpoint(finalEndpoint)) {
            const shouldAudit =
                method !== 'GET'
                || (error.status != null && error.status >= 500);
            if (shouldAudit) {
                trackApiError({
                    method,
                    endpoint: finalEndpoint,
                    message: error.message,
                    status: error.status ?? null,
                    rawMessage: error.rawMessage || null,
                });
            }
        }

        throw error;
    }
};

export const api = {
    get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),

    post: (endpoint, data, options = {}) => {
        const isLogin = typeof endpoint === 'string' && endpoint.toLowerCase().includes('/auth/login');
        return request(endpoint, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(data),
            ...(isLogin ? { timeout: LOGIN_TIMEOUT } : {}),
            ...options,
        });
    },

    put: (endpoint, data, options = {}) => request(endpoint, {
        method: 'PUT',
        headers: defaultHeaders,
        body: JSON.stringify(data),
        ...options,
    }),

    patch: (endpoint, data, options = {}) => request(endpoint, {
        method: 'PATCH',
        headers: data ? defaultHeaders : undefined,
        body: data ? JSON.stringify(data) : undefined,
        ...options,
    }),

    delete: (endpoint, options = {}) => request(endpoint, { method: 'DELETE', ...options }),

    upload: (endpoint, formData, options = {}) => request(endpoint, {
        method: 'POST',
        body: formData,
        ...options,
    }),
};

/** Despierta el API (p. ej. Render cold start) sin bloquear la UI. */
let apiWarmupPromise = null;
export const warmupApi = (user) => {
    if (apiWarmupPromise) return apiWarmupPromise;
    const fedId = user?.idFederacion || user?.federacionId || user?.IdFederacion;
    apiWarmupPromise = (async () => {
        try {
            if (fedId) {
                await api.get(`/Federaciones/${fedId}`, { silentErrors: true });
            } else {
                await api.get('/auth/me', { silentErrors: true });
            }
        } catch {
            /* ignore */
        }
    })();
    return apiWarmupPromise;
};

export const getApiBaseUrl = () => API_URL;
