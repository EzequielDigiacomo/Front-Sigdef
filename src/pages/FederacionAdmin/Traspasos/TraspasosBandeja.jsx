import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowRightLeft,
    Calendar,
    RefreshCw,
    Search,
    AlertCircle,
    CheckCircle2,
    Download,
    History,
} from 'lucide-react';
import TraspasoService from '../../../services/traspasoService';
import {
    normalizeSolicitud,
    normalizePeriodo,
    normalizeAuditoria,
    getEstadoTraspasoMeta,
    formatFecha,
    notifyTraspasosChanged,
} from '../../../utils/traspasoUtils';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import PageHeader from '../../../components/common/PageHeader';
import { useDevice } from '../../../hooks/useDevice';
import '../../Shared/Traspasos/Traspasos.css';

const FILTROS = [
    { key: 'PendienteFederacion', label: 'Pendientes verificación' },
    { key: 'PendienteOrigen', label: 'Pendientes club origen' },
    { key: '', label: 'Todas' },
    { key: 'Aprobado', label: 'Aprobadas' },
    { key: 'RechazadoFederacion', label: 'Rechazadas' },
    { key: 'RechazadoOrigen', label: 'Rechazadas origen' },
];

const TraspasosBandeja = () => {
    const { isNative, isMobile } = useDevice();
    const isMobileView = isMobile || isNative;
    const { fedId } = useParams();
    const basePath = fedId ? `/superadmin/federacion/${fedId}/traspasos` : '/dashboard/traspasos';
    const backTo = fedId ? `/superadmin/federacion/${fedId}` : '/dashboard';
    const navigate = useNavigate();

    const [filtro, setFiltro] = useState('PendienteFederacion');
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [alert, setAlert] = useState(null);
    const [periodos, setPeriodos] = useState([]);
    const [exportPeriodoId, setExportPeriodoId] = useState('');
    const [exporting, setExporting] = useState(false);
    const [auditoria, setAuditoria] = useState([]);
    const [auditoriaLoading, setAuditoriaLoading] = useState(true);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3500);
    };

    const loadSolicitudes = useCallback(async () => {
        const data = await TraspasoService.getSolicitudes(filtro || undefined);
        setSolicitudes((Array.isArray(data) ? data : []).map(normalizeSolicitud));
    }, [filtro]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [periodosData, auditData] = await Promise.all([
                    TraspasoService.getPeriodos(),
                    TraspasoService.getAuditoria(30),
                ]);
                if (!cancelled) {
                    setPeriodos((Array.isArray(periodosData) ? periodosData : []).map(normalizePeriodo));
                    setAuditoria((Array.isArray(auditData) ? auditData : []).map(normalizeAuditoria));
                }
            } catch {
                if (!cancelled) setAuditoria([]);
            } finally {
                if (!cancelled) setAuditoriaLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                await loadSolicitudes();
            } catch (err) {
                if (!cancelled) showAlert('error', err.message || 'Error al cargar traspasos.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [loadSolicitudes]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await loadSolicitudes();
            notifyTraspasosChanged();
            showAlert('success', 'Listado actualizado.');
        } catch (err) {
            showAlert('error', err.message || 'Error al refrescar.');
        } finally {
            setRefreshing(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const blob = await TraspasoService.exportCsv({
                periodoId: exportPeriodoId || undefined,
                estado: filtro || undefined,
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `traspasos-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showAlert('success', 'CSV exportado correctamente.');
        } catch (err) {
            showAlert('error', err.message || 'Error al exportar.');
        } finally {
            setExporting(false);
        }
    };

    const filtered = solicitudes.filter((s) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            s.participanteNombre.toLowerCase().includes(q) ||
            s.participanteDocumento.toLowerCase().includes(q) ||
            s.clubOrigenNombre.toLowerCase().includes(q) ||
            s.clubDestinoNombre.toLowerCase().includes(q)
        );
    });

    return (
        <div className={`page-container traspasos-page ${isMobileView ? 'mobile-view' : ''}`}>
            <PageHeader
                title="Traspasos"
                subtitle="Bandeja de solicitudes de traspaso entre clubes"
                icon={ArrowRightLeft}
                backTo={backTo}
                backLabel={fedId ? 'Dashboard federación' : 'Dashboard'}
                actions={(
                <div className="traspasos-header-actions">
                    <select
                        className="traspasos-export-select"
                        value={exportPeriodoId}
                        onChange={(e) => setExportPeriodoId(e.target.value)}
                    >
                        <option value="">Exportar: todos los periodos</option>
                        {periodos.map((p) => (
                            <option key={p.id} value={p.id}>
                                Periodo {formatFecha(p.fechaInicio)} – {formatFecha(p.fechaFin)}
                            </option>
                        ))}
                    </select>
                    <Button variant="secondary" icon={Download} onClick={handleExport} isLoading={exporting}>
                        Exportar CSV
                    </Button>
                    <Button variant="secondary" icon={RefreshCw} onClick={handleRefresh} isLoading={refreshing}>
                        Actualizar
                    </Button>
                    <Link to={`${basePath}/periodos`} style={{ display: 'flex' }}>
                        <Button variant="primary" icon={Calendar}>Periodos</Button>
                    </Link>
                </div>
                )}
            />

            {alert && (
                <div className={`traspasos-alert traspasos-alert-${alert.type === 'error' ? 'error' : 'success'}`}>
                    {alert.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{alert.message}</span>
                </div>
            )}

            <Card className="traspasos-content-card">
                <div className="traspasos-filters" style={{ marginBottom: '1rem' }}>
                    {FILTROS.map((f) => (
                        <button
                            key={f.key || 'all'}
                            type="button"
                            className={`traspasos-filter-btn ${filtro === f.key ? 'active' : ''}`}
                            onClick={() => setFiltro(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="traspasos-search-box" style={{ marginBottom: '1rem' }}>
                    <Search size={18} style={{ alignSelf: 'center', color: 'var(--text-secondary)' }} />
                    <input
                        type="search"
                        placeholder="Buscar por atleta, documento o club..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="traspasos-empty">Cargando solicitudes...</div>
                ) : filtered.length === 0 ? (
                    <div className="traspasos-empty">No hay solicitudes para mostrar.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Atleta</th>
                                    <th>Origen → Destino</th>
                                    <th>Estado</th>
                                    <th>Solicitud</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s) => {
                                    const meta = getEstadoTraspasoMeta(s.estado);
                                    return (
                                        <tr
                                            key={s.id}
                                            className="traspasos-row-click"
                                            onClick={() => navigate(`${basePath}/${s.id}`)}
                                        >
                                            <td data-label="Atleta">
                                                <strong>{s.participanteNombre}</strong>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {s.participanteDocumento}
                                                </div>
                                            </td>
                                            <td data-label="Origen → Destino">
                                                {s.clubOrigenNombre} → {s.clubDestinoNombre}
                                            </td>
                                            <td data-label="Estado">
                                                <span className={`badge badge-${meta.color}`}>{meta.label}</span>
                                            </td>
                                            <td data-label="Solicitud">{formatFecha(s.fechaSolicitud)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Card title="Historial de auditoría" className="traspasos-content-card">
                <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <History size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Acciones registradas del módulo de traspasos
                </p>
                {auditoriaLoading ? (
                    <div className="traspasos-empty">Cargando historial...</div>
                ) : auditoria.length === 0 ? (
                    <div className="traspasos-empty">Sin registros de auditoría.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Acción</th>
                                    <th>Detalle</th>
                                    <th>Usuario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditoria.map((row) => (
                                    <tr key={row.id}>
                                        <td data-label="Fecha">{formatFecha(row.fecha)}</td>
                                        <td data-label="Acción">{row.accion}</td>
                                        <td data-label="Detalle">{row.detalle}</td>
                                        <td data-label="Usuario">{row.usuario}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TraspasosBandeja;
