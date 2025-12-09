import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Users, Target, Calendar, ClipboardList } from 'lucide-react';
import { getCategoriaLabel } from '../../../utils/enums';

const ClubDetalles = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [club, setClub] = useState(null);
    const [atletas, setAtletas] = useState([]);
    const [entrenadores, setEntrenadores] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [inscripciones, setInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClubDetalles();
    }, [id]);

    const loadClubDetalles = async () => {
        try {
            const [clubData, atletasData, entrenadoresData, eventosData, inscripcionesData] = await Promise.all([
                api.get(`/Club/${id}`),
                api.get('/Atleta'),
                api.get('/Entrenador'),
                api.get('/Evento'),
                api.get('/Inscripcion')
            ]);

            setClub(clubData);
            setAtletas(atletasData);
            setEntrenadores(entrenadoresData);
            setEventos(eventosData);
            setInscripciones(inscripcionesData);
        } catch (error) {
            console.error('Error cargando detalles del club:', error);
        } finally {
            setLoading(false);
        }
    };

    const getClubStats = () => {
        if (!club) return { atletasClub: [], entrenadoresClub: [], eventosCreados: [], eventosAsistidos: [] };

        const atletasClub = atletas.filter(a => a.idClub === club.idClub);
        const entrenadoresClub = entrenadores.filter(e => e.idClub === club.idClub);

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

        return { atletasClub, entrenadoresClub, eventosCreados, eventosAsistidos };
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

    const { atletasClub, entrenadoresClub, eventosCreados, eventosAsistidos } = getClubStats();

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
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Información del Club</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Siglas</label>
                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>{club.siglas}</div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Teléfono</label>
                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>{club.telefono || '-'}</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Dirección</label>
                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>{club.direccion || '-'}</div>
                        </div>
                    </div>
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
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={20} />
                        Eventos Creados ({eventosCreados.length})
                    </h3>
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
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={20} />
                        Entrenadores ({entrenadoresClub.length})
                    </h3>
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
                                                    getCategoriaLabel(parseInt(entrenador.categoriaSeleccion)) :
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
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={20} />
                        Atletas ({atletasClub.length})
                    </h3>
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
                                        <tr key={atleta.idPersona}>
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
        </div>
    );
};

export default ClubDetalles;
