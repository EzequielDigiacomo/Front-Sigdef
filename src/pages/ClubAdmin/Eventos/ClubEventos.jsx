import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, MapPin, Users, Edit, Trash2, UserPlus } from 'lucide-react';
import Button from '../../../components/common/Button';
import DataTable from '../../../components/common/DataTable';
import './ClubEventos.css';

const ClubEventos = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEventos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.IdClub, user.idClub, user.clubId]);

    const fetchEventos = async () => {
        try {
            setLoading(true);
            const clubId = user.IdClub || user.idClub || user.clubId;

            if (!clubId) {
                console.error('❌ Error: No se encontró ID de club en el usuario');
                setEventos([]);
                setLoading(false);
                return;
            }

            let eventosDelClub = [];
            let strategyUsed = '';

            // ESTRATEGIA 1: Endpoint específico /Evento/club/{id}
            try {
                eventosDelClub = await api.get(`/Evento/club/${clubId}`);
                strategyUsed = 'specific_endpoint';
            } catch (error) {
                console.warn('⚠️ Falló /Evento/club/{id}, intentando Query Param...');

                // ESTRATEGIA 2: Query Param /Evento?idClub={id}
                try {
                    eventosDelClub = await api.get(`/Evento?idClub=${clubId}`);
                    // Verificar que el filtrado funcionó (que no devolvió todos)
                    // Si devolvió muchos eventos, verificamos si está filtrando
                    const allEvents = await api.get('/Evento');
                    if (eventosDelClub.length > 0 && eventosDelClub.length === allEvents.length && allEvents.length > 0) {
                        // Sospechoso: devolvió la misma cantidad. Verificamos si realmente filtró.
                        // Pero como no tenemos IdClub en la respuesta, es difícil saber.
                        // Asumimos que si no falló, funcionó, o el backend ignoró el query param.
                        console.warn('⚠️ Query param podría haber sido ignorado (misma cantidad que total).');
                    }
                    strategyUsed = 'query_param';
                } catch (qError) {
                    console.warn('⚠️ Falló Query Param, intentando filtrado manual...');

                    // ESTRATEGIA 3: Filtrado Manual sobre /Evento
                    const todosEventos = await api.get('/Evento');

                    if (todosEventos.length > 0) {
                        const first = todosEventos[0];
                        // Verificar si existe alguna propiedad de ID de Club
                        const hasClubId = 'idClub' in first || 'IdClub' in first || 'clubId' in first;

                        if (!hasClubId) {
                            console.error('SERVER ISSUE: Los eventos no tienen propiedad IdClub. No se puede filtrar.');
                            alert(`ERROR DE BACKEND: El endpoint /Evento devuelve eventos sin la propiedad 'IdClub'.\n\nKeys recibidas: ${Object.keys(first).join(', ')}\n\nPor favor verifica tu API o crea el endpoint /Evento/club/{id}.`);
                        }
                    }

                    eventosDelClub = todosEventos.filter(e =>
                        (e.IdClub || e.idClub || e.clubId) == clubId
                    );
                    strategyUsed = 'manual_filter';
                }
            }

            console.log(`✅ Eventos cargados usando estrategia: ${strategyUsed}. Total: ${eventosDelClub.length}`);

            // Obtener inscripciones
            try {
                const inscripciones = await api.get('/Inscripcion');
                eventosDelClub = eventosDelClub.map(evento => ({
                    ...evento,
                    cantidadInscripciones: inscripciones.filter(i => i.idEvento === evento.idEvento).length,
                    inscritos: inscripciones.filter(i => i.idEvento === evento.idEvento).length
                }));
            } catch (err) {
                console.warn('No se pudieron cargar inscripciones', err);
            }

            // Ordenar: Primero PROGRAMADO, luego EN_CURSO, luego FINALIZADO
            // Dentro de cada grupo, ordenar por fecha de inicio (más próximo primero)
            eventosDelClub.sort((a, b) => {
                const statusPriority = { 'PROGRAMADO': 1, 'EN_CURSO': 2, 'FINALIZADO': 3 };

                const estadoA = a.estado ? a.estado.toUpperCase() : '';
                const estadoB = b.estado ? b.estado.toUpperCase() : '';

                const priorityA = statusPriority[estadoA] || 99;
                const priorityB = statusPriority[estadoB] || 99;

                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }

                // Si tienen la misma prioridad, ordenar por fecha
                return new Date(a.fechaInicio) - new Date(b.fechaInicio);
            });

            setEventos(eventosDelClub);

        } catch (error) {
            console.error('❌ Error fatal al cargar eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
            try {
                await api.delete(`/Evento/${id}`);

                setEventos(eventos.filter(e => e.idEvento !== id));
            } catch (error) {
                console.error('Error al eliminar evento:', error);
                alert('Error al eliminar el evento. Por favor, intenta nuevamente.');
            }
        }
    };

    const getEstadoBadgeClass = (estado) => {
        switch (estado) {
            case 'PROGRAMADO':
                return 'badge-programado';
            case 'EN_CURSO':
                return 'badge-en-curso';
            case 'FINALIZADO':
                return 'badge-finalizado';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando eventos...</p>
            </div>
        );
    }

    return (
        <div className="club-eventos">
            <div className="page-header">
                <div>
                    <h1 className="text-gradient">Mis Eventos</h1>
                    <p className="page-subtitle">Eventos creados por tu club</p>
                </div>
                <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => navigate('/club/eventos/nuevo')}
                >
                    Crear Evento
                </Button>
            </div>

            <DataTable
                columns={[
                    { key: 'nombre', label: 'Evento' },
                    {
                        key: 'tipoEvento',
                        label: 'Tipo',
                        render: (value) => {
                            const tipos = { 1: 'Carrera', 2: 'Campeonato', 3: 'Recreativo', 4: 'Entrenamiento', 5: 'Clasificatorio' };
                            return tipos[value] || 'Evento';
                        }
                    },
                    {
                        key: 'ciudad',
                        label: 'Ciudad',
                        render: (value) => value || '-'
                    },
                    {
                        key: 'organizador',
                        label: 'Organizador',
                        render: (value, row) => (
                            <span className="font-medium">
                                {row.nombreClub || (row.idClub == (user.idClub || user.clubId) ? 'Mi Club' : 'Federación')}
                            </span>
                        )
                    },
                    {
                        key: 'estado',
                        label: 'Estado',
                        render: (value) => (
                            <span className={`evento-badge ${getEstadoBadgeClass(value?.toUpperCase())}`}>
                                {value}
                            </span>
                        )
                    },
                    {
                        key: 'fechaInicio',
                        label: 'Inicio',
                        render: (value) => value ? new Date(value).toLocaleDateString('es-AR') : '-'
                    },
                    {
                        key: 'fechaFinInscripciones',
                        label: 'Cierre Insc.',
                        render: (value) => value ? new Date(value).toLocaleDateString('es-AR') : '-'
                    },
                    {
                        key: 'cantidadInscripciones',
                        label: 'Inscritos',
                        render: (value) => (
                            <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span>{value || 0}</span>
                            </div>
                        )
                    }
                ]}
                data={eventos}
                loading={loading}
                emptyMessage="No hay eventos creados"
                actions={(evento) => (
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={UserPlus}
                            title="Inscribir Atleta"
                            onClick={() => navigate(`/club/inscripciones/nuevo?eventoId=${evento.idEvento}`)}
                        >
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={Users}
                            title="Modificar Inscripciones"
                            onClick={() => navigate(`/club/eventos/${evento.idEvento}`)}
                        >
                        </Button>
                    </div>
                )}
            />
        </div>
    );
};

export default ClubEventos;
