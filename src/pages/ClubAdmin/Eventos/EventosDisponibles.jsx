import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { Trophy, Calendar, MapPin, Users, UserPlus, Search } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import { matchesSearch } from '../../../utils/searchUtils';
import './EventosDisponibles.css';

const EventosDisponibles = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEventosDisponibles();
    }, []);

    const fetchEventosDisponibles = async () => {
        try {
            setLoading(true);

            const todosEventos = await api.get('/Evento');

            const clubes = await api.get('/Club');

            const inscripciones = await api.get('/Inscripcion');

            console.log('Todos los eventos:', todosEventos);
            console.log('Mi Club ID:', user?.idClub ?? user?.clubId);

            const myClubId = user?.idClub ?? user?.clubId ?? user?.IdClub;
            const eventosDisponibles = todosEventos
                .filter(e => {

                    const esOtroClub = e.idClub != myClubId;

                    const esFuturo = new Date(e.fechaFin) >= new Date();
                    return esOtroClub && esFuturo;
                })
                .map(evento => {

                    const clubOrganizador = clubes.find(c => c.id === evento.idClub || c.idClub === evento.idClub);

                    const inscritosTotal = inscripciones.filter(i => i.idEvento === evento.idEvento || i.idEvento === evento.id).length;

                    return {
                        ...evento,
                        nombre: evento.nombre ?? evento.Nombre ?? '',
                        ubicacion: evento.ubicacion ?? evento.Ubicacion ?? '',
                        organizador: clubOrganizador ? (clubOrganizador.nombre ?? clubOrganizador.Nombre) : 'Federación Argentina',
                        inscritosTotal,
                        cupoMaximo: evento.cupoMaximo || 100
                    };
                });

            setEventos(eventosDisponibles);
        } catch (error) {
            console.error('Error al cargar eventos disponibles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInscribir = (eventoId) => {

        navigate(`/club/inscripciones/nuevo?eventoId=${eventoId}`);
    };

    const filteredEventos = eventos.filter((evento) =>
        matchesSearch(
            searchTerm,
            evento.nombre,
            evento.ubicacion,
            evento.organizador,
        )
    );

    const calcularCuposDisponibles = (inscritosTotal, cupoMaximo) => {
        return cupoMaximo - inscritosTotal;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando eventos disponibles...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="text-gradient">Eventos Disponibles</h1>
                    <p className="page-subtitle">Inscribe a tus atletas en eventos de otros clubes y la federación</p>
                </div>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar eventos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="dark-focused" />
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Evento</th>
                                <th>Organizador</th>
                                <th>Fecha</th>
                                <th>Ubicación</th>
                                <th>Cupos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEventos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">
                                        No hay eventos disponibles que coincidan con tu búsqueda
                                    </td>
                                </tr>
                            ) : (
                                filteredEventos.map(evento => {
                                    const cuposDisponibles = calcularCuposDisponibles(evento.inscritosTotal, evento.cupoMaximo);
                                    const cuposLimitados = cuposDisponibles < 10;

                                    return (
                                        <tr key={evento.idEvento}>
                                            <td>
                                                <strong>{evento.nombre}</strong>
                                            </td>
                                            <td>{evento.organizador}</td>
                                            <td>
                                                {new Date(evento.fechaInicio).toLocaleDateString('es-AR')}
                                            </td>
                                            <td>{evento.ubicacion}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span>{evento.inscritosTotal} / {evento.cupoMaximo}</span>
                                                    {cuposLimitados && (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                                                            ¡Últimos lugares!
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    icon={UserPlus}
                                                    onClick={() => handleInscribir(evento.idEvento)}
                                                    disabled={cuposDisponibles === 0}
                                                >
                                                    {cuposDisponibles === 0 ? 'Agotado' : 'Inscribir'}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default EventosDisponibles;
