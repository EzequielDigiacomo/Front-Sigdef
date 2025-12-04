// ClubEntrenadores.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, Edit, Trash2, Search, Award, CheckCircle, XCircle } from 'lucide-react';
import '../Atletas/Atletas.css';

const ClubEntrenadores = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [entrenadores, setEntrenadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEntrenadores();
    }, [user.clubId, user.idClub]);

    const fetchEntrenadores = async () => {
        try {
            setLoading(true);
            const data = await api.get('/Entrenador');

            // Filtrar solo entrenadores del club actual
            const clubId = user.idClub || user.clubId;
            const entrenadoresDelClub = data.filter(e => {
                const entrenadorClubId = e.idClub || e.clubId;
                return entrenadorClubId == clubId;
            });

            setEntrenadores(entrenadoresDelClub);
        } catch (error) {
            console.error('Error cargando entrenadores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este entrenador?')) {
            try {
                await api.delete(`/Entrenador/${id}`);
                setEntrenadores(entrenadores.filter(e => e.idPersona !== id));
                alert('Entrenador eliminado exitosamente');
            } catch (error) {
                console.error('Error eliminando entrenador:', error);
                alert('Error al eliminar el entrenador');
            }
        }
    };

    const filteredEntrenadores = entrenadores.filter(entrenador =>
        entrenador.nombrePersona?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando entrenadores...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">Mis Entrenadores</h2>
                <Button onClick={() => navigate('/club/entrenadores/nuevo')}>
                    <Plus size={20} /> Nuevo Entrenador
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                {/* <th>Licencia</th> Eliminado */}
                                <th>Selección</th>
                                <th>Becas</th>
                                <th>Apto Médico</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntrenadores.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center">
                                        No hay entrenadores registrados
                                    </td>
                                </tr>
                            ) : (
                                filteredEntrenadores.map((entrenador) => (
                                    <tr key={entrenador.idPersona}>
                                        <td>
                                            <strong>{entrenador.nombrePersona || 'Sin nombre'}</strong>
                                        </td>
                                        {/* <td>{entrenador.licencia || '-'}</td> Eliminado */}
                                        <td>
                                            {entrenador.perteneceSeleccion ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                                                    <CheckCircle size={16} />
                                                    {entrenador.categoriaSeleccion || 'Sí'}
                                                </span>
                                            ) : (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                                    <XCircle size={16} />
                                                    No
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                {entrenador.becadoEnard && <span className="badge badge-primary">ENARD</span>}
                                                {entrenador.becadoSdn && <span className="badge badge-info">SDN</span>}
                                                {!entrenador.becadoEnard && !entrenador.becadoSdn && <span>-</span>}
                                            </div>
                                        </td>
                                        <td>
                                            {entrenador.presentoAptoMedico ? (
                                                <CheckCircle size={18} color="var(--success)" />
                                            ) : (
                                                <XCircle size={18} color="var(--danger)" />
                                            )}
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/club/entrenadores/editar/${entrenador.idPersona}`)}
                                                >
                                                    <Edit size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-danger"
                                                    onClick={() => handleDelete(entrenador.idPersona)}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ClubEntrenadores;
