import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import { Plus, Edit, Trash2, Search, UserCheck, Eye, UserPlus, FileText } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import * as XLSX from 'xlsx';
import '../Atletas/Atletas.css';
import { PARENTESCO_MAP } from '../../../utils/enums';

const TutoresList = () => {
    const [tutores, setTutores] = useState([]);
    const [atletas, setAtletas] = useState([]);
    const [atletaTutorRelaciones, setAtletaTutorRelaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Document Modals State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedTutorForDocs, setSelectedTutorForDocs] = useState(null);
    const [existingDocuments, setExistingDocuments] = useState([]);

    // Link Athlete Modal State
    const [showLinkAthleteModal, setShowLinkAthleteModal] = useState(false);
    const [selectedTutorForLink, setSelectedTutorForLink] = useState(null);

    // Tutor Details Modal State
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTutorForDetails, setSelectedTutorForDetails] = useState(null);

    // Add Existing Person Modal State
    const [showAddExistingModal, setShowAddExistingModal] = useState(false);
    const [personasDisponibles, setPersonasDisponibles] = useState([]);
    const [searchTermPersonas, setSearchTermPersonas] = useState('');

    const loadPersonasDisponibles = async () => {
        try {
            // Traemos Personas y Tutores actuales para filtrar
            const [personasData, tutoresData] = await Promise.all([
                api.get('/Persona'),
                api.get('/Tutor')
            ]);

            const tutorPersonaIds = new Set(tutoresData.map(t => t.idPersona));

            const disponibles = personasData.filter(p => {
                // Excluir si ya es tutor
                if (tutorPersonaIds.has(p.idPersona)) return false;

                // Calcular edad (Filtrar solo mayores de 18)
                if (!p.fechaNacimiento) return false;
                const nacimiento = new Date(p.fechaNacimiento);
                const hoy = new Date();
                let edad = hoy.getFullYear() - nacimiento.getFullYear();
                const mes = hoy.getMonth() - nacimiento.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;

                return edad >= 18;
            });

            setPersonasDisponibles(disponibles);
        } catch (err) {
            console.error('Error cargando personas disponibles:', err);
        }
    };

    // Confirm Add Existing Tutor Modal State
    const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);
    const [selectedPersonToAdd, setSelectedPersonToAdd] = useState(null);
    const [selectedTutorType, setSelectedTutorType] = useState('0');

    // Confirm Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tutorToDelete, setTutorToDelete] = useState(null);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleAddExistingTutorClick = (persona) => {
        setSelectedPersonToAdd(persona);
        setSelectedTutorType('0');
        setShowConfirmAddModal(true);
    };

    const executeAddTutor = async () => {
        if (!selectedPersonToAdd) return;
        try {
            await api.post('/Tutor', {
                IdPersona: selectedPersonToAdd.idPersona,
                TipoTutor: PARENTESCO_MAP[selectedTutorType]
            });
            setShowConfirmAddModal(false);
            setShowAddExistingModal(false);
            loadTutores();

            setSuccessMessage('Tutor vinculado exitosamente.');
            setShowSuccessModal(true);
        } catch (err) {
            console.error(err);
            alert('Error al agregar tutor: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteClick = (tutor) => {
        setTutorToDelete(tutor);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!tutorToDelete) return;
        try {
            // 1. Buscar y eliminar relaciones Atleta-Tutor existentes
            const relaciones = atletaTutorRelaciones.filter(r => r.idTutor === tutorToDelete.idPersona);

            if (relaciones.length > 0) {
                console.log(`Eliminando ${relaciones.length} relaciones de atletas para el tutor...`, relaciones);

                await Promise.all(relaciones.map(async r => {
                    const idRelacion = r.id || r.idAtletaTutor;

                    try {
                        if (idRelacion) {
                            await api.delete(`/AtletaTutor/${idRelacion}`);
                        } else {
                            // Sin ID simple, intentar borrado por claves compuestas
                            await api.delete(`/AtletaTutor/${r.idAtleta}/${r.idTutor}`);
                        }
                    } catch (err) {
                        console.warn('Fallo al borrar relación, intentando estrategia alternativa...', err);
                        // Si falló con ID simple (ej 404), intentar compuesto como fallback
                        if (idRelacion && err.response?.status === 404) {
                            await api.delete(`/AtletaTutor/${r.idAtleta}/${r.idTutor}`);
                        } else {
                            // Si falla esto tambien, lo dejamos pasar y que falle el delete del Tutor si es constraint
                            // O lanzamos error si queremos ser estrictos. 
                            // Lo dejamos pasar para ver si el backend tiene OnDelete Cascade
                        }
                    }
                }));
            }

            // 2. Eliminar el Tutor
            await api.delete(`/Tutor/${tutorToDelete.idPersona}`);

            setShowDeleteModal(false);
            setTutorToDelete(null);
            loadTutores();
            setSuccessMessage('Tutor eliminado exitosamente.');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error eliminando tutor:', error);
            const status = error.response?.status;
            let msg = error.response?.data?.message || error.response?.data?.title || error.message;

            if (status === 404) {
                msg = "No se encontró el recurso a eliminar. Verifica que la relación o el tutor existan.";
            } else if (status === 409 || status === 500) {
                msg = "Conflicto de dependencia: No se pudo desvincular a los atletas asociados.";
            }

            alert(`Error al eliminar: ${msg}`);
        }
    };

    useEffect(() => {
        if (showAddExistingModal) {
            loadPersonasDisponibles();
        }
    }, [showAddExistingModal]);

    useEffect(() => {
        loadTutores();
    }, []);

    const loadTutores = async () => {
        try {
            setLoading(true);

            // Eliminamos /Persona para evitar el crash del backend por circularidad profunda
            const [tutoresRes, relacionesRes, atletasRes, clubesRes] = await Promise.all([
                api.get('/Tutor').catch(() => []),
                api.get('/AtletaTutor').catch(() => []),
                api.get('/Atleta').catch(() => []),
                api.get('/Club').catch(() => [])
            ]);

            const clubesMap = new Map((clubesRes || []).map(c => [c.idClub || c.IdClub, c]));

            const atletasEnriquecidos = (atletasRes || []).map(atleta => {
                const club = clubesMap.get(atleta.idClub || atleta.IdClub);
                return {
                    ...atleta,
                    documento: atleta.documento || atleta.Documento || '-',
                    nombrePersona: atleta.nombrePersona || atleta.NombrePersona || 'Atleta',
                    nombreClub: club ? (club.nombre || club.Nombre) : (atleta.nombreClub || atleta.NombreClub || 'Agente Libre')
                };
            });

            const tutoresEnriquecidos = (tutoresRes || []).map(tutor => {
                return {
                    ...tutor,
                    documento: tutor.documento || tutor.Documento || '-',
                    telefono: tutor.telefono || tutor.Telefono || '-',
                    email: tutor.email || tutor.Email || '-',
                    nombrePersona: tutor.nombrePersona || tutor.NombrePersona || 'Tutor'
                };
            });

            // Ordenar por ID descendente (más recientes primero)
            tutoresEnriquecidos.sort((a, b) => (b.idPersona || b.IdPersona) - (a.idPersona || a.IdPersona));

            setTutores(tutoresEnriquecidos);
            setAtletas(atletasEnriquecidos);
            setAtletaTutorRelaciones(relacionesRes);
        } catch (error) {
            console.error('Error general en loadTutores:', error);
        } finally {
            setLoading(false);
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

    const getAtletasRepresentados = (idTutor) => {
        // Filtrar relaciones para este tutor
        const relacionesDelTutor = atletaTutorRelaciones.filter(rel => rel.idTutor === idTutor);

        // Obtener los IDs de los atletas
        const atletasIds = relacionesDelTutor.map(rel => rel.idAtleta);

        // Filtrar y retornar los atletas completos
        return atletas.filter(atleta => atletasIds.includes(atleta.idPersona));
    };

    // Filtrar tutores por término de búsqueda
    const tutoresFiltrados = tutores.filter(tutor => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            tutor.nombrePersona?.toLowerCase().includes(search) ||
            tutor.documento?.toLowerCase().includes(search) ||
            tutor.telefono?.toLowerCase().includes(search) ||
            tutor.email?.toLowerCase().includes(search) ||
            tutor.persona?.nombre?.toLowerCase().includes(search) ||
            tutor.persona?.apellido?.toLowerCase().includes(search)
        );
    });

    const exportTutorToExcel = (tutor) => {
        if (!tutor) return;
        try {
            const atletasRepresentados = getAtletasRepresentados(tutor.idPersona);

            // Estructura de la ficha
            const rows = [
                ['SISTEMA SIGDEF - FICHA DE TUTOR'],
                [''],
                ['DATOS PERSONALES DEL TUTOR'],
                ['NombreCompleto', tutor.nombrePersona || '-'],
                ['DNI / Documento', tutor.documento || '-'],
                ['Teléfono', tutor.telefono || '-'],
                ['Email', tutor.email || '-'],
                [''],
                ['ATLETAS REPRESENTADOS'],
                ['Nombre del Atleta', 'DNI / Documento', 'Club / Entidad']
            ];

            if (atletasRepresentados.length > 0) {
                atletasRepresentados.forEach(atleta => {
                    rows.push([
                        atleta.nombrePersona || 'Sin Nombre',
                        atleta.documento || '-',
                        atleta.nombreClub || 'Agente Libre'
                    ]);
                });
            } else {
                rows.push(['No tiene atletas vinculados', '', '']);
            }

            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Ficha");

            // Generar el archivo como un array de bytes (Uint8Array)
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Crear el link de descarga manualmente para evitar que Browser Link interfiera
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Ficha_Tutor_${tutor.documento || 'Detalle'}.xlsx`);
            document.body.appendChild(link);
            link.click();

            // Limpieza
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

        } catch (err) {
            console.error('Error al exportar Excel:', err);
            alert('No se pudo generar el archivo Excel.');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UserCheck size={28} />
                    <h2 className="page-title">Gestión de Tutores</h2>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" onClick={() => setShowAddExistingModal(true)}>
                        <UserPlus size={20} /> Vincular Existente
                    </Button>
                    <Button onClick={() => navigate('/dashboard/tutores/new')}>
                        <Plus size={20} /> Nuevo Tutor
                    </Button>
                </div>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar por nombre, DNI, teléfono o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>DNI</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Atletas Representados</th>
                                <th>Documentación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center">Cargando...</td></tr>
                            ) : tutores.length === 0 ? (
                                <tr><td colSpan="7" className="text-center">No hay tutores registrados</td></tr>
                            ) : (
                                tutoresFiltrados.map((tutor) => {
                                    const atletasRepresentados = getAtletasRepresentados(tutor.idPersona);
                                    return (
                                        <tr
                                            key={tutor.idPersona}
                                            onClick={() => {
                                                setSelectedTutorForDetails(tutor);
                                                setShowDetailsModal(true);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td>{tutor.nombrePersona || `${tutor.persona?.nombre} ${tutor.persona?.apellido}` || '-'}</td>
                                            <td>{tutor.documento || tutor.persona?.documento || '-'}</td>
                                            <td>{tutor.telefono || tutor.persona?.telefono || '-'}</td>
                                            <td>{tutor.email || tutor.persona?.email || '-'}</td>
                                            <td>
                                                {atletasRepresentados.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        {atletasRepresentados.map((atleta, idx) => (
                                                            <div key={idx} style={{ fontSize: '0.875rem' }}>
                                                                <strong>{atleta.nombrePersona}</strong> - DNI: {atleta.documento}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-secondary)' }}>Sin atletas</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-1 h-auto"
                                                        title="Subir documentos"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedTutorForDocs(tutor);
                                                            loadDocuments(tutor.idPersona);
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
                                                            setSelectedTutorForDocs(tutor);
                                                            setShowViewerModal(true);
                                                        }}
                                                    >
                                                        <Eye size={18} className="text-primary" />
                                                    </Button>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedTutorForLink(tutor);
                                                            setShowLinkAthleteModal(true);
                                                        }}
                                                        title="Enlazar atleta menor"
                                                    >
                                                        <UserPlus size={18} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/tutores/${tutor.idPersona}/edit`)}>
                                                        <Edit size={18} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDeleteClick(tutor)}>
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Document Upload Modal */}
            {showUploadModal && selectedTutorForDocs && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedTutorForDocs(null);
                    }}
                    onSuccess={() => {
                        loadTutores();
                    }}
                    personName={selectedTutorForDocs.nombrePersona || `${selectedTutorForDocs.persona?.nombre || ''} ${selectedTutorForDocs.persona?.apellido || ''}`}
                    personId={selectedTutorForDocs.idPersona}
                    existingDocuments={existingDocuments}
                />
            )}

            {/* Document Viewer Modal */}
            {showViewerModal && selectedTutorForDocs && (
                <DocumentViewerModal
                    isOpen={showViewerModal}
                    onClose={() => {
                        setShowViewerModal(false);
                        setSelectedTutorForDocs(null);
                    }}
                    personName={selectedTutorForDocs.nombrePersona || `${selectedTutorForDocs.persona?.nombre || ''} ${selectedTutorForDocs.persona?.apellido || ''}`}
                    personId={selectedTutorForDocs.idPersona}
                />
            )}

            {/* Link Athlete Modal */}
            {showLinkAthleteModal && selectedTutorForLink && (
                <LinkAthleteModal
                    isOpen={showLinkAthleteModal}
                    onClose={() => {
                        setShowLinkAthleteModal(false);
                        setSelectedTutorForLink(null);
                    }}
                    tutor={selectedTutorForLink}
                    atletas={atletas}
                    atletaTutorRelaciones={atletaTutorRelaciones}
                    onSuccess={() => {
                        loadTutores();
                        setShowLinkAthleteModal(false);
                        setSelectedTutorForLink(null);
                        setSuccessMessage('Atleta enlazado correctamente');
                        setShowSuccessModal(true);
                    }}
                />
            )}

            {/* Tutor Details Modal */}
            {showDetailsModal && selectedTutorForDetails && (
                <Modal
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedTutorForDetails(null);
                    }}
                    title="Detalles del Tutor"
                    footer={
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => exportTutorToExcel(selectedTutorForDetails)}>
                                <FileText size={18} /> Exportar Excel
                            </Button>
                            <Button variant="secondary" onClick={() => {
                                setShowDetailsModal(false);
                                setSelectedTutorForDetails(null);
                            }}>
                                Cerrar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    navigate(`/dashboard/tutores/${selectedTutorForDetails.idPersona}/edit`);
                                }}
                            >
                                <Edit size={18} /> Editar Tutor
                            </Button>
                        </div>
                    }
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1rem' }}>
                        <div>
                            <label className="detail-label">Nombre Completo</label>
                            <div className="detail-value">
                                {selectedTutorForDetails.nombrePersona || `${selectedTutorForDetails.persona?.nombre} ${selectedTutorForDetails.persona?.apellido}` || '-'}
                            </div>
                        </div>
                        <div>
                            <label className="detail-label">DNI</label>
                            <div className="detail-value">{selectedTutorForDetails.documento || selectedTutorForDetails.persona?.documento || '-'}</div>
                        </div>
                        <div>
                            <label className="detail-label">Teléfono</label>
                            <div className="detail-value">{selectedTutorForDetails.telefono || selectedTutorForDetails.persona?.telefono || '-'}</div>
                        </div>
                        <div>
                            <label className="detail-label">Email</label>
                            <div className="detail-value">{selectedTutorForDetails.email || selectedTutorForDetails.persona?.email || '-'}</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="detail-label">Atletas Representados</label>
                            <div className="detail-value">
                                {(() => {
                                    const atletasRep = getAtletasRepresentados(selectedTutorForDetails.idPersona);
                                    return atletasRep.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {atletasRep.map((atleta, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setShowDetailsModal(false);
                                                        navigate(`/dashboard/atletas/editar/${atleta.idPersona}`, {
                                                            state: { returnPath: '/dashboard/tutores' }
                                                        });
                                                    }}
                                                    style={{
                                                        padding: '0.75rem',
                                                        backgroundColor: 'var(--bg-secondary)',
                                                        borderRadius: '4px',
                                                        border: '1px solid var(--border-color)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                                        e.currentTarget.style.transform = 'translateX(4px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                                        e.currentTarget.style.transform = 'translateX(0)';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <strong>{atleta.nombrePersona}</strong><br />
                                                            <small style={{ color: 'var(--text-secondary)' }}>
                                                                DNI: {atleta.documento} | Club: {atleta.nombreClub || '-'}
                                                            </small>
                                                        </div>
                                                        <div style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
                                                            Ver detalles →
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-secondary)' }}>Sin atletas representados</span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
            {/* Add Existing Person Modal */}
            {showAddExistingModal && (
                <Modal
                    isOpen={showAddExistingModal}
                    onClose={() => setShowAddExistingModal(false)}
                    title="Vincular Persona Existente"
                    footer={
                        <Button variant="secondary" onClick={() => setShowAddExistingModal(false)}>Cancelar</Button>
                    }
                >
                    <div style={{ padding: '1rem', minWidth: '500px' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <FormField
                                icon={Search}
                                placeholder="Buscar persona por nombre o DNI..."
                                value={searchTermPersonas}
                                onChange={(e) => setSearchTermPersonas(e.target.value)}
                            />
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            {personasDisponibles
                                .filter(p => {
                                    if (!searchTermPersonas) return true;
                                    const term = searchTermPersonas.toLowerCase();
                                    return (p.nombre?.toLowerCase().includes(term) ||
                                        p.apellido?.toLowerCase().includes(term) ||
                                        p.documento?.includes(term));
                                })
                                .map(p => (
                                    <div key={p.idPersona} style={{
                                        padding: '0.75rem',
                                        borderBottom: '1px solid var(--border-color)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{p.nombre} {p.apellido}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>DNI: {p.documento}</div>
                                        </div>
                                        <Button size="sm" onClick={() => handleAddExistingTutorClick(p)}>
                                            Agregar
                                        </Button>
                                    </div>
                                ))}
                            {personasDisponibles.length === 0 && (
                                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No se encontraron personas disponibles (mayores de 18 y no tutores).
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {/* Confirm Add Existing Tutor Modal (Step 2) */}
            {showConfirmAddModal && selectedPersonToAdd && (
                <Modal
                    isOpen={showConfirmAddModal}
                    onClose={() => setShowConfirmAddModal(false)}
                    title="Confirmar Tutor"
                    footer={
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => setShowConfirmAddModal(false)}>Cancelar</Button>
                            <Button variant="primary" onClick={executeAddTutor}>Confirmar y Agregar</Button>
                        </div>
                    }
                >
                    <div style={{ padding: '1rem' }}>
                        <p style={{ marginBottom: '1rem' }}>
                            ¿Está seguro de agregar a <strong>{selectedPersonToAdd.nombre} {selectedPersonToAdd.apellido}</strong> como Tutor?
                        </p>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Parentesco *</label>
                            <select
                                className="form-input"
                                value={selectedTutorType}
                                onChange={(e) => setSelectedTutorType(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                {Object.entries(PARENTESCO_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Confirm Delete Modal */}
            {showDeleteModal && tutorToDelete && (
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Eliminar Tutor"
                    footer={
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
                            <Button variant="danger" onClick={confirmDelete}>
                                <Trash2 size={16} style={{ marginRight: '8px' }} /> Eliminar
                            </Button>
                        </div>
                    }
                >
                    <div style={{ padding: '1rem' }}>
                        <p>¿Estás seguro de que deseas eliminar a este tutor?</p>
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '4px',
                            borderLeft: '4px solid var(--danger)'
                        }}>
                            <strong>{tutorToDelete.nombrePersona || `${tutorToDelete.persona?.nombre} ${tutorToDelete.persona?.apellido}`}</strong>
                            <br />
                            <small>DNI: {tutorToDelete.documento || tutorToDelete.persona?.documento}</small>
                        </div>
                        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Esta acción no se puede deshacer. Se desvincularán los atletas asociados.
                        </p>
                    </div>
                </Modal>
            )}

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Operación Exitosa"
                footer={
                    <Button variant="primary" onClick={() => setShowSuccessModal(false)}>Aceptar</Button>
                }
            >
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ color: 'var(--success)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <UserCheck size={48} />
                    </div>
                    <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{successMessage}</p>
                </div>
            </Modal>

        </div>
    );
};

// Link Athlete Modal Component
const LinkAthleteModal = ({ isOpen, onClose, tutor, atletas, atletaTutorRelaciones, onSuccess }) => {
    const [selectedAtleta, setSelectedAtleta] = useState('');
    const [parentesco, setParentesco] = useState('0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filtrar solo atletas menores de 18 años
    const atletasMenores = atletas.filter(atleta => {
        if (!atleta.fechaNacimiento) return false;
        const hoy = new Date();
        const nacimiento = new Date(atleta.fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return edad < 18;
    });

    // Debug: Ver qué está pasando con los atletas
    console.log('Total atletas:', atletas.length);
    console.log('Atletas menores de 18:', atletasMenores.length);
    console.log('Muestra de atletas:', atletas.slice(0, 3).map(a => ({
        nombre: a.nombrePersona,
        fechaNac: a.fechaNacimiento,
        edad: a.fechaNacimiento ? new Date().getFullYear() - new Date(a.fechaNacimiento).getFullYear() : 'sin fecha'
    })));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const idAtleta = parseInt(selectedAtleta);

            // 1. Verificar y heredar contacto del tutor si falta
            const atletaCompleto = atletas.find(a => a.idPersona === idAtleta);

            if (atletaCompleto) {
                const faltaEmail = !atletaCompleto.email || atletaCompleto.email.trim() === '';
                const faltaTelefono = !atletaCompleto.telefono || atletaCompleto.telefono.trim() === '';

                if (faltaEmail || faltaTelefono) {
                    // Obtener datos completos de la persona para no perder info al hacer PUT
                    const personaData = await api.get(`/Persona/${idAtleta}`);

                    const emailTutor = tutor.email || tutor.persona?.email;
                    const telefonoTutor = tutor.telefono || tutor.persona?.telefono;

                    if ((faltaEmail && emailTutor) || (faltaTelefono && telefonoTutor)) {
                        console.log(`Heredando contacto del tutor para atleta ${idAtleta}...`);

                        const updatedPersona = {
                            Nombre: personaData.nombre,
                            Apellido: personaData.apellido,
                            Documento: personaData.documento,
                            FechaNacimiento: personaData.fechaNacimiento ? personaData.fechaNacimiento.split('T')[0] : null,
                            Direccion: personaData.direccion,
                            Sexo: personaData.sexo, // Check if Sexo is required/present
                            Email: faltaEmail && emailTutor ? emailTutor : personaData.email,
                            Telefono: faltaTelefono && telefonoTutor ? telefonoTutor : personaData.telefono
                        };

                        await api.put(`/Persona/${idAtleta}`, updatedPersona);
                    }
                }
            }

            // 2. Verificar si ya tiene un tutor y desvincularlo para asegurar el nuevo enlace
            const existingRel = Array.isArray(atletaTutorRelaciones)
                ? atletaTutorRelaciones.find(r => (r.idAtleta || r.IdAtleta) === idAtleta)
                : null;

            if (existingRel) {
                const idRel = existingRel.idAtletaTutor || existingRel.IdAtletaTutor || existingRel.id;
                console.log(`Borrando relación previa del atleta ${idAtleta} (idRel: ${idRel})...`);
                if (idRel) {
                    await api.delete(`/AtletaTutor/${idRel}`);
                }
            }

            // 3. Crear el enlace
            const payload = {
                idAtleta: idAtleta,
                idTutor: tutor.idPersona,
                idParentesco: parseInt(parentesco)
            };

            await api.post('/AtletaTutor', payload);
            onSuccess();
        } catch (err) {
            console.error('Error enlazando atleta:', err);
            setError(err.message || 'Error al enlazar el atleta. Verifica que no esté ya enlazado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Enlazar Atleta Menor - ${tutor.nombrePersona}`}
            footer={
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={loading}
                        disabled={!selectedAtleta}
                    >
                        Enlazar Atleta
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
                {error && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        backgroundColor: 'var(--danger-light)',
                        color: 'var(--danger)',
                        borderRadius: '4px'
                    }}>
                        {error}
                    </div>
                )}

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Atleta Menor de Edad *
                    </label>
                    {atletasMenores.length === 0 ? (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '4px',
                            textAlign: 'center',
                            color: 'var(--text-secondary)'
                        }}>
                            No hay atletas menores de 18 años disponibles para enlazar.
                            <br />
                            <small>Total de atletas en el sistema: {atletas.length}</small>
                        </div>
                    ) : (
                        <>
                            <select
                                value={selectedAtleta}
                                onChange={(e) => setSelectedAtleta(e.target.value)}
                                className="form-input"
                                required
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                            >
                                <option value="">Seleccione un atleta</option>
                                {atletasMenores.map((atleta) => (
                                    <option key={atleta.idPersona} value={atleta.idPersona}>
                                        {atleta.nombrePersona} - DNI: {atleta.documento}
                                    </option>
                                ))}
                            </select>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                Solo se muestran atletas menores de 18 años ({atletasMenores.length} disponibles)
                            </small>
                        </>
                    )}
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Parentesco *
                    </label>
                    <select
                        value={parentesco}
                        onChange={(e) => setParentesco(e.target.value)}
                        className="form-input"
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    >
                        <option value="0">Padre/Madre</option>
                        <option value="1">Tutor Legal</option>
                        <option value="2">Abuelo/Abuela</option>
                        <option value="3">Tío/Tía</option>
                        <option value="4">Otro</option>
                    </select>
                </div>
            </form>
        </Modal>
    );
};

export default TutoresList;
