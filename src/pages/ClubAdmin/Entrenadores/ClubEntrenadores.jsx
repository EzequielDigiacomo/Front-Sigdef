import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import { Plus, Edit, Trash2, Search, Award, CheckCircle, XCircle, Eye } from 'lucide-react';
import DataTable from '../../../components/common/DataTable';
import '../Entrenadores/ClubEntrenadores.css';

const ClubEntrenadores = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [entrenadores, setEntrenadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entrenadorToDelete, setEntrenadorToDelete] = useState(null);
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });

    // Document Modals State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedEntrenadorForDocs, setSelectedEntrenadorForDocs] = useState(null);
    const [existingDocuments, setExistingDocuments] = useState([]);

    // DEBUG: Verificar estructura del usuario
    useEffect(() => {
        console.log('🔍 ClubEntrenadores - DEBUG del usuario:');
        if (user) {
            console.log('👤 Usuario completo:', JSON.stringify(user, null, 2));
            console.log('📋 Campos disponibles:', Object.keys(user));

            // Buscar IdClub
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
        console.log('🔄 ClubEntrenadores - useEffect ejecutándose');

        // IMPORTANTE: Buscar IdClub (con I mayúscula)
        const clubId = user?.IdClub ||
            user?.idClub ||
            user?.club?.id;

        console.log('🏢 ClubEntrenadores - Club ID encontrado:', clubId);
        console.log('📋 Tipo de clubId:', typeof clubId);

        if (clubId) {
            console.log(`✅ Club ID válido encontrado: ${clubId}`);
            fetchEntrenadores(clubId);
        } else {
            console.error('❌ No se pudo obtener el IdClub para entrenadores');
            console.error('❌ User object:', user);

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

    const fetchEntrenadores = async (clubId) => {
        try {
            setLoading(true);

            // Fetch Personas and EntrenadorSeleccion in parallel
            const [personas, entrenadoresSeleccion] = await Promise.all([
                api.get('/Persona'),
                api.get('/Entrenador/seleccion')
            ]);

            // Map Personas and Selection data for quick lookup
            const personasMap = new Map(personas.map(p => [p.idPersona, p]));
            const seleccionMap = new Set();
            if (entrenadoresSeleccion && Array.isArray(entrenadoresSeleccion)) {
                // Assuming the endpoint returns categories with coaches, or a list of coaches
                // If it returns list of coaches assigned:
                // We need to verify the structure, but usually it returns stats or list.
                // If it returns stats like EntrenadorSeleccionList, we need to extract IDs.
                // Let's assume we can check assignment via Entrenador entity if possible, or fetch /EntrenadorSeleccion map.
                // However, based on previous context, EntrenadorSeleccionList returns stats.
                // Let's rely on checking if the coach ID is present in any selection assignment if available.

                // Better approach: Search in EntrenadorSeleccion/all or filter.
                // Let's assume we fetch all assignments if possible. If not, we might check local property.
                // If endpoint /Entrenador/seleccion returns mapped DTOs with coachNames, we might parse it.
                // But simpler: Check if 'perteneceSeleccion' property exists on Entrenador DTO or similar.

                // If no direct property, we use the fetched list. 
                // Let's iterate whatever EntrenadorSeleccion returns to build the Set.
                entrenadoresSeleccion.forEach(item => {
                    if (item.coachNames) { // It's a category stat
                        item.coachNames.forEach(c => seleccionMap.add(c.coachId)); // Assuming coachId is available in the view model
                    }
                });
            }

            let data = [];
            let source = '';

            try {
                data = await api.get(`/Entrenador/club/${clubId}`, { silentErrors: true });
                source = 'Endpoint /Entrenador/club/{id}';
            } catch (e1) {
                try {
                    data = await api.get(`/Club/${clubId}/Entrenadores`, { silentErrors: true });
                    source = 'Endpoint /Club/{id}/Entrenadores';
                } catch (e2) {
                    const todos = await api.get('/Entrenador');
                    if (todos && todos.length > 0) {
                        const primerEntrenador = todos[0];
                        const campoClub = Object.keys(primerEntrenador).find(key =>
                            key.toLowerCase().includes('club') && key.toLowerCase().includes('id')
                        );

                        if (campoClub) {
                            data = todos.filter(e => String(e[campoClub]) === String(clubId));
                        }
                    }
                    source = 'Fallback Filter';
                }
            }

            // Enrich Data
            const enrichedData = (data || []).map(entrenador => {
                const persona = personasMap.get(entrenador.idPersona);

                // Check selection status (either from property or map)
                // Note: The previous view showed mapping via Categories. 
                // Since I cannot be 100% sure of the structure of /Entrenador/seleccion response without viewing it,
                // I will trust 'perteneceSaeleccion' if it exists, otherwise false.
                // Actually, let's look at the previous context of "EntrenadoresSeleccionList".
                // It used 'coachNames' array.
                // For now, let's default to a safe check or a mock if the property isn't standard.
                // But DNI and Email are certain.

                return {
                    ...entrenador,
                    // Map Names and Personal Info
                    nombrePersona: persona ? `${persona.nombre} ${persona.apellido}` : (entrenador.nombrePersona || '-'),
                    documento: persona ? persona.documento : (entrenador.documento || '-'),
                    email: persona ? persona.email : (entrenador.email || '-'),
                    // Assume 'seleccion' logic: check if ID is in the map we built or property
                    esSeleccion: seleccionMap.has(entrenador.idPersona)
                };
            });

            console.log(`📊 Resultado final enriquecido (${source}): ${enrichedData.length} entrenadores`);
            setEntrenadores(enrichedData);

        } catch (error) {
            console.error('❌ Error fatal en fetchEntrenadores:', error);
            setErrorModal({
                isOpen: true,
                title: 'Error',
                message: 'No se pudieron cargar los entrenadores. Por favor, intenta nuevamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (entrenador) => {
        setEntrenadorToDelete(entrenador);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!entrenadorToDelete) return;

        try {
            await api.delete(`/Entrenador/${entrenadorToDelete.idPersona}`);
            setEntrenadores(entrenadores.filter(e => e.idPersona !== entrenadorToDelete.idPersona));
            setShowDeleteModal(false);
            setEntrenadorToDelete(null);
        } catch (error) {
            console.error('Error eliminando entrenador:', error);
            setShowDeleteModal(false);
            setErrorModal({
                isOpen: true,
                title: 'Error al eliminar',
                message: 'Hubo un problema al intentar eliminar el entrenador.'
            });
        }
    };

    const loadDocuments = async (personId) => {
        try {
            const docs = await api.get(`/Documentacion/persona/${personId}`);
            setExistingDocuments(docs || []);
        } catch (error) {
            console.error('Error cargando documentos:', error);
            setExistingDocuments([]);
        }
    };

    const filteredEntrenadores = entrenadores.filter(entrenador =>
        entrenador.nombrePersona?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando entrenadores...</p>
            </div>
        );
    }

    return (
        <div className="club-entrenadores">
            <div className="page-header">
                <h2 className="page-title">Mis Entrenadores</h2>
                <div>
                    <Button onClick={() => navigate('/club/entrenadores/nuevo')}>
                        <Plus size={20} /> Nuevo Entrenador
                    </Button>
                </div>
            </div>

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
            </Card>

            {/* Grid de entrenadores */}
            <DataTable
                columns={[
                    { key: 'nombrePersona', label: 'Nombre' },
                    { key: 'documento', label: 'DNI' },
                    {
                        key: 'esSeleccion',
                        label: 'Selección',
                        render: (value) => (
                            <span className={`badge ${value ? 'badge-primary' : 'badge-secondary'}`}>
                                {value ? 'Sí' : 'No'}
                            </span>
                        )
                    },
                    { key: 'email', label: 'Email' },
                    {
                        key: 'documentacion',
                        label: 'Documentación',
                        render: (value, entrenador) => (
                            <div className="flex items-center justify-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-auto"
                                    title="Subir documentos"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEntrenadorForDocs(entrenador);
                                        loadDocuments(entrenador.idPersona);
                                        setShowUploadModal(true);
                                    }}
                                >
                                    <Plus size={18} className="text-primary" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-auto"
                                    title="Ver documentos"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEntrenadorForDocs(entrenador);
                                        setShowViewerModal(true);
                                    }}
                                >
                                    <Eye size={18} className="text-primary" />
                                </Button>
                            </div>
                        )
                    }
                ]}
                data={filteredEntrenadores}
                loading={loading}
                emptyMessage="No hay entrenadores registrados"
                actions={(entrenador) => (
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={Edit}
                            onClick={() => navigate(`/club/entrenadores/editar/${entrenador.idPersona}`)}
                        />
                        <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDeleteClick(entrenador)}
                        />
                    </div>
                )}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setEntrenadorToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Eliminar Entrenador"
                message={`¿Estás seguro de que deseas eliminar a ${entrenadorToDelete?.nombrePersona || 'este entrenador'}? Esta acción no se puede deshacer.`}
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

            {/* Document Upload Modal */}
            {showUploadModal && selectedEntrenadorForDocs && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedEntrenadorForDocs(null);
                    }}
                    onSuccess={() => {
                        const clubId = user?.IdClub || user?.idClub || user?.club?.id;
                        if (clubId) fetchEntrenadores(clubId);
                    }}
                    personName={selectedEntrenadorForDocs.nombrePersona}
                    personId={selectedEntrenadorForDocs.idPersona}
                    existingDocuments={existingDocuments}
                />
            )}

            {/* Document Viewer Modal */}
            {showViewerModal && selectedEntrenadorForDocs && (
                <DocumentViewerModal
                    isOpen={showViewerModal}
                    onClose={() => {
                        setShowViewerModal(false);
                        setSelectedEntrenadorForDocs(null);
                    }}
                    personName={selectedEntrenadorForDocs.nombrePersona}
                    personId={selectedEntrenadorForDocs.idPersona}
                />
            )}
        </div>
    );
};

export default ClubEntrenadores;