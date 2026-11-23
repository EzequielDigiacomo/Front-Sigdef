import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { Key, Globe, MousePointerClick, Bug, CheckCircle2, Trash2, Save, Minus, Plus } from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { fetchFederacionesList } from '../../services/saasService';
import {
    AUDIT_ACTION_LABELS,
    tryParseDetalle,
    formatAuditTechnicalDetalle,
} from '../../utils/auditDisplay';

/** Intervalo de refresco automático de la bitácora (solo con sesión activa). */
const POLL_MS = 8_000;
const PAGE_SIZE = 10;

const toInputDate = (date) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const defaultRange = () => {
    const to = new Date();
    to.setDate(to.getDate() - 7);
    const from = new Date();
    from.setMonth(from.getMonth() - 2);
    return { from: toInputDate(from), to: toInputDate(to) };
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
                accionLabel: AUDIT_ACTION_LABELS[accion] || accion,
                detalle: formatAuditTechnicalDetalle(detalleRaw),
                detalleRaw,
                resultado,
                modulo: log.modulo ?? log.Modulo ?? '',
                fecha: formatFecha(log.fecha ?? log.Fecha),
                usuario: log.usuario ?? log.Usuario ?? 'Sistema',
                ip: log.ip ?? log.IP ?? '',
            };
        });

const logMatchesSearch = (log, rawQuery) => {
    const q = String(rawQuery || '').trim().toLowerCase();
    if (!q) return true;
    const blob = [
        log.accion,
        log.accionLabel,
        log.detalle,
        log.detalleRaw,
        log.usuario,
        log.modulo,
        log.ip,
        log.resultado,
    ].join(' ').toLowerCase();
    return blob.includes(q);
};

