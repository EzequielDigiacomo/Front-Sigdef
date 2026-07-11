import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import {
    MapPin, Phone, Mail, Users, Award, User, CheckCircle2, AlertCircle,
    UserCheck, Shield, ChevronRight, ChevronLeft, Clock,
} from 'lucide-react';
import { pick } from '../../../utils/apiHelpers';
import './ClubInfo.css';

const ACTIVITY_COLS = 4;
const ACTIVITY_ROWS = 4;
const ACTIVITY_PAGE_SIZE = ACTIVITY_COLS * ACTIVITY_ROWS;

const getTimeAgo = (fecha) => {
    if (!fecha) return '';
    const ahora = new Date();
    const fechaPasada = new Date(fecha);
    if (Number.isNaN(fechaPasada.getTime())) return '';
    const diferencia = ahora - fechaPasada;
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);
    if (minutos < 1) return 'Justo ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} h`;
    if (dias < 30) return `Hace ${dias} d`;
    return fechaPasada.toLocaleDateString('es-AR');
};

const formatFechaHora = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return 'Sin fecha';
    return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const ClubInfo = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [clubData, setClubData] = useState(null);
    const [entrenadores, setEntrenadores] = useState([]);
    const [tutores, setTutores] = useState([]);
    const [delegados, setDelegados] = useState([]);
    const [atletasRecientes, setAtletasRecientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [afiliacionAlDia, setAfiliacionAlDia] = useState(false);
    const [activityPage, setActivityPage] = useState(1);

    useEffect(() => {
        if (user?.idClub) {
            fetchClubData();
        }
    }, [user.idClub]);

    const fetchClubData = async () => {
        const clubId = user?.idClub || user?.IdClub || user?.clubId;
        try {
            setLoading(true);

            const [club, atletasRaw, entrenadoresRaw, tutoresRaw, relacionesRaw, personasRaw, usuariosRaw] =
                await Promise.all([
                    api.get(`/Club/${clubId}`),
                    api.get('/Atleta').catch(() => []),
                    api.get('/Entrenador').catch(() => []),
                    api.get('/Tutor').catch(() => []),
                    api.get('/AtletaTutor').catch(() => []),
                    api.get('/Persona').catch(() => []),
                    api.get('/Auth/usuarios').catch(() => []),
                ]);

            const alDia = pick(club, 'pagoAfiliacionAlDia', 'PagoAfiliacionAlDia') !== false;
            setAfiliacionAlDia(alDia);

            const atletas = Array.isArray(atletasRaw) ? atletasRaw : [];
            const atletasDelClub = atletas.filter(
                (a) => String(a.idClub ?? a.IdClub ?? a.clubId) === String(clubId)
            );
            const atletaIds = new Set(atletasDelClub.map((a) => a.idPersona ?? a.IdPersona ?? a.participanteId));

            const personasMap = new Map(
                (Array.isArray(personasRaw) ? personasRaw : []).map((p) => [
                    p.idPersona ?? p.IdPersona ?? p.participanteId ?? p.ParticipanteId,
                    p,
                ])
            );

            setAtletasRecientes(
                atletasDelClub.map((a) => {
                    const id = a.idPersona ?? a.IdPersona ?? a.participanteId;
                    const persona = personasMap.get(id);
                    const nombre = persona
                        ? `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim()
                        : a.nombrePersona || a.NombrePersona || 'Atleta';
                    return {
                        id,
                        nombre: nombre || 'Atleta',
                        fecha: a.fechaCreacion || a.FechaCreacion || null,
                    };
                })
            );

            // Entrenadores
            const entrenadoresDelClub = (Array.isArray(entrenadoresRaw) ? entrenadoresRaw : [])
                .filter((e) => String(e.idClub ?? e.IdClub) === String(clubId))
                .map((e) => {
                    const id = e.idPersona ?? e.IdPersona;
                    const persona = personasMap.get(id);
                    return {
                        ...e,
                        idPersona: id,
                        nombre: persona
                            ? `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim()
                            : e.nombrePersona || 'Entrenador',
                        licencia: e.licencia || e.Licencia || '—',
                        fecha: e.fechaCreacion || e.FechaCreacion || persona?.fechaCreacion || persona?.FechaCreacion || null,
                    };
                });
            setEntrenadores(entrenadoresDelClub);

            // Tutores vinculados a atletas del club
            const relaciones = Array.isArray(relacionesRaw) ? relacionesRaw : [];
            const tutorIds = new Set(
                relaciones
                    .filter((r) => atletaIds.has(r.idAtleta ?? r.IdAtleta))
                    .map((r) => r.idTutor ?? r.IdTutor)
            );
            const tutoresDelClub = (Array.isArray(tutoresRaw) ? tutoresRaw : [])
                .filter((t) => tutorIds.has(t.idPersona ?? t.IdPersona ?? t.participanteId))
                .map((t) => {
                    const id = t.idPersona ?? t.IdPersona ?? t.participanteId;
                    const persona = personasMap.get(id);
                    return {
                        idPersona: id,
                        nombre: persona
                            ? `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim()
                            : t.nombrePersona || 'Tutor',
                        telefono: persona?.telefono || persona?.Telefono || '—',
                        fecha: t.fechaCreacion || t.FechaCreacion || persona?.fechaCreacion || persona?.FechaCreacion || null,
                    };
                });
            setTutores(tutoresDelClub);

            // Delegados (usuarios del club)
            const delegadosDelClub = (Array.isArray(usuariosRaw) ? usuariosRaw : [])
                .filter((d) => {
                    const idClubDelegado = d.idClub || d.IdClub || d.clubId || d.ClubId;
                    const rol = d.rol || d.Rol || d.rolFederacion || d.RolFederacion || '';
                    return (
                        String(idClubDelegado) === String(clubId) &&
                        ['Club', 'Delegado', 'DelegadoClub'].includes(rol)
                    );
                })
                .map((d) => {
                    const nombre =
                        `${d.nombre || ''} ${d.apellido || ''}`.trim() ||
                        d.nombreCompleto ||
                        d.nombrePersona ||
                        d.username ||
                        'Delegado';
                    return {
                        id: d.id || d.idPersona || d.IdPersona,
                        nombre,
                        rol: d.rol || d.Rol || d.rolFederacion || d.RolFederacion || 'Club',
                        email: d.email || d.Email || '—',
                        fecha: d.fechaCreacion || d.FechaCreacion || null,
                    };
                });
            setDelegados(delegadosDelClub);

            setClubData({
                ...club,
                nombre: pick(club, 'nombre', 'Nombre') || user.clubNombre || user.nombre,
                siglas: pick(club, 'sigla', 'Sigla', 'siglas', 'Siglas') || '',
                direccion: pick(club, 'direccion', 'Direccion') || 'No especificada',
                telefono: pick(club, 'telefono', 'Telefono') || 'No especificado',
                email: pick(club, 'email', 'Email') || user.email,
                totalAtletas: atletasDelClub.length,
                totalEntrenadores: entrenadoresDelClub.length,
                totalTutores: tutoresDelClub.length,
                totalDelegados: delegadosDelClub.length,
                logros: club.logros || [],
            });
        } catch (error) {
            console.error('Error al cargar información del club:', error);

            setClubData({
                id: clubId,
                nombre: user.clubNombre || user.nombre,
                siglas: '',
                direccion: user.clubData?.direccion || 'No especificada',
                telefono: user.clubData?.telefono || 'No especificado',
                email: user.email,
                totalAtletas: 0,
                totalEntrenadores: 0,
                totalTutores: 0,
                totalDelegados: 0,
                logros: [],
            });
            setAfiliacionAlDia(false);
            setEntrenadores([]);
            setTutores([]);
            setDelegados([]);
            setAtletasRecientes([]);
        } finally {
            setLoading(false);
        }
    };

    const actividadReciente = useMemo(() => {
        const items = [
            ...atletasRecientes.map((a) => ({
                id: `atleta-${a.id}`,
                titulo: a.nombre,
                subtitulo: 'Atleta registrado',
                fecha: a.fecha,
                tone: 'blue',
                icon: Users,
            })),
            ...entrenadores.map((e) => ({
                id: `entrenador-${e.idPersona}`,
                titulo: e.nombre,
                subtitulo: 'Entrenador asignado',
                fecha: e.fecha,
                tone: 'amber',
                icon: Award,
            })),
            ...tutores.map((t) => ({
                id: `tutor-${t.idPersona}`,
                titulo: t.nombre,
                subtitulo: 'Tutor vinculado',
                fecha: t.fecha,
                tone: 'pink',
                icon: UserCheck,
            })),
            ...delegados.map((d) => ({
                id: `delegado-${d.id}`,
                titulo: d.nombre,
                subtitulo: 'Delegado del club',
                fecha: d.fecha,
                tone: 'violet',
                icon: Shield,
            })),
        ];

        const conFecha = items
            .filter((item) => item.fecha)
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        const sinFecha = items.filter((item) => !item.fecha);

        return [...conFecha, ...sinFecha];
    }, [atletasRecientes, entrenadores, tutores, delegados]);

    useEffect(() => {
        setActivityPage(1);
    }, [actividadReciente.length]);

    const activityTotalPages = Math.max(1, Math.ceil(actividadReciente.length / ACTIVITY_PAGE_SIZE));
    const activityPageSafe = Math.min(activityPage, activityTotalPages);
    const actividadPagina = actividadReciente.slice(
        (activityPageSafe - 1) * ACTIVITY_PAGE_SIZE,
        activityPageSafe * ACTIVITY_PAGE_SIZE
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando dashboard del club...</p>
            </div>
        );
    }

    const quickCards = [
        {
            key: 'atletas',
            label: 'Atletas',
            count: clubData.totalAtletas,
            path: '/club/atletas',
            icon: Users,
            tone: 'blue',
            hint: 'Plantel del club',
        },
        {
            key: 'tutores',
            label: 'Tutores',
            count: clubData.totalTutores,
            path: '/club/tutores',
            icon: UserCheck,
            tone: 'pink',
            hint: 'Responsables legales',
        },
        {
            key: 'entrenadores',
            label: 'Entrenadores',
            count: clubData.totalEntrenadores,
            path: '/club/entrenadores',
            icon: Award,
            tone: 'amber',
            hint: 'Cuerpo técnico',
        },
        {
            key: 'delegados',
            label: 'Delegados',
            count: clubData.totalDelegados,
            path: '/club/delegados',
            icon: Shield,
            tone: 'violet',
            hint: 'Accesos del club',
        },
    ];

    return (
        <div className="club-info club-info-compact">
            <header className="mi-club-header">
                <div className="mi-club-title-block">
                    <div>
                        <p className="mi-club-eyebrow">Dashboard</p>
                        <h1 className="text-gradient">{clubData.nombre}</h1>
                    </div>
                    {clubData.siglas && <span className="mi-club-sigla">{clubData.siglas}</span>}
                </div>
                <div className={`mi-club-status ${afiliacionAlDia ? 'ok' : 'pending'}`}>
                    {afiliacionAlDia ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <div>
                        <strong>{afiliacionAlDia ? 'Afiliación activa' : 'Membresía pendiente'}</strong>
                        <span>
                            {afiliacionAlDia
                                ? `Cuota al día · vence 31/12/${new Date().getFullYear()}`
                                : 'Regularizar cuota anual'}
                        </span>
                    </div>
                </div>
            </header>

            <div className="mi-quick-cards">
                {quickCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <button
                            key={card.key}
                            type="button"
                            className={`mi-quick-card tone-${card.tone}`}
                            onClick={() => navigate(card.path)}
                        >
                            <div className="mi-quick-card-top">
                                <span className="mi-quick-icon">
                                    <Icon size={16} />
                                </span>
                                <ChevronRight size={14} className="mi-quick-chevron" />
                            </div>
                            <strong className="mi-quick-count">{card.count}</strong>
                            <span className="mi-quick-label">{card.label}</span>
                            <span className="mi-quick-hint">{card.hint}</span>
                        </button>
                    );
                })}
            </div>

            <div className="mi-club-layout">
                <section className="mi-club-panel glass-panel">
                    <div className="mi-club-panel-head">
                        <h2>Datos del club</h2>
                    </div>

                    <dl className="mi-club-facts">
                        <div className="mi-fact">
                            <dt><Award size={14} /> Nombre</dt>
                            <dd>{clubData.nombre}</dd>
                        </div>
                        <div className="mi-fact">
                            <dt><MapPin size={14} /> Dirección</dt>
                            <dd>{clubData.direccion}</dd>
                        </div>
                        <div className="mi-fact">
                            <dt><Phone size={14} /> Teléfono</dt>
                            <dd>{clubData.telefono}</dd>
                        </div>
                        <div className="mi-fact">
                            <dt><Mail size={14} /> Email</dt>
                            <dd>{clubData.email}</dd>
                        </div>
                    </dl>

                    {clubData.logros?.length > 0 && (
                        <div className="mi-club-logros">
                            <h3>Logros</h3>
                            <ul>
                                {clubData.logros.map((logro, index) => (
                                    <li key={index}>
                                        <Award size={12} /> {logro}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                <section className="mi-club-panel glass-panel">
                    <div className="mi-club-panel-head">
                        <h2>Entrenadores</h2>
                        <button type="button" className="mi-panel-link" onClick={() => navigate('/club/entrenadores')}>
                            Ver todos <ChevronRight size={14} />
                        </button>
                    </div>

                    {entrenadores.length > 0 ? (
                        <ul className="mi-coach-list">
                            {entrenadores.slice(0, 5).map((entrenador) => (
                                <li key={entrenador.idPersona} className="mi-coach-row">
                                    <div className="mi-coach-avatar">
                                        <User size={16} />
                                    </div>
                                    <div className="mi-coach-meta">
                                        <strong>{entrenador.nombre}</strong>
                                        <span>Lic. {entrenador.licencia}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mi-empty">
                            <User size={20} />
                            <p>Sin entrenadores asignados</p>
                        </div>
                    )}
                </section>

                <section className="mi-club-panel glass-panel">
                    <div className="mi-club-panel-head">
                        <h2>Tutores</h2>
                        <button type="button" className="mi-panel-link" onClick={() => navigate('/club/tutores')}>
                            Ver todos <ChevronRight size={14} />
                        </button>
                    </div>

                    {tutores.length > 0 ? (
                        <ul className="mi-coach-list">
                            {tutores.slice(0, 5).map((tutor) => (
                                <li key={tutor.idPersona} className="mi-coach-row">
                                    <div className="mi-coach-avatar tone-pink">
                                        <UserCheck size={16} />
                                    </div>
                                    <div className="mi-coach-meta">
                                        <strong>{tutor.nombre}</strong>
                                        <span>{tutor.telefono}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mi-empty">
                            <UserCheck size={20} />
                            <p>Sin tutores vinculados</p>
                        </div>
                    )}
                </section>

                <section className="mi-club-panel glass-panel">
                    <div className="mi-club-panel-head">
                        <h2>Delegados</h2>
                        <button type="button" className="mi-panel-link" onClick={() => navigate('/club/delegados')}>
                            Ver todos <ChevronRight size={14} />
                        </button>
                    </div>

                    {delegados.length > 0 ? (
                        <ul className="mi-coach-list">
                            {delegados.slice(0, 5).map((delegado) => (
                                <li key={delegado.id} className="mi-coach-row">
                                    <div className="mi-coach-avatar tone-violet">
                                        <Shield size={16} />
                                    </div>
                                    <div className="mi-coach-meta">
                                        <strong>{delegado.nombre}</strong>
                                        <span>{delegado.rol} · {delegado.email}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mi-empty">
                            <Shield size={20} />
                            <p>Sin delegados registrados</p>
                        </div>
                    )}
                </section>
            </div>

            <section className="mi-activity-section">
                <div className="mi-club-panel-head">
                    <h2>
                        <Clock size={16} /> Actividad reciente
                    </h2>
                    {actividadReciente.length > 0 && (
                        <span className="mi-activity-count">
                            {actividadReciente.length} registro{actividadReciente.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {actividadReciente.length > 0 ? (
                    <>
                        <div className="mi-activity-cards">
                            {actividadPagina.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <article
                                        key={item.id}
                                        className={`mi-quick-card mi-activity-card tone-${item.tone}`}
                                    >
                                        <div className="mi-quick-card-top">
                                            <span className="mi-quick-icon">
                                                <Icon size={16} />
                                            </span>
                                            <span className="mi-activity-ago">{getTimeAgo(item.fecha) || '—'}</span>
                                        </div>
                                        <strong className="mi-activity-title">{item.titulo}</strong>
                                        <span className="mi-quick-hint">{item.subtitulo}</span>
                                        <span className="mi-activity-datetime">{formatFechaHora(item.fecha)}</span>
                                    </article>
                                );
                            })}
                        </div>

                        {activityTotalPages > 1 && (
                            <div className="mi-activity-pagination">
                                <button
                                    type="button"
                                    className="mi-page-btn"
                                    disabled={activityPageSafe <= 1}
                                    onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                                    aria-label="Página anterior"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="mi-page-info">
                                    Página {activityPageSafe} de {activityTotalPages}
                                </span>
                                <button
                                    type="button"
                                    className="mi-page-btn"
                                    disabled={activityPageSafe >= activityTotalPages}
                                    onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                                    aria-label="Página siguiente"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mi-empty mi-activity-empty">
                        <Clock size={20} />
                        <p>Sin actividad reciente registrada</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ClubInfo;
