import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import { Plus, Edit, Trash2, Search, Users, Target } from 'lucide-react';
import { getCategoriaLabel } from '../../../utils/enums';
import './Clubes.css';

const ClubesList = () => {
    const [clubes, setClubes] = useState([]);
    const [atletas, setAtletas] = useState([]);
    const [entrenadores, setEntrenadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        console.log('🔍 useEffect ejecutado');
        loadData();
    }, []);

    const loadData = async () => {
        try {
            console.log('🔄 Cargando datos...');
            const [clubesData, atletasData, entrenadoresData] = await Promise.all([
                api.get('/Club'),
                api.get('/Atleta'),
                api.get('/Entrenador')
            ]);
            console.log('✅ Datos cargados:', {
                clubes: clubesData.length,
                atletas: atletasData.length,
                entrenadores: entrenadoresData.length
            });
            setClubes(clubesData);
            setAtletas(atletasData);
            setEntrenadores(entrenadoresData);
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const getClubStats = (idClub) => {
        const atletasClub = atletas.filter(a => a.idClub === idClub);
        const entrenadoresClub = entrenadores.filter(e => e.idClub === idClub);
        const totalAtletas = atletasClub.length;
        const totalEntrenadores = entrenadoresClub.length;

        const categorias = atletasClub.reduce((acc, curr) => {
            const cat = curr.categoria;
            if (cat !== null && cat !== undefined) {
                acc[cat] = (acc[cat] || 0) + 1;
            }
            return acc;
        }, {});

        return { totalAtletas, totalEntrenadores, categorias, atletasClub, entrenadoresClub };
    };

    const handleCardClick = (club) => {
        console.log('🎯 CLICK en card del club:', club.nombre);
        console.log('🔄 Navegando a:', `/clubes/detalles/${club.idClub}`);
        navigate(`/clubes/detalles/${club.idClub}`);
    };

    const handleEditClick = (e, clubId) => {
        e.stopPropagation();
        console.log('✏️ Click en editar club:', clubId);
        navigate(`/clubes/editar/${clubId}`);
    };

    const handleDeleteClick = (e, clubId) => {
        e.stopPropagation();
        console.log('🗑️ Click en eliminar club:', clubId);
        // Aquí iría la lógica para eliminar el club
    };

    // Filtrar clubes por búsqueda
    const filteredClubes = clubes.filter(club =>
        club.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.siglas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log('📊 Clubes a renderizar:', filteredClubes.length);

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">Gestión de Clubes</h2>
                <Button onClick={() => navigate('/clubes/nuevo')}>
                    <Plus size={20} /> Nuevo Club
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar club por nombre, siglas o direcci�n..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                {loading ? (
                    <div className="clubes-loading">Cargando clubes...</div>
                ) : filteredClubes.length === 0 ? (
                    <div className="clubes-empty">
                        <div className="clubes-empty-icon">🏢</div>
                        <p>No se encontraron clubes</p>
                        {searchTerm && <p>Intenta con otros términos de búsqueda</p>}
                    </div>
                ) : (
                    <div className="clubes-grid">
                        {filteredClubes.map((club) => {
                            const stats = getClubStats(club.idClub);
                            console.log(`🏷️ Renderizando club: ${club.nombre} (ID: ${club.idClub})`);

                            return (
                                <div
                                    key={club.idClub}
                                    className="club-card"
                                    onClick={() => handleCardClick(club)}
                                >
                                    <div className="club-card-header">
                                        <div>
                                            <h3 className="club-card-title">{club.nombre}</h3>
                                            <span className="club-card-siglas">
                                                {club.siglas}
                                            </span>
                                        </div>
                                        <div className="club-card-actions">
                                            <button
                                                className="club-card-action-btn"
                                                onClick={(e) => handleEditClick(e, club.idClub)}
                                                title="Editar club"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                className="club-card-action-btn delete"
                                                onClick={(e) => handleDeleteClick(e, club.idClub)}
                                                title="Eliminar club"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="club-card-info">
                                        <div className="club-card-detail">
                                            <strong>Dirección:</strong>
                                            <span>{club.direccion || 'No especificada'}</span>
                                        </div>
                                        <div className="club-card-detail">
                                            <strong>Teléfono:</strong>
                                            <span>{club.telefono || 'No especificado'}</span>
                                        </div>
                                    </div>

                                    <div className="club-card-stats">
                                        <div className="club-stat-item">
                                            <div className="club-stat-label">
                                                <Users size={16} />
                                                <span>Atletas</span>
                                            </div>
                                            <span className="club-stat-value atletas">
                                                {stats.totalAtletas}
                                            </span>
                                        </div>

                                        <div className="club-stat-item">
                                            <div className="club-stat-label">
                                                <Target size={16} />
                                                <span>Entrenadores</span>
                                            </div>
                                            <span className="club-stat-value entrenadores">
                                                {stats.totalEntrenadores}
                                            </span>
                                        </div>

                                        {Object.keys(stats.categorias).length > 0 && (
                                            <div className="club-categorias">
                                                <div className="club-categorias-title">
                                                    Atletas por Categoría:
                                                </div>
                                                <div className="club-categorias-list">
                                                    {Object.entries(stats.categorias).map(([catId, count]) => (
                                                        <span key={catId} className="club-categoria-badge">
                                                            {getCategoriaLabel(parseInt(catId))}: {count}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ClubesList;
