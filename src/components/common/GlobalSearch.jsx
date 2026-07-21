import React, { useState, useEffect } from 'react';
import { Search, X, User, Shield, Users as UsersIcon, ArrowRight, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { matchesSearch } from '../../utils/searchUtils';
import './GlobalSearch.css';

const normalizeAtleta = (a) => ({
    idPersona: a.idPersona ?? a.IdPersona ?? a.participanteId ?? a.ParticipanteId,
    nombrePersona:
        a.nombrePersona ??
        a.NombrePersona ??
        (`${a.nombre ?? a.Nombre ?? ''} ${a.apellido ?? a.Apellido ?? ''}`.trim() || '-'),
    documento: a.documento ?? a.Documento ?? a.dni ?? a.Dni ?? '',
    nombreClub: a.nombreClub ?? a.NombreClub ?? '',
});

const GlobalSearch = ({ isOpen, onClose, role }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ atletas: [], clubes: [] });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const isClub = role === 'CLUB';
    const clubId = user?.idClub ?? user?.clubId ?? user?.IdClub;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            loadSearchData();
        } else {
            document.body.style.overflow = 'auto';
            setQuery('');
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, isClub, clubId]);

    const loadSearchData = async () => {
        setLoading(true);
        try {
            if (isClub) {
                // Club: solo atletas de su club (no tiene acceso útil a /Club completo)
                let atletasData = [];
                if (clubId) {
                    try {
                        atletasData = await api.get(`/Atleta/club/${clubId}`, { silentErrors: true });
                    } catch {
                        const all = await api.get('/Atleta').catch(() => []);
                        atletasData = (Array.isArray(all) ? all : []).filter(
                            (a) => String(a.idClub ?? a.IdClub) === String(clubId)
                        );
                    }
                }
                setResults({
                    atletas: (Array.isArray(atletasData) ? atletasData : []).map(normalizeAtleta),
                    clubes: [],
                });
            } else {
                const [atletasData, clubesData] = await Promise.all([
                    api.get('/Atleta').catch(() => []),
                    api.get('/Club').catch(() => []),
                ]);
                setResults({
                    atletas: (Array.isArray(atletasData) ? atletasData : []).map(normalizeAtleta),
                    clubes: Array.isArray(clubesData) ? clubesData : [],
                });
            }
        } catch (err) {
            console.error('Error cargando datos de búsqueda:', err);
            setResults({ atletas: [], clubes: [] });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setQuery(e.target.value);
    };

    const getFilteredResults = () => {
        if (!query.trim()) return { atletas: [], clubes: [] };

        return {
            atletas: results.atletas
                .filter((a) => matchesSearch(query, a.nombrePersona, a.documento, a.nombreClub))
                .slice(0, 8),
            clubes: isClub
                ? []
                : results.clubes
                      .filter((c) => matchesSearch(query, c.nombre ?? c.Nombre, c.localidad ?? c.Localidad))
                      .slice(0, 3),
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
                        type="search"
                        placeholder={isClub ? 'Buscar atletas del club...' : 'Buscar atletas, clubes...'}
                        value={query}
                        onChange={handleSearch}
                        autoFocus
                    />
                    {query && <X size={20} className="clear-icon" onClick={() => setQuery('')} />}
                </div>
                <button type="button" className="close-search" onClick={onClose}>Cancelar</button>
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
                                        {filtered.atletas.map((atleta) => (
                                            <div
                                                key={atleta.idPersona}
                                                className="result-item"
                                                onClick={() =>
                                                    navigateTo(
                                                        isClub
                                                            ? `/club/atletas/editar/${atleta.idPersona}`
                                                            : `/dashboard/atletas/editar/${atleta.idPersona}`
                                                    )
                                                }
                                            >
                                                <div className="result-avatar"><UsersIcon size={18} /></div>
                                                <div className="result-info">
                                                    <p className="result-title">{atleta.nombrePersona || 'Sin nombre'}</p>
                                                    <p className="result-subtitle">
                                                        DNI: {atleta.documento || '—'}
                                                        {atleta.nombreClub ? ` - ${atleta.nombreClub}` : ''}
                                                    </p>
                                                </div>
                                                <ArrowRight size={16} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {filtered.clubes.length > 0 && (
                                    <div className="result-section">
                                        <p className="results-label">Clubes</p>
                                        {filtered.clubes.map((club) => (
                                            <div
                                                key={club.idClub ?? club.IdClub}
                                                className="result-item"
                                                onClick={() =>
                                                    navigateTo(`/dashboard/clubes/editar/${club.idClub ?? club.IdClub}`)
                                                }
                                            >
                                                <div className="result-avatar"><Building2 size={18} /></div>
                                                <div className="result-info">
                                                    <p className="result-title">{club.nombre ?? club.Nombre}</p>
                                                    <p className="result-subtitle">
                                                        {(club.localidad ?? club.Localidad) || 'Sin localidad'}
                                                    </p>
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
                            <div
                                className="quick-item"
                                onClick={() => navigateTo(isClub ? '/club/atletas' : '/dashboard/atletas')}
                            >
                                <UsersIcon size={24} />
                                <span>Atletas</span>
                            </div>
                            <div
                                className="quick-item"
                                onClick={() => navigateTo(isClub ? '/club/delegados' : '/dashboard/delegados')}
                            >
                                <Shield size={24} />
                                <span>Delegados</span>
                            </div>
                            <div
                                className="quick-item"
                                onClick={() => navigateTo(isClub ? '/club' : '/dashboard/clubes')}
                            >
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
