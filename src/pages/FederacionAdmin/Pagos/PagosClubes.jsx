import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Search,
    CheckCircle2,
    AlertCircle,
    Plus,
    RefreshCw,
    Building2,
    Users,
    Receipt,
    Trash2,
} from 'lucide-react';
import { api } from '../../../services/api';
import PagoService from '../../../services/pagoService';
import { withFederationScope, getClubFederationId, pick } from '../../../utils/apiHelpers';
import { getEstadoPagoLabel, getEstadoPagoColor } from '../../../utils/enums';
import { matchesSearch } from '../../../utils/searchUtils';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import PageHeader from '../../../components/common/PageHeader';
import RegistrarPagoModal from './RegistrarPagoModal';
import './PagosClubes.css';

const ESTADO_PAGO_PAGADO = 1;

const normalizeClub = (c) => ({
    idClub: pick(c, 'idClub', 'id', 'Id'),
    nombre: pick(c, 'nombre', 'Nombre') || 'Sin nombre',
    siglas: pick(c, 'sigla', 'Sigla', 'siglas', 'Siglas') || '',
    idFederacion: getClubFederationId(c),
    federacionNombre: pick(c, 'federacionNombre', 'FederacionNombre') || '',
    pagoAfiliacionAlDia: pick(c, 'pagoAfiliacionAlDia', 'PagoAfiliacionAlDia') !== false,
    solicitudPagoPendiente: !!pick(c, 'solicitudPagoPendiente', 'SolicitudPagoPendiente'),
});

const resolveNombrePersona = (a) => {
    const flat = pick(a, 'nombrePersona', 'NombrePersona');
    if (flat && String(flat).trim()) return String(flat).trim();

    const persona =
        a?.participante ?? a?.Participante ?? a?.persona ?? a?.Persona ?? null;
    const nombre = pick(persona, 'nombre', 'Nombre') || '';
    const apellido = pick(persona, 'apellido', 'Apellido') || '';
    const full = `${nombre} ${apellido}`.trim();
    return full || 'Sin nombre';
};

const resolveDocumento = (a) => {
    const flat = pick(a, 'documento', 'Documento', 'dni', 'Dni');
    if (flat && String(flat).trim() && String(flat).trim() !== '-') {
        return String(flat).trim();
    }
    const persona =
        a?.participante ?? a?.Participante ?? a?.persona ?? a?.Persona ?? null;
    return pick(persona, 'documento', 'Documento', 'dni', 'Dni') || '-';
};

const resolveNombreClub = (a) => {
    const flat = pick(a, 'nombreClub', 'NombreClub');
    if (flat && String(flat).trim()) return String(flat).trim();

    const club = a?.club ?? a?.Club ?? null;
    const clubNombre = pick(club, 'nombre', 'Nombre');
    if (clubNombre && String(clubNombre).trim()) return String(clubNombre).trim();

    return 'Agente Libre';
};

const normalizeAtleta = (a) => {
    const estadoPago = Number(pick(a, 'estadoPago', 'EstadoPago') ?? 0);
    return {
        participanteId: pick(a, 'participanteId', 'ParticipanteId', 'idPersona', 'IdPersona'),
        nombrePersona: resolveNombrePersona(a),
        documento: resolveDocumento(a),
        nombreClub: resolveNombreClub(a),
        categoriaNombre: pick(a, 'categoriaNombre', 'CategoriaNombre') || '',
        estadoPago,
        alDia: estadoPago === ESTADO_PAGO_PAGADO,
    };
};

const extractAtletasPayload = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.Data)) return response.Data;
    if (Array.isArray(response?.items)) return response.items;
    return [];
};

const normalizeRecibo = (p) => ({
    id: pick(p, 'id', 'Id'),
    tipoPago: pick(p, 'tipoPago', 'TipoPago') || '',
    clubId: pick(p, 'clubId', 'ClubId'),
    clubNombre: pick(p, 'clubNombre', 'ClubNombre') || '',
    participanteId: pick(p, 'participanteId', 'ParticipanteId'),
    participanteNombre: pick(p, 'participanteNombre', 'ParticipanteNombre') || 'Sin nombre',
    eventoNombre: pick(p, 'eventoNombre', 'EventoNombre') || '',
    monto: Number(pick(p, 'monto', 'Monto') ?? 0),
    fechaPago: pick(p, 'fechaPago', 'FechaPago'),
    referencia: pick(p, 'referencia', 'Referencia') || '-',
    registradoPor: pick(p, 'registradoPor', 'RegistradoPor') || '-',
    notas: pick(p, 'notas', 'Notas') || '',
});

