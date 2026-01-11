import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User, Calendar, Award, DollarSign, Eye } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import Modal from '../../../components/common/Modal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import DataTable from '../../../components/common/DataTable';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
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
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    // Documentation States
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedAthleteForDocs, setSelectedAthleteForDocs] = useState(null);
    const [existingDocuments, setExistingDocuments] = useState([]);

    // Payment State
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrLink, setQrLink] = useState('');

    const handlePagarAfiliacionAtleta = async (atleta) => {
        try {
            setIsProcessingPayment(true);
            const currentYear = new Date().getFullYear();

            const pagoData = {
                concepto: `Afiliación Anual Atleta ${currentYear} - ${atleta.nombrePersona}`,
                monto: 30000,
                idClub: user.idClub,
                idPersona: atleta.idPersona,
                estado: 0 // Pendiente
            };

            const response = await api.post('/PagoTransaccion/preferencia', pagoData);

            if (response.paymentUrl) {
                setQrLink(response.paymentUrl);
                setShowQRModal(true);
            } else {
                setFeedbackModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'No se pudo generar el link de pago',
                    type: 'danger'
                });
            }
        } catch (error) {
            console.error('Error al iniciar pago:', error);
            setFeedbackModal({
                isOpen: true,
                title: 'Error',
                message: 'Error al iniciar el proceso de pago',
                type: 'danger'
            });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // States for "Assign Existing Tutor"
    const [showSelectTutorModal, setShowSelectTutorModal] = useState(false);
    const [existingTutores, setExistingTutores] = useState([]);
    const [selectedTutorIdToAssign, setSelectedTutorIdToAssign] = useState('');
    const [loadingTutores, setLoadingTutores] = useState(false);

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

            setFeedbackModal({
                isOpen: true,
                title: 'Error de configuración',
                message: 'No se pudo identificar tu club. El campo IdClub no está disponible en tu perfil.',
                type: 'danger'
            });
            setLoading(false);
        }
    }, [user]);

    const fetchAtletas = async (clubId) => {
        try {
            setLoading(true);

            // 1. Fetch Personas in parallel to be ready
            const personasPromise = api.get('/Persona');

            let data = [];
            let source = '';

            // Try to fetch athletes for the club
            try {
                data = await api.get(`/Atleta/club/${clubId}`, { silentErrors: true });
                source = 'Endpoint /Atleta/club/{id}';
            } catch (e1) {
                try {
                    data = await api.get(`/Club/${clubId}/Atletas`, { silentErrors: true });
                    source = 'Endpoint /Club/{id}/Atletas';
                } catch (e2) {
                    const todos = await api.get('/Atleta');
                    if (todos && todos.length > 0) {
                        const primerAtleta = todos[0];
                        const campoClub = Object.keys(primerAtleta).find(key =>
                            key === 'IdClub' || key === 'idClub' || key.toLowerCase() === 'idclub'
                        );

                        if (campoClub) {
                            data = todos.filter(a => {
                                const clubIdAtleta = a[campoClub];
                                return clubIdAtleta !== undefined &&
                                    clubIdAtleta !== null &&
                                    String(clubIdAtleta) === String(clubId);
                            });
                        }
                    }
                    source = 'Fallback Filter';
                }
            }

            // 2. Await Personas
            const personas = await personasPromise;
            const personasMap = new Map(personas.map(p => [p.idPersona, p]));

            // 3. Map Athletes with Persona Data
            const enrichedData = (data || []).map(atleta => {
                const personaId = atleta.idPersona || atleta.IdPersona;
                const persona = personasMap.get(personaId);
                return {
                    ...atleta,
                    idPersona: personaId,
                    nombrePersona: persona ? `${persona.nombre} ${persona.apellido}` : (atleta.nombrePersona || '-'),
                    documento: persona ? persona.documento : (atleta.documento || '-')
                };
            });

            console.log(`📊 Resultado final enriquecido (${source}): ${enrichedData.length} atletas`);
            setAtletas(enrichedData);

        } catch (error) {
            console.error('❌ Error fatal en fetchAtletas:', error);
            setFeedbackModal({
                isOpen: true,
                title: 'Error',
                message: 'No se pudieron cargar los atletas. Por favor, intenta nuevamente.',
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchClubTutores = async () => {
        try {
            setLoadingTutores(true);
            const clubId = user?.IdClub || user?.idClub || user?.club?.id || user?.clubId; // Reuse detection

            if (!clubId) return;

            // Fetch logic similar to ClubTutores to get "My Club Tutors"
            const [allTutores, allAtletas, allRelaciones, allPersonas] = await Promise.all([
                api.get('/Tutor'),
                api.get('/Atleta'),
                api.get('/AtletaTutor'),
                api.get('/Persona')
            ]);

            // Filter My Club Athletes
            const myClubAtletas = allAtletas.filter(a => {
                const aClubId = a.idClub || a.clubId || a.IdClub;
                return aClubId && String(aClubId) === String(clubId);
            });
            const myClubAtletaIds = new Set(myClubAtletas.map(a => a.idPersona));

            // Filter Relationships
            const myClubRelaciones = allRelaciones.filter(r => myClubAtletaIds.has(r.idAtleta));
            const myClubTutorIds = new Set(myClubRelaciones.map(r => r.idTutor));

            // Filter Tutors
            const personasMap = new Map(allPersonas.map(p => [p.idPersona, p]));

            const tutoresDelClub = allTutores
                .filter(t => myClubTutorIds.has(t.idPersona)) // Only show tutors already linked to club
                .map(t => {
                    const persona = personasMap.get(t.idPersona);
                    return {
                        ...t,
                        nombreCompleto: persona ? `${persona.nombre} ${persona.apellido}` : t.nombrePersona
                    };
                });

            setExistingTutores(tutoresDelClub);

        } catch (error) {
            console.error("Error fetching club tutors:", error);
            setFeedbackModal({
                isOpen: true,
                title: 'Error',
                message: 'Error cargando lista de tutores',
                type: 'danger'
            });
        } finally {
            setLoadingTutores(false);
        }
    };

    const handleAssignTutor = async () => {
        if (!selectedTutorIdToAssign || !atletaDetails) return;

        try {
            await api.post('/AtletaTutor', {
                idAtleta: atletaDetails.idPersona,
                idTutor: parseInt(selectedTutorIdToAssign),
                parentesco: 0 // Default or ask user? usually parentesco is needed. Assume Padre/Madre (0) or ask.
            });

            // Success
            setFeedbackModal({
                isOpen: true,
                title: 'Éxito',
                message: 'Tutor asignado correctamente',
                type: 'success'
            });
            setShowSelectTutorModal(false);
            handleCloseModal(); // Close details modal too or refresh it?

            // Refresh logic could go here, for now just close
        } catch (error) {
            console.error("Error assigning tutor:", error);
            setFeedbackModal({
                isOpen: true,
                title: 'Error',
                message: 'Error al asignar tutor: ' + error.message,
                type: 'danger'
            });
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
            setFeedbackModal({
                isOpen: true,
                title: 'Error al eliminar',
                message: 'Hubo un problema al intentar eliminar el atleta.',
                type: 'danger'
            });
        }
    };

    const handleUnlinkTutor = async () => {
        if (!window.confirm("¿Seguro que deseas desvincular este tutor?")) return;

        try {
            // Fetch relation first to get ID
            const relaciones = await api.get('/AtletaTutor');
            const rel = relaciones.find(r => r.idAtleta === atletaDetails.idPersona);

            if (rel) {
                // Try delete. Assuming backend supports Delete by ID
                // If ID is 'id' or 'idAtletaTutor'
                const idRel = rel.id || rel.idAtletaTutor || rel.IdAtletaTutor;
                if (idRel) {
                    await api.delete(`/AtletaTutor/${idRel}`);
                } else {
                    // Fallback: maybe send composite key in body?
                    // This is risky without knowing API. Assuming ID exists.
                    throw new Error("No se pudo identificar la relación para eliminar.");
                }

                setAtletaDetails(prev => ({ ...prev, tutor: null }));
                setFeedbackModal({ isOpen: true, title: 'Éxito', message: 'Tutor desvinculado correctamente', type: 'success' });
            }
        } catch (error) {
            console.error("Error unlinking tutor:", error);
            setFeedbackModal({ isOpen: true, title: 'Error', message: 'No se pudo desvincular al tutor.', type: 'danger' });
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
            try {
                // Fetch relationships to find the tutor
                const relaciones = await api.get('/AtletaTutor');
                const relacion = relaciones.find(r => r.idAtleta === atleta.idPersona);

                if (relacion) {
                    try {
                        tutor = await api.get(`/Tutor/${relacion.idTutor}`);
                        // Enforce name presence
                        if (tutor.persona) {
                            tutor.nombre = `${tutor.persona.nombre} ${tutor.persona.apellido}`;
                            tutor.telefono = tutor.telefono || tutor.persona.telefono;
                            tutor.email = tutor.email || tutor.persona.email;
                        } else if (!tutor.nombre && !tutor.nombrePersona) {
                            // Fallback if Tutor object is bare
                            const tutorPersona = await api.get(`/Persona/${relacion.idTutor}`);
                            tutor.nombre = `${tutorPersona.nombre} ${tutorPersona.apellido}`;
                            tutor.telefono = tutor.telefono || tutorPersona.telefono;
                            tutor.email = tutor.email || tutorPersona.email;
                        }
                    } catch (e) {
                        console.warn('Error fetching tutor details:', e);
                    }
                }
            } catch (err) {
                console.warn("Error checking relations:", err);
            }

            setAtletaDetails({
                ...atleta,
                personaCompleta: persona,
                tutor: tutor
            });
        } catch (error) {
            console.error('Error al cargar detalles del atleta:', error);
            setFeedbackModal({
                isOpen: true,
                title: 'Error',
                message: 'Error al cargar los detalles del atleta',
                type: 'danger'
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
                        { key: 'documento', label: 'DNI' },
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
                        },
                        {
                            key: 'documentacion',
                            label: 'Documentación',
                            render: (_, atleta) => (
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={Plus}
                                        onClick={() => {
                                            setSelectedAthleteForDocs(atleta);
                                            setShowUploadModal(true);
                                        }}
                                        title="Subir Documentación"
                                        className="h-auto p-1 text-primary"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={Eye}
                                        onClick={() => {
                                            setSelectedAthleteForDocs(atleta);
                                            setShowViewerModal(true);
                                        }}
                                        title="Ver Documentación"
                                        className="h-auto p-1 text-primary"
                                    />
                                </div>
                            )
                        }
                    ]}
                    data={filteredAtletas}
                    loading={loading}
                    keyField="idPersona"
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
                                <div className="detail-row" style={{ alignItems: 'center' }}>
                                    <span className="label">Cuota Anual:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span className="value">
                                            {atletaDetails.estadoPago === 1 ? '✅ Pagada' : '❌ Pendiente'}
                                        </span>
                                        {atletaDetails.estadoPago !== 1 && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handlePagarAfiliacionAtleta(atletaDetails)}
                                                disabled={isProcessingPayment}
                                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                                            >
                                                {isProcessingPayment ? '...' : 'Pagar ($30.000)'} <DollarSign size={14} />
                                            </Button>
                                        )}
                                    </div>
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
                            <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><Users size={18} /> Tutor</span>
                                {atletaDetails.tutor && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        icon={Trash2}
                                        onClick={handleUnlinkTutor}
                                        title="Desvincular tutor"
                                        style={{ padding: '0.25rem 0.5rem' }}
                                    />
                                )}
                            </h4>
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
                                        Agregar Nuevo Tutor
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        icon={Users}
                                        onClick={() => {
                                            setShowSelectTutorModal(true);
                                            fetchClubTutores();
                                        }}
                                        style={{ marginLeft: '10px' }}
                                    >
                                        Asignar Existente
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

            {/* Modal para Seleccionar Tutor Existente */}
            <Modal
                isOpen={showSelectTutorModal}
                onClose={() => setShowSelectTutorModal(false)}
                title="Asignar Tutor Existente"
            >
                <div className="p-4">
                    <p style={{ marginBottom: '1rem' }}>Selecciona un tutor de la lista (familiares de otros atletas del club):</p>

                    {loadingTutores ? (
                        <div className="spinner"></div>
                    ) : (
                        <select
                            className="form-input"
                            value={selectedTutorIdToAssign}
                            onChange={(e) => setSelectedTutorIdToAssign(e.target.value)}
                            style={{ width: '100%', marginBottom: '1rem' }}
                        >
                            <option value="">-- Seleccionar Tutor --</option>
                            {existingTutores.map(t => (
                                <option key={t.idPersona} value={t.idPersona}>
                                    {t.nombreCompleto} (DNI: {t.documento || '-'})
                                </option>
                            ))}
                        </select>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="secondary" onClick={() => setShowSelectTutorModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleAssignTutor} disabled={!selectedTutorIdToAssign}>Asignar</Button>
                    </div>
                </div>
            </Modal>

            {/* QR Modal */}
            <Modal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                title="Escanear QR para Pagar"
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '1.5rem' }}>
                    <p style={{ textAlign: 'center', color: '#ccc' }}>
                        Escanea este código QR con la App de Mercado Pago o tu billetera virtual favorita.
                    </p>

                    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                        {qrLink && <QRCodeCanvas value={qrLink} size={250} />}
                    </div>

                    <div style={{ width: '100%', textAlign: 'center' }}>
                        <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>¿Prefieres pagar en el navegador?</p>
                        <Button
                            variant="primary"
                            onClick={() => window.open(qrLink, '_blank')}
                            style={{ width: '100%' }}
                        >
                            Ir a Mercado Pago
                        </Button>
                    </div>
                </div>
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

            {/* Modal de Carga de Documentación */}
            {showUploadModal && selectedAthleteForDocs && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedAthleteForDocs(null);
                    }}
                    personName={selectedAthleteForDocs.nombrePersona}
                    personId={selectedAthleteForDocs.idPersona}
                    onSuccess={() => {
                        fetchAtletas(user?.IdClub || user?.idClub);
                    }}
                />
            )}

            {/* Modal de Visualización de Documentación */}
            {showViewerModal && selectedAthleteForDocs && (
                <DocumentViewerModal
                    isOpen={showViewerModal}
                    onClose={() => {
                        setShowViewerModal(false);
                        setSelectedAthleteForDocs(null);
                    }}
                    personName={selectedAthleteForDocs.nombrePersona}
                    personId={selectedAthleteForDocs.idPersona}
                />
            )}

            {/* Modal de Feedback (General) */}
            <ConfirmationModal
                isOpen={feedbackModal.isOpen}
                onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                onConfirm={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                title={feedbackModal.title}
                message={feedbackModal.message}
                type={feedbackModal.type || 'info'}
                confirmText="Entendido"
                showCancel={false}
            />
        </div>
    );
};

export default ClubAtletas;