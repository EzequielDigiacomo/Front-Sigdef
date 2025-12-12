import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Users, Target, Calendar, ClipboardList, Edit, Plus } from 'lucide-react';
import Modal from '../../../components/common/Modal';
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

    useEffect(() => {
        loadClubDetalles();
    }, [id]);

    const loadClubDetalles = async () => {
        try {
            const [clubData, atletasData, entrenadoresData, delegadosData, eventosData, inscripcionesData] = await Promise.all([
                api.get(`/Club/${id}`),
                api.get('/Atleta'),
                api.get('/Entrenador'),
                api.get('/DelegadoClub'),
                api.get('/Evento'),
                api.get('/Inscripcion')
            ]);

            // Enriquecer atletas con datos de Persona para obtener documento
            const atletasEnriquecidos = await Promise.all(
                atletasData.map(async (atleta) => {
                    try {
                        const personaData = await api.get(`/Persona/${atleta.idPersona}`);
                        return {
                            ...atleta,
                            documento: personaData.documento || '-'
                        };
                    } catch (error) {
                        console.error('Error obteniendo Persona:', error);
                        return atleta;
                    }
                })
            );

            setClub(clubData);
            setAtletas(atletasEnriquecidos);
            setEntrenadores(entrenadoresData);
            setDelegados(delegadosData);
            setEventos(eventosData);
            setInscripciones(inscripcionesData);
        } catch (error) {
            console.error('Error cargando detalles del club:', error);
        } finally {
            setLoading(false);
        }
    };

    const getClubStats = () => {
        if (!club) return { atletasClub: [], entrenadoresClub: [], delegadoClub: null, eventosCreados: [], eventosAsistidos: [] };

        const atletasClub = atletas.filter(a => a.idClub === club.idClub);
        const entrenadoresClub = entrenadores.filter(e => e.idClub === club.idClub);
        const delegadoClub = delegados.find(d => d.idClub === club.idClub);

        // Eventos creados por el club (asumiendo idClub o clubId propiedad en evento)
        // Se intenta matchear por idClub
        const eventosCreados = eventos.filter(e => e.idClub === club.idClub);

        // Eventos a los cuales ha asistido (inscripciones del club)
        // Filtramos inscripciones de este club
        const inscripcionesClub = inscripciones.filter(i => i.idClub === club.idClub);
        // Obtenemos los IDs de eventos únicos
        const eventosAsistidosIds = [...new Set(inscripcionesClub.map(i => i.idEvento))];
        // Filtramos la lista completa de eventos
        const eventosAsistidos = eventos.filter(e => eventosAsistidosIds.includes(e.idEvento));

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
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Delegado del Club</h3>
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
                    <div className="flex justify-between items-center mb-4">
                        <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Users size={20} />
                            Atletas ({atletasClub.length})
                        </h3>
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
                            <Plus size={16} className="mr-2" /> Agregar Atleta
                        </Button>
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
            {/* Modal Agregar Atleta Existente */}
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
                                            onClick={async () => {
                                                const confirmMsg = atleta.idClub
                                                    ? `Este atleta pertenece a ${atleta.nombreClub}. ¿Deseas transferirlo a este club?`
                                                    : `¿Deseas agregar a ${atleta.nombrePersona} a este club?`;

                                                if (window.confirm(confirmMsg)) {
                                                    try {
                                                        const fullAtleta = await api.get(`/Atleta/${atleta.idPersona}`);
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

                                                        await api.put(`/Atleta/${atleta.idPersona}`, payload);

                                                        alert('Atleta agregado exitosamente');
                                                        setShowAddAtletaModal(false);
                                                        loadClubDetalles();
                                                    } catch (error) {
                                                        console.error('Error moviendo atleta:', error);
                                                        alert('Error al mover el atleta. Revisa la consola.');
                                                    }
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

            {/* Modal Detalles Atleta */}
            {showAtletaDetailsModal && selectedAtleta && (
                <Modal
                    isOpen={showAtletaDetailsModal}
                    onClose={() => {
                        setShowAtletaDetailsModal(false);
                        setSelectedAtleta(null);
                    }}
                    title="Detalles del Atleta"
                    footer={
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => {
                                setShowAtletaDetailsModal(false);
                                setSelectedAtleta(null);
                            }}>
                                Cerrar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowAtletaDetailsModal(false);
                                    navigate(`/dashboard/atletas/editar/${selectedAtleta.idPersona}`, {
                                        state: { returnPath: `/dashboard/clubes/detalles/${id}` }
                                    });
                                }}
                            >
                                <Edit size={18} /> Editar Atleta
                            </Button>
                        </div>
                    }
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1rem' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="detail-label">Nombre Completo</label>
                            <div className="detail-value" style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>
                                {selectedAtleta.nombrePersona}
                            </div>
                        </div>
                        <div>
                            <label className="detail-label">DNI</label>
                            <div className="detail-value">{selectedAtleta.documento}</div>
                        </div>
                        <div>
                            <label className="detail-label">Categoría</label>
                            <div className="detail-value">{getCategoriaLabel(selectedAtleta.categoria)}</div>
                        </div>
                        <div>
                            <label className="detail-label">Selección</label>
                            <div className="detail-value">
                                {selectedAtleta.perteneceSeleccion ? (
                                    <span className="badge badge-success">Sí</span>
                                ) : (
                                    <span className="badge badge-secondary">No</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="detail-label">Estado Pago</label>
                            <div className="detail-value">
                                <span className={`badge badge-${selectedAtleta.estadoPago === 1 ? 'success' : 'warning'}`}>
                                    {selectedAtleta.estadoPago === 1 ? 'Al día' : 'Pendiente'}
                                </span>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ClubDetalles;
