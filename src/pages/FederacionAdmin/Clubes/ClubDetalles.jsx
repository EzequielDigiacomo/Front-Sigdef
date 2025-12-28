import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Users, Target, Calendar, ClipboardList, Edit, Plus, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import AtletaDetailModal from '../Atletas/components/AtletaDetailModal';
import { getCategoriaLabel } from '../../../utils/enums';

const ClubDetalles = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [club, setClub] = useState(null);
    const [atletas, setAtletas] = useState([]);
    const [entrenadores, setEntrenadores] = useState([]);
    const [delegados, setDelegados] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [inscripciones, setInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const loadClubDetalles = async () => {
        try {
            const [clubData, atletasData, entrenadoresData, delegadosData, eventosData] = await Promise.all([
                api.get(`/Club/${id}`),
                api.get(`/Club/${id}/Atletas`),
                api.get(`/Club/${id}/Entrenadores`),
                api.get(`/Club/${id}/Delegados`),
                api.get(`/Club/${id}/Eventos`)
            ]);

            // Ahora los endpoints ya nos devuelven la data filtrada y enriquecida (NombrePersona, etc)
            setClub(clubData);
            setAtletas(atletasData);
            setEntrenadores(entrenadoresData);
            setDelegados(delegadosData);
            setEventos(eventosData);

            // Nota: Para inscripciones globales, si se necesitan para "Eventos Asistidos", 
            // idealmente deberíamos tener un endpoint específico. 
            // Por ahora, dejamos inscripciones vacío para no sobrecargar, 
            // o si es crítico ver eventos asistidos, deberíamos agregar api.get(`/Club/${id}/EventosAsistidos`) en el backend.
            setInscripciones([]);


        } catch (error) {
            console.error('Error cargando detalles del club:', error);
        } finally {
            setLoading(false);
        }
    };

    const getClubStats = () => {
        if (!club) return { atletasClub: [], entrenadoresClub: [], delegadoClub: null, eventosCreados: [], eventosAsistidos: [] };

        // Al usar los endpoints específicos, los arrays en el estado YA SON los del club.
        // No hace falta filtrar de nuevo.
        const atletasClub = atletas || [];
        const entrenadoresClub = entrenadores || [];
        // La API devuelve lista de delegados, tomamos el primero si hay, o null. Verificación extra por seguridad.
        const delegadoClub = (delegados && delegados.length > 0) ? delegados[0] : null;

        const eventosCreados = eventos || [];

        // Pendiente: Eventos Asistidos requeriría otro endpoint específico.
        const eventosAsistidos = [];

        return { atletasClub, entrenadoresClub, delegadoClub, eventosCreados, eventosAsistidos };
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="text-center">Cargando detalles del club...</div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="page-container">
                <div className="text-center">Club no encontrado</div>
            </div>
        );
    }

    const { atletasClub, entrenadoresClub, delegadoClub, eventosCreados, eventosAsistidos } = getClubStats();

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/dashboard/clubes')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">Detalles - {club.nombre}</h2>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {/* Info General */}
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Información del Club</h3>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/dashboard/clubes/editar/${club.idClub}`)}
                        >
                            <Edit size={16} className="mr-2" /> Editar
                        </Button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Siglas</label>
                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>{club.siglas}</div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Teléfono</label>
                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>{club.telefono || '-'}</div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Dirección</label>
                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>{club.direccion || '-'}</div>
                        </div>
                    </div>
                </Card>

                {/* Información del Delegado */}
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Delegado del Club</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate('/dashboard/delegados-club/nuevo', { state: { clubId: club.idClub, returnPath: `/dashboard/clubes/detalles/${club.idClub}` } })}
                            >
                                <Plus size={16} className="mr-2" /> Nuevo Delegado
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        // TODO: Idealmente tener un endpoint /DelegadoClub/Disponibles o similar.
                                        // Por ahora, traemos todos y filtramos en el cliente los que tienen idClub = null o 0
                                        const allDelegados = await api.get('/DelegadoClub');
                                        // Asumimos que si no tiene club asignado, idClub es null o 0.
                                        // OJO: Chequear cómo viene el DTO de lista general
                                        const libres = allDelegados.filter(d => !d.idClub || d.idClub === 0);

                                        // Enriquecer con Datos Personales si el endpoint /DelegadoClub no devuelve nombrePersona
                                        // (Si usas el mismo endpoint que modificamos hace un rato para ByClub, seguro trae nombrePersona)
                                        // Si el endpoint general /DelegadoClub es simple, puede que necesitemos buscar Persona.
                                        // Asumiremos por ahora que trae datos básicos.

                                        // Si necesitas enriquecer:
                                        const libresEnriquecidos = await Promise.all(libres.map(async (d) => {
                                            if (!d.nombrePersona) {
                                                try {
                                                    const p = await api.get(`/Persona/${d.idPersona}`);
                                                    return { ...d, nombrePersona: `${p.nombre} ${p.apellido}`, documento: p.documento };
                                                } catch (e) { return d; }
                                            }
                                            return d;
                                        }));

                                        setAvailableDelegados(libresEnriquecidos);
                                        setShowAddDelegadoModal(true);
                                    } catch (error) {
                                        console.error("Error cargando delegados disponibles", error);
                                        setConfirmModalState({
                                            isOpen: true,
                                            step: 'error',
                                            message: 'Error al cargar delegados disponibles',
                                            subMessage: 'Intente nuevamente más tarde.'
                                        });
                                    }
                                }}
                            >
                                <Users size={16} className="mr-2" /> Agregar Existente
                            </Button>
                        </div>
                    </div>
                    {delegadoClub ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Nombre Completo</label>
                                <div style={{ fontSize: '1rem', fontWeight: '500' }}>{delegadoClub.nombrePersona || '-'}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>DNI</label>
                                <div style={{ fontSize: '1rem', fontWeight: '500' }}>{delegadoClub.documento || '-'}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Email</label>
                                <div style={{ fontSize: '1rem', fontWeight: '500' }}>{delegadoClub.email || '-'}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Teléfono</label>
                                <div style={{ fontSize: '1rem', fontWeight: '500' }}>{delegadoClub.telefono || '-'}</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No hay delegado asignado a este club
                        </div>
                    )}
                </Card>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <Target size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{entrenadoresClub.length}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Entrenadores</div>
                    </Card>
                    <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <Users size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--success)' }} />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{atletasClub.length}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Atletas</div>
                    </Card>
                    <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <Calendar size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--warning)' }} />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{eventosAsistidos.length}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Eventos Asistidos</div>
                    </Card>
                </div>

                {/* Eventos Creados */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Calendar size={20} />
                            Eventos Creados ({eventosCreados.length})
                        </h3>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/dashboard/eventos/nuevo', { state: { clubId: club.idClub, returnPath: `/dashboard/clubes/detalles/${club.idClub}` } })}
                        >
                            <Plus size={16} className="mr-2" /> Agregar Evento
                        </Button>
                    </div>
                    {eventosCreados.length > 0 ? (
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Fecha Inicio</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventosCreados.map((ev) => (
                                        <tr key={ev.idEvento}>
                                            <td>{ev.nombre}</td>
                                            <td>{new Date(ev.fechaInicio).toLocaleDateString()}</td>
                                            <td>
                                                {new Date(ev.fechaFin) < new Date() ? 'Finalizado' : 'Próximo'}
                                            </td>
                                            <td>
                                                <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/eventos/${ev.idEvento}`)}>Ver</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No tiene eventos creados
                        </div>
                    )}
                </Card>

                {/* Eventos Asistidos */}
                <Card>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ClipboardList size={20} />
                        Eventos Asistidos ({eventosAsistidos.length})
                    </h3>
                    {eventosAsistidos.length > 0 ? (
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Fecha Inicio</th>
                                        <th>Atletas Inscritos</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventosAsistidos.map((ev) => {
                                        // Contar cuántos inscritos de este club hay en este evento
                                        const countInscritos = inscripciones.filter(i => i.idEvento === ev.idEvento && i.idClub === club.idClub).length;
                                        return (
                                            <tr key={ev.idEvento}>
                                                <td>{ev.nombre}</td>
                                                <td>{new Date(ev.fechaInicio).toLocaleDateString()}</td>
                                                <td>{countInscritos}</td>
                                                <td>
                                                    <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/eventos/${ev.idEvento}`)}>Ver</Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No ha asistido a ningún evento
                        </div>
                    )}
                </Card>


                {/* Entrenadores */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Target size={20} />
                            Entrenadores ({entrenadoresClub.length})
                        </h3>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/dashboard/entrenadores/nuevo', { state: { clubId: club.idClub, returnPath: `/dashboard/clubes/detalles/${club.idClub}` } })}
                        >
                            <Plus size={16} className="mr-2" /> Agregar Entrenador
                        </Button>
                    </div>
                    {entrenadoresClub.length > 0 ? (
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Licencia</th>
                                        <th>Categoría Selección</th>
                                        <th>Becado ENARD</th>
                                        <th>Becado SDN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entrenadoresClub.map((entrenador) => (
                                        <tr key={entrenador.idPersona}>
                                            <td>{entrenador.nombrePersona}</td>
                                            <td>{entrenador.licencia || '-'}</td>
                                            <td>
                                                {entrenador.categoriaSeleccion ?
                                                    getCategoriaLabel(entrenador.categoriaSeleccion) :
                                                    '-'
                                                }
                                            </td>
                                            <td>
                                                {entrenador.becadoEnard ? (
                                                    <span className="badge badge-success">Sí</span>
                                                ) : (
                                                    <span className="badge badge-secondary">No</span>
                                                )}
                                            </td>
                                            <td>
                                                {entrenador.becadoSdn ? (
                                                    <span className="badge badge-success">Sí</span>
                                                ) : (
                                                    <span className="badge badge-secondary">No</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No hay entrenadores registrados en este club
                        </div>
                    )}
                </Card>

                {/* Atletas */}
                <Card>
                    <div className="flex flex-col items-center mb-4 gap-3">
                        <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Users size={20} />
                            Atletas ({atletasClub.length})
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate('/dashboard/atletas/nuevo', {
                                    state: {
                                        clubId: club.idClub,
                                        returnPath: `/dashboard/clubes/detalles/${club.idClub}`
                                    }
                                })}
                            >
                                <Plus size={16} className="mr-2" /> Crear Atleta
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        const [allAtletas, allClubes] = await Promise.all([
                                            api.get('/Atleta'),
                                            api.get('/Club')
                                        ]);

                                        // Crear mapa de clubes para búsqueda rápida
                                        const clubsMap = allClubes.reduce((acc, c) => ({ ...acc, [c.idClub]: c.nombre }), {});

                                        // Enriquecer atletas con nombre de club y datos de persona si es necesario
                                        // Nota: Para la lista de selección, idClub y nombreClub es lo crítico
                                        const athletesWithClubName = await Promise.all(allAtletas.map(async (a) => {
                                            let nombrePersona = a.nombrePersona;
                                            if (!nombrePersona) {
                                                // Si no viene el nombre, intentar sacarlo de persona o dejar placeholder
                                                // En este contexto asumimos que viene o el endpoint /Atleta devolvió DTOs completos
                                                // Si falta info, podríamos buscar Persona, pero sería muy lento para TODOS.
                                                // Asumimos que el DTO de lista trae info básica.
                                            }
                                            return {
                                                ...a,
                                                nombreClub: a.idClub ? clubsMap[a.idClub] : null
                                            };
                                        }));

                                        setTodosAtletas(athletesWithClubName);
                                        setShowAddAtletaModal(true);
                                    } catch (error) {
                                        console.error("Error loading info for modal", error);
                                    }
                                }}
                            >
                                <Users size={16} className="mr-2" /> Agregar Existente
                            </Button>
                        </div>
                    </div>
                    {atletasClub.length > 0 ? (
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Documento</th>
                                        <th>Categoría</th>
                                        <th>Selección</th>
                                        <th>Estado Pago</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atletasClub.map((atleta) => (
                                        <tr
                                            key={atleta.idPersona}
                                            onClick={() => {
                                                setSelectedAtleta(atleta);
                                                setShowAtletaDetailsModal(true);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td>{atleta.nombrePersona}</td>
                                            <td>{atleta.documento}</td>
                                            <td>{getCategoriaLabel(atleta.categoria)}</td>
                                            <td>
                                                {atleta.perteneceSeleccion ? (
                                                    <span className="badge badge-success">Sí</span>
                                                ) : (
                                                    <span className="badge badge-secondary">No</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${atleta.estadoPago === 1 ? 'success' : 'warning'}`}>
                                                    {atleta.estadoPago === 1 ? 'Al día' : 'Pendiente'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No hay atletas registrados en este club
                        </div>
                    )}
                </Card>
            </div>
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
                                                        step: 'transfer_warning',
                                                        athlete: atleta,
                                                        message: `Este atleta pertenece a ${atleta.nombreClub}.`,
                                                        subMessage: 'Si continúas, el atleta será dado de baja de su club actual y asignado a este.'
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
                        confirmModalState.step === 'transfer_warning' ? 'Advertencia de Transferencia' :
                            confirmModalState.step === 'confirm' ? 'Confirmar Acción' :
                                confirmModalState.step === 'success' ? '¡Operación Exitosa!' :
                                    confirmModalState.step === 'error' ? 'Error' : 'Procesando...'
                    }
                    footer={
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            {confirmModalState.step === 'transfer_warning' && (
                                <>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                                        onClick={() => setConfirmModalState(prev => ({
                                            ...prev,
                                            step: 'confirm',
                                            message: '¿Estás seguro de realizar la transferencia?',
                                            subMessage: 'Esta acción es definitiva.'
                                        }))}
                                    >
                                        Entiendo, Continuar
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
                                                        IdPersona: fullAtleta.idPersona || fullAtleta.IdPersona,
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
                        {confirmModalState.step === 'transfer_warning' && (
                            <>
                                <AlertTriangle size={48} className="text-amber-500" style={{ color: 'var(--warning)' }} />
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
                    onRefresh={loadClubDetalles}
                    returnPath={`/dashboard/clubes/detalles/${id}`}
                />
            )}
        </div >
    );
};

export default ClubDetalles;
