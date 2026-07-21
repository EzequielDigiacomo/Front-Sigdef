import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import TraspasoService from '../../../services/traspasoService';
import {
    normalizeSolicitud,
    getEstadoTraspasoMeta,
    formatFecha,
    notifyTraspasosChanged,
    notifyMensajesChanged,
} from '../../../utils/traspasoUtils';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';

const TraspasosSalientes = () => {
    const { user } = useAuth();
    const idClub = user?.idClub ?? user?.IdClub;

    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rejectModal, setRejectModal] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3500);
    };

    const loadSolicitudes = useCallback(async () => {
        const data = await TraspasoService.getSolicitudes('PendienteOrigen');
        const list = (Array.isArray(data) ? data : []).map(normalizeSolicitud);
        setSolicitudes(list.filter((s) => String(s.idClubOrigen) === String(idClub)));
    }, [idClub]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                await loadSolicitudes();
            } catch (err) {
                if (!cancelled) showAlert('error', err.message || 'Error al cargar solicitudes.');
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
            notifyMensajesChanged();
        } catch (err) {
            showAlert('error', err.message || 'Error al refrescar.');
        } finally {
            setRefreshing(false);
        }
    };

    const handleAceptar = async (id) => {
        setActionLoading(true);
        try {
            await TraspasoService.aceptarOrigen(id);
            await loadSolicitudes();
            notifyTraspasosChanged();
            notifyMensajesChanged();
            showAlert('success', 'Traspaso aceptado y ejecutado. El atleta ya pertenece al club destino.');
        } catch (err) {
            showAlert('error', err.message || 'No se pudo aceptar.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRechazar = async () => {
        if (!rejectModal) return;
        setActionLoading(true);
        try {
            await TraspasoService.rechazarOrigen(rejectModal.id, motivo);
            setRejectModal(null);
            setMotivo('');
            await loadSolicitudes();
            notifyTraspasosChanged();
            notifyMensajesChanged();
            showAlert('success', 'Solicitud rechazada.');
        } catch (err) {
            showAlert('error', err.message || 'No se pudo rechazar.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            {alert && (
                <div className={`traspasos-alert traspasos-alert-${alert.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
                    {alert.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{alert.message}</span>
                </div>
            )}

            <Card
                title="Salidas pendientes de su club"
                actions={
                    <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleRefresh} isLoading={refreshing}>
                        Actualizar
                    </Button>
                }
            >
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 0 }}>
                    Solicitudes habilitadas por la federación (deuda verificada). Acepte para ejecutar el traspaso o rechace si no autoriza la salida.
                </p>

                {loading ? (
                    <div className="traspasos-empty">Cargando...</div>
                ) : solicitudes.length === 0 ? (
                    <div className="traspasos-empty">No hay solicitudes pendientes de respuesta.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Atleta</th>
                                    <th>Club destino</th>
                                    <th>Motivo</th>
                                    <th>Fecha</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudes.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <strong>{s.participanteNombre}</strong>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {s.participanteDocumento}
                                            </div>
                                        </td>
                                        <td>{s.clubDestinoNombre}</td>
                                        <td>{s.motivoSolicitud || '—'}</td>
                                        <td>{formatFecha(s.fechaSolicitud)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    icon={CheckCircle2}
                                                    onClick={() => handleAceptar(s.id)}
                                                    isLoading={actionLoading}
                                                >
                                                    Aceptar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    icon={XCircle}
                                                    onClick={() => setRejectModal(s)}
                                                    disabled={actionLoading}
                                                >
                                                    Rechazar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={!!rejectModal}
                onClose={() => !actionLoading && setRejectModal(null)}
                title="Rechazar solicitud de traspaso"
                footer={
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={() => setRejectModal(null)} disabled={actionLoading}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleRechazar} isLoading={actionLoading}>
                            Confirmar rechazo
                        </Button>
                    </div>
                }
            >
                {rejectModal && (
                    <>
                        <p>
                            Rechazar traspaso de <strong>{rejectModal.participanteNombre}</strong> hacia{' '}
                            <strong>{rejectModal.clubDestinoNombre}</strong>.
                        </p>
                        <label htmlFor="motivoRechazoOrigen" style={{ display: 'block', marginBottom: 6 }}>Motivo (opcional)</label>
                        <textarea
                            id="motivoRechazoOrigen"
                            rows={3}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: 8,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </>
                )}
            </Modal>
        </>
    );
};

export default TraspasosSalientes;
