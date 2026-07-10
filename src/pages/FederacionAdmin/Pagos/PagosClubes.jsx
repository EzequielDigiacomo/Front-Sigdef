import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Search,
    CheckCircle2,
    AlertCircle,
    Plus,
    RefreshCw,
    ArrowLeft,
    Building2,
} from 'lucide-react';
import { api } from '../../../services/api';
import PagoService from '../../../services/pagoService';
import { withFederationScope, getClubFederationId, pick } from '../../../utils/apiHelpers';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import RegistrarPagoModal from './RegistrarPagoModal';
import './PagosClubes.css';

const normalizeClub = (c) => ({
    idClub: pick(c, 'idClub', 'id', 'Id'),
    nombre: pick(c, 'nombre', 'Nombre') || 'Sin nombre',
    siglas: pick(c, 'sigla', 'Sigla', 'siglas', 'Siglas') || '',
    idFederacion: getClubFederationId(c),
    federacionNombre: pick(c, 'federacionNombre', 'FederacionNombre') || '',
    pagoAfiliacionAlDia: pick(c, 'pagoAfiliacionAlDia', 'PagoAfiliacionAlDia') !== false,
    solicitudPagoPendiente: !!pick(c, 'solicitudPagoPendiente', 'SolicitudPagoPendiente'),
});

