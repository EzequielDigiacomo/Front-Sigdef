// En EntrenadoresSeleccionList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { getCategoriaLabel } from '../../utils/enums';
import './EntrenadorSeleccion.css';

const EntrenadorSeleccionList = () => {
    const [entrenadores, setEntrenadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadEntrenadores();
    }, []);

    const loadEntrenadores = async () => {
        try {
            // Usar el nuevo endpoint específico para entrenadores de selección
            const data = await api.get('/Entrenador/seleccion');
            setEntrenadores(data);
        } catch (error) {
            console.error('Error cargando entrenadores de selección:', error);
            // Si el endpoint nuevo no existe, fallback al endpoint general con filtro
            try {
                const allData = await api.get('/Entrenador');
                const entrenadoresSeleccion = allData.filter(ent =>
                    ent.perteneceSeleccion === true
                );
                setEntrenadores(entrenadoresSeleccion);
            } catch (fallbackError) {
                console.error('Error en fallback:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    // Filtrar por búsqueda en el frontend
    const filteredEntrenadores = entrenadores.filter(entrenador =>
        entrenador.nombrePersona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entrenador.licencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entrenador.nombreClub?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoriaLabel(parseInt(entrenador.categoriaSeleccion))?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este entrenador de selección?')) {
            try {
                await api.delete(`/Entrenador/${id}`);
                loadEntrenadores();
            } catch (error) {
                console.error('Error eliminando entrenador:', error);
                alert('Error al eliminar el entrenador');
            }
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">Entrenadores de Selección</h2>
                <Button onClick={() => navigate('/entrenadores-seleccion/nuevo')}>
                    <Plus size={20} /> Nuevo Entrenador
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, licencia, club o categoría..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Licencia</th>
                                <th>Categoría de Selección</th>
                                <th>Club</th>
                                <th>Becado ENARD</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center">Cargando...</td>
                                </tr>
                            ) : filteredEntrenadores.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">
                                        {searchTerm ? 'No se encontraron entrenadores con ese criterio' : 'No hay entrenadores de selección registrados'}
                                    </td>
                                </tr>
                            ) : (
                                filteredEntrenadores.map((entrenador) => (
                                    <tr key={entrenador.idPersona}>
                                        <td>{entrenador.nombrePersona || '-'}</td>
                                        <td>{entrenador.licencia || '-'}</td>
                                        <td>
                                            {entrenador.categoriaSeleccion ?
                                                getCategoriaLabel(parseInt(entrenador.categoriaSeleccion)) :
                                                'No asignada'
                                            }
                                        </td>
                                        <td>{entrenador.nombreClub || '-'}</td>
                                        <td>
                                            {entrenador.becadoEnard ? (
                                                <span className="badge badge-success">Sí</span>
                                            ) : (
                                                <span className="badge badge-secondary">No</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/entrenadores-seleccion/editar/${entrenador.idPersona}`)}
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

export default EntrenadorSeleccionList;