import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardList, RefreshCw, Search, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import FichajeService from '../../../services/fichajeService';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import PageHeader from '../../../components/common/PageHeader';
import FormField from '../../../components/forms/FormField';
import {
    getEstadoFichajeLabel,
    getEstadoFichajeColor,
    getEstadoAptoLabel,
    getEstadoAptoColor,
} from '../../../utils/enums';
import '../../Shared/Traspasos/Traspasos.css';

const FILTROS = [
    { key: '', label: 'Por revisar' },
    { key: '0', label: 'Pendientes' },
    { key: '1', label: 'Observados' },
    { key: '2', label: 'Aprobados' },
    { key: '3', label: 'Rechazados' },
];

const normalize = (item) => ({
    id: item.participanteId ?? item.ParticipanteId,
    nombre: `${item.participante?.nombre ?? item.Participante?.Nombre ?? ''} ${item.participante?.apellido ?? item.Participante?.Apellido ?? ''}`.trim()
        || item.nombrePersona
        || '—',
    documento: item.participante?.documento ?? item.Participante?.Documento ?? item.documento ?? '',
    club: item.club?.nombre ?? item.Club?.Nombre ?? item.nombreClub ?? '—',
    estadoFichaje: item.estadoFichaje ?? item.EstadoFichaje ?? 0,
    estadoApto: item.estadoApto ?? item.EstadoApto ?? 'Faltante',
    estaHabilitado: !!(item.estaHabilitado ?? item.EstaHabilitado),
    docsFaltantes: item.docsFaltantes ?? item.DocsFaltantes ?? [],
    motivoRevision: item.motivoRevision ?? item.MotivoRevision ?? '',
    fechaEnvio: item.fechaEnvioFichaje ?? item.FechaEnvioFichaje ?? item.fechaCreacion,
});

const formatFecha = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-AR');
};

const SolicitudesAltas = () => {
    const [filtro, setFiltro] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [alert, setAlert] = useState(null);
    const [motivoModal, setMotivoModal] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 4000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await FichajeService.getFichajes(filtro === '' ? undefined : Number(filtro));
            setItems((Array.isArray(data) ? data : []).map(normalize));
        } catch (err) {
            showAlert('error', err.message || 'Error al cargar solicitudes.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [filtro]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = items.filter((row) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return row.nombre.toLowerCase().includes(q)
            || row.documento.toLowerCase().includes(q)
            || row.club.toLowerCase().includes(q);
    });

    const handleAprobar = async (id) => {
        setActionLoading(true);
        try {
            await FichajeService.aprobar(id);
            showAlert('success', 'Alta aprobada.');
            await load();
        } catch (err) {
            const msg = err?.response?.data?.error || err.message || 'No se pudo aprobar.';
            const faltantes = err?.response?.data?.docsFaltantes;
            showAlert('error', faltantes?.length ? `${msg} Falta: ${faltantes.join(', ')}` : msg);
        } finally {
            setActionLoading(false);
        }
    };

    const openMotivo = (id, accion) => {
        setMotivo('');
        setMotivoModal({ id, accion });
    };

    const submitMotivo = async () => {
        if (!motivoModal || !motivo.trim()) {
            showAlert('error', 'Indicá un motivo.');
            return;
        }
        setActionLoading(true);
        try {
            if (motivoModal.accion === 'observar') {
                await FichajeService.observar(motivoModal.id, motivo.trim());
                showAlert('success', 'Solicitud observada.');
            } else {
                await FichajeService.rechazar(motivoModal.id, motivo.trim());
                showAlert('success', 'Solicitud rechazada.');
            }
            setMotivoModal(null);
            await load();
        } catch (err) {
            showAlert('error', err.message || 'No se pudo completar la acción.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="page-container traspasos-page">
            <PageHeader
                title="Solicitudes de alta"
                icon={ClipboardList}
                backTo="/dashboard"
                actions={
                    <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw size={16} /> Actualizar
                    </Button>
                }
            />

            <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Altas enviadas por los clubes. Acá la federación aprueba, observa o rechaza.
            </p>

            {alert && (
                <div className={`traspasos-alert traspasos-alert--${alert.type}`}>
                    {alert.message}
                </div>
            )}

            <div className="traspasos-subnav" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
                {FILTROS.map((f) => (
                    <button
                        key={f.key || 'all'}
                        type="button"
                        className={filtro === f.key ? 'active' : ''}
                        onClick={() => setFiltro(f.key)}
                        style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 999,
                            border: '1px solid var(--border-color)',
                            background: filtro === f.key ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: filtro === f.key ? '#fff' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <Card>
                <FormField
                    icon={Search}
                    placeholder="Buscar por atleta, documento o club..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="table-responsive" style={{ marginTop: '1rem' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Atleta</th>
                                <th>Club</th>
                                <th>Estado</th>
                                <th>Apto</th>
                                <th>Enviado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center">Cargando...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">No hay solicitudes en este filtro.</td></tr>
                            ) : filtered.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <strong>{row.nombre}</strong>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.documento}</div>
                                        {row.motivoRevision && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 4 }}>
                                                Motivo: {row.motivoRevision}
                                            </div>
                                        )}
                                        {row.docsFaltantes?.length > 0 && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                                                Docs: {row.docsFaltantes.join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td>{row.club}</td>
                                    <td>
                                        <span className={`badge badge-sm badge-${getEstadoFichajeColor(row.estadoFichaje)}`}>
                                            {getEstadoFichajeLabel(row.estadoFichaje)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-sm badge-${getEstadoAptoColor(row.estadoApto)}`}>
                                            {getEstadoAptoLabel(row.estadoApto)}
                                        </span>
                                    </td>
                                    <td>{formatFecha(row.fechaEnvio)}</td>
                                    <td>
                                        {(row.estadoFichaje === 0 || row.estadoFichaje === 1) && (
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <Button size="sm" onClick={() => handleAprobar(row.id)} disabled={actionLoading}>
                                                    <CheckCircle2 size={14} /> Aprobar
                                                </Button>
                                                <Button size="sm" variant="secondary" onClick={() => openMotivo(row.id, 'observar')} disabled={actionLoading}>
                                                    <AlertCircle size={14} /> Observar
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => openMotivo(row.id, 'rechazar')} disabled={actionLoading}>
                                                    <XCircle size={14} /> Rechazar
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {motivoModal && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
                    <Card style={{ width: 'min(480px, 92vw)', padding: '1.25rem' }}>
                        <h3 style={{ marginTop: 0 }}>
                            {motivoModal.accion === 'observar' ? 'Observar solicitud' : 'Rechazar solicitud'}
                        </h3>
                        <textarea
                            className="form-input"
                            rows={4}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Motivo visible para el club..."
                            style={{ width: '100%', marginBottom: '1rem' }}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <Button variant="ghost" onClick={() => setMotivoModal(null)} disabled={actionLoading}>Cancelar</Button>
                            <Button onClick={submitMotivo} disabled={actionLoading}>Confirmar</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SolicitudesAltas;
