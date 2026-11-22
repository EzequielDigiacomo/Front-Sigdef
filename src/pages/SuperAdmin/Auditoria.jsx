import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { Key, Globe, MousePointerClick, Bug } from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import { api } from '../../services/api';

const inferTipo = (accion = '') => {
    const upper = String(accion).toUpperCase();
    if (upper.includes('LOGIN') || upper.includes('LOGOUT') || upper.includes('AUTH')) return 'Acceso';
    if (upper.startsWith('CLICK_') || upper === 'CLICK_UI') return 'Click';
    if (
        upper.includes('ERROR')
        || upper.includes('FAILED')
        || upper.includes('CRASH')
        || upper.includes('BLOCK')
        || upper.includes('SUSPEND')
    ) return 'Error';
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
    if (parsed.message) parts.push(parsed.message);
    if (parsed.label && !parsed.message) parts.push(`Click: ${parsed.label}`);
    if (parsed.endpoint) parts.push(`${parsed.method || 'REQ'} ${parsed.endpoint}`);
    if (parsed.httpStatus) parts.push(`HTTP ${parsed.httpStatus}`);
    if (parsed.path) parts.push(`Pantalla: ${parsed.path}`);
    if (parsed.lastClick?.label) parts.push(`Último click: ${parsed.lastClick.label}`);
    if (parsed.documento) parts.push(`DNI: ${parsed.documento}`);
    if (parsed.tipoLabel || parsed.tipoDocumento != null) {
        parts.push(`Doc: ${parsed.tipoLabel || parsed.tipoDocumento}`);
    }
    if (parsed.fileName) parts.push(`Archivo: ${parsed.fileName}`);
    if (parsed.technicalHint) parts.push(`Detalle: ${parsed.technicalHint}`);

    return parts.length > 0 ? parts.join(' · ') : detalle;
};

const Auditoria = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadLogs = async () => {
            try {
                setLoading(true);
                const data = await api.get('/support/logs?limit=200');
                const isForbidNoise = (detalle = '') =>
                    detalle.includes('No authentication handler is registered for the scheme');

                setLogs((data || [])
                    .filter((log) => {
                        const accion = log.accion ?? log.Accion ?? '';
                        const detalle = log.detalle ?? log.Detalle ?? '';
                        return !(accion === 'ERROR_FATAL' && isForbidNoise(detalle));
                    })
                    .map((log) => {
                        const accion = log.accion ?? log.Accion ?? 'Evento';
                        const detalleRaw = log.detalle ?? log.Detalle ?? '';
                        return {
                            id: log.id ?? log.Id,
                            tipo: inferTipo(accion),
                            accion,
                            detalle: formatDetalle(detalleRaw),
                            detalleRaw,
                            modulo: log.modulo ?? log.Modulo ?? '',
                            fecha: formatFecha(log.fecha ?? log.Fecha),
                            usuario: log.usuario ?? log.Usuario ?? 'Sistema',
                            ip: log.ip ?? log.IP ?? '',
                        };
                    }));
            } catch (error) {
                console.error('Error cargando auditoría:', error);
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };

        loadLogs();
    }, []);

    const filteredLogs = logs.filter((log) => {
        const q = searchTerm.toLowerCase();
        return (
            log.accion.toLowerCase().includes(q)
            || log.detalle.toLowerCase().includes(q)
            || log.usuario.toLowerCase().includes(q)
            || (log.modulo || '').toLowerCase().includes(q)
        );
    });

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'Error': return <Bug size={16} />;
            case 'Acceso': return <Key size={16} />;
            case 'Click': return <MousePointerClick size={16} />;
            default: return <Globe size={16} />;
        }
    };

    const isErrorLog = (log) => log.tipo === 'Error';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Bitácora de Auditoría</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Historial de accesos, clicks de usuarios y errores de carga/operación en el ecosistema SaaS.
                </p>
            </div>

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por acción, error, pantalla, endpoint o usuario..."
                    />
                </div>

                {loading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Cargando registros...</p>
                ) : filteredLogs.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No hay registros de auditoría.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredLogs.map((log) => (
                            <div key={log.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                border: `1px solid ${isErrorLog(log) ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)'}`,
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: isErrorLog(log) ? 'rgba(239, 68, 68, 0.06)' : 'var(--bg-primary)',
                            }}>
                                <div style={{
                                    color: isErrorLog(log) ? 'var(--danger)' : 'var(--primary)',
                                    backgroundColor: isErrorLog(log) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
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
                                            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{log.accion}</h4>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '0.1rem 0.4rem',
                                                borderRadius: '4px',
                                                backgroundColor: isErrorLog(log) ? 'rgba(239, 68, 68, 0.15)' : 'var(--border-color)',
                                                color: isErrorLog(log) ? 'var(--danger)' : 'var(--text-secondary)',
                                                fontWeight: '600',
                                            }}>
                                                {log.tipo}
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
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
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
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Auditoria;
