import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import '../Atletas/Atletas.css';
import './Evento.css';

const EventosList = () => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadEventos();
    }, []);

    const loadEventos = async () => {
        try {
            const data = await api.get('/Evento');

            // Ordenar: Futuros/Actuales primero, Pasados al final
            const now = new Date();
            const sortedData = data.sort((a, b) => {
                const endA = new Date(a.fechaFin);
                const endB = new Date(b.fechaFin);
                const isPastA = endA < now;
                const isPastB = endB < now;

                if (isPastA && !isPastB) return 1;
                if (!isPastA && isPastB) return -1;
                return endA - endB; // Ordenar por fecha dentro del mismo grupo
            });

            setEventos(sortedData);
        } catch (error) {
            console.error('Error cargando eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Evitar navegar al detalle
        if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
            try {
                await api.delete(`/Evento/${id}`);
                setEventos(prev => prev.filter(ev => ev.idEvento !== id));
            } catch (error) {
                console.error('Error eliminando evento:', error);
                alert('Error al eliminar el evento');
            }
        }
    };

    // 🔹 FUNCIÓN PARA MANEJAR CLICK EN FILA
    const handleRowClick = (eventoId) => {
        navigate(`/eventos/${eventoId}`);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">Gestión de Eventos</h2>
                <Button onClick={() => navigate('/eventos/nuevo')}>
                    <Plus size={20} /> Nuevo Evento
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Buscar evento..." className="search-input" />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Fecha Inicio</th>
                                <th>Fecha Fin</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="text-center">Cargando...</td></tr>
                            ) : eventos.map((evento) => {
                                const isPast = new Date(evento.fechaFin) < new Date();
                                return (
                                    <tr
                                        key={evento.idEvento}
                                        className="clickable-row"
                                        onClick={() => handleRowClick(evento.idEvento)}
                                        style={{
                                            cursor: 'pointer',
                                            ...(isPast ? { opacity: 0.6, backgroundColor: '#f9fafb20' } : {})
                                        }}
                                    >
                                        <td>
                                            <strong>{evento.nombre}</strong>
                                            {isPast && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(Finalizado)</span>}
                                        </td>
                                        <td>{new Date(evento.fechaInicio).toLocaleDateString()}</td>
                                        <td>{new Date(evento.fechaFin).toLocaleDateString()}</td>
                                        <td>
                                            <div className="actions-cell">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/eventos/editar/${evento.idEvento}`);
                                                    }}
                                                >
                                                    <Edit size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-danger"
                                                    onClick={(e) => handleDelete(evento.idEvento, e)}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default EventosList;