const formatMonto = (value) =>
    new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const formatFecha = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const tipoPagoLabel = (tipo) => {
    switch (tipo) {
        case 'AtletaAfiliacion':
            return 'Cuota atleta';
        case 'ClubAfiliacion':
            return 'Afiliación club';
        case 'InscripcionEvento':
            return 'Inscripción evento';
        default:
            return tipo || 'Pago';
    }
};

/** Concepto de deuda visible en la columna "Debe". */
const getDebeLabel = (estadoPago) => {
    switch (Number(estadoPago)) {
        case 1:
            return { text: 'Al día', tone: 'ok' };
        case 2:
            return { text: 'Cuota de afiliación (vencida)', tone: 'debt' };
        case 3:
            return { text: 'Saldo parcial de afiliación', tone: 'partial' };
        default:
            return { text: 'Cuota de afiliación', tone: 'debt' };
    }
};

const PagosClubes = () => {
    const { fedId } = useParams();
    const isSuperAdminView = Boolean(fedId);
    const backTo = isSuperAdminView ? `/superadmin/federacion/${fedId}` : '/dashboard';
    const [activeTab, setActiveTab] = useState('clubes');
    const [clubes, setClubes] = useState([]);
    const [atletas, setAtletas] = useState([]);
    const [recibos, setRecibos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [atletaFilter, setAtletaFilter] = useState('deudores');
    const [reciboTipoFilter, setReciboTipoFilter] = useState('todos');
    const [reciboAtletaId, setReciboAtletaId] = useState(null);
    const [selectedReciboIds, setSelectedReciboIds] = useState([]);
    const [deletingRecibos, setDeletingRecibos] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({
        isOpen: false,
        ids: [],
        message: '',
    });
    const [alert, setAlert] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalClub, setModalClub] = useState(null);
    const [modalAtleta, setModalAtleta] = useState(null);

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

    const loadAtletas = useCallback(async () => {
        let raw = [];

        // Preferir paged: trae nombrePersona/nombreClub planos.
        try {
            const paged = await api.get(
                withFederationScope('/Atleta/paged?pageNumber=1&pageSize=5000', fedId)
            );
            raw = extractAtletasPayload(paged);
        } catch (pagedErr) {
            console.warn('Pagos: /Atleta/paged no disponible, usando /Atleta:', pagedErr?.message);
        }

        if (raw.length === 0) {
            const data = await api.get(withFederationScope('/Atleta', fedId));
            raw = extractAtletasPayload(data);
        }

        const list = raw.map(normalizeAtleta);
        setAtletas(list.filter((a) => a.participanteId != null));
    }, [fedId]);

    const loadHistorial = useCallback(async () => {
        const data = await PagoService.getHistorial(fedId);
        const list = Array.isArray(data) ? data.map(normalizeRecibo) : [];
        setRecibos(list);
    }, [fedId]);

    const loadAll = useCallback(async () => {
        await Promise.all([loadClubes(), loadAtletas(), loadHistorial()]);
    }, [loadClubes, loadAtletas, loadHistorial]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                await loadAll();
            } catch (err) {
                console.error('Error cargando pagos:', err);
                if (!cancelled) showAlert('error', 'Error al cargar el estado de pagos.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loadAll]);

    useEffect(() => {
        if (activeTab !== 'recibos') {
            setReciboAtletaId(null);
            setSelectedReciboIds([]);
        }
    }, [activeTab]);

    useEffect(() => {
        setSelectedReciboIds([]);
    }, [reciboTipoFilter, reciboAtletaId, searchTerm]);

    const openRecibosAtleta = (atleta) => {
        setReciboAtletaId(atleta.participanteId);
        setSearchTerm('');
        setSelectedReciboIds([]);
        setActiveTab('recibos');
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await loadAll();
            showAlert('success', 'Datos actualizados.');
        } catch {
            showAlert('error', 'Error al refrescar.');
        } finally {
            setRefreshing(false);
        }
    };

    const handleToggleClub = async (club) => {
        const nextStatus = !club.pagoAfiliacionAlDia;
        setTogglingId(`club-${club.idClub}`);
        setClubes((prev) =>
            prev.map((c) =>
                c.idClub === club.idClub ? { ...c, pagoAfiliacionAlDia: nextStatus } : c
            )
        );
        try {
            await PagoService.toggleClubStatus(club.idClub, nextStatus);
            showAlert('success', `Estado de ${club.nombre} actualizado.`);
        } catch (err) {
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

    const handleToggleAtleta = async (atleta) => {
        const nextAlDia = !atleta.alDia;
        const nextEstado = nextAlDia ? ESTADO_PAGO_PAGADO : 0;
        setTogglingId(`atleta-${atleta.participanteId}`);
        setAtletas((prev) =>
            prev.map((a) =>
                a.participanteId === atleta.participanteId
                    ? { ...a, alDia: nextAlDia, estadoPago: nextEstado }
                    : a
            )
        );
        try {
            await PagoService.toggleAtletaStatus(atleta.participanteId, nextAlDia);
            showAlert(
                'success',
                nextAlDia
                    ? `${atleta.nombrePersona} marcado al día.`
                    : `${atleta.nombrePersona} marcado como deudor (cuota de afiliación).`
            );
        } catch (err) {
            setAtletas((prev) =>
                prev.map((a) =>
                    a.participanteId === atleta.participanteId
                        ? { ...a, alDia: atleta.alDia, estadoPago: atleta.estadoPago }
                        : a
                )
            );
            showAlert('error', err.message || 'Error al cambiar el estado del atleta.');
        } finally {
            setTogglingId(null);
        }
    };

    const handleOpenRegistrarClub = (club) => {
        setModalAtleta(null);
        setModalClub(club);
        setModalOpen(true);
    };

    const handleOpenRegistrarAtleta = (atleta) => {
        setModalClub(null);
        setModalAtleta(atleta);
        setModalOpen(true);
    };

    const handleRegistrarPago = async ({ monto, referencia, notas }) => {
        if (modalAtleta) {
            await PagoService.registrarPago({
                tipoPago: 'AtletaAfiliacion',
                clubId: null,
                participanteId: modalAtleta.participanteId,
                inscripcionId: null,
                monto,
                referencia,
                notas,
            });
            showAlert('success', `Recibo registrado para ${modalAtleta.nombrePersona}.`);
            await Promise.all([loadAtletas(), loadHistorial()]);
            return;
        }

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
        await Promise.all([loadClubes(), loadHistorial()]);
    };

    const filteredClubes = clubes.filter((club) =>
        matchesSearch(searchTerm, club.nombre, club.siglas)
    );

    const filteredAtletas = atletas.filter((atleta) => {
        const matchesText = matchesSearch(
            searchTerm,
            atleta.nombrePersona,
            atleta.documento,
            atleta.nombreClub
        );
        if (!matchesText) return false;
        if (atletaFilter === 'deudores') return !atleta.alDia;
        if (atletaFilter === 'alDia') return atleta.alDia;
        return true;
    });

    const recibosAtletas = recibos.filter((r) => r.tipoPago === 'AtletaAfiliacion');

    const filteredRecibos = recibos.filter((recibo) => {
        if (reciboAtletaId != null && Number(recibo.participanteId) !== Number(reciboAtletaId)) {
            return false;
        }
        if (reciboTipoFilter === 'atletas' && recibo.tipoPago !== 'AtletaAfiliacion') {
            return false;
        }
        if (reciboTipoFilter === 'clubes' && recibo.tipoPago !== 'ClubAfiliacion') {
            return false;
        }
        const beneficiario =
            recibo.tipoPago === 'ClubAfiliacion'
                ? recibo.clubNombre
                : recibo.participanteNombre;
        return matchesSearch(
            searchTerm,
            beneficiario,
            recibo.clubNombre,
            recibo.participanteNombre,
            recibo.referencia,
            recibo.notas,
            recibo.registradoPor,
            tipoPagoLabel(recibo.tipoPago)
        );
    });

    const totalRecibosFiltrados = filteredRecibos.reduce(
        (sum, recibo) => sum + (Number(recibo.monto) || 0),
        0
    );
    const totalRecibosGeneral = recibos.reduce(
        (sum, recibo) => sum + (Number(recibo.monto) || 0),
        0
    );
    const totalClubes = recibos
        .filter((r) => r.tipoPago === 'ClubAfiliacion')
        .reduce((sum, r) => sum + (Number(r.monto) || 0), 0);
    const totalAtletas = recibos
        .filter((r) => r.tipoPago === 'AtletaAfiliacion')
        .reduce((sum, r) => sum + (Number(r.monto) || 0), 0);

    const allVisibleSelected =
        filteredRecibos.length > 0 &&
        filteredRecibos.every((r) => selectedReciboIds.includes(r.id));

    const toggleSelectRecibo = (id) => {
        setSelectedReciboIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAllRecibos = () => {
        if (allVisibleSelected) {
            setSelectedReciboIds([]);
            return;
        }
        setSelectedReciboIds(filteredRecibos.map((r) => r.id));
    };

    const askDeleteRecibos = (ids) => {
        const uniqueIds = [...new Set((ids || []).filter((id) => id != null))];
        if (uniqueIds.length === 0) return;
        setConfirmDelete({
            isOpen: true,
            ids: uniqueIds,
            message:
                uniqueIds.length === 1
                    ? '¿Eliminar este recibo? Esta acción no se puede deshacer.'
                    : `¿Eliminar ${uniqueIds.length} recibos seleccionados? Esta acción no se puede deshacer.`,
        });
    };

    const handleConfirmDeleteRecibos = async () => {
        const ids = confirmDelete.ids;
        setDeletingRecibos(true);
        try {
            if (ids.length === 1) {
                await PagoService.eliminarPago(ids[0]);
            } else {
                await PagoService.eliminarPagos(ids);
            }
            setSelectedReciboIds((prev) => prev.filter((id) => !ids.includes(id)));
            setConfirmDelete({ isOpen: false, ids: [], message: '' });
            await loadHistorial();
            showAlert(
                'success',
                ids.length === 1 ? 'Recibo eliminado.' : `${ids.length} recibos eliminados.`
            );
        } catch (err) {
            showAlert('error', err.message || 'No se pudieron eliminar los recibos.');
        } finally {
            setDeletingRecibos(false);
        }
    };

    const alDiaCount = clubes.filter((c) => c.pagoAfiliacionAlDia).length;
    const deudorCount = clubes.length - alDiaCount;
    const atletasAlDiaCount = atletas.filter((a) => a.alDia).length;
    const atletasDeudorCount = atletas.length - atletasAlDiaCount;

    const isClubesTab = activeTab === 'clubes';
    const isAtletasTab = activeTab === 'atletas';
    const isRecibosTab = activeTab === 'recibos';

    const reciboAtletaNombre =
        reciboAtletaId == null
            ? null
            : atletas.find((a) => Number(a.participanteId) === Number(reciboAtletaId))?.nombrePersona ||
              recibosAtletas.find((r) => Number(r.participanteId) === Number(reciboAtletaId))
                  ?.participanteNombre ||
              'Atleta';

    const getReciboBeneficiario = (recibo) => {
        if (recibo.tipoPago === 'ClubAfiliacion') {
            return recibo.clubNombre || 'Club';
        }
        if (recibo.tipoPago === 'InscripcionEvento') {
            return recibo.participanteNombre || recibo.eventoNombre || 'Inscripción';
        }
        return recibo.participanteNombre || 'Atleta';
    };

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
                        marginBottom: '0.75rem',
                    }}
                >
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Modo Supervisión SuperAdmin
                    </span>
                </div>
            )}

            <PageHeader
                title={
                    isClubesTab
                        ? 'Clubes Afiliados'
                        : isAtletasTab
                          ? 'Atletas Federados'
                          : 'Recibos'
                }
                subtitle={
                    isClubesTab
                        ? 'Estado de pago de la suscripción anual a la federación (sincronizado con SportTrack).'
                        : isAtletasTab
                          ? 'Marcá quién debe la cuota de afiliación y registrá el cobro de cada atleta.'
                          : reciboAtletaNombre
                            ? `Historial de recibos de ${reciboAtletaNombre}.`
                            : 'Historial de todos los recibos registrados (clubes y atletas).'
                }
                icon={isClubesTab ? Building2 : isAtletasTab ? Users : Receipt}
                backTo={backTo}
                backLabel={isSuperAdminView ? 'Dashboard federación' : 'Dashboard'}
                actions={(
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="pagos-stats">
                        {isClubesTab && (
                            <>
                                <span className="pagos-stat pagos-stat-ok">
                                    <CheckCircle2 size={14} /> {alDiaCount} al día
                                </span>
                                <span className="pagos-stat pagos-stat-debt">
                                    <AlertCircle size={14} /> {deudorCount} deudor{deudorCount === 1 ? '' : 'es'}
                                </span>
                            </>
                        )}
                        {isAtletasTab && (
                            <>
                                <span className="pagos-stat pagos-stat-ok">
                                    <CheckCircle2 size={14} /> {atletasAlDiaCount} al día
                                </span>
                                <span className="pagos-stat pagos-stat-debt">
                                    <AlertCircle size={14} /> {atletasDeudorCount} con deuda
                                </span>
                            </>
                        )}
                        {isRecibosTab && (
                            <span className="pagos-stat pagos-stat-ok">
                                <Receipt size={14} /> {filteredRecibos.length} recibo
                                {filteredRecibos.length === 1 ? '' : 's'}
                            </span>
                        )}
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
                )}
            />

            {isRecibosTab && !loading && (
                <div className="pagos-totales">
                    <div className="pagos-total-card pagos-total-card-main">
                        <span className="pagos-total-label">Total registrado</span>
                        <strong className="pagos-total-value">{formatMonto(totalRecibosGeneral)}</strong>
                        <span className="pagos-total-hint">
                            {recibos.length} recibo{recibos.length === 1 ? '' : 's'} en el sistema
                        </span>
                    </div>
                    <div className="pagos-total-card">
                        <span className="pagos-total-label">Vista actual</span>
                        <strong className="pagos-total-value">{formatMonto(totalRecibosFiltrados)}</strong>
                        <span className="pagos-total-hint">
                            Suma de los {filteredRecibos.length} recibo
                            {filteredRecibos.length === 1 ? '' : 's'} filtrados
                        </span>
                    </div>
                    <div className="pagos-total-card">
                        <span className="pagos-total-label">Clubes</span>
                        <strong className="pagos-total-value">{formatMonto(totalClubes)}</strong>
                    </div>
                    <div className="pagos-total-card">
                        <span className="pagos-total-label">Atletas</span>
                        <strong className="pagos-total-value">{formatMonto(totalAtletas)}</strong>
                    </div>
                </div>
            )}

            <div className="pagos-tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={isClubesTab}
                    className={`pagos-tab ${isClubesTab ? 'pagos-tab-active' : ''}`}
                    onClick={() => setActiveTab('clubes')}
                >
                    <Building2 size={16} /> Clubes
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={isAtletasTab}
                    className={`pagos-tab ${isAtletasTab ? 'pagos-tab-active' : ''}`}
                    onClick={() => setActiveTab('atletas')}
                >
                    <Users size={16} /> Atletas
                    {atletasDeudorCount > 0 && (
                        <span className="pagos-tab-badge">{atletasDeudorCount}</span>
                    )}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={isRecibosTab}
                    className={`pagos-tab ${isRecibosTab ? 'pagos-tab-active' : ''}`}
                    onClick={() => setActiveTab('recibos')}
                >
                    <Receipt size={16} /> Recibos
                    {recibos.length > 0 && (
                        <span className="pagos-tab-badge pagos-tab-badge-muted">
                            {recibos.length}
                        </span>
                    )}
                </button>
            </div>

            {alert && (
                <div className={`pagos-alert pagos-alert-${alert.type}`}>
                    {alert.message}
                </div>
            )}

            <Card>
                <div className="pagos-toolbar">
                    <div className="pagos-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder={
                                isClubesTab
                                    ? 'Buscar club por nombre o sigla...'
                                    : isAtletasTab
                                      ? 'Buscar atleta por nombre, DNI o club...'
                                      : 'Buscar recibo por club, atleta, referencia o notas...'
                            }
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isAtletasTab && (
                        <div className="pagos-filter-group">
                            <button
                                type="button"
                                className={`pagos-filter-btn ${atletaFilter === 'deudores' ? 'active' : ''}`}
                                onClick={() => setAtletaFilter('deudores')}
                            >
                                Con deuda
                            </button>
                            <button
                                type="button"
                                className={`pagos-filter-btn ${atletaFilter === 'alDia' ? 'active' : ''}`}
                                onClick={() => setAtletaFilter('alDia')}
                            >
                                Al día
                            </button>
                            <button
                                type="button"
                                className={`pagos-filter-btn ${atletaFilter === 'todos' ? 'active' : ''}`}
                                onClick={() => setAtletaFilter('todos')}
                            >
                                Todos
                            </button>
                        </div>
                    )}
                    {isRecibosTab && (
                        <div className="pagos-filter-group">
                            <button
                                type="button"
                                className={`pagos-filter-btn ${reciboTipoFilter === 'todos' ? 'active' : ''}`}
                                onClick={() => setReciboTipoFilter('todos')}
                            >
                                Todos
                            </button>
                            <button
                                type="button"
                                className={`pagos-filter-btn ${reciboTipoFilter === 'clubes' ? 'active' : ''}`}
                                onClick={() => setReciboTipoFilter('clubes')}
                            >
                                Clubes
                            </button>
                            <button
                                type="button"
                                className={`pagos-filter-btn ${reciboTipoFilter === 'atletas' ? 'active' : ''}`}
                                onClick={() => setReciboTipoFilter('atletas')}
                            >
                                Atletas
                            </button>
                        </div>
                    )}
                    {isRecibosTab && reciboAtletaId != null && (
                        <button
                            type="button"
                            className="pagos-filter-btn active"
                            onClick={() => {
                                setReciboAtletaId(null);
                                setSearchTerm('');
                            }}
                        >
                            Quitar filtro de atleta
                        </button>
                    )}
                    {isRecibosTab && selectedReciboIds.length > 0 && (
                        <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => askDeleteRecibos(selectedReciboIds)}
                            disabled={deletingRecibos}
                        >
                            Borrar seleccionados ({selectedReciboIds.length})
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="pagos-loading">
                        {isClubesTab && 'Cargando clubes...'}
                        {isAtletasTab && 'Cargando atletas...'}
                        {isRecibosTab && 'Cargando recibos...'}
                    </div>
                ) : isClubesTab ? (
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
                                                        disabled={togglingId === `club-${club.idClub}`}
                                                        onChange={() => handleToggleClub(club)}
                                                    />
                                                    <span className="pagos-toggle-slider" />
                                                </label>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    className="pagos-btn-recibo"
                                                    onClick={() => handleOpenRegistrarClub(club)}
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
                ) : isAtletasTab ? (
                    <div className="pagos-table-wrap">
                        <table className="pagos-table">
                            <thead>
                                <tr>
                                    <th>Atleta</th>
                                    <th>Club</th>
                                    <th>Debe</th>
                                    <th>Estado</th>
                                    <th>Marcar pago</th>
                                    <th style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAtletas.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="pagos-empty">
                                                {atletaFilter === 'deudores'
                                                    ? 'No hay atletas con deuda de afiliación.'
                                                    : 'No se encontraron atletas.'}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAtletas.map((atleta) => {
                                        const debe = getDebeLabel(atleta.estadoPago);
                                        const cantRecibos = recibosAtletas.filter(
                                            (r) => Number(r.participanteId) === Number(atleta.participanteId)
                                        ).length;
                                        return (
                                            <tr key={atleta.participanteId}>
                                                <td>
                                                    <div className="pagos-club-name">
                                                        <strong>{atleta.nombrePersona}</strong>
                                                        <span>DNI {atleta.documento}</span>
                                                    </div>
                                                </td>
                                                <td>{atleta.nombreClub}</td>
                                                <td>
                                                    <span className={`pagos-debe pagos-debe-${debe.tone}`}>
                                                        {debe.text}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`pagos-badge pagos-badge-${getEstadoPagoColor(atleta.estadoPago)}`}
                                                    >
                                                        {getEstadoPagoLabel(atleta.estadoPago)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <label
                                                        className="pagos-toggle"
                                                        title={
                                                            atleta.alDia
                                                                ? 'Marcar como deudor (cuota pendiente)'
                                                                : 'Marcar al día (sin deuda)'
                                                        }
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={atleta.alDia}
                                                            disabled={togglingId === `atleta-${atleta.participanteId}`}
                                                            onChange={() => handleToggleAtleta(atleta)}
                                                        />
                                                        <span className="pagos-toggle-slider" />
                                                    </label>
                                                </td>
                                                <td>
                                                    <div className="pagos-actions">
                                                        <button
                                                            type="button"
                                                            className="pagos-btn-recibo"
                                                            onClick={() => handleOpenRegistrarAtleta(atleta)}
                                                        >
                                                            <Plus size={14} /> Registrar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="pagos-btn-historial"
                                                            onClick={() => openRecibosAtleta(atleta)}
                                                            title="Ver recibos del atleta"
                                                        >
                                                            <Receipt size={14} />
                                                            {cantRecibos > 0 ? ` ${cantRecibos}` : ''}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="pagos-table-wrap">
                        <table className="pagos-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 42 }}>
                                        <input
                                            type="checkbox"
                                            className="pagos-check"
                                            checked={allVisibleSelected}
                                            onChange={toggleSelectAllRecibos}
                                            title="Seleccionar todos los visibles"
                                            aria-label="Seleccionar todos los recibos visibles"
                                        />
                                    </th>
                                    <th>Fecha</th>
                                    <th>Beneficiario</th>
                                    <th>Concepto</th>
                                    <th>Monto</th>
                                    <th>Referencia</th>
                                    <th>Registrado por</th>
                                    <th>Notas</th>
                                    <th style={{ textAlign: 'center' }}>Borrar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecibos.length === 0 ? (
                                    <tr>
                                        <td colSpan={9}>
                                            <div className="pagos-empty">
                                                {reciboAtletaId != null
                                                    ? 'Este atleta aún no tiene recibos registrados.'
                                                    : 'No hay recibos registrados todavía.'}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecibos.map((recibo) => {
                                        const beneficiario = getReciboBeneficiario(recibo);
                                        const esAtleta = recibo.tipoPago === 'AtletaAfiliacion';
                                        const isSelected = selectedReciboIds.includes(recibo.id);
                                        return (
                                            <tr
                                                key={recibo.id}
                                                className={isSelected ? 'pagos-row-selected' : undefined}
                                            >
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        className="pagos-check"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectRecibo(recibo.id)}
                                                        aria-label={`Seleccionar recibo ${recibo.id}`}
                                                    />
                                                </td>
                                                <td>{formatFecha(recibo.fechaPago)}</td>
                                                <td>
                                                    {esAtleta && recibo.participanteId != null ? (
                                                        <button
                                                            type="button"
                                                            className="pagos-link-atleta"
                                                            onClick={() => {
                                                                setReciboAtletaId(recibo.participanteId);
                                                                setSearchTerm('');
                                                            }}
                                                        >
                                                            {beneficiario}
                                                        </button>
                                                    ) : (
                                                        <strong>{beneficiario}</strong>
                                                    )}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`pagos-badge ${
                                                            recibo.tipoPago === 'ClubAfiliacion'
                                                                ? 'pagos-badge-ok'
                                                                : recibo.tipoPago === 'AtletaAfiliacion'
                                                                  ? 'pagos-badge-secondary'
                                                                  : 'pagos-badge-warning'
                                                        }`}
                                                    >
                                                        {tipoPagoLabel(recibo.tipoPago)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong className="pagos-monto">
                                                        {formatMonto(recibo.monto)}
                                                    </strong>
                                                </td>
                                                <td>{recibo.referencia}</td>
                                                <td>{recibo.registradoPor}</td>
                                                <td>
                                                    <span className="pagos-notas" title={recibo.notas || undefined}>
                                                        {recibo.notas || '—'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        className="pagos-btn-delete"
                                                        title="Borrar recibo"
                                                        onClick={() => askDeleteRecibos([recibo.id])}
                                                        disabled={deletingRecibos}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
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
                    setModalAtleta(null);
                }}
                onSubmit={handleRegistrarPago}
                paymentType={modalAtleta ? 'AtletaAfiliacion' : 'ClubAfiliacion'}
                entityName={modalAtleta?.nombrePersona || modalClub?.nombre || ''}
            />

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                onClose={() => {
                    if (deletingRecibos) return;
                    setConfirmDelete({ isOpen: false, ids: [], message: '' });
                }}
                onConfirm={handleConfirmDeleteRecibos}
                title={confirmDelete.ids.length > 1 ? 'Borrar recibos' : 'Borrar recibo'}
                message={confirmDelete.message}
                confirmText={confirmDelete.ids.length > 1 ? 'Borrar seleccionados' : 'Borrar'}
                type="danger"
                isLoading={deletingRecibos}
            />
        </div>
    );
};

export default PagosClubes;
