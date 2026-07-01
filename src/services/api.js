import { PARENTESCO_MAP } from '../utils/enums';

// --- CONFIGURACIÓN DE API ---
// Usa la variable de entorno si existe, sino usa localhost por defecto
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5029/api';

const DEFAULT_TIMEOUT = 30000; // 30 segundos
const MAX_RETRIES = 2;

const defaultHeaders = {
    'Content-Type': 'application/json',
};

const handleResponse = async (response, options = {}) => {
    const { silentErrors = false } = options;

    if (response.status === 204) {
        return null;
    }

    if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Su sesión ha expirado');
    }

    let responseText = '';
    try {
        responseText = await response.text();
    } catch (e) {
        console.warn('⚠️ No se pudo leer el cuerpo de la respuesta');
    }

    if (!response.ok) {
        if (!silentErrors) {
            console.error('❌ Error del servidor:', response.status, responseText);
        }
        
        try {
            const errorObj = JSON.parse(responseText);
            throw new Error(errorObj.message || errorObj.error || `Error ${response.status}`);
        } catch (e) {
            throw new Error(responseText || `Error ${response.status}: ${response.statusText}`);
        }
    }

    if (!responseText) return { success: true };

    try {
        return JSON.parse(responseText);
    } catch (error) {
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
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('La petición ha tardado demasiado tiempo (Timeout)');
        }
        throw error;
    }
};

const request = async (endpoint, options = {}, retries = MAX_RETRIES) => {
    const { silentErrors = false, ...fetchOptions } = options;
    const url = `${API_URL}${endpoint}`;
    
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    if (token) {
        fetchOptions.headers = {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    try {
        const response = await fetchWithTimeout(url, fetchOptions);
        
        if (response.status >= 500 && retries > 0) {
            console.warn(`Retrying... (${MAX_RETRIES - retries + 1})`);
            await new Promise(res => setTimeout(res, 1000));
            return request(endpoint, options, retries - 1);
        }
        
        return await handleResponse(response, { silentErrors });
    } catch (error) {
        if (retries > 0 && error.message.includes('Timeout')) {
            return request(endpoint, options, retries - 1);
        }
        if (!silentErrors) console.error(`💥 Error en ${url}:`, error);
        throw error;
    }
};

export const api = {
    get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),
    
    post: (endpoint, data, options = {}) => request(endpoint, { 
        method: 'POST', 
        headers: defaultHeaders,
        body: JSON.stringify(data),
        ...options 
    }),
    
    put: (endpoint, data, options = {}) => request(endpoint, { 
        method: 'PUT', 
        headers: defaultHeaders,
        body: JSON.stringify(data),
        ...options 
    }),
    
    delete: (endpoint, options = {}) => request(endpoint, { method: 'DELETE', ...options }),
    
    upload: (endpoint, formData, options = {}) => request(endpoint, { 
        method: 'POST', 
        body: formData,
        ...options 
    })
};