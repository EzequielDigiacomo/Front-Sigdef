import { api, getApiBaseUrl } from './api';

const getToken = () => {
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

const parseFilename = (disposition, fallback) => {
    let filename = fallback;
    if (disposition && disposition.includes('filename=')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
        }
    }
    return filename;
};

const triggerBlobDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

export async function downloadBackup({ scope = 'full', idFederacion } = {}) {
    const base = getApiBaseUrl();
    const params = new URLSearchParams({ scope });
    if (scope === 'federacion' && idFederacion) {
        params.set('idFederacion', String(idFederacion));
    }

    const token = getToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
        const response = await fetch(`${base}/backup/download?${params}`, {
            method: 'GET',
            headers: {
                'X-Client-App': 'sigdef',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
            signal: controller.signal,
        });

        if (!response.ok) {
            let message = `Error ${response.status}`;
            try {
                const err = await response.json();
                message = err.message || message;
            } catch {
                /* ignore */
            }
            throw new Error(message);
        }

        const blob = await response.blob();
        const fallback =
            scope === 'federacion'
                ? `backup_federacion_${idFederacion}_${new Date().toISOString().slice(0, 10)}.sql`
                : `backup_full_${new Date().toISOString().slice(0, 10)}.sql`;
        const filename = parseFilename(response.headers.get('content-disposition'), fallback);
        triggerBlobDownload(blob, filename);
        return filename;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function fetchBackupHistory(limit = 50) {
    return (await api.get(`/backup/history?limit=${limit}`)) || [];
}
