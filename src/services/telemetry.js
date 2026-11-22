const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5029/api';

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

const TelemetryService = {
    init: () => {
        if (typeof window === 'undefined' || window.__sigdefTelemetryReady) return;
        window.__sigdefTelemetryReady = true;

        window.onerror = (message, source, lineno, colno, error) => {
            TelemetryService.reportError({
                message: String(message || 'Error de ventana'),
                url: source || window.location.href,
                stack: error?.stack || `line ${lineno}:${colno}`,
                browserInfo: navigator.userAgent,
            });
        };

        window.onunhandledrejection = (event) => {
            const reason = event?.reason;
            TelemetryService.reportError({
                message: `Unhandled Promise Rejection: ${reason?.message || reason || 'desconocido'}`,
                url: window.location.href,
                stack: reason?.stack || null,
                browserInfo: navigator.userAgent,
            });
        };
    },

    reportError: async (errorData) => {
        try {
            const token = getAuthToken();
            const headers = {
                'Content-Type': 'application/json',
                'X-Client-App': 'sigdef',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            await fetch(`${API_URL}/support/frontend-error`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify(errorData),
            });
        } catch {
            /* evitar bucles si falla el reporte */
        }
    },
};

export default TelemetryService;
