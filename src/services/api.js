const API_URL = 'https://localhost:7112/api';

const defaultHeaders = {
    'Content-Type': 'application/json',
};

const handleResponse = async (response, options = {}) => {
    const { silentErrors = false } = options;

    if (response.status === 204) {
        console.log('✅ 204 No Content - Operación exitosa');
        return null;
    }

    const responseText = await response.text();

    if (!response.ok) {
        if (!silentErrors) {
            console.error('❌ Error del servidor:', responseText);
        }
        throw new Error(responseText || `Error ${response.status}: ${response.statusText}`);
    }

    if (!responseText) {
        console.log('✅ Respuesta vacía - Operación exitosa');
        return { success: true };
    }

    try {
        const data = JSON.parse(responseText);
        console.log('✅ Respuesta JSON exitosa:', data);
        return data;
    } catch (error) {
        
        console.log('✅ Respuesta de texto - Operación exitosa:', responseText);
        return {
            message: responseText,
            success: true
        };
    }
};

export const api = {
    get: async (endpoint, options = {}) => {
        const { silentErrors = false } = options;
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const headers = { ...defaultHeaders };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log(`🚀 GET ${API_URL}${endpoint}`);

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers
            });
            return await handleResponse(response, { silentErrors });
        } catch (error) {
            if (!silentErrors) {
                console.error(`💥 Error GET ${endpoint}:`, error);
            }
            throw error;
        }
    },

    post: async (endpoint, data, options = {}) => {
        const { silentErrors = false } = options;
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const headers = { ...defaultHeaders };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log(`🚀 POST ${API_URL}${endpoint}`, data);

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
            return await handleResponse(response, { silentErrors });
        } catch (error) {
            if (!silentErrors) {
                console.error(`💥 Error POST ${endpoint}:`, error);
            }
            throw error;
        }
    },

    put: async (endpoint, data, options = {}) => {
        const { silentErrors = false } = options;
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const headers = { ...defaultHeaders };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log(`🚀 PUT ${API_URL}${endpoint}`, data);

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data)
            });
            return await handleResponse(response, { silentErrors });
        } catch (error) {
            if (!silentErrors) {
                console.error(`💥 Error PUT ${endpoint}:`, error);
            }
            throw error;
        }
    },

    delete: async (endpoint, options = {}) => {
        const { silentErrors = false } = options;
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const headers = { ...defaultHeaders };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log(`🚀 DELETE ${API_URL}${endpoint}`);

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers
            });
            return await handleResponse(response, { silentErrors });
        } catch (error) {
            if (!silentErrors) {
                console.error(`💥 Error DELETE ${endpoint}:`, error);
            }
            throw error;
        }
    }
};