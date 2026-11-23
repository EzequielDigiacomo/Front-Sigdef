import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { Key, Globe, MousePointerClick, Bug, CheckCircle2 } from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/** Intervalo de refresco automático de la bitácora (solo con sesión activa). */
const POLL_MS = 3_000;

const ACTION_LABELS = {
    CLICK_UI: 'Click en pantalla',
    CLICK_SAVE_DELEGADO: 'Intento guardar delegado',
    SAVE_DELEGADO_OK: 'Delegado guardado OK',
    SAVE_DELEGADO_VALIDATION: 'Error validación delegado',
    SAVE_DELEGADO_FAILED: 'Error al guardar delegado',
    CLICK_SAVE_ATHLETE: 'Intento guardar atleta',
    SAVE_ATHLETE_OK: 'Atleta guardado OK',
    SAVE_ATHLETE_FAILED: 'Error al guardar atleta',
    SAVE_ATHLETE_VALIDATION: 'Error validación atleta',
    CLICK_UPLOAD_DOCUMENT: 'Intento cargar documento',
    UPLOAD_DOCUMENT_FAILED: 'Error al cargar documento',
    API_ERROR: 'Error de API',
    FRONTEND_CRASH: 'Crash frontend',
    LOGIN_SUCCESS: 'Login OK',
    LOGIN_FAILED: 'Login fallido',
};

const inferTipo = (accion = '', resultado = '') => {
    const upper = String(accion).toUpperCase();
    const res = String(resultado || '').toUpperCase();

    if (res === 'OK' || (upper.includes('_OK') && !upper.includes('LOGIN'))) return 'Éxito';
    if (upper.includes('LOGIN') || upper.includes('LOGOUT') || upper.includes('AUTH')) return 'Acceso';
    if (upper.includes('VALIDATION') || res === 'VALIDACION') return 'Validación';
    if (
        upper.includes('ERROR')
        || upper.includes('FAILED')
        || upper.includes('CRASH')
        || upper.includes('BLOCK')
        || upper.includes('SUSPEND')
        || res === 'ERROR'
    ) return 'Error';
    if (upper.startsWith('CLICK_') || upper === 'CLICK_UI') return 'Click';
    return 'Operación';
};

const formatFecha = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleString('es-AR');
};

const tryParseDetalle = (detalle) => {
    if (!detalle || typeof detalle !== 'string') return null;
    const trimmed = detalle.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
    try {
        return JSON.parse(trimmed);
    } catch {
        return null;
    }
};

