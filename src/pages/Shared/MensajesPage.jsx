import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mail, PenSquare, RefreshCcw, Send, ArrowLeft, Megaphone } from 'lucide-react';
import MessageService from '../../services/messageService';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { pick } from '../../utils/apiHelpers';
import { notifyUnreadMessagesChanged } from '../../hooks/useUnreadMessages';
import Button from '../../components/common/Button';
import DestinatariosMultiSelect from './DestinatariosMultiSelect';
import CampanaDetalle from './CampanaDetalle';
import './MensajesPage.css';

const pickNum = (obj, ...keys) => {
    const value = pick(obj, ...keys);
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

const pickUsuarioId = (usuario) => {
    const id = pickNum(usuario, 'idUsuario', 'IdUsuario', 'id', 'Id');
    return id != null && id > 0 ? id : null;
};

const pickFederacionId = (obj) => {
    const id = pickNum(obj, 'federacionId', 'FederacionId', 'idFederacion', 'IdFederacion', 'id', 'Id');
    return id != null && id > 0 ? id : null;
};

const pickStr = (obj, ...keys) => pick(obj, ...keys) ?? '';

const getRol = (usuario) =>
    pickStr(usuario, 'rolFederacion', 'RolFederacion', 'rol', 'Rol').toLowerCase();

const isActivo = (usuario) => {
    const v = usuario?.estaActivo ?? usuario?.EstaActivo ?? usuario?.activo ?? usuario?.Activo;
    return v !== false;
};

const displayUsuario = (usuario) => {
    if (!usuario) return 'Usuario';
    const nombre = pickStr(usuario, 'nombre', 'Nombre');
    const apellido = pickStr(usuario, 'apellido', 'Apellido');
    const full = `${nombre} ${apellido}`.trim();
    return full || pickStr(usuario, 'username', 'Username') || 'Usuario';
};

const formatFecha = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const normalizeHiloListItem = (item) => ({
    idHilo: pickNum(item, 'idHilo', 'IdHilo'),
    asunto: pickStr(item, 'asunto', 'Asunto'),
    ultimoMensajeEn: pick(item, 'ultimoMensajeEn', 'UltimoMensajeEn'),
    contraparte: item.contraparte || item.Contraparte || {},
    ultimoMensajePreview: pickStr(item, 'ultimoMensajePreview', 'UltimoMensajePreview'),
    cantidadNoLeidos: pickNum(item, 'cantidadNoLeidos', 'CantidadNoLeidos') || 0,
});

const normalizeMensaje = (msg) => ({
    idMensaje: pickNum(msg, 'idMensaje', 'IdMensaje'),
    remitenteId: pickNum(msg, 'remitenteId', 'RemitenteId'),
    destinatarioId: pickNum(msg, 'destinatarioId', 'DestinatarioId'),
    remitente: msg.remitente || msg.Remitente || {},
    cuerpo: pickStr(msg, 'cuerpo', 'Cuerpo'),
    enviadoEn: pick(msg, 'enviadoEn', 'EnviadoEn'),
    leidoEn: pick(msg, 'leidoEn', 'LeidoEn'),
    esPropio: Boolean(msg.esPropio ?? msg.EsPropio),
});

const normalizeHiloDetalle = (detalle) => ({
    idHilo: pickNum(detalle, 'idHilo', 'IdHilo'),
    asunto: pickStr(detalle, 'asunto', 'Asunto'),
    creadoEn: pick(detalle, 'creadoEn', 'CreadoEn'),
    ultimoMensajeEn: pick(detalle, 'ultimoMensajeEn', 'UltimoMensajeEn'),
    idCampana: pickNum(detalle, 'idCampana', 'IdCampana'),
    mensajes: (detalle.mensajes || detalle.Mensajes || []).map(normalizeMensaje),
});

const normalizeCampanaList = (item) => ({
    idCampana: pickNum(item, 'idCampana', 'IdCampana'),
    asunto: pickStr(item, 'asunto', 'Asunto'),
    enviadoEn: pick(item, 'enviadoEn', 'EnviadoEn'),
    cantidadDestinatarios: pickNum(item, 'cantidadDestinatarios', 'CantidadDestinatarios') || 0,
    tipoCampana: pickStr(item, 'tipoCampana', 'TipoCampana'),
    cantidadLeidos: pickNum(item, 'cantidadLeidos', 'CantidadLeidos') || 0,
    cantidadRespondidos: pickNum(item, 'cantidadRespondidos', 'CantidadRespondidos') || 0,
});

const resolveModo = (modo, user) => {
    if (modo === 'super' || modo === 'admin' || modo === 'club') return modo;
    const role = String(user?.role || '').toUpperCase();
    if (role === 'SUPERADMIN') return 'super';
    if (role === 'CLUB') return 'club';
    return 'admin';
};

const subtituloPorModo = {
    super: 'Mensajes y comunicados a administradores de federación (solo SIGDEF).',
    admin: 'Mensajes con SuperAdmin/clubes y comunicados masivos (solo SIGDEF).',
    club: 'Comunicación privada con el administrador de tu federación (solo SIGDEF).',
};

const MensajesPage = ({ modo: modoProp = 'auto' }) => {
    const { user } = useAuth();
    const modo = resolveModo(modoProp, user);
    const isSuper = modo === 'super';
    const isAdmin = modo === 'admin';
    const isClub = modo === 'club';
    const puedeMasivo = isSuper || isAdmin;

    const [tab, setTab] = useState('bandeja');
    const [hilos, setHilos] = useState([]);
    const [campanas, setCampanas] = useState([]);
    const [campanaDetalle, setCampanaDetalle] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [federaciones, setFederaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [sending, setSending] = useState(false);
    const [selectedHiloId, setSelectedHiloId] = useState(null);
    const [hiloDetalle, setHiloDetalle] = useState(null);
    const [vista, setVista] = useState('bandeja');
    const [modoEnvio, setModoEnvio] = useState('individual');
    const [filtro, setFiltro] = useState('');
    const [respuesta, setRespuesta] = useState('');
    const [toast, setToast] = useState(null);
    const [compose, setCompose] = useState({
        destinatarioId: '',
        destinatarioIds: [],
        asunto: '',
        cuerpo: '',
    });

    const currentUserId = useMemo(() => {
        const fromUser = pickUsuarioId(user);
        if (fromUser) return fromUser;
        const match = (usuarios || []).find(
            (u) =>
                String(pickStr(u, 'username', 'Username')).toLowerCase() ===
                String(user?.username || '').toLowerCase()
        );
        return pickUsuarioId(match);
    }, [user, usuarios]);

    const userFedId = pickFederacionId(user);
    const toastTimerRef = useRef(null);

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type });
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setToast(null), 3500);
    }, []);

    useEffect(
        () => () => {
            if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        },
        []
    );

    const gruposMasivo = useMemo(() => {
        const activos = (usuarios || []).filter(isActivo);

        if (isSuper) {
            const admins = activos.filter((u) => getRol(u) === 'admin' && pickUsuarioId(u));
            const fedMap = Object.fromEntries(
                (federaciones || []).map((f) => {
                    const fid = pickFederacionId(f);
                    return [String(fid || 'sin-fed'), pickStr(f, 'nombre', 'Nombre') || 'Federación'];
                })
            );
            const grouped = {};
            admins.forEach((admin) => {
                const fedId = String(pickFederacionId(admin) || 'sin-fed');
                if (!grouped[fedId]) {
                    grouped[fedId] = {
                        id: `fed-${fedId}`,
                        label: fedMap[fedId] || 'Sin federación',
                        items: [],
                    };
                }
                grouped[fedId].items.push(admin);
            });
            return Object.values(grouped).sort((a, b) => a.label.localeCompare(b.label));
        }

        if (isAdmin) {
            const clubes = activos.filter((u) => {
                if (getRol(u) !== 'club' || !pickUsuarioId(u)) return false;
                const fedId = pickFederacionId(u);
                return userFedId == null || fedId == null || Number(fedId) === Number(userFedId);
            });
            return clubes.length
                ? [{ id: 'clubes', label: 'Clubes de tu federación', items: clubes }]
                : [];
        }

        return [];
    }, [usuarios, federaciones, isSuper, isAdmin, userFedId]);

    const destinatariosIndividual = useMemo(() => {
        const activos = (usuarios || []).filter((u) => isActivo(u) && pickUsuarioId(u));

        if (isSuper) {
            return {
                tipo: 'grupos',
                label: 'Destinatario (Admin de federación)',
                placeholder: 'Seleccionar administrador...',
                grupos: gruposMasivo,
            };
        }

        if (isAdmin) {
            const superAdmins = activos.filter((u) => getRol(u) === 'superadmin');
            const clubes = activos.filter((u) => {
                if (getRol(u) !== 'club') return false;
                const fedId = pickFederacionId(u);
                return userFedId == null || fedId == null || Number(fedId) === Number(userFedId);
            });
            return {
                tipo: 'grupos',
                label: 'Destinatario',
                placeholder: 'Seleccionar destinatario...',
                grupos: [
                    ...(superAdmins.length
                        ? [{ id: 'super', label: 'SuperAdmin', items: superAdmins }]
                        : []),
                    ...(clubes.length
                        ? [{ id: 'clubes', label: 'Clubes de tu federación', items: clubes }]
                        : []),
                ],
            };
        }

        const admins = activos.filter((u) => {
            if (getRol(u) !== 'admin') return false;
            const fedId = pickFederacionId(u);
            return userFedId == null || fedId == null || Number(fedId) === Number(userFedId);
        });

        return {
            tipo: 'lista',
            label: 'Destinatario (Admin de federación)',
            placeholder: 'Seleccionar administrador...',
            items: admins,
        };
    }, [usuarios, gruposMasivo, isSuper, isAdmin, userFedId]);

    const hilosNormalizados = useMemo(() => (hilos || []).map(normalizeHiloListItem), [hilos]);
    const campanasNormalizadas = useMemo(
        () => (campanas || []).map(normalizeCampanaList),
        [campanas]
    );

    const hilosFiltrados = useMemo(() => {
        const q = filtro.trim().toLowerCase();
        if (!q) return hilosNormalizados;
        return hilosNormalizados.filter((h) => {
            const contraparte = displayUsuario(h.contraparte).toLowerCase();
            return (
                h.asunto.toLowerCase().includes(q) ||
                contraparte.includes(q) ||
                h.ultimoMensajePreview.toLowerCase().includes(q)
            );
        });
    }, [hilosNormalizados, filtro]);

    const loadHilos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await MessageService.getHilos();
            setHilos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            showToast(error.message || 'No se pudieron cargar los mensajes', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const loadCampanas = useCallback(async () => {
        if (!puedeMasivo) return;
        try {
            const data = await MessageService.getCampanas();
            setCampanas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            showToast(error.message || 'No se pudieron cargar los comunicados', 'error');
        }
    }, [puedeMasivo, showToast]);

    const loadCatalogos = useCallback(async () => {
        try {
            const usersPromise = api.get('/Auth/usuarios').catch(() => []);
            const fedPromise = isSuper
                ? api.get('/Federaciones').catch(() => [])
                : Promise.resolve([]);
            const [usersRes, federacionesRes] = await Promise.all([usersPromise, fedPromise]);
            setUsuarios(Array.isArray(usersRes) ? usersRes : []);
            setFederaciones(Array.isArray(federacionesRes) ? federacionesRes : []);
        } catch (error) {
            console.error(error);
        }
    }, [isSuper]);

    const loadHiloDetalle = useCallback(
        async (hiloId, markRead = true) => {
            setLoadingDetalle(true);
            try {
                const detalle = await MessageService.getHilo(hiloId);
                setHiloDetalle(normalizeHiloDetalle(detalle));
                if (markRead) {
                    await MessageService.marcarLeido(hiloId).catch(() => {});
                    notifyUnreadMessagesChanged();
                    await loadHilos();
                }
            } catch (error) {
                console.error(error);
                showToast(error.message || 'No se pudo cargar la conversación', 'error');
            } finally {
                setLoadingDetalle(false);
            }
        },
        [showToast, loadHilos]
    );

    useEffect(() => {
        loadHilos();
        loadCatalogos();
        if (puedeMasivo) loadCampanas();
    }, [loadHilos, loadCatalogos, loadCampanas, puedeMasivo]);

    useEffect(() => {
        if (!isClub || compose.destinatarioId) return;
        if (destinatariosIndividual.tipo === 'lista' && destinatariosIndividual.items?.length === 1) {
            const id = pickUsuarioId(destinatariosIndividual.items[0]);
            if (id) setCompose((prev) => ({ ...prev, destinatarioId: String(id) }));
        }
    }, [isClub, destinatariosIndividual, compose.destinatarioId]);

    const handleSelectHilo = async (hiloId) => {
        setSelectedHiloId(hiloId);
        setVista('bandeja');
        setTab('bandeja');
        setCampanaDetalle(null);
        setRespuesta('');
        await loadHiloDetalle(hiloId);
    };

    const openCampana = async (campanaId) => {
        setLoadingDetalle(true);
        try {
            const data = await MessageService.getCampana(campanaId);
            setCampanaDetalle(data);
            setVista('campana');
            setSelectedHiloId(null);
            setHiloDetalle(null);
        } catch (error) {
            console.error(error);
            showToast(error.message || 'No se pudo cargar el comunicado', 'error');
        } finally {
            setLoadingDetalle(false);
        }
    };

    const handleEnviarNuevo = async (e) => {
        e.preventDefault();
        if (!compose.asunto.trim() || !compose.cuerpo.trim()) {
            showToast('Completá asunto y mensaje', 'warning');
            return;
        }

        setSending(true);
        try {
            if (modoEnvio === 'masivo' && puedeMasivo) {
                if (!compose.destinatarioIds.length) {
                    showToast('Seleccioná al menos un destinatario', 'warning');
                    setSending(false);
                    return;
                }
                const result = await MessageService.enviarMasivo({
                    asunto: compose.asunto.trim(),
                    cuerpo: compose.cuerpo.trim(),
                    destinatarioIds: compose.destinatarioIds,
                });
                const campanaId = pickNum(result, 'campanaId', 'CampanaId');
                const cantidad =
                    pickNum(result, 'cantidadHilos', 'CantidadHilos') ||
                    compose.destinatarioIds.length;
                showToast(`Comunicado enviado a ${cantidad} destinatarios`, 'success');
                setCompose({ destinatarioId: '', destinatarioIds: [], asunto: '', cuerpo: '' });
                setModoEnvio('individual');
                await Promise.all([loadHilos(), loadCampanas()]);
                notifyUnreadMessagesChanged();
                setTab('comunicados');
                if (campanaId) await openCampana(campanaId);
            } else {
                const destinatarioId = Number(compose.destinatarioId);
                if (!destinatarioId || destinatarioId <= 0) {
                    showToast('Seleccioná un destinatario válido', 'warning');
                    setSending(false);
                    return;
                }
                const creado = await MessageService.crearHilo({
                    destinatarioId,
                    asunto: compose.asunto.trim(),
                    cuerpo: compose.cuerpo.trim(),
                });
                const normalizado = normalizeHiloDetalle(creado);
                showToast('Mensaje enviado', 'success');
                setCompose({ destinatarioId: '', destinatarioIds: [], asunto: '', cuerpo: '' });
                setVista('bandeja');
                setTab('bandeja');
                await loadHilos();
                notifyUnreadMessagesChanged();
                setSelectedHiloId(normalizado.idHilo);
                setHiloDetalle(normalizado);
            }
        } catch (error) {
            console.error(error);
            showToast(error.message || 'No se pudo enviar el mensaje', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleResponder = async (e) => {
        e.preventDefault();
        if (!selectedHiloId || !respuesta.trim()) {
            showToast('Escribí una respuesta', 'warning');
            return;
        }

        setSending(true);
        try {
            const actualizado = await MessageService.responderHilo(selectedHiloId, respuesta.trim());
            setHiloDetalle(normalizeHiloDetalle(actualizado));
            setRespuesta('');
            showToast('Respuesta enviada', 'success');
            await loadHilos();
            notifyUnreadMessagesChanged();
        } catch (error) {
            console.error(error);
            showToast(error.message || 'No se pudo enviar la respuesta', 'error');
        } finally {
            setSending(false);
        }
    };

    const hiloSeleccionado = hilosFiltrados.find((h) => h.idHilo === selectedHiloId);
    const totalNoLeidos = hilosNormalizados.reduce((acc, h) => acc + (h.cantidadNoLeidos || 0), 0);

    const renderDestinatarioOptions = () => {
        if (destinatariosIndividual.tipo === 'lista') {
            return (destinatariosIndividual.items || []).map((item) => {
                const id = pickUsuarioId(item);
                if (!id) return null;
                return (
                    <option key={`user-${id}`} value={id}>
                        {displayUsuario(item)} ({pickStr(item, 'username', 'Username')})
                    </option>
                );
            });
        }

        return (destinatariosIndividual.grupos || []).map((grupo) => (
            <optgroup key={grupo.id || grupo.label} label={grupo.label}>
                {(grupo.items || []).map((item) => {
                    const id = pickUsuarioId(item);
                    if (!id) return null;
                    return (
                        <option key={`user-${id}`} value={id}>
                            {displayUsuario(item)} ({pickStr(item, 'username', 'Username')})
                        </option>
                    );
                })}
            </optgroup>
        ));
    };

    return (
        <section className="mensajes-section">
            <div className="mensajes-header">
                <div>
                    <h2 className="page-title">
                        <Mail size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Mensajes
                    </h2>
                    <p className="page-subtitle">{subtituloPorModo[modo]}</p>
                </div>
                <div className="mensajes-header-actions">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            loadHilos();
                            if (puedeMasivo) loadCampanas();
                        }}
                        title="Actualizar"
                    >
                        <RefreshCcw size={16} />
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            setVista('redactar');
                            setSelectedHiloId(null);
                            setHiloDetalle(null);
                            setCampanaDetalle(null);
                            setModoEnvio(puedeMasivo ? modoEnvio : 'individual');
                        }}
                    >
                        <PenSquare size={16} />
                        Nuevo mensaje
                    </Button>
                </div>
            </div>

            {toast && (
                <div className={`mensajes-toast mensajes-toast-${toast.type}`} role="status">
                    {toast.message}
                </div>
            )}

            {puedeMasivo && (
                <div className="mensajes-tabs">
                    <button
                        type="button"
                        className={tab === 'bandeja' ? 'active' : ''}
                        onClick={() => {
                            setTab('bandeja');
                            setVista('bandeja');
                            setCampanaDetalle(null);
                        }}
                    >
                        Bandeja
                    </button>
                    <button
                        type="button"
                        className={tab === 'comunicados' ? 'active' : ''}
                        onClick={() => {
                            setTab('comunicados');
                            setVista('bandeja');
                            setSelectedHiloId(null);
                            setHiloDetalle(null);
                            setCampanaDetalle(null);
                            loadCampanas();
                        }}
                    >
                        <Megaphone size={14} />
                        Comunicados enviados
                    </button>
                </div>
            )}

            <div
                className={`mensajes-layout ${
                    (selectedHiloId && vista === 'bandeja') || vista === 'campana'
                        ? 'has-selection'
                        : ''
                }`}
            >
                <div
                    className={`mensajes-panel list-panel ${
                        (selectedHiloId && vista === 'bandeja') || vista === 'campana'
                            ? 'collapsed-mobile'
                            : ''
                    }`}
                >
                    {tab === 'comunicados' && puedeMasivo ? (
                        <>
                            <div className="mensajes-panel-header">
                                <strong style={{ fontSize: '0.9rem' }}>Comunicados masivos</strong>
                            </div>
                            <div className="mensajes-list">
                                {campanasNormalizadas.length === 0 ? (
                                    <div className="mensajes-empty-detail">
                                        <p>
                                            <strong>Sin comunicados</strong>
                                        </p>
                                        <p>
                                            Cuando envíes un mensaje a varios destinatarios,
                                            aparecerá acá.
                                        </p>
                                    </div>
                                ) : (
                                    campanasNormalizadas.map((c) => (
                                        <button
                                            key={c.idCampana}
                                            type="button"
                                            className={`mensaje-hilo-item ${
                                                campanaDetalle &&
                                                pickNum(campanaDetalle, 'idCampana', 'IdCampana') ===
                                                    c.idCampana
                                                    ? 'active'
                                                    : ''
                                            }`}
                                            onClick={() => openCampana(c.idCampana)}
                                        >
                                            <div className="mensaje-hilo-top">
                                                <span className="mensaje-hilo-asunto">
                                                    {c.asunto}
                                                </span>
                                                <span className="mensaje-hilo-fecha">
                                                    {formatFecha(c.enviadoEn)}
                                                </span>
                                            </div>
                                            <div className="mensaje-hilo-meta">
                                                Enviado a {c.cantidadDestinatarios} ·{' '}
                                                {c.cantidadRespondidos} respondieron ·{' '}
                                                {c.cantidadLeidos} leídos
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mensajes-panel-header">
                                <input
                                    className="mensajes-search form-input"
                                    placeholder="Buscar por asunto o destinatario..."
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                />
                            </div>
                            <div className="mensajes-list">
                                {loading ? (
                                    <div className="mensajes-empty-detail">
                                        Cargando conversaciones...
                                    </div>
                                ) : hilosFiltrados.length === 0 ? (
                                    <div className="mensajes-empty-detail">
                                        <p>
                                            <strong>No hay mensajes</strong>
                                        </p>
                                        <p>
                                            Cuando envíes o recibas mensajes, aparecerán acá.
                                        </p>
                                    </div>
                                ) : (
                                    hilosFiltrados.map((hilo) => (
                                        <button
                                            key={hilo.idHilo}
                                            type="button"
                                            className={`mensaje-hilo-item ${
                                                selectedHiloId === hilo.idHilo ? 'active' : ''
                                            } ${hilo.cantidadNoLeidos > 0 ? 'unread' : ''}`}
                                            onClick={() => handleSelectHilo(hilo.idHilo)}
                                        >
                                            <div className="mensaje-hilo-top">
                                                <span className="mensaje-hilo-asunto">
                                                    {hilo.asunto}
                                                </span>
                                                <span className="mensaje-hilo-fecha">
                                                    {formatFecha(hilo.ultimoMensajeEn)}
                                                </span>
                                            </div>
                                            <div className="mensaje-hilo-meta">
                                                {displayUsuario(hilo.contraparte)}
                                                {hilo.cantidadNoLeidos > 0 && (
                                                    <span className="mensajes-badge-unread">
                                                        {hilo.cantidadNoLeidos}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mensaje-hilo-preview">
                                                {hilo.ultimoMensajePreview}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                            {totalNoLeidos > 0 && (
                                <div className="mensajes-footer-hint">
                                    {totalNoLeidos} mensaje{totalNoLeidos === 1 ? '' : 's'} sin
                                    leer
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="mensajes-panel">
                    {vista === 'redactar' ? (
                        <form className="mensajes-compose" onSubmit={handleEnviarNuevo}>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setVista('bandeja')}
                            >
                                <ArrowLeft size={16} />
                                Volver
                            </Button>

                            {puedeMasivo && (
                                <div className="mensajes-modo-envio">
                                    <button
                                        type="button"
                                        className={modoEnvio === 'individual' ? 'active' : ''}
                                        onClick={() => setModoEnvio('individual')}
                                    >
                                        Individual
                                    </button>
                                    <button
                                        type="button"
                                        className={modoEnvio === 'masivo' ? 'active' : ''}
                                        onClick={() => setModoEnvio('masivo')}
                                    >
                                        Comunicado masivo
                                    </button>
                                </div>
                            )}

                            {modoEnvio === 'masivo' && puedeMasivo ? (
                                <label>
                                    Destinatarios
                                    <DestinatariosMultiSelect
                                        grupos={gruposMasivo}
                                        selectedIds={compose.destinatarioIds}
                                        onChange={(ids) =>
                                            setCompose((prev) => ({
                                                ...prev,
                                                destinatarioIds: ids,
                                            }))
                                        }
                                        emptyMessage={
                                            isSuper
                                                ? 'No hay administradores disponibles'
                                                : 'No hay clubes en tu federación'
                                        }
                                    />
                                    <small className="mensajes-compose-hint">
                                        Se crea un hilo privado por cada destinatario. Cada uno
                                        responde por separado.
                                    </small>
                                </label>
                            ) : (
                                <label>
                                    {destinatariosIndividual.label}
                                    <select
                                        className="form-input"
                                        value={compose.destinatarioId}
                                        onChange={(e) =>
                                            setCompose((prev) => ({
                                                ...prev,
                                                destinatarioId: e.target.value,
                                            }))
                                        }
                                        required={modoEnvio !== 'masivo'}
                                    >
                                        <option value="">
                                            {destinatariosIndividual.placeholder}
                                        </option>
                                        {renderDestinatarioOptions()}
                                    </select>
                                </label>
                            )}

                            <label>
                                Asunto
                                <input
                                    className="form-input"
                                    type="text"
                                    value={compose.asunto}
                                    onChange={(e) =>
                                        setCompose((prev) => ({
                                            ...prev,
                                            asunto: e.target.value,
                                        }))
                                    }
                                    placeholder="Asunto del mensaje"
                                    maxLength={300}
                                    required
                                />
                            </label>

                            <label>
                                Mensaje
                                <textarea
                                    className="form-input"
                                    rows={8}
                                    value={compose.cuerpo}
                                    onChange={(e) =>
                                        setCompose((prev) => ({
                                            ...prev,
                                            cuerpo: e.target.value,
                                        }))
                                    }
                                    placeholder="Escribí tu mensaje..."
                                    required
                                />
                            </label>

                            <div className="mensajes-compose-actions">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setVista('bandeja')}
                                    disabled={sending}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="primary" isLoading={sending}>
                                    <Send size={16} />
                                    {modoEnvio === 'masivo'
                                        ? `Enviar a ${compose.destinatarioIds.length || 0}`
                                        : 'Enviar'}
                                </Button>
                            </div>
                        </form>
                    ) : vista === 'campana' && campanaDetalle ? (
                        loadingDetalle ? (
                            <div className="mensajes-empty-detail">Cargando comunicado...</div>
                        ) : (
                            <CampanaDetalle
                                campana={campanaDetalle}
                                onBack={() => {
                                    setVista('bandeja');
                                    setCampanaDetalle(null);
                                    setTab('comunicados');
                                }}
                                onOpenHilo={async (hiloId) => {
                                    setTab('bandeja');
                                    await handleSelectHilo(hiloId);
                                }}
                            />
                        )
                    ) : !selectedHiloId || !hiloDetalle ? (
                        <div className="mensajes-empty-detail">
                            <div>
                                <Mail size={36} style={{ opacity: 0.35, marginBottom: 12 }} />
                                <p>
                                    {tab === 'comunicados'
                                        ? 'Seleccioná un comunicado para ver el desglose.'
                                        : 'Seleccioná una conversación o creá un mensaje nuevo.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mensajes-detail">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setSelectedHiloId(null);
                                    setHiloDetalle(null);
                                }}
                            >
                                <ArrowLeft size={16} />
                                Volver
                            </Button>

                            <div className="mensajes-detail-header">
                                <h3>{hiloDetalle.asunto}</h3>
                                <p>
                                    Conversación con {displayUsuario(hiloSeleccionado?.contraparte)}
                                </p>
                            </div>

                            <div className="mensajes-thread">
                                {loadingDetalle ? (
                                    <div className="mensajes-empty-detail">
                                        Cargando historial...
                                    </div>
                                ) : (
                                    hiloDetalle.mensajes.map((mensaje) => (
                                        <div
                                            key={mensaje.idMensaje}
                                            className={`mensaje-bubble ${
                                                mensaje.esPropio ||
                                                mensaje.remitenteId === currentUserId
                                                    ? 'propio'
                                                    : ''
                                            }`}
                                        >
                                            <div className="mensaje-bubble-meta">
                                                <span>{displayUsuario(mensaje.remitente)}</span>
                                                <span>{formatFecha(mensaje.enviadoEn)}</span>
                                            </div>
                                            <p className="mensaje-bubble-body">{mensaje.cuerpo}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form className="mensajes-reply" onSubmit={handleResponder}>
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    value={respuesta}
                                    onChange={(e) => setRespuesta(e.target.value)}
                                    placeholder="Escribí tu respuesta..."
                                />
                                <div className="mensajes-compose-actions">
                                    <Button type="submit" variant="primary" isLoading={sending}>
                                        <Send size={16} />
                                        Responder
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default MensajesPage;
