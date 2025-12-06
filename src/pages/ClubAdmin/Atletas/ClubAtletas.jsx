import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User, Calendar, Award } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import Modal from '../../../components/common/Modal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import DataTable from '../../../components/common/DataTable';
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [atletaToDelete, setAtletaToDelete] = useState(null);
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });

    // DEBUG: Verificar estructura del usuario
    useEffect(() => {
        console.log('🔍 DEBUG - Estructura del usuario:');
        if (user) {
            console.log('👤 Usuario completo:', JSON.stringify(user, null, 2));
            console.log('📋 Campos disponibles:', Object.keys(user));

            // Buscar cualquier campo que contenga "club" o "Club"
            Object.keys(user).forEach(key => {
                if (key.toLowerCase().includes('club')) {
                    console.log(`✅ Campo relacionado con club: "${key}" =`, user[key]);
                }
            });

            // Verificar IdClub específicamente
            if (user.IdClub !== undefined) {
                console.log(`🎯 ¡ENCONTRADO! user.IdClub =`, user.IdClub);
            }
        }
    }, [user]);

    useEffect(() => {
        console.log('🔄 useEffect ejecutándose');

        // IMPORTANTE: Buscar IdClub (con I mayúscula)
        const clubId = user?.IdClub ||
            user?.idClub ||
            user?.club?.id ||
            (user && user.id && user.id.toString().includes('club') ? user.id : null);

        console.log('🏢 Club ID encontrado:', clubId);
        console.log('📋 Tipo de clubId:', typeof clubId);

        if (clubId) {
            console.log(`✅ Club ID válido encontrado: ${clubId}`);
            fetchAtletas(clubId);
        } else {
            console.error('❌ No se pudo obtener el IdClub');
            console.error('❌ User object:', user);

            // Mostrar qué campos tiene el usuario
            if (user) {
                console.error('❌ Campos del usuario:', Object.keys(user));
                Object.keys(user).forEach(key => {
                    console.error(`   - ${key}:`, user[key], '(tipo:', typeof user[key], ')');
                });
            }

            setErrorModal({
                isOpen: true,
                title: 'Error de configuración',
                message: 'No se pudo identificar tu club. El campo IdClub no está disponible en tu perfil.'
            });
            setLoading(false);
        }
    }, [user]);

    const fetchAtletas = async (clubId) => {
        try {
            setLoading(true);
            console.log(`🔍 INICIANDO fetchAtletas para clubId: ${clubId} (tipo: ${typeof clubId})`);

            let data = [];
            let source = '';

            // PRIMERO: Intentar endpoints específicos (ajustados para IdClub)
            try {
                console.log(`📡 Intentando GET /Atleta/club/${clubId}`);
                data = await api.get(`/Atleta/club/${clubId}`, { silentErrors: true });
                source = 'Endpoint /Atleta/club/{id}';
                console.log(`✅ ${source}: ${data?.length || 0} atletas`);
            } catch (e1) {
                console.warn(`⚠️ /Atleta/club/${clubId} falló:`, e1.message);

                try {
                    console.log(`📡 Intentando GET /Club/${clubId}/Atletas`);
                    data = await api.get(`/Club/${clubId}/Atletas`, { silentErrors: true });
                    source = 'Endpoint /Club/{id}/Atletas';
                    console.log(`✅ ${source}: ${data?.length || 0} atletas`);
                } catch (e2) {
                    console.warn(`⚠️ /Club/${clubId}/Atletas falló:`, e2.message);

                    // FALLBACK: Obtener todos y filtrar por IdClub
                    console.log('📡 Usando FALLBACK: Obtener todos los atletas y filtrar');
                    const todos = await api.get('/Atleta');
                    console.log(`📦 Total atletas en DB: ${todos?.length || 0}`);

                    if (todos && todos.length > 0) {
                        // DEBUG: Ver estructura del primer atleta
                        const primerAtleta = todos[0];
                        console.log('📋 Primer atleta estructura:', JSON.stringify(primerAtleta, null, 2));

                        // Buscar el campo correcto (probablemente IdClub con I mayúscula)
                        const campoClub = Object.keys(primerAtleta).find(key =>
                            key === 'IdClub' ||
                            key === 'idClub' ||
                            key.toLowerCase() === 'idclub'
                        );

                        console.log(`🔍 Campo de club encontrado: "${campoClub}"`);

                        if (campoClub) {
                            // Filtrar usando string comparison para evitar problemas de tipo
                            data = todos.filter(a => {
                                const clubIdAtleta = a[campoClub];
                                const match = clubIdAtleta !== undefined &&
                                    clubIdAtleta !== null &&
                                    String(clubIdAtleta) === String(clubId);

                                if (match) {
                                    console.log(`   ✅ Match: Atleta "${a.nombrePersona}" - ${campoClub}=${clubIdAtleta}`);
                                }

                                return match;
                            });
                        } else {
                            console.error('❌ No se encontró campo de club en los atletas');
                            // Mostrar todos los campos del primer atleta para debug
                            console.log('📋 Todos los campos disponibles:', Object.keys(primerAtleta));
                        }
                    }
                    source = 'Fallback Filter';
                }
            }

            console.log(`📊 Resultado final (${source}): ${data?.length || 0} atletas`);
            setAtletas(data || []);

            if ((data?.length || 0) === 0) {
                console.warn('⚠️ No se encontraron atletas para este club');
            }

        } catch (error) {
            console.error('❌ Error fatal en fetchAtletas:', error);
            setErrorModal({
                isOpen: true,
                title: 'Error',
                message: 'No se pudieron cargar los atletas. Por favor, intenta nuevamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Resto de las funciones se mantienen igual...
    const handleDeleteClick = (atleta) => {
        setAtletaToDelete(atleta);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!atletaToDelete) return;

        try {
            await api.delete(`/Atleta/${atletaToDelete.idPersona}`);
            setAtletas(atletas.filter(a => a.idPersona !== atletaToDelete.idPersona));
            setShowDeleteModal(false);
            setAtletaToDelete(null);
        } catch (error) {
            console.error('Error al eliminar atleta:', error);
            setShowDeleteModal(false);
            setErrorModal({
                isOpen: true,
                title: 'Error al eliminar',
                message: 'Hubo un problema al intentar eliminar el atleta.'
            });
        }
    };

    const handleCardClick = async (atleta) => {
        setSelectedAtleta(atleta);
        setShowModal(true);
        setLoadingDetails(true);

        try {
            const persona = await api.get(`/Persona/${atleta.idPersona}`);
            console.log('📋 Datos completos de la persona:', persona);

            let tutor = null;
            if (persona.idTutor) {
                try {
                    tutor = await api.get(`/Tutor/${persona.idTutor}`);
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
            setErrorModal({
                isOpen: true,
                title: 'Error',
                message: 'Error al cargar los detalles del atleta'
            });
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedAtleta(null);
        setAtletaDetails(null);
    };

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

                    {/* Botón de debug temporal */}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            console.log('🔍 DEBUG COMPLETO:');
                            console.log('👤 Usuario:', user);
                            console.log('🏢 Club ID (IdClub):', user?.IdClub);
                            console.log('📦 Total atletas cargados:', atletas.length);
                            console.log('🔍 Primer atleta (si existe):', atletas[0]);
                            alert('Revisa la consola (F12) para ver la información de debug');
                        }}
                        style={{ marginTop: '10px', fontSize: '12px' }}
                    >
                        Debug Info
                    </Button>
                </div>
                <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => navigate('/club/atletas/nuevo')}
                >
                    Agregar Atleta
                </Button>
            </div>

            {/* Tabla de Atletas */}
            <Card>
                <div className="filters-bar">
                    <FormField
                        icon={Search}
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        variant="dark-focused"
                    />
                </div>

                <DataTable
                    columns={[
                        { key: 'nombrePersona', label: 'Nombre' },
                        {
                            key: 'categoria',
                            label: 'Categoría',
                            render: (value) => getCategoriaTexto(value)
                        },
                        {
                            key: 'estadoPago',
                            label: 'Estado Pago',
                            render: (value) => (
                                <span className={`badge ${value === 1 ? 'badge-success' : 'badge-danger'}`}>
                                    {value === 1 ? 'Al día' : 'Pendiente'}
                                </span>
                            )
                        },
                        {
                            key: 'perteneceSeleccion',
                            label: 'Selección',
                            render: (value) => value ? '⭐ Sí' : 'No'
                        },
                        {
                            key: 'presentoAptoMedico',
                            label: 'Apto Médico',
                            render: (value) => value ? '✅ Presentado' : '❌ Pendiente'
                        }
                    ]}
                    data={filteredAtletas}
                    loading={loading}
                    onRowClick={handleCardClick}
                    actions={(atleta) => (
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={Edit}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/club/atletas/editar/${atleta.idPersona}`);
                                }}
                            />
                            <Button
                                variant="danger"
                                size="sm"
                                icon={Trash2}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(atleta);
                                }}
                            />
                        </div>
                    )}
                />
            </Card>

            {/* Modal de detalles */}
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
                                    handleDeleteClick(atletaDetails);
                                }}
                            >
                                Eliminar
                            </Button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setAtletaToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Eliminar Atleta"
                message={`¿Estás seguro de que deseas eliminar a ${atletaToDelete?.nombrePersona || 'este atleta'}?`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
            />

            <ConfirmationModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                onConfirm={() => setErrorModal({ ...errorModal, isOpen: false })}
                title={errorModal.title}
                message={errorModal.message}
                confirmText="Entendido"
                showCancel={false}
                type="danger"
            />
        </div>
    );
};

export default ClubAtletas;