const formatDetalle = (detalle) => {
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

const isForbidNoise = (detalle = '') =>
    detalle.includes('No authentication handler is registered for the scheme');

const mapLogs = (data) =>
    (data || [])
        .filter((log) => {
            const accion = log.accion ?? log.Accion ?? '';
            const detalle = log.detalle ?? log.Detalle ?? '';
            return !(accion === 'ERROR_FATAL' && isForbidNoise(detalle));
        })
        .map((log) => {
            const accion = log.accion ?? log.Accion ?? 'Evento';
            const detalleRaw = log.detalle ?? log.Detalle ?? '';
            const parsed = tryParseDetalle(detalleRaw) || {};
            const resultado = parsed.resultado || '';
            return {
                id: log.id ?? log.Id,
                tipo: inferTipo(accion, resultado),
                accion,
                accionLabel: ACTION_LABELS[accion] || accion,
                detalle: formatDetalle(detalleRaw),
                detalleRaw,
                resultado,
                modulo: log.modulo ?? log.Modulo ?? '',
                fecha: formatFecha(log.fecha ?? log.Fecha),
                usuario: log.usuario ?? log.Usuario ?? 'Sistema',
                ip: log.ip ?? log.IP ?? '',
            };
        });

const Auditoria = () => {
    const { isAuthenticated } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return undefined;
        }

        let cancelled = false;

        const loadLogs = async ({ silent = false } = {}) => {
            if (document.visibilityState === 'hidden') return;
            try {
                if (!silent) setLoading(true);
                const data = await api.get('/support/logs?limit=200');
                if (cancelled) return;
                setLogs(mapLogs(data));
            } catch (error) {
                if (cancelled) return;
                console.error('Error cargando auditoría:', error);
                if (!silent) setLogs([]);
            } finally {
                if (!cancelled && !silent) setLoading(false);
            }
        };

        loadLogs({ silent: false });
        const id = setInterval(() => loadLogs({ silent: true }), POLL_MS);

        const onFocus = () => loadLogs({ silent: true });
        const onVisibility = () => {
            if (document.visibilityState === 'visible') loadLogs({ silent: true });
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            cancelled = true;
            clearInterval(id);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [isAuthenticated]);

    const filteredLogs = logs.filter((log) => {
        const q = searchTerm.toLowerCase();
        return (
            log.accion.toLowerCase().includes(q)
            || log.accionLabel.toLowerCase().includes(q)
            || log.detalle.toLowerCase().includes(q)
            || log.usuario.toLowerCase().includes(q)
            || (log.modulo || '').toLowerCase().includes(q)
            || (log.resultado || '').toLowerCase().includes(q)
        );
    });

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'Error':
            case 'Validación':
                return <Bug size={16} />;
            case 'Éxito':
                return <CheckCircle2 size={16} />;
            case 'Acceso':
                return <Key size={16} />;
            case 'Click':
                return <MousePointerClick size={16} />;
            default:
                return <Globe size={16} />;
        }
    };

    const toneFor = (tipo) => {
        if (tipo === 'Error' || tipo === 'Validación') {
            return {
                border: 'rgba(239, 68, 68, 0.35)',
                bg: 'rgba(239, 68, 68, 0.06)',
                color: 'var(--danger)',
                chipBg: 'rgba(239, 68, 68, 0.15)',
            };
        }
        if (tipo === 'Éxito') {
            return {
                border: 'rgba(34, 197, 94, 0.35)',
                bg: 'rgba(34, 197, 94, 0.06)',
                color: '#22c55e',
                chipBg: 'rgba(34, 197, 94, 0.15)',
            };
        }
        return {
            border: 'var(--border-color)',
            bg: 'var(--bg-primary)',
            color: 'var(--primary)',
            chipBg: 'var(--border-color)',
        };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Bitácora de Auditoría</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Movimientos de usuarios con resultado (OK / validación / error) y detalle del fallo.
                </p>
            </div>

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por acción, error, DNI, pantalla o usuario..."
                    />
                </div>

                {loading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Cargando registros...</p>
                ) : filteredLogs.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No hay registros de auditoría.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredLogs.map((log) => {
                            const tone = toneFor(log.tipo);
                            return (
                                <div key={log.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    border: `1px solid ${tone.border}`,
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: tone.bg,
                                }}>
                                    <div style={{
                                        color: tone.color,
                                        backgroundColor: tone.chipBg,
                                        padding: '0.5rem',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        {getIcon(log.tipo)}
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ minWidth: '250px', flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                    {log.accionLabel}
                                                </h4>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.1rem 0.4rem',
                                                    borderRadius: '4px',
                                                    backgroundColor: tone.chipBg,
                                                    color: tone.color,
                                                    fontWeight: '700',
                                                }}>
                                                    {log.resultado || log.tipo}
                                                </span>
                                                {log.modulo ? (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '0.1rem 0.4rem',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'var(--border-color)',
                                                        color: 'var(--text-secondary)',
                                                        fontWeight: '600',
                                                    }}>
                                                        {log.modulo}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p style={{
                                                fontSize: '0.85rem',
                                                color: (log.tipo === 'Error' || log.tipo === 'Validación')
                                                    ? 'var(--danger)'
                                                    : 'var(--text-secondary)',
                                                marginTop: '0.25rem',
                                                fontWeight: (log.tipo === 'Error' || log.tipo === 'Validación') ? 600 : 400,
                                            }}>
                                                {log.detalle}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '150px' }}>
                                            <span>Usuario: <strong style={{ color: 'var(--primary)' }}>{log.usuario}</strong></span>
                                            <span>IP: {log.ip}</span>
                                            <span style={{ fontSize: '0.75rem', marginTop: '0.1rem' }}>{log.fecha}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Auditoria;
