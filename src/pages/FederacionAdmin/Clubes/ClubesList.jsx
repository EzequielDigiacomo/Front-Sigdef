import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import {
    Plus, Edit, Trash2, Search, Users, Target, Briefcase, ArrowLeft,
    Mail, Phone, MapPin, Building2, CheckCircle2, AlertCircle, Eye,
} from 'lucide-react';
import { useDevice } from '../../../hooks/useDevice';
import { withFederationScope, getClubFederationId, pick } from '../../../utils/apiHelpers';
import './Clubes.css';

const getAfiliacionLabel = (alDia) => (alDia ? 'Al Día (Anual)' : 'Deudor');
const getAfiliacionBadgeClass = (alDia) => (alDia ? 'badge-success' : 'badge-danger');

const ClubesList = () => {
    const { isNative } = useDevice();
    const { fedId } = useParams();
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
            setLoading(true);
            const [clubesData, clubSigdefRaw] = await Promise.all([
                api.get(withFederationScope('/Clubes', fedId)).catch(() => []),
                api.get(withFederationScope('/Club', fedId)).catch(() => []),
            ]);

            const sigdefById = new Map(
                (Array.isArray(clubSigdefRaw) ? clubSigdefRaw : []).map((c) => {
                    const id = c.idClub ?? c.IdClub ?? c.id ?? c.Id;
                    return [String(id), c];
                })
            );

            let normalizedClubes = (Array.isArray(clubesData) ? clubesData : []).map((c) => {
                const id = c.idClub ?? c.id ?? c.Id ?? c.IdClub;
                const sig = sigdefById.get(String(id)) || {};
                return {
                    idClub: id,
                    nombre: pick(c, 'nombre', 'Nombre') || pick(sig, 'nombre', 'Nombre') || 'Sin nombre',
                    siglas: pick(c, 'sigla', 'Sigla', 'siglas', 'Siglas')
                        || pick(sig, 'sigla', 'Sigla', 'siglas', 'Siglas')
                        || '',
                    email: pick(c, 'email', 'Email') || pick(sig, 'email', 'Email') || '',
                    telefono: pick(c, 'telefono', 'Telefono') || pick(sig, 'telefono', 'Telefono') || '',
                    direccion: pick(c, 'direccion', 'Direccion') || pick(sig, 'direccion', 'Direccion') || '',
                    ubicacion: pick(c, 'ubicacion', 'Ubicacion') || '',
                    idFederacion: getClubFederationId(c) ?? getClubFederationId(sig),
                    federacionNombre: pick(c, 'federacionNombre', 'FederacionNombre') || '',
                    activo: pick(c, 'activo', 'Activo') !== false,
                    pagoAfiliacionAlDia: pick(c, 'pagoAfiliacionAlDia', 'PagoAfiliacionAlDia') !== false,
                    bloqueadoPorFaltaDePago: !!pick(c, 'bloqueadoPorFaltaDePago', 'BloqueadoPorFaltaDePago'),
                    planNombre: pick(c, 'planNombre', 'PlanNombre') || '',
                    frecuenciaPago: pick(c, 'frecuenciaPago', 'FrecuenciaPago') || '',
                    fechaVencimientoPlan: pick(c, 'fechaVencimientoPlan', 'FechaVencimientoPlan') || null,
                    cantidadAtletas: pick(c, 'cantidadAtletas', 'CantidadAtletas')
                        ?? pick(sig, 'cantidadAtletas', 'CantidadAtletas')
                        ?? 0,
                    cantidadEntrenadores: pick(sig, 'cantidadEntrenadores', 'CantidadEntrenadores')
                        ?? pick(c, 'cantidadEntrenadores', 'CantidadEntrenadores')
                        ?? 0,
                    cantidadRepresentantes: pick(sig, 'cantidadRepresentantes', 'CantidadRepresentantes')
                        ?? pick(c, 'cantidadRepresentantes', 'CantidadRepresentantes')
                        ?? 0,
                    tieneDelegado: !!(
                        pick(sig, 'tieneDelegado', 'TieneDelegado')
                        ?? pick(c, 'tieneDelegado', 'TieneDelegado')
                    ),
                };
            });

            if (fedId) {
                normalizedClubes = normalizedClubes.filter(
                    (c) => String(c.idFederacion ?? '') === String(fedId)
                );
            }

            setClubes(normalizedClubes);
        } catch (error) {
            console.error('Error cargando clubes:', error);
            setClubes([]);
        } finally {
            setLoading(false);
        }
    };

    const basePath = isSuperAdminView
        ? `/superadmin/federacion/${fedId}/clubes`
        : '/dashboard/clubes';

    const handleEditClick = (e, clubId) => {
        e.stopPropagation();
        navigate(`${basePath}/editar/${clubId}`, { state: { returnPath: basePath } });
    };

    const handleDetailClick = (e, clubId) => {
        e.stopPropagation();
        navigate(`${basePath}/detalles/${clubId}`);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
    };

    const filteredClubes = clubes.filter((club) => {
        const term = searchTerm.toLowerCase();
        return (
            (club.nombre || '').toLowerCase().includes(term) ||
            (club.siglas || '').toLowerCase().includes(term) ||
            (club.email || '').toLowerCase().includes(term) ||
            (club.direccion || '').toLowerCase().includes(term)
        );
    });

    const formatVencimiento = (fecha) => {
        if (!fecha) return null;
        const d = new Date(fecha);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString('es-AR');
    };

    const renderClubCard = (club) => (
        <article key={club.idClub} className="club-card club-card-full">
            <div className="club-card-header">
                <div className="club-card-heading">
                    <h3 className="club-card-title">{club.nombre}</h3>
                    <div className="club-card-badges">
                        {club.siglas && <span className="club-card-siglas">{club.siglas}</span>}
                        <span className={`badge ${getAfiliacionBadgeClass(club.pagoAfiliacionAlDia)}`}>
                            {club.pagoAfiliacionAlDia
                                ? <><CheckCircle2 size={12} /> {getAfiliacionLabel(true)}</>
                                : <><AlertCircle size={12} /> {getAfiliacionLabel(false)}</>}
                        </span>
                        <span className={`badge ${club.activo ? 'badge-info' : 'badge-secondary'}`}>
                            {club.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        {club.bloqueadoPorFaltaDePago && (
                            <span className="badge badge-danger">Bloqueado</span>
                        )}
                    </div>
                </div>
                <div className="club-card-actions">
                    <button
                        type="button"
                        className="club-card-action-btn"
                        title="Ver detalle"
                        onClick={(e) => handleDetailClick(e, club.idClub)}
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        type="button"
                        className="club-card-action-btn"
                        title="Editar"
                        onClick={(e) => handleEditClick(e, club.idClub)}
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        type="button"
                        className="club-card-action-btn delete"
                        title="Eliminar"
                        onClick={handleDeleteClick}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="club-card-info">
                <div className="club-card-detail">
                    <Mail size={14} />
                    <span>{club.email || 'Sin email'}</span>
                </div>
                <div className="club-card-detail">
                    <Phone size={14} />
                    <span>{club.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="club-card-detail">
                    <MapPin size={14} />
                    <span>{club.direccion || club.ubicacion || 'Sin dirección'}</span>
                </div>
                {club.federacionNombre && (
                    <div className="club-card-detail">
                        <Building2 size={14} />
                        <span>{club.federacionNombre}</span>
                    </div>
                )}
                {(club.planNombre || club.frecuenciaPago || club.fechaVencimientoPlan) && (
                    <div className="club-card-plan">
                        {club.planNombre && <span>Plan: <strong>{club.planNombre}</strong></span>}
                        {club.frecuenciaPago && <span>{club.frecuenciaPago}</span>}
                        {formatVencimiento(club.fechaVencimientoPlan) && (
                            <span>Vence: {formatVencimiento(club.fechaVencimientoPlan)}</span>
                        )}
                    </div>
                )}
            </div>

            <div className="club-card-stats club-card-stats-grid">
                <div className="club-stat-chip tone-blue">
                    <Users size={14} />
                    <div>
                        <strong>{club.cantidadAtletas || 0}</strong>
                        <span>Atletas</span>
                    </div>
                </div>
                <div className="club-stat-chip tone-amber">
                    <Target size={14} />
                    <div>
                        <strong>{club.cantidadEntrenadores || 0}</strong>
                        <span>Entrenadores</span>
                    </div>
                </div>
                <div className={`club-stat-chip ${club.tieneDelegado || club.cantidadRepresentantes > 0 ? 'tone-green' : 'tone-muted'}`}>
                    <Briefcase size={14} />
                    <div>
                        <strong>
                            {club.cantidadRepresentantes > 0
                                ? club.cantidadRepresentantes
                                : (club.tieneDelegado ? 'Sí' : 'No')}
                        </strong>
                        <span>Delegado</span>
                    </div>
                </div>
            </div>
        </article>
    );

    return (
        <div className={`page-container clubes-page ${isNative ? 'mobile-view' : ''}`}>
            {isSuperAdminView && (
                <div className="clubes-sa-banner">
                    <button
                        type="button"
                        onClick={() => navigate(`/superadmin/federacion/${fedId}`)}
                        className="clubes-sa-back"
                    >
                        <ArrowLeft size={15} /> Volver al dashboard de la federación
                    </button>
                    <span className="clubes-sa-sep">|</span>
                    <span className="clubes-sa-note">Modo Supervisión SuperAdmin</span>
                </div>
            )}

            <div className="page-header">
                <div>
                    <h2 className="page-title">
                        {isSuperAdminView ? 'Clubes de la Federación' : (isNative ? 'Clubes' : 'Gestión de Clubes')}
                    </h2>
                    <p className="clubes-count">
                        {filteredClubes.length} club{filteredClubes.length !== 1 ? 'es' : ''}
                    </p>
                </div>
                <Button
                    onClick={() => navigate('nuevo', { state: { returnPath: basePath } })}
                    variant="primary"
                    icon={Plus}
                >
                    {isNative ? 'Nuevo' : 'Nuevo Club'}
                </Button>
            </div>

            <Card className="clubes-shell">
                <div className="filters-bar">
                    <FormField
                        icon={Search}
                        placeholder="Buscar por nombre, sigla, email o dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        variant="dark-focused"
                    />
                </div>

                {loading ? (
                    <div className="clubes-loading">Cargando clubes...</div>
                ) : filteredClubes.length === 0 ? (
                    <div className="clubes-empty">
                        <p>No se encontraron clubes</p>
                    </div>
                ) : (
                    <div className="clubes-grid">
                        {filteredClubes.map(renderClubCard)}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ClubesList;
