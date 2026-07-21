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

const TraspasosEntrantes = () => {
    const { user } = useAuth();
    const idClub = user?.idClub ?? user?.IdClub;

    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelId, setCancelId] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [alert, setAlert] = useState(null);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3500);
    };

    const loadSolicitudes = useCallback(async () => {
        const data = await TraspasoService.getSolicitudes();
        const list = (Array.isArray(data) ? data : []).map(normalizeSolicitud);
        setSolicitudes(list.filter((s) => String(s.idClubDestino) === String(idClub)));
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

    const handleCancelar = async () => {
        if (!cancelId) return;
        setCancelling(true);
        try {
            await TraspasoService.cancelar(cancelId);
            setCancelId(null);
            await loadSolicitudes();
            notifyTraspasosChanged();
            notifyMensajesChanged();
            showAlert('success', 'Solicitud cancelada.');
        } catch (err) {
            showAlert('error', err.message || 'No se pudo cancelar.');
        } finally {
            setCancelling(false);
        }
    };

    const canCancel = (estado) =>
        estado === 'PendienteOrigen' || estado === 'PendienteFederacion';

    return (
        <>
            {alert && (
                <div className={`traspasos-alert traspasos-alert-${alert.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
                    {alert.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{alert.message}</span>
                </div>
            )}

            <Card
                title="Mis solicitudes enviadas"
                actions={
                    <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleRefresh} isLoading={refreshing}>
                        Actualizar
                    </Button>
                }
            >
                {loading ? (
                    <div className="traspasos-empty">Cargando...</div>
                ) : solicitudes.length === 0 ? (
                    <div className="traspasos-empty">Aún no envió solicitudes de traspaso.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Atleta</th>
                                    <th>Club origen</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudes.map((s) => {
                                    const meta = getEstadoTraspasoMeta(s.estado);
                                    return (
                                        <tr key={s.id}>
                                            <td>
                                                <strong>{s.participanteNombre}</strong>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {s.participanteDocumento}
                                                </div>
                                            </td>
                                            <td>{s.clubOrigenNombre}</td>
                                            <td>
                                                <span className={`badge badge-${meta.color}`}>{meta.label}</span>
                                            </td>
                                            <td>{formatFecha(s.fechaSolicitud)}</td>
                                            <td>
                                                {canCancel(s.estado) && (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        icon={XCircle}
                                                        onClick={() => setCancelId(s.id)}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={!!cancelId}
                onClose={() => !cancelling && setCancelId(null)}
                title="Cancelar solicitud"
                footer={
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={() => setCancelId(null)} disabled={cancelling}>
                            No
                        </Button>
                        <Button variant="primary" onClick={handleCancelar} isLoading={cancelling}>
                            Sí, cancelar
                        </Button>
                    </div>
                }
            >
                <p>¿Confirma que desea cancelar esta solicitud de traspaso?</p>
            </Modal>
        </>
    );
};

export default TraspasosEntrantes;
