import React, { useCallback, useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Database, Download, RefreshCw, HardDrive, Clock, AlertTriangle } from 'lucide-react';
import { downloadBackup, fetchBackupHistory } from '../../services/backupService';
import { fetchFederacionesList } from '../../services/saasService';

const formatFecha = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('es-AR');
};

const BackupsManagement = () => {
    const [scope, setScope] = useState('full');
    const [federaciones, setFederaciones] = useState([]);
    const [idFederacion, setIdFederacion] = useState('');
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadHistory = useCallback(async () => {
        setLoadingHistory(true);
        setError('');
        try {
            const data = await fetchBackupHistory(50);
            setHistory(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'No se pudo cargar el historial');
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
        fetchFederacionesList()
            .then((list) => setFederaciones(Array.isArray(list) ? list : []))
            .catch(() => setFederaciones([]));
    }, [loadHistory]);

    const handleDownload = async () => {
        setError('');
        setSuccess('');
        if (scope === 'federacion' && !idFederacion) {
            setError('Seleccioná una federación');
            return;
        }

        setDownloading(true);
        try {
            const filename = await downloadBackup({
                scope,
                idFederacion: scope === 'federacion' ? Number(idFederacion) : undefined,
            });
            setSuccess(`Backup descargado: ${filename}`);
            await loadHistory();
        } catch (err) {
            setError(err.message || 'Error al generar el backup');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.35rem' }}>
                        <Database size={22} /> Backups de base de datos
                    </h1>
                    <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Archivo .sql restaurable. El historial es compartido con SportTrack (misma BD).
                    </p>
                </div>
                <Button variant="secondary" onClick={loadHistory} disabled={loadingHistory}>
                    <RefreshCw size={16} /> Actualizar
                </Button>
            </div>

            {error && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
                    {success}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 400px) 1fr', gap: '1.25rem' }} className="backups-grid-sigdef">
                <Card>
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HardDrive size={18} /> Generar backup
                    </h3>

                    <label style={{ display: 'flex', gap: 10, padding: '0.75rem', borderRadius: 8, border: scope === 'full' ? '1px solid #3b82f6' : '1px solid var(--border-color)', marginBottom: 8, cursor: 'pointer' }}>
                        <input type="radio" checked={scope === 'full'} onChange={() => setScope('full')} />
                        <span>
                            <strong style={{ display: 'block' }}>Base completa</strong>
                            <small style={{ color: 'var(--text-secondary)' }}>Estructura + datos. Disaster recovery.</small>
                        </span>
                    </label>

                    <label style={{ display: 'flex', gap: 10, padding: '0.75rem', borderRadius: 8, border: scope === 'federacion' ? '1px solid #3b82f6' : '1px solid var(--border-color)', marginBottom: 12, cursor: 'pointer' }}>
                        <input type="radio" checked={scope === 'federacion'} onChange={() => setScope('federacion')} />
                        <span>
                            <strong style={{ display: 'block' }}>Por federación</strong>
                            <small style={{ color: 'var(--text-secondary)' }}>Export filtrado. Destino con esquema migrado.</small>
                        </span>
                    </label>

                    {scope === 'federacion' && (
                        <select
                            value={idFederacion}
                            onChange={(e) => setIdFederacion(e.target.value)}
                            style={{ width: '100%', marginBottom: 12, padding: '0.55rem', borderRadius: 8 }}
                        >
                            <option value="">Seleccioná federación…</option>
                            {federaciones.map((f) => {
                                const id = f.id ?? f.idFederacion;
                                return (
                                    <option key={id} value={id}>
                                        {f.nombre}{f.sigla ? ` (${f.sigla})` : ''}
                                    </option>
                                );
                            })}
                        </select>
                    )}

                    <p style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: '#fbbf24', alignItems: 'flex-start' }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                        Incluye cuentas y hashes de password. Archivos Cloudinary no van en el dump.
                    </p>

                    <Button onClick={handleDownload} disabled={downloading} style={{ width: '100%', marginTop: 8 }}>
                        <Download size={16} /> {downloading ? 'Generando…' : 'Descargar .sql'}
                    </Button>
                </Card>

                <Card>
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={18} /> Historial (SIGDEF + SportTrack)
                    </h3>
                    {loadingHistory ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>
                    ) : history.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Todavía no hay backups registrados.</p>
                    ) : (
                        <div style={{ overflow: 'auto', maxHeight: 520 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Fecha</th>
                                        <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Acción</th>
                                        <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Origen</th>
                                        <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Usuario</th>
                                        <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((h) => (
                                        <tr key={h.id ?? h.Id}>
                                            <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                                                {formatFecha(h.fecha ?? h.Fecha)}
                                            </td>
                                            <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', verticalAlign: 'top', fontWeight: 700, color: '#38bdf8', fontSize: '0.75rem' }}>
                                                {h.accion ?? h.Accion}
                                            </td>
                                            <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                                                {h.sistemaOrigen ?? h.SistemaOrigen ?? '—'}
                                            </td>
                                            <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                                                {h.usuario ?? h.Usuario}
                                            </td>
                                            <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', verticalAlign: 'top', color: 'var(--text-secondary)', fontSize: '0.78rem', maxWidth: 280, wordBreak: 'break-word' }}>
                                                {h.detalle ?? h.Detalle}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            <style>{`
                @media (max-width: 960px) {
                    .backups-grid-sigdef { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
};

export default BackupsManagement;
