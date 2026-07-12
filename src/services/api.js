import { PARENTESCO_MAP } from '../utils/enums';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5029/api';
const CLIENT_APP = 'sigdef';

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 2;

const defaultHeaders = {
    'Content-Type': 'application/json',
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

        if (serverMessage) {
            throw new Error(serverMessage);
        }

        if (isLoginRequest) {
            throw new Error('Usuario o contraseña incorrectos.');
        }

        throw new Error('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
    }

    if (!response.ok) {
        if (!silentErrors) {
            console.error('Error del servidor:', response.status, responseText, 'URL:', response.url);
        }

        if (!responseText) {
            throw new Error(`Error ${response.status}: ${response.statusText || 'Sin respuesta del servidor'}`);
        }

        try {
            const errorObj = JSON.parse(responseText);
            throw new Error(errorObj.message || errorObj.error || `Error ${response.status}`);
        } catch (e) {
            if (e.message && !e.message.startsWith('Error ') && !e.message.includes('Unexpected end')) throw e;
            if (e instanceof SyntaxError) {
                throw new Error(responseText || `Error ${response.status}: ${response.statusText}`);
            }
            throw e;
        }
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
            throw new Error('La petición ha tardó demasiado tiempo (Timeout)');
        }
        throw error;
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
    const { silentErrors = false, ...fetchOptions } = options;
    const finalEndpoint = normalizeEndpoint(endpoint);
    const url = `${API_URL}${finalEndpoint}`;

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
        });

        if (response.status >= 500 && retries > 0) {
            console.warn(`Retrying... (${MAX_RETRIES - retries + 1})`);
            await new Promise((res) => setTimeout(res, 1000));
            return request(endpoint, options, retries - 1);
        }

        let data = await handleResponse(response, { silentErrors });

        if (finalEndpoint.startsWith('/Clubes')) {
            if (Array.isArray(data)) {
                data = data.map((c) => ({
                    ...c,
                    idClub: c.idClub ?? c.id ?? c.Id,
                    siglas: c.sigla ?? c.Sigla ?? c.siglas ?? c.Siglas ?? '',
                }));
            } else if (data && typeof data === 'object') {
                data.idClub = data.idClub ?? data.id ?? data.Id;
                data.siglas = data.sigla ?? data.Sigla ?? data.siglas ?? data.Siglas ?? '';
            }
        }

        return data;
    } catch (error) {
        if (retries > 0 && error.message.includes('Timeout')) {
            return request(endpoint, options, retries - 1);
        }
        if (!silentErrors) console.error(`Error en ${url}:`, error);
        throw error;
    }
};

export const api = {
    get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),

    post: (endpoint, data, options = {}) => request(endpoint, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(data),
        ...options,
    }),

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
