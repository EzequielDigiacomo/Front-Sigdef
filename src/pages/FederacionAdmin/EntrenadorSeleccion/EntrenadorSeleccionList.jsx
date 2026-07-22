import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import { Users, Award, ChevronRight, User, Plus } from 'lucide-react';
import { CATEGORIA_MAP, normalizeCategoriaId } from '../../../utils/enums';
import { withFederationScope } from '../../../utils/apiHelpers';
import PageHeader from '../../../components/common/PageHeader';
import './EntrenadorSeleccion.css?v=2';

const EntrenadorSeleccionList = () => {
    const { fedId } = useParams();
    const isSuperAdminView = Boolean(fedId);
    const backTo = isSuperAdminView ? `/superadmin/federacion/${fedId}` : '/dashboard';
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const baseEntrenadores = isSuperAdminView
        ? `/superadmin/federacion/${fedId}/entrenadores`
        : '/dashboard/entrenadores';
    const baseSelecciones = isSuperAdminView
        ? `/superadmin/federacion/${fedId}/selecciones`
        : '/dashboard/selecciones';

    useEffect(() => {
        fetchData();
    }, [fedId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const coachesPromise = api
                .get(withFederationScope('/Entrenador/seleccion', fedId))
                .catch(() => []);
            const athletesPromise = api.get(withFederationScope('/Atleta', fedId)).catch(() => []);

            const buildStats = (coachesData, athletesData) => {
                const selectionAthletes = (athletesData || []).filter(
                    (a) => !!(a.perteneceSeleccion ?? a.PerteneceSeleccion)
                );

                return Object.keys(CATEGORIA_MAP).map((key) => {
                    const categoryId = parseInt(key, 10);
                    const categoryLabel = CATEGORIA_MAP[key];

                    const coaches = (coachesData || []).filter(
                        (c) =>
                            normalizeCategoriaId(c.categoriaSeleccion ?? c.CategoriaSeleccion) ===
                            categoryId
                    );
                    const coachNames = coaches.map(
                        (c) =>
                            c.nombrePersona ||
                            c.NombrePersona ||
                            `${c.nombre || c.Nombre || ''} ${c.apellido || c.Apellido || ''}`.trim() ||
                            'Entrenador'
                    );

                    const athleteCount = selectionAthletes.filter((a) => {
                        const cat = a.categoria ?? a.Categoria;
                        return normalizeCategoriaId(cat) === categoryId;
                    }).length;

                    return {
                        id: categoryId,
                        label: categoryLabel,
                        coachNames,
                        athleteCount,
                        hasTrainer: coachNames.length > 0,
                    };
                });
            };

            const coachesData = await coachesPromise;
            setStats(buildStats(coachesData, []));
            setLoading(false);

            const athletesData = await athletesPromise;
            setStats(buildStats(coachesData, athletesData));
        } catch (error) {
            console.error('Error loading selection dashboard:', error);
            setLoading(false);
        }
    };

    const renderCoachSection = (names) => {
        if (!names || names.length === 0) {
            return (
                <div className="no-coach-badge">
                    <span className="mr-2">⚠️</span> No asignado
                </div>
            );
        }

        const maxDisplay = 3;
        const displayed = names.slice(0, maxDisplay);
        const remaining = names.length - maxDisplay;

        return (
            <div className="coach-mini-list">
                {displayed.map((name, i) => (
                    <div key={i} className="coach-mini-item">
                        <div className="coach-avatar-small">
                            <User size={14} />
                        </div>
                        <span className="text-ellipsis" title={name}>{name}</span>
                    </div>
                ))}
                {remaining > 0 && (
                    <span className="text-xs text-primary font-medium ml-1">+{remaining} más</span>
                )}
            </div>
        );
    };

    return (
        <div className="dashboard-selection-container fade-in">
            <PageHeader
                title="Selección Nacional"
                subtitle="Vista general de categorías y cuerpo técnico"
                icon={Award}
                backTo={backTo}
                backLabel={isSuperAdminView ? 'Dashboard federación' : 'Dashboard'}
                actions={(
                    <button
                        className="btn-primary"
                        onClick={() => navigate(`${baseEntrenadores}/nuevo`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} />
                        Crear Entrenador
                    </button>
                )}
            />

            {loading ? (
                <div className="flex-center h-64">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="categories-grid">
                    {stats.map((stat) => (
                        <div
                            key={stat.id}
                            className="category-card-horizontal"
                            onClick={() => navigate(`${baseSelecciones}/categoria/${stat.id}`)}
                        >
                            <div className="card-col-left">
                                <div className="category-icon-wrapper">
                                    <Award size={32} />
                                </div>
                                <h3 className="category-title">{stat.label}</h3>
                            </div>

                            <div className="card-col-center">
                                <div className="section-label">Cuerpo Técnico</div>
                                {renderCoachSection(stat.coachNames)}
                            </div>

                            <div className="card-col-right">
                                <div className="stat-group">
                                    <div className="stat-big-number">{stat.athleteCount}</div>
                                    <div className="stat-sublabel">Atletas</div>
                                </div>
                                <div className="btn-icon-action">
                                    <ChevronRight size={28} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EntrenadorSeleccionList;