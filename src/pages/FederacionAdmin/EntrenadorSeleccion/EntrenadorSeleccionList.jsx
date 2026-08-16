import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import Button from '../../../components/common/Button';
import { Award, ChevronRight, User, Plus, AlertTriangle, Users } from 'lucide-react';
import { CATEGORIA_MAP, normalizeCategoriaId } from '../../../utils/enums';
import { withFederationScope } from '../../../utils/apiHelpers';
import PageHeader from '../../../components/common/PageHeader';
import './EntrenadorSeleccion.css';

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

    const summary = useMemo(() => {
        const totalAtletas = stats.reduce((acc, s) => acc + (s.athleteCount || 0), 0);
        const conStaff = stats.filter((s) => s.hasTrainer).length;
        const sinStaff = stats.length - conStaff;
        return { totalAtletas, conStaff, sinStaff, categorias: stats.length };
    }, [stats]);

    const renderCoachSection = (names) => {
        if (!names || names.length === 0) {
            return (
                <span className="sel-chip sel-chip-warn">
                    <AlertTriangle size={12} />
                    Sin staff
                </span>
            );
        }

        const maxDisplay = 2;
        const displayed = names.slice(0, maxDisplay);
        const remaining = names.length - maxDisplay;

        return (
            <div className="sel-coach-inline">
                {displayed.map((name, i) => (
                    <span key={i} className="sel-chip sel-chip-ok" title={name}>
                        <User size={11} />
                        <span className="sel-chip-text">{name}</span>
                    </span>
                ))}
                {remaining > 0 && (
                    <span className="sel-chip sel-chip-muted">+{remaining}</span>
                )}
            </div>
        );
    };

    return (
        <div className="sel-page fade-in">
            <PageHeader
                title="Selección Nacional"
                subtitle="Categorías, cuerpo técnico y planteles"
                icon={Award}
                backTo={backTo}
                backLabel={isSuperAdminView ? 'Federación' : 'Dashboard'}
                actions={(
                    <Button
                        variant="primary"
                        size="sm"
                        icon={Plus}
                        onClick={() => navigate(`${baseEntrenadores}/nuevo`)}
                    >
                        Crear entrenador
                    </Button>
                )}
            />

            {!loading && (
                <div className="sel-kpi-row">
                    <div className="sel-kpi">
                        <span className="sel-kpi-label">Categorías</span>
                        <span className="sel-kpi-value">{summary.categorias}</span>
                    </div>
                    <div className="sel-kpi">
                        <span className="sel-kpi-label">Atletas</span>
                        <span className="sel-kpi-value">{summary.totalAtletas}</span>
                    </div>
                    <div className="sel-kpi">
                        <span className="sel-kpi-label">Con staff</span>
                        <span className="sel-kpi-value sel-kpi-ok">{summary.conStaff}</span>
                    </div>
                    <div className="sel-kpi">
                        <span className="sel-kpi-label">Sin staff</span>
                        <span className="sel-kpi-value sel-kpi-warn">{summary.sinStaff}</span>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="sel-loading">
                    <div className="spinner" />
                </div>
            ) : (
                <div className="sel-cat-grid">
                    {stats.map((stat) => (
                        <button
                            type="button"
                            key={stat.id}
                            className={`sel-cat-card${stat.hasTrainer ? '' : ' is-empty-staff'}`}
                            onClick={() => navigate(`${baseSelecciones}/categoria/${stat.id}`)}
                        >
                            <div className="sel-cat-top">
                                <div className="sel-cat-icon" aria-hidden>
                                    <Award size={16} />
                                </div>
                                <div className="sel-cat-title-wrap">
                                    <h3 className="sel-cat-title">{stat.label}</h3>
                                    <span className="sel-cat-meta">
                                        <Users size={12} />
                                        {stat.athleteCount} atleta{stat.athleteCount === 1 ? '' : 's'}
                                    </span>
                                </div>
                                <span className="sel-cat-go" aria-hidden>
                                    <ChevronRight size={16} />
                                </span>
                            </div>
                            <div className="sel-cat-staff">
                                <span className="sel-staff-label">Cuerpo técnico</span>
                                {renderCoachSection(stat.coachNames)}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EntrenadorSeleccionList;