const Auditoria = () => {
    const { isAuthenticated } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [expandedId, setExpandedId] = useState(null);

    const [retention, setRetention] = useState({ enabled: false, days: 90, federaciones: [] });
    const [retentionLoading, setRetentionLoading] = useState(true);
    const [retentionSaving, setRetentionSaving] = useState(false);
    const [retentionMsg, setRetentionMsg] = useState('');
    const [fedRows, setFedRows] = useState([]);
    const [fedBusyId, setFedBusyId] = useState(null);
    const [fedMsg, setFedMsg] = useState('');
    const [fedPurgeOpen, setFedPurgeOpen] = useState(true);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        type: 'danger',
        action: null,
    });
    const [feedbackModal, setFeedbackModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'success',
    });

    const openConfirm = ({ title, message, confirmText = 'Confirmar', type = 'danger', action }) => {
        setConfirmModal({ isOpen: true, title, message, confirmText, type, action });
    };

    const closeConfirm = () => {
        if (retentionSaving || fedBusyId) return;
        setConfirmModal((m) => ({ ...m, isOpen: false, action: null }));
    };

    const showFeedback = (type, title, message) => {
        setFeedbackModal({ isOpen: true, type, title, message });
    };

    const closeFeedback = () => {
        setFeedbackModal((m) => ({ ...m, isOpen: false }));
    };

    const runConfirmAction = async () => {
        const action = confirmModal.action;
        if (!action) return;
        try {
            await action();
            setConfirmModal((m) => ({ ...m, isOpen: false, action: null }));
        } catch {
            /* el action ya muestra feedback de error */
        }
    };

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

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

                // Con búsqueda: traemos un lote amplio y filtramos en cliente
                // (usuario, detalle, acción, módulo, IP) para que coincida sí o sí.
                if (debouncedSearch) {
                    let data = await api.get(
                        `/support/logs?pageNumber=1&pageSize=2000&search=${encodeURIComponent(debouncedSearch)}`
                    ).catch(() => null);
                    if (cancelled) return;

                    let list = Array.isArray(data)
                        ? data
                        : (Array.isArray(data?.items) ? data.items : []);

                    if (list.length === 0) {
                        data = await api.get('/support/logs?limit=2000');
                        if (cancelled) return;
                        list = Array.isArray(data)
                            ? data
                            : (Array.isArray(data?.items) ? data.items : []);
                    }

                    const filtered = mapLogs(list).filter((l) => logMatchesSearch(l, debouncedSearch));
                    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE) || 1);
                    const pageSafe = Math.min(Math.max(1, page), pages);
                    setLogs(filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE));
                    setTotalCount(filtered.length);
                    setTotalPages(pages);
                    if (pageSafe !== page) setPage(pageSafe);
                    return;
                }

                const params = new URLSearchParams({
                    pageNumber: String(page),
                    pageSize: String(PAGE_SIZE),
                });
                const data = await api.get(`/support/logs?${params.toString()}`);
                if (cancelled) return;

                const isPaged = data && !Array.isArray(data) && Array.isArray(data.items);
                const list = isPaged ? data.items : (Array.isArray(data) ? data : []);
                setLogs(mapLogs(list));
                if (isPaged) {
                    setTotalCount(Number(data.totalCount) || list.length);
                    setTotalPages(Math.max(1, Number(data.totalPages) || 1));
                    const serverPage = Number(data.pageNumber);
                    if (serverPage && serverPage !== page) setPage(serverPage);
                } else {
                    setTotalCount(list.length);
                    setTotalPages(Math.max(1, Math.ceil(list.length / PAGE_SIZE)));
                }
            } catch (error) {
                if (cancelled) return;
                console.error('Error cargando auditoría:', error);
                if (!silent) {
                    setLogs([]);
                    setTotalCount(0);
                    setTotalPages(1);
                }
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
    }, [isAuthenticated, page, debouncedSearch]);

    useEffect(() => {
        if (!isAuthenticated) return undefined;
        let cancelled = false;
        (async () => {
            setRetentionLoading(true);
            try {
                const [data, feds] = await Promise.all([
                    api.get('/support/audit-retention').catch(() => null),
                    fetchFederacionesList().catch(() => []),
                ]);
                if (cancelled) return;

                const fedConfigs = Array.isArray(data?.federaciones) ? data.federaciones : [];
                setRetention({
                    enabled: !!data?.enabled,
                    days: Number(data?.days) > 0 ? Number(data.days) : 90,
                    federaciones: fedConfigs,
                });

                const range = defaultRange();
                const rows = (Array.isArray(feds) ? feds : []).map((f) => {
                    const id = Number(f.idFederacion ?? f.IdFederacion ?? f.id ?? 0);
                    const cfg = fedConfigs.find((c) => Number(c.federacionId) === id);
                    return {
                        id,
                        nombre: f.nombre || f.Nombre || `Federación #${id}`,
                        enabled: !!cfg?.enabled,
                        days: Number(cfg?.days) > 0 ? Number(cfg.days) : 90,
                        from: range.from,
                        to: range.to,
                    };
                }).filter((r) => r.id > 0);

                setFedRows(rows);
            } catch (err) {
                console.error('Error cargando retención de auditoría:', err);
            } finally {
                if (!cancelled) setRetentionLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [isAuthenticated]);

    const updateFedRow = (id, patch) => {
        setFedRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };

    const saveFedRetention = async (row) => {
        setFedBusyId(row.id);
        setFedMsg('');
        try {
            const saved = await api.put('/support/audit-retention/federacion', {
                federacionId: row.id,
                nombre: row.nombre,
                enabled: !!row.enabled,
                days: Number(row.days) || 90,
            });
            updateFedRow(row.id, {
                enabled: !!saved.enabled,
                days: Number(saved.days) || 90,
            });
            const msg = saved.enabled
                ? `${row.nombre}: auto-borrado activo (conserva ${saved.days} días).`
                : `${row.nombre}: auto-borrado desactivado.`;
            setFedMsg(msg);
            showFeedback('success', 'Configuración guardada', msg);
        } catch (err) {
            const msg = err?.message || `No se pudo guardar la config de ${row.nombre}.`;
            setFedMsg(msg);
            showFeedback('danger', 'No se pudo completar', msg);
        } finally {
            setFedBusyId(null);
        }
    };

    const askPurgeFedRange = (row) => {
        if (!row.from || !row.to) {
            showFeedback('info', 'Fechas incompletas', 'Completá desde / hasta para borrar por rango.');
            return;
        }
        if (row.from > row.to) {
            showFeedback('danger', 'Rango inválido', 'La fecha desde no puede ser posterior a hasta.');
            return;
        }
        openConfirm({
            title: 'Borrar auditoría por rango',
            message: `¿Borrar auditoría de "${row.nombre}" desde ${row.from} hasta ${row.to}? Lo posterior a "hasta" se conserva.`,
            confirmText: 'Borrar rango',
            type: 'danger',
            action: async () => {
                setFedBusyId(row.id);
                setFedMsg('');
                try {
                    const res = await api.post('/support/audit-retention/purge-federacion', {
                        federacionId: row.id,
                        deleteAll: false,
                        from: row.from,
                        to: row.to,
                    });
                    const msg = res?.message || `${row.nombre}: eliminados ${res?.deleted ?? 0}`;
                    setFedMsg(msg);
                    showFeedback('success', 'Proceso completado', msg);
                } catch (err) {
                    const msg = err?.message || `No se pudo purgar ${row.nombre}.`;
                    setFedMsg(msg);
                    showFeedback('danger', 'No se pudo completar', msg);
                    throw err;
                } finally {
                    setFedBusyId(null);
                }
            },
        });
    };

    const askPurgeFedAll = (row) => {
        openConfirm({
            title: 'Borrar toda la auditoría',
            message: `¿Borrar TODA la auditoría de "${row.nombre}"? Esta acción no se puede deshacer.`,
            confirmText: 'Borrar todo',
            type: 'danger',
            action: async () => {
                setFedBusyId(row.id);
                setFedMsg('');
                try {
                    const res = await api.post('/support/audit-retention/purge-federacion', {
                        federacionId: row.id,
                        deleteAll: true,
                    });
                    const msg = res?.message || `${row.nombre}: eliminados ${res?.deleted ?? 0}`;
                    setFedMsg(msg);
                    showFeedback('success', 'Proceso completado', msg);
                } catch (err) {
                    const msg = err?.message || `No se pudo borrar todo de ${row.nombre}.`;
                    setFedMsg(msg);
                    showFeedback('danger', 'No se pudo completar', msg);
                    throw err;
                } finally {
                    setFedBusyId(null);
                }
            },
        });
    };

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

    const saveRetention = async () => {
        setRetentionSaving(true);
        setRetentionMsg('');
        try {
            const saved = await api.put('/support/audit-retention', {
                enabled: !!retention.enabled,
                days: Number(retention.days) || 90,
            });
            setRetention({
                enabled: !!saved.enabled,
                days: Number(saved.days) || 90,
            });
            const msg = saved.enabled
                ? `Retención automática activa: se borran registros de más de ${saved.days} días (revisión diaria).`
                : 'Retención automática desactivada. Los registros no se borran solos.';
            setRetentionMsg(msg);
            showFeedback('success', 'Configuración guardada', msg);
        } catch (err) {
            const msg = err?.message || 'No se pudo guardar la configuración.';
            setRetentionMsg(msg);
            showFeedback('danger', 'No se pudo completar', msg);
        } finally {
            setRetentionSaving(false);
        }
    };

    const askPurgeNow = () => {
        const days = Number(retention.days) || 90;
        openConfirm({
            title: 'Purgar auditoría global',
            message: `¿Eliminar ahora todos los registros de auditoría anteriores a ${days} días?`,
            confirmText: 'Purgar ahora',
            type: 'danger',
            action: async () => {
                setRetentionSaving(true);
                setRetentionMsg('');
                try {
                    const res = await api.post('/support/audit-retention/purge', {
                        enabled: !!retention.enabled,
                        days,
                    });
                    const msg = res?.message || `Eliminados: ${res?.deleted ?? 0}`;
                    setRetentionMsg(msg);
                    showFeedback('success', 'Proceso completado', msg);
                } catch (err) {
                    const msg = err?.message || 'No se pudo ejecutar la purga.';
                    setRetentionMsg(msg);
                    showFeedback('danger', 'No se pudo completar', msg);
                    throw err;
                } finally {
                    setRetentionSaving(false);
                }
            },
        });
    };

    const askTruncateAll = () => {
        openConfirm({
            title: 'Vaciar toda la auditoría',
            message: 'Se eliminan TODOS los registros y se libera espacio en disco (TRUNCATE). Esta acción no se puede deshacer.',
            confirmText: 'Vaciar todo',
            type: 'danger',
            action: async () => {
                setRetentionSaving(true);
                setRetentionMsg('');
                try {
                    const res = await api.post('/support/audit-retention/truncate-all');
                    const msg = res?.message || 'Auditoría vaciada.';
                    setRetentionMsg(msg);
                    setLogs([]);
                    setTotalCount(0);
                    setTotalPages(1);
                    setPage(1);
                    showFeedback('success', 'Proceso completado', msg);
                } catch (err) {
                    const msg = err?.message || 'No se pudo vaciar la auditoría.';
                    setRetentionMsg(msg);
                    showFeedback('danger', 'No se pudo completar', msg);
                    throw err;
                } finally {
                    setRetentionSaving(false);
                }
            },
        });
    };

    const askVacuumSpace = () => {
        openConfirm({
            title: 'Liberar espacio en disco',
            message: 'Ejecuta VACUUM FULL sobre Auditoria (puede tardar unos segundos). No borra registros vivos: solo reclama el espacio de los DELETE ya hechos.',
            confirmText: 'Liberar espacio',
            type: 'info',
            action: async () => {
                setRetentionSaving(true);
                setRetentionMsg('');
                try {
                    const res = await api.post('/support/audit-retention/vacuum');
                    const msg = res?.message || 'Espacio liberado con VACUUM.';
                    setRetentionMsg(msg);
                    showFeedback('success', 'Proceso completado', msg);
                } catch (err) {
                    const msg = err?.message || 'No se pudo liberar espacio.';
                    setRetentionMsg(msg);
                    showFeedback('danger', 'No se pudo completar', msg);
                    throw err;
                } finally {
                    setRetentionSaving(false);
                }
            },
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
            <div style={{ minWidth: 0 }}>
                <h2 className="text-gradient" style={{ fontSize: 'clamp(1.35rem, 5vw, 2rem)', fontWeight: '800', marginBottom: '0.25rem', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    Bitácora de Auditoría
                </h2>
                <p style={{ color: 'var(--text-secondary)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    Vista técnica para SuperAdmin: endpoint, HTTP, hints y JSON crudo para diagnosticar errores.
                    La federación solo ve un título amigable en su dashboard.
                </p>
            </div>

            <Card>
                <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700 }}>
                    Retención de registros
                </h3>
                <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Por defecto los registros <strong>no se borran solos</strong>. Acá definís si se purgan automáticamente
                    y cada cuántos días. La revisión automática corre una vez al día en el servidor.
                </p>

                {retentionLoading ? (
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Cargando configuración...</p>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        alignItems: 'flex-end',
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                checked={!!retention.enabled}
                                onChange={(e) => setRetention((r) => ({ ...r, enabled: e.target.checked }))}
                            />
                            Borrado automático
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                            Conservar últimos (días)
                            <input
                                type="number"
                                min={1}
                                max={3650}
                                value={retention.days}
                                onChange={(e) => setRetention((r) => ({ ...r, days: e.target.value }))}
                                style={{
                                    width: 120,
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: 8,
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </label>
                        <Button variant="primary" icon={Save} onClick={saveRetention} isLoading={retentionSaving}>
                            Guardar
                        </Button>
                        <Button variant="secondary" icon={Trash2} onClick={askPurgeNow} disabled={retentionSaving}>
                            Purgar ahora
                        </Button>
                        <Button variant="secondary" onClick={askVacuumSpace} disabled={retentionSaving}>
                            Liberar espacio (VACUUM)
                        </Button>
                        <Button variant="danger" icon={Trash2} onClick={askTruncateAll} disabled={retentionSaving}>
                            Vaciar todo y liberar espacio
                        </Button>
                    </div>
                )}
                {retentionMsg ? (
                    <p style={{ margin: '0.85rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {retentionMsg}
                    </p>
                ) : null}
            </Card>

            <Card>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginBottom: fedPurgeOpen ? '0.35rem' : 0,
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                        Purga por federación
                    </h3>
                    <button
                        type="button"
                        onClick={() => setFedPurgeOpen((v) => !v)}
                        title={fedPurgeOpen ? 'Minimizar' : 'Expandir'}
                        aria-label={fedPurgeOpen ? 'Minimizar purga por federación' : 'Expandir purga por federación'}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            background: 'rgba(15, 23, 42, 0.45)',
                            color: 'var(--text-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        {fedPurgeOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </button>
                </div>

                {fedPurgeOpen ? (
                <>
                <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Configuración independiente por federación. Podés borrar un rango (ej. desde hace 2 meses hasta hace 1 semana)
                    para conservar lo reciente, o borrar todo. El auto-borrado usa los días a conservar de cada una.
                </p>

                {retentionLoading ? (
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Cargando federaciones...</p>
                ) : fedRows.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay federaciones para configurar.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {fedRows.map((row) => {
                            const busy = fedBusyId === row.id;
                            return (
                                <div
                                    key={row.id}
                                    style={{
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 12,
                                        padding: '0.9rem 1rem',
                                        background: 'rgba(15, 23, 42, 0.35)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>{row.nombre}</strong>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            ID {row.id}
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.75rem 1rem',
                                        alignItems: 'flex-end',
                                    }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={!!row.enabled}
                                                onChange={(e) => updateFedRow(row.id, { enabled: e.target.checked })}
                                            />
                                            Auto-borrado
                                        </label>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem' }}>
                                            Conservar (días)
                                            <input
                                                type="number"
                                                min={1}
                                                max={3650}
                                                value={row.days}
                                                onChange={(e) => updateFedRow(row.id, { days: e.target.value })}
                                                style={{
                                                    width: 100,
                                                    padding: '0.4rem 0.55rem',
                                                    borderRadius: 8,
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-card)',
                                                    color: 'var(--text-primary)',
                                                }}
                                            />
                                        </label>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            icon={Save}
                                            onClick={() => saveFedRetention(row)}
                                            isLoading={busy}
                                        >
                                            Guardar config
                                        </Button>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.75rem 1rem',
                                        alignItems: 'flex-end',
                                    }}>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem' }}>
                                            Borrar desde
                                            <input
                                                type="date"
                                                value={row.from}
                                                onChange={(e) => updateFedRow(row.id, { from: e.target.value })}
                                                style={{
                                                    padding: '0.4rem 0.55rem',
                                                    borderRadius: 8,
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-card)',
                                                    color: 'var(--text-primary)',
                                                }}
                                            />
                                        </label>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem' }}>
                                            Borrar hasta
                                            <input
                                                type="date"
                                                value={row.to}
                                                onChange={(e) => updateFedRow(row.id, { to: e.target.value })}
                                                style={{
                                                    padding: '0.4rem 0.55rem',
                                                    borderRadius: 8,
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-card)',
                                                    color: 'var(--text-primary)',
                                                }}
                                            />
                                        </label>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            icon={Trash2}
                                            onClick={() => askPurgeFedRange(row)}
                                            disabled={busy}
                                        >
                                            Borrar rango
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            icon={Trash2}
                                            onClick={() => askPurgeFedAll(row)}
                                            disabled={busy}
                                        >
                                            Borrar todo
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {fedMsg ? (
                    <p style={{ margin: '0.85rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {fedMsg}
                    </p>
                ) : null}
                </>
                ) : null}
            </Card>

            <Card>
                <div style={{ marginBottom: '1.5rem', minWidth: 0 }}>
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por acción, error, DNI, pantalla o usuario..."
                    />
                </div>

                {loading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Cargando registros...</p>
                ) : logs.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No hay registros de auditoría.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
                        {logs.map((log) => {
                            const tone = toneFor(log.tipo);
                            const expanded = expandedId === log.id;
                            return (
                                <div key={log.id} style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.85rem',
                                    border: `1px solid ${tone.border}`,
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: tone.bg,
                                    minWidth: 0,
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        color: tone.color,
                                        backgroundColor: tone.chipBg,
                                        padding: '0.5rem',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {getIcon(log.tipo)}
                                    </div>

                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        minWidth: 0,
                                    }}>
                                        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <h4 style={{
                                                    fontSize: '0.95rem',
                                                    fontWeight: 'bold',
                                                    color: 'var(--text-primary)',
                                                    overflowWrap: 'anywhere',
                                                    wordBreak: 'break-word',
                                                }}>
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
                                                overflowWrap: 'anywhere',
                                                wordBreak: 'break-word',
                                            }}>
                                                {log.detalle}
                                            </p>
                                            {log.detalleRaw ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedId(expanded ? null : log.id)}
                                                    style={{
                                                        marginTop: '0.35rem',
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--primary)',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        padding: 0,
                                                    }}
                                                >
                                                    {expanded ? 'Ocultar JSON' : 'Ver JSON técnico'}
                                                </button>
                                            ) : null}
                                            {expanded ? (
                                                <pre style={{
                                                    marginTop: '0.5rem',
                                                    padding: '0.65rem',
                                                    borderRadius: 8,
                                                    background: 'rgba(15, 23, 42, 0.55)',
                                                    border: '1px solid var(--border-color)',
                                                    fontSize: '0.72rem',
                                                    overflow: 'auto',
                                                    maxHeight: 220,
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                    color: 'var(--text-secondary)',
                                                }}>
                                                    {(() => {
                                                        const parsed = tryParseDetalle(log.detalleRaw);
                                                        return parsed
                                                            ? JSON.stringify(parsed, null, 2)
                                                            : log.detalleRaw;
                                                    })()}
                                                </pre>
                                            ) : null}
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            flex: '0 1 auto',
                                            minWidth: 0,
                                            overflowWrap: 'anywhere',
                                            wordBreak: 'break-word',
                                        }}>
                                            <span>Usuario: <strong style={{ color: 'var(--primary)' }}>{log.usuario}</strong></span>
                                            <span>IP: {log.ip}</span>
                                            <span style={{ fontSize: '0.75rem', marginTop: '0.1rem' }}>{log.fecha}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {totalCount > PAGE_SIZE && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '0.75rem',
                                marginTop: '0.5rem',
                                paddingTop: '0.75rem',
                                borderTop: '1px solid var(--border-color)',
                            }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Página {page} de {totalPages} · {totalCount} registros
                                </span>
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                />
                            </div>
                        )}
                    </div>
                )}
            </Card>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={runConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText="Cancelar"
                type={confirmModal.type}
                isLoading={retentionSaving || !!fedBusyId}
            />

            <ConfirmationModal
                isOpen={feedbackModal.isOpen}
                onClose={closeFeedback}
                onConfirm={closeFeedback}
                title={feedbackModal.title}
                message={feedbackModal.message}
                confirmText="Entendido"
                type={feedbackModal.type === 'danger' ? 'danger' : feedbackModal.type === 'info' ? 'info' : 'success'}
                showCancel={false}
            />
        </div>
    );
};

export default Auditoria;
