import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Pagination from '../../../components/common/Pagination';
import {
    ArrowLeft, Users, Target, Edit, Plus, CheckCircle, AlertTriangle, XCircle, Info, Search, UserPlus,
} from 'lucide-react';
import Modal from '../../../components/common/Modal';
import AtletaDetailModal from '../Atletas/components/AtletaDetailModal';
import { getCategoriaLabel, getEstadoPagoColor, getEstadoPagoLabel } from '../../../utils/enums';
import { pick } from '../../../utils/apiHelpers';
import './ClubDetalles.css';

const ATLETAS_PAGE_SIZE = 12;

const resolvePersonaNombre = (entity) => {
    const direct = pick(entity, 'nombrePersona', 'NombrePersona', 'nombreCompleto', 'NombreCompleto');
    if (direct && String(direct).trim() && direct !== '-') return String(direct).trim();

    const nested = entity?.persona || entity?.Persona || entity?.participante || entity?.Participante || {};
    const nombre = pick(entity, 'nombre', 'Nombre') ?? pick(nested, 'nombre', 'Nombre') ?? '';
    const apellido = pick(entity, 'apellido', 'Apellido') ?? pick(nested, 'apellido', 'Apellido') ?? '';
    const full = `${nombre} ${apellido}`.trim();
    return full || '—';
};

const resolveDocumento = (entity) => {
    const nested = entity?.persona || entity?.Persona || entity?.participante || entity?.Participante || {};
    const doc = pick(entity, 'documento', 'Documento', 'dni', 'Dni')
        ?? pick(nested, 'documento', 'Documento', 'dni', 'Dni');
    return doc != null && String(doc).trim() ? String(doc).trim() : '—';
};

const normalizeClubAtleta = (a) => {
    const idPersona = pick(a, 'idPersona', 'IdPersona', 'participanteId', 'ParticipanteId');
    return {
        ...a,
        idPersona,
        idClub: pick(a, 'idClub', 'IdClub'),
        nombrePersona: resolvePersonaNombre(a),
        documento: resolveDocumento(a),
        categoria: pick(a, 'categoria', 'Categoria'),
        categoriaNombre: pick(a, 'categoriaNombre', 'CategoriaNombre'),
        perteneceSeleccion: pick(a, 'perteneceSeleccion', 'PerteneceSeleccion') === true,
        estadoPago: pick(a, 'estadoPago', 'EstadoPago'),
    };
};

const normalizeClubEntrenador = (e) => ({
    ...e,
    idPersona: pick(e, 'idPersona', 'IdPersona'),
    nombrePersona: resolvePersonaNombre(e),
    licencia: pick(e, 'licencia', 'Licencia') || '—',
    categoriaSeleccion: pick(e, 'categoriaSeleccion', 'CategoriaSeleccion'),
    becadoEnard: pick(e, 'becadoEnard', 'BecadoEnard') === true,
    becadoSdn: pick(e, 'becadoSdn', 'BecadoSdn') === true,
});

const normalizeClubDelegado = (d) => ({
    ...d,
    idPersona: pick(d, 'idPersona', 'IdPersona'),
    nombrePersona: resolvePersonaNombre(d),
    documento: resolveDocumento(d),
    email: pick(d, 'email', 'Email') || '—',
    telefono: pick(d, 'telefono', 'Telefono') || '—',
});

const formatCategoriaAtleta = (atleta) => {
    if (atleta?.categoriaNombre) return atleta.categoriaNombre;
    if (atleta?.categoria != null && atleta.categoria !== '') return getCategoriaLabel(atleta.categoria);
    return 'Sin asignar';
};

