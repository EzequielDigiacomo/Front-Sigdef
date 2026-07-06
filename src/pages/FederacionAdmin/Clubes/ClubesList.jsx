import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import { Plus, Edit, Trash2, Search, Users, Target, Briefcase, ArrowLeft } from 'lucide-react';
import { useDevice } from '../../../hooks/useDevice';
import MobileCard from '../../../components/common/MobileCard';
import { withFederationScope, getClubFederationId } from '../../../utils/apiHelpers';
import { getCategoriaLabel, getEstadoPagoColor, getEstadoPagoLabel } from '../../../utils/enums';
import './Clubes.css';

const ClubesList = () => {
    const { isNative } = useDevice();
    const { fedId } = useParams();                       // Presente cuando el SuperAdmin navega a /superadmin/federacion/:fedId/clubes
    const isSuperAdminView = Boolean(fedId);
    const [clubes, setClubes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, [fedId]);

    const loadData = async () => {
        try {
            const clubesData = await api.get(withFederationScope('/Clubes', fedId));
            const normalizedClubes = Array.isArray(clubesData) ? clubesData.map(c => ({
                idClub: c.idClub ?? c.id ?? c.Id,
                nombre: c.nombre ?? c.Nombre,
                siglas: c.sigla ?? c.Sigla ?? c.siglas ?? c.Siglas ?? '',
                email: c.email ?? c.Email,
                telefono: c.telefono ?? c.Telefono,
                direccion: c.direccion ?? c.Direccion,
                idFederacion: getClubFederationId(c),
                estadoMatricula: c.estadoMatricula ?? c.EstadoMatricula ?? 0
            })) : [];

            if (fedId) {
                const filtrados = normalizedClubes.filter(c =>
                    String(c.idFederacion ?? '') === String(fedId)
                );
                setClubes(filtrados);
            } else {
                setClubes(normalizedClubes);
            }
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

            {/* Banner contextual SuperAdmin */}
            {isSuperAdminView && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: '10px',
                    padding: '0.7rem 1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                }}>
                    <button
                        onClick={() => navigate(`/superadmin/federacion/${fedId}`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600', fontSize: '0.85rem', padding: 0 }}
                    >
                        <ArrowLeft size={15} /> Volver al dashboard de la federación
                    </button>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Modo Supervisión SuperAdmin</span>
                </div>
            )}

            <div className="page-header">
                <h2 className="page-title">{isSuperAdminView ? 'Clubes de la Federación' : (isNative ? 'Clubes' : 'Gestión de Clubes')}</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button onClick={() => navigate('nuevo', { state: { returnPath: isSuperAdminView ? `/superadmin/federacion/${fedId}/clubes` : '/dashboard/clubes' } })} variant="primary" icon={Plus}>
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