const PagosClubes = () => {
    const { fedId } = useParams();
    const isSuperAdminView = Boolean(fedId);
    const navigate = useNavigate();

    const [clubes, setClubes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [alert, setAlert] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalClub, setModalClub] = useState(null);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3500);
    };

    const loadClubes = useCallback(async () => {
        const data = await api.get(withFederationScope('/Clubes', fedId));
        let list = Array.isArray(data) ? data.map(normalizeClub) : [];

        if (fedId) {
            list = list.filter((c) => String(c.idFederacion ?? '') === String(fedId));
        }

        setClubes(list);
    }, [fedId]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                await loadClubes();
            } catch (err) {
                console.error('Error cargando clubes para pagos:', err);
                if (!cancelled) showAlert('error', 'Error al cargar el estado de pagos de clubes.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [loadClubes]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await loadClubes();
            showAlert('success', 'Datos actualizados.');
        } catch {
            showAlert('error', 'Error al refrescar.');
        } finally {
            setRefreshing(false);
        }
    };

    const handleToggleClub = async (club) => {
        const nextStatus = !club.pagoAfiliacionAlDia;
        setTogglingId(club.idClub);
        // Optimistic UI
        setClubes((prev) =>
            prev.map((c) =>
                c.idClub === club.idClub ? { ...c, pagoAfiliacionAlDia: nextStatus } : c
            )
        );
        try {
            await PagoService.toggleClubStatus(club.idClub, nextStatus);
            showAlert('success', `Estado de ${club.nombre} actualizado.`);
        } catch (err) {
            // Revert
            setClubes((prev) =>
                prev.map((c) =>
                    c.idClub === club.idClub ? { ...c, pagoAfiliacionAlDia: club.pagoAfiliacionAlDia } : c
                )
            );
            showAlert('error', err.message || 'Error al cambiar el estado del club.');
        } finally {
            setTogglingId(null);
        }
    };

    const handleOpenRegistrar = (club) => {
        setModalClub(club);
        setModalOpen(true);
    };

    const handleRegistrarPago = async ({ monto, referencia, notas }) => {
        await PagoService.registrarPago({
            tipoPago: 'ClubAfiliacion',
            clubId: modalClub.idClub,
            participanteId: null,
            inscripcionId: null,
            monto,
            referencia,
            notas,
        });
        showAlert('success', `Recibo registrado para ${modalClub.nombre}.`);
        await loadClubes();
    };

    const filteredClubes = clubes.filter((club) => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return true;
        return (
            club.nombre.toLowerCase().includes(q) ||
            (club.siglas || '').toLowerCase().includes(q)
        );
    });

    const alDiaCount = clubes.filter((c) => c.pagoAfiliacionAlDia).length;
    const deudorCount = clubes.length - alDiaCount;

    return (
        <div className="page-container pagos-page">
            {isSuperAdminView && (
                <div
                    style={{
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: '10px',
                        padding: '0.7rem 1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => navigate(`/superadmin/federacion/${fedId}`)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#60a5fa',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            padding: 0,
                        }}
                    >
                        <ArrowLeft size={15} /> Volver al dashboard de la federación
                    </button>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Modo Supervisión SuperAdmin
                    </span>
                </div>
            )}

            <div className="pagos-header">
                <div>
                    <h2>
                        <Building2 size={22} style={{ marginRight: 8, verticalAlign: -4 }} />
                        Clubes Afiliados
                    </h2>
                    <p>Estado de pago de la suscripción anual a la federación (sincronizado con SportTrack).</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="pagos-stats">
                        <span className="pagos-stat pagos-stat-ok">
                            <CheckCircle2 size={14} /> {alDiaCount} al día
                        </span>
                        <span className="pagos-stat pagos-stat-debt">
                            <AlertCircle size={14} /> {deudorCount} deudor{deudorCount === 1 ? '' : 'es'}
                        </span>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={RefreshCw}
                        onClick={handleRefresh}
                        isLoading={refreshing}
                        disabled={loading}
                    >
                        Actualizar
                    </Button>
                </div>
            </div>

            {alert && (
                <div className={`pagos-alert pagos-alert-${alert.type}`}>
                    {alert.message}
                </div>
            )}

            <Card>
                <div className="pagos-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar club por nombre o sigla..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="pagos-loading">Cargando clubes...</div>
                ) : (
                    <div className="pagos-table-wrap">
                        <table className="pagos-table">
                            <thead>
                                <tr>
                                    <th>Club</th>
                                    <th>Federación</th>
                                    <th>Estado Afiliación</th>
                                    <th>Interruptor Rápido</th>
                                    <th style={{ textAlign: 'center' }}>Registrar Cobro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClubes.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>
                                            <div className="pagos-empty">No se encontraron clubes.</div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClubes.map((club) => (
                                        <tr key={club.idClub}>
                                            <td>
                                                <div className="pagos-club-name">
                                                    <strong>{club.nombre}</strong>
                                                    <span>{club.siglas || 'SIN SIGLA'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {club.federacionNombre || (
                                                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                                                        Sin federación
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span
                                                    className={`pagos-badge ${
                                                        club.pagoAfiliacionAlDia
                                                            ? 'pagos-badge-ok'
                                                            : 'pagos-badge-debt'
                                                    }`}
                                                >
                                                    {club.pagoAfiliacionAlDia ? (
                                                        <CheckCircle2 size={12} />
                                                    ) : (
                                                        <AlertCircle size={12} />
                                                    )}
                                                    {club.pagoAfiliacionAlDia
                                                        ? 'Al Día (Anual)'
                                                        : 'Deudor'}
                                                </span>
                                            </td>
                                            <td>
                                                <label className="pagos-toggle" title="Cambiar estado de afiliación">
                                                    <input
                                                        type="checkbox"
                                                        checked={club.pagoAfiliacionAlDia}
                                                        disabled={togglingId === club.idClub}
                                                        onChange={() => handleToggleClub(club)}
                                                    />
                                                    <span className="pagos-toggle-slider" />
                                                </label>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    className="pagos-btn-recibo"
                                                    onClick={() => handleOpenRegistrar(club)}
                                                >
                                                    <Plus size={14} /> Registrar Recibo
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <RegistrarPagoModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setModalClub(null);
                }}
                onSubmit={handleRegistrarPago}
                paymentType="ClubAfiliacion"
                entityName={modalClub?.nombre || ''}
            />
        </div>
    );
};

export default PagosClubes;
