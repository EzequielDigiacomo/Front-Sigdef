import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import { Users, Award, ChevronRight, User, Plus } from 'lucide-react';
import { CATEGORIA_MAP } from '../../../utils/enums';
import './EntrenadorSeleccion.css?v=2';

const EntrenadorSeleccionList = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [coachesData, athletesData] = await Promise.all([
                api.get('/Entrenador/seleccion').catch(() => []),
                api.get('/Atleta').catch(() => [])
            ]);

            const selectionAthletes = (athletesData || []).filter(a => a.perteneceSeleccion);

            const categoryStats = Object.keys(CATEGORIA_MAP).map(key => {
                const categoryId = parseInt(key);
                const categoryLabel = CATEGORIA_MAP[key];

                // Get ALL coaches for this category
                const coaches = (coachesData || []).filter(c => parseInt(c.categoriaSeleccion) === categoryId);
                const coachNames = coaches.map(c => c.nombrePersona || `${c.nombre} ${c.apellido}`);

                const athleteCount = selectionAthletes.filter(a => a.categoria === categoryId).length;

                return {
                    id: categoryId,
                    label: categoryLabel,
                    coachNames: coachNames,
                    athleteCount: athleteCount,
                    // Para el estilo de la imagen, simulamos algunos datos adicionales
                    hasTrainer: coachNames.length > 0
                };
            });

            setStats(categoryStats);
        } catch (error) {
            console.error('Error loading selection dashboard:', error);
        } finally {
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

        const maxDisplay = 3; // Mostrar hasta 3 ahora que es más alta
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
            <div className="dashboard-selection-header">
                <div>
                    <h1 className="dashboard-title">
                        <Award className="text-primary" size={32} />
                        Selección Nacional
                    </h1>
                    <p className="dashboard-subtitle">Vista general de categorías y cuerpo técnico</p>
                </div>
            </div>

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
                            onClick={() => navigate(`/dashboard/selecciones/categoria/${stat.id}`)}
                        >
                            {/* Columna Izquierda: Icono y Título */}
                            <div className="card-col-left">
                                <div className="category-icon-wrapper">
                                    <Award size={48} />
                                </div>
                                <h3 className="category-title">{stat.label}</h3>
                            </div>

                            {/* Columna Central: Entrenadores */}
                            <div className="card-col-center">
                                <div className="section-label">Cuerpo Técnico</div>
                                {renderCoachSection(stat.coachNames)}
                            </div>

                            {/* Columna Derecha: Stats y Acción */}
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