const ClubDetalles = () => {
    const { id, fedId } = useParams();
    const isSuperAdminView = Boolean(fedId);
    const navigate = useNavigate();
    const [club, setClub] = useState(null);
    const [atletas, setAtletas] = useState([]);
    const [entrenadores, setEntrenadores] = useState([]);
    const [delegados, setDelegados] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [atletaSearch, setAtletaSearch] = useState('');
    const [atletaPage, setAtletaPage] = useState(1);

    // Modal states
    const [showAddAtletaModal, setShowAddAtletaModal] = useState(false);
    const [showAtletaDetailsModal, setShowAtletaDetailsModal] = useState(false);
    const [selectedAtleta, setSelectedAtleta] = useState(null);
    const [todosAtletas, setTodosAtletas] = useState([]);

    // Delegado Modal State
    const [showAddDelegadoModal, setShowAddDelegadoModal] = useState(false);
    const [availableDelegados, setAvailableDelegados] = useState([]);

    // Confirmation & Feedback States
    const [confirmModalState, setConfirmModalState] = useState({
        isOpen: false,
        step: 'confirm', // confirm, loading, success, error
        athlete: null,
        message: '',
        subMessage: ''
    });

    useEffect(() => {
        loadClubDetalles();
    }, [id]);

    const loadClubDetalles = async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            const clubIdInt = parseInt(id, 10);
            const clubData = await api.get(`/Clubes/${id}`);

            let atletasData = [];
            let entrenadoresData = [];
            let delegadosData = [];
            let eventosData = [];

            try {
                entrenadoresData = await api.get(`/Clubes/${id}/Entrenadores`, { silentErrors: true });
                if (!Array.isArray(entrenadoresData)) throw new Error('Not array');
            } catch {
                const todos = await api.get(`/Entrenador`, { silentErrors: true }).catch(() => []);
                entrenadoresData = (Array.isArray(todos) ? todos : []).filter(
                    (x) => Number(x.idClub ?? x.IdClub) === clubIdInt
                );
            }

            try {
                delegadosData = await api.get(`/Clubes/${id}/Delegados`, { silentErrors: true });
                if (!Array.isArray(delegadosData)) throw new Error('Not array');
            } catch {
                const todos = await api.get(`/DelegadoClub`, { silentErrors: true }).catch(() => []);
                delegadosData = (Array.isArray(todos) ? todos : []).filter(
                    (x) => Number(x.idClub ?? x.IdClub) === clubIdInt
                );
            }

            try {
                eventosData = await api.get(`/Clubes/${id}/Eventos`, { silentErrors: true });
                if (!Array.isArray(eventosData)) throw new Error('Not array');
            } catch {
                const todos = await api.get(`/Evento`, { silentErrors: true }).catch(() => []);
                eventosData = (Array.isArray(todos) ? todos : []).filter(
                    (x) => Number(x.clubId ?? x.ClubId) === clubIdInt
                );
            }

            // Preferir /Atleta (trae nombre/documento); Participantes/club suele venir incompleto.
            try {
                const todos = await api.get(`/Atleta`, { silentErrors: true });
                atletasData = (Array.isArray(todos) ? todos : []).filter(
                    (x) => Number(x.idClub ?? x.IdClub) === clubIdInt
                );
                if (atletasData.length === 0) throw new Error('Fallback Participantes');
            } catch {
                try {
                    const participantes = await api.get(`/Participantes/club/${id}`, { silentErrors: true });
                    atletasData = Array.isArray(participantes) ? participantes : [];
                } catch {
                    atletasData = [];
                }
            }

            const normalizedClub = {
                idClub: clubData.idClub ?? clubData.id ?? clubData.Id,
                nombre: clubData.nombre ?? clubData.Nombre,
                siglas: clubData.sigla ?? clubData.Sigla ?? clubData.siglas ?? clubData.Siglas ?? '',
                email: clubData.email ?? clubData.Email ?? '',
                telefono: clubData.telefono ?? clubData.Telefono ?? '',
                direccion: clubData.direccion ?? clubData.Direccion ?? '',
                estadoMatricula: clubData.estadoMatricula ?? clubData.EstadoMatricula ?? 0,
            };

            const normalizedAtletas = atletasData.map(normalizeClubAtleta);

            setClub(normalizedClub);
            setAtletas(normalizedAtletas);
            setEntrenadores((Array.isArray(entrenadoresData) ? entrenadoresData : []).map(normalizeClubEntrenador));
            setDelegados((Array.isArray(delegadosData) ? delegadosData : []).map(normalizeClubDelegado));
            setEventos(Array.isArray(eventosData) ? eventosData : []);
            setSelectedAtleta((prev) => {
                if (!prev) return null;
                const prevId = prev.idPersona ?? prev.IdPersona ?? prev.participanteId;
                return normalizedAtletas.find((a) => String(a.idPersona) === String(prevId)) || prev;
            });
            if (!silent) setAtletaPage(1);
        } catch (error) {
            console.error('Error cargando detalles del club:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleUpdateClubStatus = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            const payload = {
                nombre: club.nombre,
                direccion: club.direccion,
                telefono: club.telefono,
                sigla: club.siglas, // backend espera 'sigla'
                email: club.email || "",
                estadoMatricula: newStatus
            };

            await api.put(`/Clubes/${club.idClub}`, payload);
            
            // Actualizar estado local
            setClub(prev => ({ ...prev, estadoMatricula: newStatus }));
        } catch (error) {
            console.error('Error actualizando matrícula:', error);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getClubStats = () => {
        if (!club) return { atletasClub: [], entrenadoresClub: [], delegadoClub: null, eventosCreados: [], eventosAsistidos: [] };

        const atletasClub = atletas || [];
        const entrenadoresClub = entrenadores || [];
        const delegadoClub = (delegados && delegados.length > 0) ? delegados[0] : null;
        const eventosCreados = eventos || [];
        const eventosAsistidos = [];

        return { atletasClub, entrenadoresClub, delegadoClub, eventosCreados, eventosAsistidos };
    };

    const clubListPath = isSuperAdminView
        ? `/superadmin/federacion/${fedId}/clubes`
        : '/dashboard/clubes';
    const clubEditPath = isSuperAdminView
        ? `/superadmin/federacion/${fedId}/clubes/editar/${club?.idClub}`
        : `/dashboard/clubes/editar/${club?.idClub}`;
    const clubDetailPath = isSuperAdminView
        ? `/superadmin/federacion/${fedId}/clubes/detalles/${club?.idClub}`
        : `/dashboard/clubes/detalles/${club?.idClub}`;

    if (loading) {
        return (
            <div className="club-detalles">
                <div className="club-empty">Cargando detalles del club...</div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="club-detalles">
                <div className="club-empty">Club no encontrado</div>
            </div>
        );
    }

    const { atletasClub, entrenadoresClub, delegadoClub } = getClubStats();

    const filteredAtletas = atletasClub.filter((a) => {
        const q = atletaSearch.trim().toLowerCase();
        if (!q) return true;
        return (
            String(a.nombrePersona || '').toLowerCase().includes(q)
            || String(a.documento || '').toLowerCase().includes(q)
            || String(formatCategoriaAtleta(a) || '').toLowerCase().includes(q)
        );
    });

    const atletaTotalPages = Math.max(1, Math.ceil(filteredAtletas.length / ATLETAS_PAGE_SIZE));
    const atletaPageSafe = Math.min(atletaPage, atletaTotalPages);
    const atletasPageRows = filteredAtletas.slice(
        (atletaPageSafe - 1) * ATLETAS_PAGE_SIZE,
        atletaPageSafe * ATLETAS_PAGE_SIZE
    );

    return (
        <div className="club-detalles fade-in">
            <div className="club-detalles-hero">
                <div className="club-detalles-hero-left">
                    <Button variant="ghost" size="sm" onClick={() => navigate(clubListPath)} title="Volver">
                        <ArrowLeft size={18} />
                    </Button>
                    <div className="club-detalles-sigla">{club.siglas || '—'}</div>
                    <div className="club-detalles-title-block">
                        <h1>{club.nombre}</h1>
                        <p>{club.email || 'Sin email'} · Detalle del club</p>
                    </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => navigate(clubEditPath)}>
                    <Edit size={14} /> Editar
                </Button>
            </div>

            <Card className="club-panel-tight">
                <div className="club-detalles-meta">
                    <div className="club-meta-item">
                        <label>Siglas</label>
                        <div className="value">{club.siglas || '—'}</div>
                    </div>
                    <div className="club-meta-item">
                        <label>Teléfono</label>
                        <div className="value">{club.telefono || '—'}</div>
                    </div>
                    <div className="club-meta-item">
                        <label>Dirección</label>
                        <div className="value">{club.direccion || '—'}</div>
                    </div>
                    <div className="club-meta-item">
                        <label>Matrícula</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <select
                                value={club.estadoMatricula ?? 0}
                                onChange={(e) => handleUpdateClubStatus(parseInt(e.target.value, 10))}
                                disabled={updatingStatus}
                                className={`badge badge-${getEstadoPagoColor(club.estadoMatricula)} club-matricula-select`}
                            >
                                <option value={0} style={{ backgroundColor: '#4b5563', color: 'white' }}>Pendiente</option>
                                <option value={1} style={{ backgroundColor: '#059669', color: 'white' }}>Pagado</option>
                                <option value={2} style={{ backgroundColor: '#dc2626', color: 'white' }}>Vencido</option>
                                <option value={3} style={{ backgroundColor: '#d97706', color: 'white' }}>Parcial</option>
                            </select>
                            {updatingStatus && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>…</span>}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="club-detalles-kpis">
                <Card className="club-panel-tight club-kpi">
                    <span className="club-kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--success)' }}>
                        <Users size={16} />
                    </span>
                    <div>
                        <strong>{atletasClub.length}</strong>
                        <span>Atletas</span>
                    </div>
                </Card>
                <Card className="club-panel-tight club-kpi">
                    <span className="club-kpi-icon" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--primary)' }}>
                        <Target size={16} />
                    </span>
                    <div>
                        <strong>{entrenadoresClub.length}</strong>
                        <span>Entrenadores</span>
                    </div>
                </Card>
                <Card className="club-panel-tight club-kpi">
                    <span className="club-kpi-icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}>
                        <UserPlus size={16} />
                    </span>
                    <div>
                        <strong>{delegadoClub ? 1 : 0}</strong>
                        <span>Delegado</span>
                    </div>
                </Card>
            </div>

            <Card className="club-panel-tight club-section">
                <div className="club-section-head">
                    <h2>Delegado</h2>
                    <div className="club-section-actions">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                const target = isSuperAdminView
                                    ? `/superadmin/federacion/${fedId}/delegados/nuevo`
                                    : '/dashboard/delegados/nuevo';
                                navigate(target, { state: { clubId: club.idClub, returnPath: clubDetailPath } });
                            }}
                        >
                            <Plus size={14} /> Nuevo
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                                try {
                                    const allDelegados = await api.get('/DelegadoClub');
                                    const libres = (Array.isArray(allDelegados) ? allDelegados : []).filter(
                                        (d) => !d.idClub || d.idClub === 0
                                    );
                                    const libresEnriquecidos = await Promise.all(libres.map(async (d) => {
                                        const base = normalizeClubDelegado(d);
                                        if (base.nombrePersona !== '—' && base.documento !== '—') return base;
                                        try {
                                            const p = await api.get(`/Persona/${d.idPersona}`);
                                            return normalizeClubDelegado({
                                                ...d,
                                                nombrePersona: `${p.nombre || ''} ${p.apellido || ''}`.trim(),
                                                documento: p.documento,
                                            });
                                        } catch {
                                            return base;
                                        }
                                    }));
                                    setAvailableDelegados(libresEnriquecidos);
                                    setShowAddDelegadoModal(true);
                                } catch (error) {
                                    console.error('Error cargando delegados disponibles', error);
                                    setConfirmModalState({
                                        isOpen: true,
                                        step: 'error',
                                        message: 'Error al cargar delegados disponibles',
                                        subMessage: 'Intente nuevamente más tarde.',
                                    });
                                }
                            }}
                        >
                            <Users size={14} /> Existente
                        </Button>
                    </div>
                </div>
                {delegadoClub ? (
                    <div className="club-delegado-row">
                        <div className="club-meta-item">
                            <label>Nombre</label>
                            <div className="value">{delegadoClub.nombrePersona}</div>
                        </div>
                        <div className="club-meta-item">
                            <label>DNI</label>
                            <div className="value">{delegadoClub.documento}</div>
                        </div>
                        <div className="club-meta-item">
                            <label>Email</label>
                            <div className="value">{delegadoClub.email}</div>
                        </div>
                        <div className="club-meta-item">
                            <label>Teléfono</label>
                            <div className="value">{delegadoClub.telefono}</div>
                        </div>
                    </div>
                ) : (
                    <div className="club-empty">No hay delegado asignado</div>
                )}
            </Card>

            <Card className="club-panel-tight club-section">
                <div className="club-section-head">
                    <h2><Target size={16} /> Entrenadores ({entrenadoresClub.length})</h2>
                    <div className="club-section-actions">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                const target = isSuperAdminView
                                    ? `/superadmin/federacion/${fedId}/entrenadores/nuevo`
                                    : '/dashboard/entrenadores/nuevo';
                                navigate(target, { state: { clubId: club.idClub, returnPath: clubDetailPath } });
                            }}
                        >
                            <Plus size={14} /> Agregar
                        </Button>
                    </div>
                </div>
                {entrenadoresClub.length > 0 ? (
                    <div className="club-dense-table-wrap">
                        <table className="club-dense-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Licencia</th>
                                    <th>Categoría</th>
                                    <th>ENARD</th>
                                    <th>SDN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entrenadoresClub.map((entrenador) => (
                                    <tr key={entrenador.idPersona}>
                                        <td className="club-name-cell">{entrenador.nombrePersona}</td>
                                        <td>{entrenador.licencia}</td>
                                        <td>
                                            {entrenador.categoriaSeleccion
                                                ? getCategoriaLabel(entrenador.categoriaSeleccion)
                                                : '—'}
                                        </td>
                                        <td>
                                            <span className={`club-pill ${entrenador.becadoEnard ? 'club-pill-ok' : 'club-pill-muted'}`}>
                                                {entrenador.becadoEnard ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`club-pill ${entrenador.becadoSdn ? 'club-pill-ok' : 'club-pill-muted'}`}>
                                                {entrenador.becadoSdn ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="club-empty">Sin entrenadores en este club</div>
                )}
            </Card>

            <Card className="club-panel-tight club-section">
                <div className="club-section-head">
                    <h2><Users size={16} /> Atletas ({filteredAtletas.length}{atletaSearch ? ` / ${atletasClub.length}` : ''})</h2>
                    <div className="club-section-tools">
                        <div style={{ position: 'relative', flex: 1, maxWidth: 220 }}>
                            <Search
                                size={14}
                                style={{
                                    position: 'absolute',
                                    left: 10,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-secondary)',
                                    pointerEvents: 'none',
                                }}
                            />
                            <input
                                className="form-input club-search"
                                style={{ paddingLeft: '2rem' }}
                                placeholder="Buscar nombre o DNI..."
                                value={atletaSearch}
                                onChange={(e) => {
                                    setAtletaSearch(e.target.value);
                                    setAtletaPage(1);
                                }}
                            />
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                const target = isSuperAdminView
                                    ? `/superadmin/federacion/${fedId}/atletas/nuevo`
                                    : '/dashboard/atletas/nuevo';
                                navigate(target, { state: { clubId: club.idClub, returnPath: clubDetailPath } });
                            }}
                        >
                            <Plus size={14} /> Crear
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                                try {
                                    const [allAtletas, allClubes] = await Promise.all([
                                        api.get('/Atleta'),
                                        api.get('/Club'),
                                    ]);
                                    const clubsMap = (Array.isArray(allClubes) ? allClubes : []).reduce(
                                        (acc, c) => ({ ...acc, [c.idClub ?? c.IdClub]: c.nombre ?? c.Nombre }),
                                        {}
                                    );
                                    const athletesWithClubName = (Array.isArray(allAtletas) ? allAtletas : []).map((a) => {
                                        const normalized = normalizeClubAtleta(a);
                                        return {
                                            ...normalized,
                                            nombreClub: a.idClub || a.IdClub
                                                ? clubsMap[a.idClub ?? a.IdClub]
                                                : null,
                                        };
                                    });
                                    setTodosAtletas(athletesWithClubName);
                                    setShowAddAtletaModal(true);
                                } catch (error) {
                                    console.error('Error loading info for modal', error);
                                }
                            }}
                        >
                            <UserPlus size={14} /> Existente
                        </Button>
                    </div>
                </div>

                {atletasClub.length > 0 ? (
                    <>
                        <div className="club-dense-table-wrap">
                            <table className="club-dense-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Documento</th>
                                        <th>Categoría</th>
                                        <th>Selección</th>
                                        <th>Pago</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atletasPageRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                Sin resultados para “{atletaSearch}”
                                            </td>
                                        </tr>
                                    ) : (
                                        atletasPageRows.map((atleta) => (
                                            <tr
                                                key={atleta.idPersona}
                                                onClick={() => {
                                                    setSelectedAtleta(atleta);
                                                    setShowAtletaDetailsModal(true);
                                                }}
                                            >
                                                <td className="club-name-cell">{atleta.nombrePersona}</td>
                                                <td className="club-doc-cell">{atleta.documento}</td>
                                                <td>{formatCategoriaAtleta(atleta)}</td>
                                                <td>
                                                    <span className={`club-pill ${atleta.perteneceSeleccion ? 'club-pill-ok' : 'club-pill-muted'}`}>
                                                        {atleta.perteneceSeleccion ? 'Sí' : 'No'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${getEstadoPagoColor(atleta.estadoPago)}`} style={{ fontSize: '0.68rem' }}>
                                                        {getEstadoPagoLabel(atleta.estadoPago)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {filteredAtletas.length > ATLETAS_PAGE_SIZE && (
                            <div className="club-pagination">
                                <Pagination
                                    currentPage={atletaPageSafe}
                                    totalPages={atletaTotalPages}
                                    onPageChange={setAtletaPage}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="club-empty">No hay atletas registrados en este club</div>
                )}
            </Card>

            {/* Modal Agregar Atleta Existente (Lista) */}
            {showAddAtletaModal && (
                <Modal
                    isOpen={showAddAtletaModal}
                    onClose={() => setShowAddAtletaModal(false)}
                    title="Agregar Atleta al Club"
                    footer={
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => setShowAddAtletaModal(false)}>
                                Cerrar
                            </Button>
                        </div>
                    }
                >
                    <div style={{ maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Buscar por nombre..."
                                className="form-input"
                                onChange={(e) => {
                                    const term = e.target.value.toLowerCase();
                                    const items = document.querySelectorAll('.athlete-item');
                                    items.forEach(item => {
                                        const name = item.getAttribute('data-name').toLowerCase();
                                        if (name.includes(term)) {
                                            item.style.display = 'flex';
                                        } else {
                                            item.style.display = 'none';
                                        }
                                    });
                                }}
                            />
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {todosAtletas.map(atleta => (
                                <div
                                    className="athlete-item"
                                    key={atleta.idPersona}
                                    data-name={atleta.nombrePersona || 'Desconocido'}
                                    style={{
                                        padding: '0.75rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        backgroundColor: 'var(--bg-secondary)'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '500' }}>
                                            {atleta.nombrePersona || `ID: ${atleta.idPersona}`}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {atleta.nombreClub ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Users size={12} /> {atleta.nombreClub}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--success)' }}>• Sin Club</span>
                                            )}
                                        </div>
                                    </div>
                                    {atleta.idClub !== parseInt(id) ? (
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => {
                                                const hasClub = !!atleta.idClub;

                                                if (hasClub) {
                                                    setConfirmModalState({
                                                        isOpen: true,
                                                        step: 'transfer_blocked',
                                                        athlete: atleta,
                                                        message: `Este atleta pertenece a ${atleta.nombreClub}.`,
                                                        subMessage: 'Los traspasos entre clubes deben gestionarse mediante el módulo formal de Traspasos. El club destino debe iniciar la solicitud desde su panel (/club/traspasos).'
                                                    });
                                                } else {
                                                    setConfirmModalState({
                                                        isOpen: true,
                                                        step: 'confirm',
                                                        athlete: atleta,
                                                        message: `¿Deseas agregar a ${atleta.nombrePersona} a este club?`,
                                                        subMessage: 'Esta acción vinculará al atleta con el club.'
                                                    });
                                                }
                                            }}
                                        >
                                            <Plus size={16} /> Agregar
                                        </Button>
                                    ) : (
                                        <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>En este club</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal de Confirmación y Feedback */}
            {confirmModalState.isOpen && (
                <Modal
                    isOpen={confirmModalState.isOpen}
                    onClose={() => {
                        // Solo permitir cerrar si no está cargando
                        if (confirmModalState.step !== 'loading') {
                            setConfirmModalState(prev => ({ ...prev, isOpen: false }));
                        }
                    }}
                    title={
                        confirmModalState.step === 'transfer_blocked' ? 'Traspaso formal requerido' :
                            confirmModalState.step === 'confirm' ? 'Confirmar Acción' :
                                confirmModalState.step === 'success' ? '¡Operación Exitosa!' :
                                    confirmModalState.step === 'error' ? 'Error' : 'Procesando...'
                    }
                    footer={
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            {confirmModalState.step === 'transfer_blocked' && (
                                <>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
                                    >
                                        Cerrar
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            setConfirmModalState(prev => ({ ...prev, isOpen: false }));
                                            setShowAddAtletaModal(false);
                                            const traspasosPath = isSuperAdminView
                                                ? `/superadmin/federacion/${fedId}/traspasos`
                                                : '/dashboard/traspasos';
                                            navigate(traspasosPath);
                                        }}
                                    >
                                        Ir a Traspasos
                                    </Button>
                                </>
                            )}
                            {confirmModalState.step === 'confirm' && (
                                <>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={async () => {
                                            if (confirmModalState.mode !== 'DELEGADO') {
                                                const { athlete } = confirmModalState;
                                                setConfirmModalState(prev => ({ ...prev, step: 'loading' }));

                                                try {
                                                    const fullAtleta = await api.get(`/Atleta/${athlete.idPersona}`);
                                                    const payload = {
                                                        ParticipanteId: fullAtleta.participanteId ?? fullAtleta.ParticipanteId ?? fullAtleta.idPersona ?? fullAtleta.IdPersona,
                                                        IdClub: parseInt(id),
                                                        Categoria: fullAtleta.categoria || 0,
                                                        BecadoEnard: fullAtleta.becadoEnard,
                                                        BecadoSdn: fullAtleta.becadoSdn,
                                                        MontoBeca: fullAtleta.montoBeca,
                                                        PresentoAptoMedico: fullAtleta.presentoAptoMedico,
                                                        EstadoPago: fullAtleta.estadoPago,
                                                        PerteneceSeleccion: fullAtleta.perteneceSeleccion,
                                                        FechaAptoMedico: fullAtleta.fechaAptoMedico
                                                    };

                                                    await api.put(`/Atleta/${athlete.idPersona}`, payload);

                                                    setConfirmModalState(prev => ({
                                                        ...prev,
                                                        step: 'success',
                                                        message: 'El atleta ha sido agregado al club correctamente.',
                                                        subMessage: 'La lista de atletas se actualizará al cerrar este mensaje.'
                                                    }));

                                                    // Recargar datos de fondo
                                                    loadClubDetalles();
                                                } catch (error) {
                                                    console.error('Error moviendo atleta:', error);
                                                    setConfirmModalState(prev => ({
                                                        ...prev,
                                                        step: 'error',
                                                        message: 'Hubo un error al intentar agregar al atleta.',
                                                        subMessage: 'Por favor intenta nuevamente o contacta a soporte.'
                                                    }));
                                                }
                                            } else {
                                                const { delegado } = confirmModalState;
                                                setConfirmModalState(prev => ({ ...prev, step: 'loading' }));

                                                try {
                                                    // Asignar el club al delegado
                                                    // PUT /DelegadoClub/{id}
                                                    // Necesitamos el objeto completo para el PUT o update parcial si el backend soporta

                                                    // Primero obtenemos el delegado actual (o usamos el que tenemos si es completo)
                                                    // Asumimos que necesitamos NombrePersona etc para el DTO de update? 
                                                    // Usualmente el PUT pide DTO de creación/edición.

                                                    // Opción A: Obtener Persona para rellenar datos obligatorios
                                                    // Opción B: Si el backend tiene un PATCH o endpoint específico "AsignarClub"

                                                    // Vamos a intentar obtener el delegado completo para no perder datos
                                                    // Como no hay endpoint OneDelegado fácil sin saber ID, usamos el IDPersona que tenemos

                                                    const fullDelegadoResponse = await api.get(`/DelegadoClub`);
                                                    const targetDelegado = fullDelegadoResponse.find(d => d.idPersona === delegado.idPersona);

                                                    if (targetDelegado) {
                                                        const payload = {
                                                            idPersona: targetDelegado.idPersona,
                                                            idRol: targetDelegado.idRol,
                                                            idFederacion: targetDelegado.idFederacion,
                                                            idClub: parseInt(id) // ASIGNAMOS EL CLUB
                                                        };

                                                        // Nota: El endpoint PUT espera un ID en la URL.
                                                        // ¿Es el ID de la tabla DelegadoClub o IdPersona?
                                                        // Asumiendo que la PK es IdPersona o hay un ID autoincremental.
                                                        // En el DTO se ve IdPersona. Asumimos llave compuesta o IdPersona como clave.
                                                        // Si el endpoint es PUT /DelegadoClub/{idPersona}

                                                        await api.put(`/DelegadoClub/${delegado.idPersona}`, payload);

                                                        setConfirmModalState(prev => ({
                                                            ...prev,
                                                            step: 'success',
                                                            message: 'Delegado asignado correctamente.',
                                                            subMessage: 'El delegado ahora administra este club.'
                                                        }));
                                                        loadClubDetalles();
                                                    } else {
                                                        throw new Error("No se encontró el delegado original para actualizar.");
                                                    }

                                                } catch (error) {
                                                    console.error('Error asignando delegado:', error);
                                                    setConfirmModalState(prev => ({
                                                        ...prev,
                                                        step: 'error',
                                                        message: 'Error al asignar delegado.',
                                                        subMessage: 'Hubo un problema de conexión o datos.'
                                                    }));
                                                }
                                            }
                                        }}
                                    >
                                        Confirmar
                                    </Button>
                                </>
                            )}

                            {(confirmModalState.step === 'success' || confirmModalState.step === 'error') && (
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setConfirmModalState(prev => ({ ...prev, isOpen: false }));
                                        if (confirmModalState.step === 'success') {
                                            setShowAddAtletaModal(false);
                                        }
                                    }}
                                >
                                    Entendido
                                </Button>
                            )}
                        </div>
                    }
                >
                    <div style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        {confirmModalState.step === 'transfer_blocked' && (
                            <>
                                <AlertTriangle size={48} style={{ color: 'var(--warning)' }} />
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--warning)' }}>{confirmModalState.message}</h4>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                        {confirmModalState.subMessage}
                                    </p>
                                </div>
                            </>
                        )}

                        {confirmModalState.step === 'confirm' && (
                            <>
                                <Info size={48} style={{ color: 'var(--primary)' }} />
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{confirmModalState.message}</h4>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                        {confirmModalState.subMessage}
                                    </p>
                                </div>
                            </>
                        )}

                        {confirmModalState.step === 'loading' && (
                            <div className="flex flex-col items-center">
                                <div className="spinner mb-4" style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '4px solid #f3f3f3',
                                    borderTop: '4px solid var(--primary)',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                <p>Procesando solicitud...</p>
                                <style>{`
                                    @keyframes spin {
                                        0% { transform: rotate(0deg); }
                                        100% { transform: rotate(360deg); }
                                    }
                                `}</style>
                            </div>
                        )}

                        {confirmModalState.step === 'success' && (
                            <>
                                <CheckCircle size={48} className="text-green-500" style={{ color: 'var(--success)' }} />
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Operación Exitosa</h4>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                        {confirmModalState.message}
                                    </p>
                                </div>
                            </>
                        )}

                        {confirmModalState.step === 'error' && (
                            <>
                                <XCircle size={48} className="text-red-500" style={{ color: 'var(--danger)' }} />
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Error</h4>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                        {confirmModalState.message}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            )}

            {/* Modal Agregar Delegado Existente */}
            {showAddDelegadoModal && (
                <Modal
                    isOpen={showAddDelegadoModal}
                    onClose={() => setShowAddDelegadoModal(false)}
                    title="Asignar Delegado Existente"
                    footer={
                        <Button variant="secondary" onClick={() => setShowAddDelegadoModal(false)}>
                            Cerrar
                        </Button>
                    }
                >
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {availableDelegados.length === 0 ? (
                            <div className="text-center p-4 text-gray-500">No hay delegados disponibles.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {availableDelegados.map(del => (
                                    <div key={del.idPersona} style={{
                                        padding: '0.75rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        backgroundColor: 'var(--bg-secondary)'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{del.nombrePersona || `ID: ${del.idPersona}`}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>DNI: {del.documento || '-'}</div>
                                        </div>
                                        <Button size="sm" variant="primary" onClick={() => {
                                            setConfirmModalState({
                                                isOpen: true,
                                                step: 'confirm',
                                                mode: 'DELEGADO',
                                                delegado: del,
                                                message: `¿Asignar a ${del.nombrePersona} como delegado?`,
                                                subMessage: 'Esta acción vinculará al delegado seleccionado.'
                                            });
                                            setShowAddDelegadoModal(false);
                                        }}>
                                            <Plus size={16} /> Asignar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {showAtletaDetailsModal && selectedAtleta && (
                <AtletaDetailModal
                    isOpen={showAtletaDetailsModal}
                    onClose={() => {
                        setShowAtletaDetailsModal(false);
                        setSelectedAtleta(null);
                    }}
                    athlete={selectedAtleta}
                    onRefresh={() => loadClubDetalles({ silent: true })}
                    returnPath={`/dashboard/clubes/detalles/${id}`}
                />
            )}
        </div >
    );
};

export default ClubDetalles;
