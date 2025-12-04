import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import { Users, Award, ChevronRight } from 'lucide-react';
import { CATEGORIA_MAP } from '../../utils/enums';
import './EntrenadorSeleccion.css';

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
                const coach = (coachesData || []).find(c => parseInt(c.categoriaSeleccion) === categoryId);
                const athleteCount = selectionAthletes.filter(a => a.categoria === categoryId).length;

                return {
                    id: categoryId,
                    label: categoryLabel,
                    coachName: coach ? (coach.nombrePersona || `${coach.nombre} ${coach.apellido}`) : 'Sin asignar',
                    athleteCount: athleteCount
                };
            });

            setStats(categoryStats);
        } catch (error) {
            console.error('Error loading selection dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">
                    <Award size={24} className="text-primary" />
                    Selección Nacional
                </h1>
                <p className="page-subtitle">Panel de gestión por categorías</p>
            </div>

            {loading ? (
                <div className="text-center py-8">Cargando dashboard...</div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    {stats.map((stat) => (
                        <Card
                            key={stat.id}
                            className="category-card cursor-pointer hover:shadow-lg transition-all"
                            onClick={() => navigate(`/dashboard/entrenadores-seleccion/categoria/${stat.id}`)}
                            style={{ padding: '0.75rem' }}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="p-1.5 bg-primary-light rounded-lg">
                                    <Award className="text-primary" size={18} />
                                </div>
                                <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>
                                    {stat.athleteCount}
                                </span>
                            </div>

                            <h3 className="text-base font-bold mb-1.5">{stat.label}</h3>

                            <div className="flex items-center text-gray-600 mb-1.5" style={{ fontSize: '0.75rem' }}>
                                <Users size={12} className="mr-1" />
                                <span style={{
                                    fontSize: '0.75rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {stat.coachName}
                                </span>
                            </div>

                            <div className="flex justify-end text-primary font-medium items-center" style={{ fontSize: '0.7rem' }}>
                                Ver <ChevronRight size={12} className="ml-0.5" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EntrenadorSeleccionList;