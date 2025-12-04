import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User, Calendar, Award } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import './ClubAtletas.css';

const ClubAtletas = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [atletas, setAtletas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAtleta, setSelectedAtleta] = useState(null);
    const [atletaDetails, setAtletaDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchAtletas();
    }, [user.clubId]);

    const fetchAtletas = async () => {
        try {
            setLoading(true);
            console.log('🔍 Obteniendo atletas...');
            console.log('👤 Usuario actual:', user);
            console.log('🏛️ Club ID del usuario:', user.clubId);

            const todosAtletas = await api.get('/Atleta');
            console.log('📊 Total de atletas en la DB:', todosAtletas.length);
            console.log('📋 PRIMER ATLETA COMPLETO:', todosAtletas[0]);

            // Filtrar solo atletas del club actual usando idClub
            const clubId = user.idClub || user.clubId;
            const atletasDelClub = todosAtletas.filter(a => {
                const atletaClubId = a.idClub || a.clubId;
                console.log(`Comparando: atleta.idClub (${atletaClubId}) === user.clubId (${clubId})`);
                return atletaClubId === clubId;
            });

            console.log('✅ Atletas del club filtrados:', atletasDelClub.length);
            console.log('📋 Atletas del club:', atletasDelClub);

            setAtletas(atletasDelClub);
        } catch (error) {
            console.error('❌ Error al cargar atletas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este atleta?')) {
            try {
                await api.delete(`/Atleta/${id}`);
                setAtletas(atletas.filter(a => a.idPersona !== id));
            } catch (error) {
                console.error('Error al eliminar atleta:', error);
                alert('Error al eliminar el atleta. Por favor, intenta nuevamente.');
            }
        }
    };

    const handleCardClick = async (atleta) => {
        setSelectedAtleta(atleta);
        setShowModal(true);
        setLoadingDetails(true);

        try {
            // Obtener datos completos de la persona
            const persona = await api.get(`/Persona/${atleta.idPersona}`);
            console.log('📋 Datos completos de la persona:', persona);

            // Intentar obtener tutor si existe
            let tutor = null;
            if (persona.idTutor) {
                try {
                    tutor = await api.get(`/Tutor/${persona.idTutor}`);
                    console.log('👨‍👩‍👧 Datos del tutor:', tutor);
                } catch (error) {
                    console.log('No se pudo obtener tutor:', error);
                }
            }

            setAtletaDetails({
                ...atleta,
                personaCompleta: persona,
                tutor: tutor
            });
        } catch (error) {
            console.error('Error al cargar detalles del atleta:', error);
            alert('Error al cargar los detalles del atleta');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedAtleta(null);
        setAtletaDetails(null);
    };

    // Mapeo de categorías (ajustar según tu enum en el backend)
    const getCategoriaTexto = (categoria) => {
        const categorias = {
            0: 'PRE-MINI',
            1: 'MINI',
            2: 'INFANTIL',
            3: 'CADETE',
            4: 'JUVENIL',
            5: 'JUNIOR',
            6: 'SENIOR',
            7: 'MASTER'
        };
        return categorias[categoria] || `Categoría ${categoria}`;
    };

    const filteredAtletas = atletas.filter(atleta => {
        const nombreCompleto = (atleta.nombrePersona || '').toLowerCase();
        return nombreCompleto.includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando atletas...</p>
            </div>
        );
    }

    return (
        <div className="club-atletas">
            <div className="page-header">
                <div>
                    <h1 className="text-gradient">Mis Atletas</h1>
                    <p className="page-subtitle">Gestiona los atletas de tu club</p>
                </div>
                <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => navigate('/club/atletas/nuevo')}
                >
                    Agregar Atleta
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

            <div className="atletas-grid">
                {filteredAtletas.length === 0 ? (
                    <div className="empty-state glass-panel">
                        <Users size={48} color="var(--text-secondary)" />
                        <h3>No hay atletas registrados</h3>
                        <p>Comienza agregando atletas a tu club</p>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => navigate('/club/atletas/nuevo')}
                        >
                            Agregar Primer Atleta
                        </Button>
                    </div>
                ) : (
                    filteredAtletas.map((atleta) => {
                        return (
                            <div
                                key={atleta.idPersona}
                                className="atleta-card glass-panel clickeable"
                                onClick={() => handleCardClick(atleta)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="atleta-header">
                                    <div className="atleta-avatar">
                                        <Users size={24} />
                                    </div>
                                    <div className="atleta-info">
                                        <h3>{atleta.nombrePersona || 'Sin nombre'}</h3>
                                        <span className="atleta-categoria">
                                            {getCategoriaTexto(atleta.categoria)}
                                        </span>
                                    </div>
                                </div>

                                <div className="atleta-details">
                                    <div className="detail-item">
                                        <span className="detail-label">Estado Pago:</span>
                                        <span className="detail-value">
                                            {atleta.estadoPago === 1 ? '✅ Al día' : '❌ Pendiente'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Selección:</span>
                                        <span className="detail-value">
                                            {atleta.perteneceSeleccion ? '⭐ Sí' : 'No'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Apto Médico:</span>
                                        <span className="detail-value">
                                            {atleta.presentoAptoMedico ? '✅ Presentado' : '❌ Pendiente'}
                                        </span>
                                    </div>
                                    {atleta.montoBeca > 0 && (
                                        <div className="detail-item">
                                            <span className="detail-label">Beca:</span>
                                            <span className="detail-value">
                                                ${atleta.montoBeca}
                                                {atleta.becadoEnard && ' (ENARD)'}
                                                {atleta.becadoSdn && ' (SDN)'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="atleta-actions">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        icon={Edit}
                                        onClick={() => navigate(`/club/atletas/editar/${atleta.idPersona}`)}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        icon={Trash2}
                                        onClick={() => handleDelete(atleta.idPersona)}
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal de Detalles del Atleta */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={`Detalles de ${selectedAtleta?.nombrePersona || 'Atleta'}`}
            >
                {loadingDetails ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner"></div>
                        <p>Cargando detalles...</p>
                    </div>
                ) : atletaDetails ? (
                    <div className="atleta-details-modal">
                        {/* Información Personal */}
                        <div className="detail-section">
                            <h4><User size={18} /> Información Personal</h4>
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <span className="label">Nombre Completo:</span>
                                    <span className="value">{atletaDetails.nombrePersona}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">DNI:</span>
                                    <span className="value">{atletaDetails.personaCompleta?.dni || 'No especificado'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Fecha de Nacimiento:</span>
                                    <span className="value">
                                        {atletaDetails.personaCompleta?.fechaNacimiento
                                            ? new Date(atletaDetails.personaCompleta.fechaNacimiento).toLocaleDateString('es-AR')
                                            : 'No especificada'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Sexo:</span>
                                    <span className="value">{atletaDetails.personaCompleta?.sexo || 'No especificado'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contacto */}
                        <div className="detail-section">
                            <h4><Phone size={18} /> Contacto</h4>
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <Phone size={16} />
                                    <span className="value">{atletaDetails.personaCompleta?.telefono || 'No especificado'}</span>
                                </div>
                                <div className="detail-row">
                                    <Mail size={16} />
                                    <span className="value">{atletaDetails.personaCompleta?.email || 'No especificado'}</span>
                                </div>
                                <div className="detail-row">
                                    <MapPin size={16} />
                                    <span className="value">{atletaDetails.personaCompleta?.direccion || 'No especificada'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Información Deportiva */}
                        <div className="detail-section">
                            <h4><Award size={18} /> Información Deportiva</h4>
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <span className="label">Categoría:</span>
                                    <span className="value">{getCategoriaTexto(atletaDetails.categoria)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Pertenece a Selección:</span>
                                    <span className="value">{atletaDetails.perteneceSeleccion ? '⭐ Sí' : 'No'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Estado de Pago:</span>
                                    <span className="value">{atletaDetails.estadoPago === 1 ? '✅ Al día' : '❌ Pendiente'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Apto Médico:</span>
                                    <span className="value">
                                        {atletaDetails.presentoAptoMedico
                                            ? `✅ Presentado (${new Date(atletaDetails.fechaAptoMedico).toLocaleDateString('es-AR')})`
                                            : '❌ Pendiente'}
                                    </span>
                                </div>
                                {atletaDetails.montoBeca > 0 && (
                                    <div className="detail-row">
                                        <span className="label">Beca:</span>
                                        <span className="value">
                                            ${atletaDetails.montoBeca}
                                            {atletaDetails.becadoEnard && ' (ENARD)'}
                                            {atletaDetails.becadoSdn && ' (SDN)'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tutor */}
                        <div className="detail-section">
                            <h4><Users size={18} /> Tutor</h4>
                            {atletaDetails.tutor ? (
                                <div className="detail-grid">
                                    <div className="detail-row">
                                        <span className="label">Nombre:</span>
                                        <span className="value">{atletaDetails.tutor.nombre || 'No especificado'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Phone size={16} />
                                        <span className="value">{atletaDetails.tutor.telefono || 'No especificado'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Mail size={16} />
                                        <span className="value">{atletaDetails.tutor.email || 'No especificado'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                        Este atleta no tiene tutor asignado
                                    </p>
                                    <Button
                                        variant="primary"
                                        icon={Plus}
                                        onClick={() => {
                                            handleCloseModal();
                                            navigate(`/club/tutores/nuevo?atletaId=${atletaDetails.idPersona}`);
                                        }}
                                    >
                                        Agregar Tutor
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Acciones */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <Button
                                variant="secondary"
                                icon={Edit}
                                onClick={() => {
                                    handleCloseModal();
                                    navigate(`/club/atletas/editar/${atletaDetails.idPersona}`);
                                }}
                            >
                                Editar Atleta
                            </Button>
                            <Button
                                variant="danger"
                                icon={Trash2}
                                onClick={() => {
                                    handleCloseModal();
                                    handleDelete(atletaDetails.idPersona);
                                }}
                            >
                                Eliminar
                            </Button>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default ClubAtletas;
