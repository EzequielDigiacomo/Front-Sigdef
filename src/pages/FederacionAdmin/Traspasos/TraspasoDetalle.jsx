import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    AlertCircle,
    AlertTriangle,
    ShieldAlert,
} from 'lucide-react';
import TraspasoService from '../../../services/traspasoService';
import {
    normalizeSolicitud,
    normalizeValidaciones,
    getEstadoTraspasoMeta,
    formatFecha,
    notifyTraspasosChanged,
    notifyMensajesChanged,
} from '../../../utils/traspasoUtils';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import { useAuth } from '../../../context/AuthContext';
import '../../Shared/Traspasos/Traspasos.css';

const TraspasoDetalle = () => {
    const { id, fedId } = useParams();
    const basePath = fedId ? `/superadmin/federacion/${fedId}/traspasos` : '/dashboard/traspasos';
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPERADMIN';

    const [solicitud, setSolicitud] = useState(null);
    const [validaciones, setValidaciones] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectModal, setRejectModal] = useState(false);
    const [motivo, setMotivo] = useState('');
    const [alert, setAlert] = useState(null);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 4000);
    };

    const loadData = async () => {
        const [solData, valData] = await Promise.all([
            TraspasoService.getSolicitud(id),
            TraspasoService.getValidaciones(id),
        ]);
        setSolicitud(normalizeSolicitud(solData));
        setValidaciones(normalizeValidaciones(valData));
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                await loadData();
            } catch (err) {
                if (!cancelled) showAlert('error', err.message || 'Error al cargar solicitud.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    const handleAprobar = async (forzar = false) => {
        setActionLoading(true);
        try {
            const updated = await TraspasoService.aprobar(id, forzar);
            setSolicitud(normalizeSolicitud(updated));
            await loadData();
            notifyTraspasosChanged();
            notifyMensajesChanged();
            showAlert('success', forzar ? 'Traspaso habilitado (forzado). El club origen puede responder.' : 'Deuda verificada. El club origen puede aceptar o rechazar.');
        } catch (err) {
            showAlert('error', err.message || 'No se pudo aprobar.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRechazar = async () => {
        setActionLoading(true);
        try {
            const updated = await TraspasoService.rechazar(id, motivo);
            setSolicitud(normalizeSolicitud(updated));
            setRejectModal(false);
            notifyTraspasosChanged();
            notifyMensajesChanged();
            showAlert('success', 'Solicitud rechazada.');
        } catch (err) {
            showAlert('error', err.message || 'No se pudo rechazar.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-content container traspasos-page">
                <div className="traspasos-empty">Cargando detalle...</div>
            </div>
        );
    }

    if (!solicitud) {
        return (
            <div className="page-content container traspasos-page">
                <div className="traspasos-empty">Solicitud no encontrada.</div>
            </div>
        );
    }

    const meta = getEstadoTraspasoMeta(solicitud.estado);
    const puedeActuar = solicitud.estado === 'PendienteFederacion';

    return (
        <div className="page-content container traspasos-page">
            <Link to={basePath} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                <ArrowLeft size={16} /> Volver a bandeja
            </Link>

            <div className="traspasos-header">
                <div>
                    <h1>Solicitud #{solicitud.id}</h1>
                    <span className={`badge badge-${meta.color}`}>{meta.label}</span>
                </div>
                {puedeActuar && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Button
                            variant="primary"
                            icon={CheckCircle2}
                            onClick={() => handleAprobar(false)}
                            isLoading={actionLoading}
                            disabled={validaciones && !validaciones.puedeAprobar}
                        >
                            Habilitar traspaso
                        </Button>
                        {isSuperAdmin && validaciones && !validaciones.puedeAprobar && (
                            <Button
                                variant="secondary"
                                icon={ShieldAlert}
                                onClick={() => handleAprobar(true)}
                                isLoading={actionLoading}
                            >
                                Forzar habilitación
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            icon={XCircle}
                            onClick={() => setRejectModal(true)}
                            disabled={actionLoading}
                        >
                            Rechazar
                        </Button>
                    </div>
                )}
            </div>

            {alert && (
                <div className={`traspasos-alert traspasos-alert-${alert.type === 'error' ? 'error' : 'success'}`}>
                    {alert.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{alert.message}</span>
                </div>
            )}

            <Card title="Datos de la solicitud">
                <div className="traspasos-detail-grid">
                    <div>
                        <label>Atleta</label>
                        <div>{solicitud.participanteNombre}</div>
                    </div>
                    <div>
                        <label>Documento</label>
                        <div>{solicitud.participanteDocumento}</div>
                    </div>
                    <div>
                        <label>Club origen</label>
                        <div>{solicitud.clubOrigenNombre}</div>
                    </div>
                    <div>
                        <label>Club destino</label>
                        <div>{solicitud.clubDestinoNombre}</div>
                    </div>
                    <div>
                        <label>Fecha solicitud</label>
                        <div>{formatFecha(solicitud.fechaSolicitud)}</div>
                    </div>
                    <div>
                        <label>Verificación federación</label>
                        <div>{formatFecha(solicitud.fechaRespuestaFederacion)}</div>
                    </div>
                    <div>
                        <label>Respuesta origen</label>
                        <div>{formatFecha(solicitud.fechaRespuestaOrigen)}</div>
                    </div>
                    {solicitud.motivoSolicitud && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label>Motivo solicitud</label>
                            <div>{solicitud.motivoSolicitud}</div>
                        </div>
                    )}
                    {solicitud.motivoRechazo && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label>Motivo rechazo</label>
                            <div>{solicitud.motivoRechazo}</div>
                        </div>
                    )}
                </div>
            </Card>

            {validaciones && (
                <Card title="Validaciones">
                    {!validaciones.puedeAprobar && puedeActuar && (
                        <div className="traspasos-alert traspasos-alert-warning" style={{ marginBottom: '1rem' }}>
                            <AlertTriangle size={18} />
                            <span>Hay validaciones bloqueantes. Regularice la deuda antes de habilitar.</span>
                        </div>
                    )}
                    <ul className="traspasos-validacion-list">
                        {validaciones.items.map((item) => (
                            <li
                                key={item.codigo}
                                className={`traspasos-validacion-item ${item.ok ? 'ok' : 'fail'}`}
                            >
                                {item.ok ? (
                                    <CheckCircle2 size={18} color="var(--success)" />
                                ) : (
                                    <XCircle size={18} color="var(--danger)" />
                                )}
                                <div>
                                    <strong>{item.descripcion}</strong>
                                    {item.detalle && <span>{item.detalle}</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            <Modal
                isOpen={rejectModal}
                onClose={() => !actionLoading && setRejectModal(false)}
                title="Rechazar traspaso"
                footer={
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={() => setRejectModal(false)} disabled={actionLoading}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleRechazar} isLoading={actionLoading}>
                            Confirmar rechazo
                        </Button>
                    </div>
                }
            >
                <label htmlFor="motivoRechazo" style={{ display: 'block', marginBottom: 6 }}>Motivo (opcional)</label>
                <textarea
                    id="motivoRechazo"
                    rows={3}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Indique el motivo del rechazo..."
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 8,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                    }}
                />
            </Modal>
        </div>
    );
};

export default TraspasoDetalle;
