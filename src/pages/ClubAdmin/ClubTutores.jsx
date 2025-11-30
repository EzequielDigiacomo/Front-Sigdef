import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { UserCheck, Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import Button from '../../components/common/Button';
import './ClubAtletas.css'; // Reusing styles for consistency

const ClubTutores = () => {
    const navigate = useNavigate();
    const [tutores, setTutores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTutores();
    }, []);

    const fetchTutores = async () => {
        try {
            setLoading(true);
            const data = await api.get('/Tutor');
            setTutores(data);
        } catch (error) {
            console.error('Error al cargar tutores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este tutor?')) {
            try {
                await api.delete(`/Tutor/${id}`);
                setTutores(tutores.filter(t => t.idPersona !== id));
            } catch (error) {
                console.error('Error al eliminar tutor:', error);
                alert('Error al eliminar el tutor. Por favor, intenta nuevamente.');
            }
        }
    };

    const filteredTutores = tutores.filter(tutor => {
        const nombreCompleto = (tutor.nombrePersona || `${tutor.persona?.nombre} ${tutor.persona?.apellido}` || '').toLowerCase();
        return nombreCompleto.includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando tutores...</p>
            </div>
        );
    }

    return (
        <div className="club-atletas"> {/* Reusing class for layout */}
            <div className="page-header">
                <div>
                    <h1 className="text-gradient">Mis Tutores</h1>
                    <p className="page-subtitle">Gestiona los tutores y responsables</p>
                </div>
                <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => navigate('/club/tutores/nuevo')}
                >
                    Agregar Tutor
                </Button>
            </div>

            <div className="search-section glass-panel">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="atletas-grid"> {/* Reusing grid class */}
                {filteredTutores.length === 0 ? (
                    <div className="empty-state glass-panel">
                        <UserCheck size={48} color="var(--text-secondary)" />
                        <h3>No hay tutores registrados</h3>
                        <p>Comienza agregando tutores a tu club</p>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => navigate('/club/tutores/nuevo')}
                        >
                            Agregar Primer Tutor
                        </Button>
                    </div>
                ) : (
                    filteredTutores.map((tutor) => (
                        <div key={tutor.idPersona} className="atleta-card glass-panel">
                            <div className="atleta-header">
                                <div className="atleta-avatar" style={{ background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}>
                                    <UserCheck size={24} />
                                </div>
                                <div className="atleta-info">
                                    <h3>{tutor.nombrePersona || `${tutor.persona?.nombre} ${tutor.persona?.apellido}`}</h3>
                                    <span className="atleta-categoria">Tutor</span>
                                </div>
                            </div>

                            <div className="atleta-details">
                                <div className="detail-item">
                                    <span className="detail-label"><Phone size={14} /> Teléfono:</span>
                                    <span className="detail-value">{tutor.telefono || tutor.persona?.telefono || '-'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label"><Mail size={14} /> Email:</span>
                                    <span className="detail-value">{tutor.email || tutor.persona?.email || '-'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label"><MapPin size={14} /> Dirección:</span>
                                    <span className="detail-value">{tutor.direccion || tutor.persona?.direccion || '-'}</span>
                                </div>
                            </div>

                            <div className="atleta-actions">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={Edit}
                                    onClick={() => navigate(`/club/tutores/editar/${tutor.idPersona}`)}
                                >
                                    Editar
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => handleDelete(tutor.idPersona)}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ClubTutores;
