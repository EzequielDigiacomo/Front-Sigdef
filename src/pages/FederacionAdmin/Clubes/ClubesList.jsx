import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import { Plus, Edit, Trash2, Search, Users, Target, Briefcase } from 'lucide-react';
import { getCategoriaLabel } from '../../../utils/enums';
import './Clubes.css';

const ClubesList = () => {
    const [clubes, setClubes] = useState([]);
    const [atletas, setAtletas] = useState([]);
    const [entrenadores, setEntrenadores] = useState([]);
    const [delegados, setDelegados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [clubesData, atletasData, entrenadoresData, delegadosData] = await Promise.all([
                api.get('/Club'),
                api.get('/Atleta'),
                api.get('/Entrenador'),
                api.get('/DelegadoClub')
            ]);
            setClubes(clubesData);
            setAtletas(atletasData);
            setEntrenadores(entrenadoresData);
            setDelegados(delegadosData);
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const getClubStats = (idClub) => {
        const atletasClub = atletas.filter(a => a.idClub === idClub);
        const entrenadoresClub = entrenadores.filter(e => e.idClub === idClub);
        const delegadoClub = delegados.find(d => d.idClub === idClub);
        const totalAtletas = atletasClub.length;
        const totalEntrenadores = entrenadoresClub.length;

        const categorias = atletasClub.reduce((acc, curr) => {
            const cat = curr.categoria;
            if (cat !== null && cat !== undefined) {
                acc[cat] = (acc[cat] || 0) + 1;
            }
            return acc;
        }, {});

        return { totalAtletas, totalEntrenadores, categorias, atletasClub, entrenadoresClub, delegadoClub };
    };

    const handleCardClick = (club) => {
        console.log('🎯 CLICK en card del club:', club.nombre);
        // Usar navegación relativa para mantenerse dentro del dashboard
        navigate(`detalles/${club.idClub}`);
    };

    const handleEditClick = (e, clubId) => {
        e.stopPropagation();
        console.log('✏️ Click en editar club:', clubId);
        navigate(`editar/${clubId}`);
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

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">Gestión de Clubes</h2>
                <Button onClick={() => navigate('nuevo')}>
                    <Plus size={20} /> Nuevo Club
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar club por nombre, siglas o dirección..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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

                                        <div className="club-stat-item">
                                            <div className="club-stat-label">
                                                <Briefcase size={16} />
                                                <span>Delegado</span>
                                            </div>
                                            <span className={`club-stat-value ${stats.delegadoClub ? 'atletas' : 'entrenadores'}`}>
                                                {stats.delegadoClub ? '✓' : '✗'}
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
