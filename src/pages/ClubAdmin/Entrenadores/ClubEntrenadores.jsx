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
            console.log(`🔍 ClubEntrenadores - INICIANDO fetchEntrenadores para clubId: ${clubId}`);

            let data = [];
            let source = '';

            // PRIMERO: Intentar endpoints específicos
            try {
                console.log(`📡 ClubEntrenadores - Intentando GET /Entrenador/club/${clubId}`);
                data = await api.get(`/Entrenador/club/${clubId}`, { silentErrors: true });
                source = 'Endpoint /Entrenador/club/{id}';
                console.log(`✅ ${source}: ${data?.length || 0} entrenadores`);
            } catch (e1) {
                console.warn(`⚠️ /Entrenador/club/${clubId} falló:`, e1.message);

                try {
                    console.log(`📡 ClubEntrenadores - Intentando GET /Club/${clubId}/Entrenadores`);
                    data = await api.get(`/Club/${clubId}/Entrenadores`, { silentErrors: true });
                    source = 'Endpoint /Club/{id}/Entrenadores';
                    console.log(`✅ ${source}: ${data?.length || 0} entrenadores`);
                } catch (e2) {
                    console.warn(`⚠️ /Club/${clubId}/Entrenadores falló:`, e2.message);

                    // FALLBACK: Obtener todos y filtrar por IdClub
                    console.log('📡 ClubEntrenadores - Usando FALLBACK: Obtener todos los entrenadores y filtrar');
                    const todos = await api.get('/Entrenador');
                    console.log(`📦 ClubEntrenadores - Total entrenadores en DB: ${todos?.length || 0}`);

                    if (todos && todos.length > 0) {
                        // DEBUG: Ver estructura del primer entrenador
                        const primerEntrenador = todos[0];
                        console.log('📋 ClubEntrenadores - Primer entrenador estructura:', JSON.stringify(primerEntrenador, null, 2));

                        // Buscar el campo correcto (probablemente IdClub con I mayúscula)
                        const campoClub = Object.keys(primerEntrenador).find(key =>
                            key === 'IdClub' ||
                            key === 'idClub' ||
                            key.toLowerCase() === 'idclub' ||
                            key.toLowerCase().includes('club')
                        );

                        console.log(`🔍 ClubEntrenadores - Campo de club encontrado: "${campoClub}"`);

                        if (campoClub) {
                            // Filtrar usando string comparison para evitar problemas de tipo
                            data = todos.filter(e => {
                                const clubIdEntrenador = e[campoClub];
                                const match = clubIdEntrenador !== undefined &&
                                    clubIdEntrenador !== null &&
                                    String(clubIdEntrenador) === String(clubId);

                                if (match) {
                                    console.log(`   ✅ Match: Entrenador "${e.nombrePersona}" - ${campoClub}=${clubIdEntrenador}`);
                                }

                                return match;
                            });
                        } else {
                            console.error('❌ ClubEntrenadores - No se encontró campo de club en los entrenadores');
                            // Mostrar todos los campos del primer entrenador para debug
                            console.log('📋 ClubEntrenadores - Todos los campos disponibles:', Object.keys(primerEntrenador));
                        }
                    }
                    source = 'Fallback Filter';
                }
            }

            console.log(`📊 ClubEntrenadores - Resultado final (${source}): ${data?.length || 0} entrenadores`);
            setEntrenadores(data || []);

            if ((data?.length || 0) === 0) {
                console.warn('⚠️ ClubEntrenadores - No se encontraron entrenadores para este club');
            }

        } catch (error) {
            console.error('❌ ClubEntrenadores - Error fatal en fetchEntrenadores:', error);
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
                    {/* Botón de debug temporal */}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            console.log('🔍 ClubEntrenadores - DEBUG COMPLETO:');
                            console.log('👤 Usuario:', user);
                            console.log('🏢 Club ID (IdClub):', user?.IdClub);
                            console.log('📦 Total entrenadores cargados:', entrenadores.length);
                            console.log('🔍 Primer entrenador (si existe):', entrenadores[0]);
                            alert('ClubEntrenadores - Revisa la consola (F12) para ver la información de debug');
                        }}
                        style={{ marginRight: '10px', fontSize: '12px' }}
                    >
                        Debug Info
                    </Button>

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
                    { key: 'titulo', label: 'Título' },
                    { key: 'nroLicencia', label: 'Licencia' },
                    {
                        key: 'estado',
                        label: 'Estado',
                        render: (value) => (
                            <span className={`badge ${value === 1 ? 'badge-success' : 'badge-danger'}`}>
                                {value === 1 ? 'Activo' : 'Inactivo'}
                            </span>
                        )
                    },
                    { key: 'especialidad', label: 'Especialidad' },
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