import React, { useState, useEffect } from 'react';
import { Search, X, User, Shield, Users as UsersIcon, ArrowRight, Building2, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './GlobalSearch.css';

const GlobalSearch = ({ isOpen, onClose, role }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ atletas: [], clubes: [], entrenadores: [] });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Cargar datos iniciales cuando el buscador se abre
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            loadSearchData();
        } else {
            document.body.style.overflow = 'auto';
            setQuery('');
        }
    }, [isOpen]);

    const loadSearchData = async () => {
        setLoading(true);
        try {
            const [atletasData, clubesData] = await Promise.all([
                api.get('/Atleta'),
                api.get('/Club')
            ]);
            
            // Si el rol es FEDERACION, también podríamos buscar tutores/entrenadores
            // Pero por ahora atletas y clubes son lo más importante
            setResults({
                atletas: atletasData || [],
                clubes: clubesData || [],
                entrenadores: [] // Se puede expandir luego
            });
        } catch (err) {
            console.error('Error cargando datos de búsqueda:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setQuery(e.target.value);
    };

    const getFilteredResults = () => {
        if (!query) return { atletas: [], clubes: [] };
        const q = query.toLowerCase();
        
        return {
            atletas: results.atletas.filter(a => 
                a.nombrePersona?.toLowerCase().includes(q) || 
                a.documento?.includes(q)
            ).slice(0, 5),
            clubes: results.clubes.filter(c => 
                c.nombre?.toLowerCase().includes(q)
            ).slice(0, 3)
        };
    };

    const filtered = getFilteredResults();
    const hasResults = filtered.atletas.length > 0 || filtered.clubes.length > 0;

    const navigateTo = (path) => {
        navigate(path);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="global-search-overlay">
            <div className="search-header">
                <div className="search-input-wrapper">
                    <Search size={20} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Buscar atletas, clubes..." 
                        value={query}
                        onChange={handleSearch}
                        autoFocus
                    />
                    {query && <X size={20} className="clear-icon" onClick={() => setQuery('')} />}
                </div>
                <button className="close-search" onClick={onClose}>Cancelar</button>
            </div>

            <div className="search-results">
                {query.length > 0 ? (
                    <div className="results-list">
                        {loading ? (
                            <div className="search-loading">Buscando...</div>
                        ) : hasResults ? (
                            <>
                                {filtered.atletas.length > 0 && (
                                    <div className="result-section">
                                        <p className="results-label">Atletas</p>
                                        {filtered.atletas.map(atleta => (
                                            <div key={atleta.idPersona} className="result-item" onClick={() => navigateTo(role === 'CLUB' ? `/club/atleta/${atleta.idPersona}` : `/dashboard/atletas/editar/${atleta.idPersona}`)}>
                                                <div className="result-avatar"><UsersIcon size={18} /></div>
                                                <div className="result-info">
                                                    <p className="result-title">{atleta.nombrePersona}</p>
                                                    <p className="result-subtitle">DNI: {atleta.documento} {atleta.nombreClub ? ` - ${atleta.nombreClub}` : ''}</p>
                                                </div>
                                                <ArrowRight size={16} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {filtered.clubes.length > 0 && (
                                    <div className="result-section">
                                        <p className="results-label">Clubes</p>
                                        {filtered.clubes.map(club => (
                                            <div key={club.idClub} className="result-item" onClick={() => navigateTo(`/dashboard/clubes/editar/${club.idClub}`)}>
                                                <div className="result-avatar"><Building2 size={18} /></div>
                                                <div className="result-info">
                                                    <p className="result-title">{club.nombre}</p>
                                                    <p className="result-subtitle">{club.localidad || 'Sin localidad'}</p>
                                                </div>
                                                <ArrowRight size={16} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="no-results">
                                <Search size={40} />
                                <p>No se encontraron resultados para "{query}"</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="quick-access">
                        <p className="results-label">Accesos Rápidos</p>
                        <div className="quick-grid">
                            <div className="quick-item" onClick={() => navigateTo(role === 'CLUB' ? '/club/atletas' : '/dashboard/atletas')}>
                                <UsersIcon size={24} />
                                <span>Atletas</span>
                            </div>
                            <div className="quick-item" onClick={() => navigateTo(role === 'CLUB' ? '/club/delegados' : '/dashboard/delegados')}>
                                <Shield size={24} />
                                <span>Delegados</span>
                            </div>
                            <div className="quick-item" onClick={() => navigateTo(role === 'CLUB' ? '/club' : '/dashboard/clubes')}>
                                <User size={24} />
                                <span>Perfiles</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;
