import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import { Plus, Edit, Trash2, Search, Users, Target, Briefcase } from 'lucide-react';
import { useDevice } from '../../../hooks/useDevice';
import MobileCard from '../../../components/common/MobileCard';
import { getCategoriaLabel, getEstadoPagoColor, getEstadoPagoLabel } from '../../../utils/enums';
import { seedDatabase } from '../../../utils/seeder';
import './Clubes.css';

const ClubesList = () => {
    const { isNative } = useDevice();
    const [clubes, setClubes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const clubesData = await api.get('/Club');
            setClubes(clubesData);
        } catch (error) {
            console.error('Error cargando clubes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (club) => {
        navigate(`detalles/${club.idClub}`);
    };

    const handleEditClick = (e, clubId) => {
        e.stopPropagation();
        navigate(`editar/${clubId}`);
    };

    const filteredClubes = clubes.filter(club =>
        club.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.siglas.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`page-container ${isNative ? 'mobile-view' : ''}`}>
            <div className="page-header">
                <h2 className="page-title">{isNative ? 'Clubes' : 'Gestión de Clubes'}</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!isNative && (
                        <Button variant="danger" onClick={seedDatabase}>
                            GENERAR DATOS TEST
                        </Button>
                    )}
                    <Button onClick={() => navigate('nuevo')} variant="primary" icon={Plus}>
                        {isNative ? 'Nuevo' : 'Nuevo Club'}
                    </Button>
                </div>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="dark-focused" />
                </div>

                {loading ? (
                    <div className="clubes-loading">Cargando clubes...</div>
                ) : filteredClubes.length === 0 ? (
                    <div className="clubes-empty">
                        <p>No se encontraron clubes</p>
                    </div>
                ) : isNative ? (
                    <div className="mobile-list-container">
                        {filteredClubes.map((club) => (
                            <MobileCard 
                                key={club.idClub}
                                title={club.nombre}
                                subtitle={club.siglas}
                                badge={
                                    <div className="flex gap-2">
                                        <span className="badge badge-info"><Users size={12} /> {club.cantidadAtletas || 0}</span>
                                        <span className={`badge badge-${getEstadoPagoColor(club.estadoMatricula)}`}>
                                            {getEstadoPagoLabel(club.estadoMatricula)}
                                        </span>
                                    </div>
                                }
                                details={[
                                    { label: 'Dirección', value: club.direccion || '-' },
                                    { label: 'Entr.', value: club.cantidadEntrenadores || 0 },
                                    { label: 'Del.', value: club.tieneDelegado ? '✅' : '❌' }
                                ]}
                                actions={
                                    <Button variant="ghost" size="sm" icon={Edit} onClick={(e) => handleEditClick(e, club.idClub)} />
                                }
                                onClick={() => handleCardClick(club)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="clubes-grid">
                        {filteredClubes.map((club) => {
                            const stats = {
                                totalAtletas: club.cantidadAtletas || 0,
                                totalEntrenadores: club.cantidadEntrenadores || 0,
                                categorias: club.atletasPorCategoria || {},
                                delegadoClub: club.tieneDelegado
                            };

                            return (
                                <div key={club.idClub} className="club-card" onClick={() => handleCardClick(club)}>
                                    <div className="club-card-header">
                                        <div>
                                            <h3 className="club-card-title">{club.nombre}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="club-card-siglas">{club.siglas}</span>
                                                <span className={`badge badge-${getEstadoPagoColor(club.estadoMatricula)}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                                    {getEstadoPagoLabel(club.estadoMatricula)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="club-card-actions">
                                            <button className="club-card-action-btn" onClick={(e) => handleEditClick(e, club.idClub)}><Edit size={18} /></button>
                                            <button className="club-card-action-btn delete" onClick={(e) => e.stopPropagation()}><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                    <div className="club-card-info">
                                        <div className="club-card-detail"><strong>Dirección:</strong> <span>{club.direccion || 'No especificada'}</span></div>
                                        <div className="club-card-detail"><strong>Teléfono:</strong> <span>{club.telefono || 'No especificado'}</span></div>
                                    </div>
                                    <div className="club-card-stats">
                                        <div className="club-stat-item"><div className="club-stat-label"><Users size={16} /><span>Atletas</span></div><span className="club-stat-value atletas">{stats.totalAtletas}</span></div>
                                        <div className="club-stat-item"><div className="club-stat-label"><Target size={16} /><span>Entrenadores</span></div><span className="club-stat-value entrenadores">{stats.totalEntrenadores}</span></div>
                                        <div className="club-stat-item"><div className="club-stat-label"><Briefcase size={16} /><span>Delegado</span></div><span className={`club-stat-value ${stats.delegadoClub ? 'atletas' : 'entrenadores'}`}>{stats.delegadoClub ? '✓' : '✗'}</span></div>
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
