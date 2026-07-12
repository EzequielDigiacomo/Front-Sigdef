import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import { Plus, Edit, Trash2, Search, UserCheck, Eye, UserPlus, FileText, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useSort } from '../../../hooks/useSort';
import Modal from '../../../components/common/Modal';
import * as XLSX from 'xlsx';
import { withFederationScope } from '../../../utils/apiHelpers';
import { useDevice } from '../../../hooks/useDevice';
import MobileCard from '../../../components/common/MobileCard';
import '../Atletas/Atletas.css';
import { PARENTESCO_MAP } from '../../../utils/enums';

const TutoresList = () => {
    const { isNative } = useDevice();
    const { fedId } = useParams();
    const isSuperAdminView = Boolean(fedId);
    const [tutores, setTutores] = useState([]);
    const [atletas, setAtletas] = useState([]);
    const [atletaTutorRelaciones, setAtletaTutorRelaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const handleEditTutor = (id) => {
        const path = isSuperAdminView
            ? `/superadmin/federacion/${fedId}/tutores/${id}/edit`
            : `/dashboard/tutores/${id}/edit`;
        navigate(path, { state: { returnPath: location.pathname } });
    };

    const handleEditAtleta = (id) => {
        const path = isSuperAdminView
            ? `/superadmin/federacion/${fedId}/atletas/editar/${id}`
            : `/dashboard/atletas/editar/${id}`;
        navigate(path, { state: { returnPath: location.pathname } });
    };

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
        // Evitar dump /Persona: la búsqueda es por documento al escribir
        setPersonasDisponibles([]);
    };

    const searchPersonaByDocumento = async (documento) => {
        const doc = String(documento || '').trim();
        if (doc.length < 6) {
            setPersonasDisponibles([]);
            return;
        }
        try {
            const persona = await api.get(`/Persona/documento/${doc}`, { silentErrors: true });
            if (!persona) {
                setPersonasDisponibles([]);
                return;
            }
            const id = persona.idPersona ?? persona.IdPersona ?? persona.participanteId;
            const yaEsTutor = tutores.some((t) => String(t.idPersona) === String(id));
            if (yaEsTutor) {
                setPersonasDisponibles([]);
                return;
            }
            const fecha = persona.fechaNacimiento || persona.FechaNacimiento;
            if (fecha) {
                const nacimiento = new Date(fecha);
                const hoy = new Date();
                let edad = hoy.getFullYear() - nacimiento.getFullYear();
                const mes = hoy.getMonth() - nacimiento.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
                if (edad < 18) {
                    setPersonasDisponibles([]);
                    return;
                }
            }
            setPersonasDisponibles([{
                ...persona,
                idPersona: id,
                nombre: persona.nombre || persona.Nombre,
                apellido: persona.apellido || persona.Apellido,
                documento: persona.documento || persona.Documento || doc,
            }]);
        } catch {
            setPersonasDisponibles([]);
        }
    };

    const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);
    const [selectedPersonToAdd, setSelectedPersonToAdd] = useState(null);
    const [selectedTutorType, setSelectedTutorType] = useState('0');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tutorToDelete, setTutorToDelete] = useState(null);
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
        const idPersona = tutorToDelete.idPersona;
        const prevTutores = tutores;
        const prevRelaciones = atletaTutorRelaciones;

        setTutores((list) => list.filter((t) => String(t.idPersona) !== String(idPersona)));
        setAtletaTutorRelaciones((rels) =>
            rels.filter((r) => String(r.idTutor) !== String(idPersona))
        );
        setShowDeleteModal(false);
        setTutorToDelete(null);

        try {
            const relaciones = prevRelaciones.filter((r) => String(r.idTutor) === String(idPersona));
            if (relaciones.length > 0) {
                await Promise.all(
                    relaciones.map(async (r) => {
                        const idRelacion = r.id || r.idAtletaTutor;
                        try {
                            if (idRelacion) await api.delete(`/AtletaTutor/${idRelacion}`);
                            else await api.delete(`/AtletaTutor/${r.idAtleta}/${r.idTutor}`);
                        } catch (err) {
                            if (idRelacion && err.response?.status === 404) {
                                await api.delete(`/AtletaTutor/${r.idAtleta}/${r.idTutor}`);
                            }
                        }
                    })
                );
            }
            await api.delete(`/Tutor/${idPersona}`);
            setSuccessMessage('Tutor eliminado exitosamente.');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error eliminando tutor:', error);
            setTutores(prevTutores);
            setAtletaTutorRelaciones(prevRelaciones);
            alert('Error al eliminar tutor.');
        }
    };

    useEffect(() => {
        if (showAddExistingModal) loadPersonasDisponibles();
    }, [showAddExistingModal]);

    useEffect(() => {
        loadTutores();
    }, [fedId]);

    const loadTutores = async () => {
        try {
            setLoading(true);

            const tutoresPromise = api.get('/Tutor').catch(() => []);
            const relacionesPromise = api.get('/AtletaTutor').catch(() => []);
            const atletasPromise = api.get(withFederationScope('/Atleta', fedId)).catch(() => []);
            const clubesPromise = api.get(withFederationScope('/Clubes', fedId)).catch(() => []);

            const mapTutores = (tutoresRes) =>
                (tutoresRes || []).map((tutor) => {
                    const idPersona =
                        tutor.idPersona ?? tutor.IdPersona ?? tutor.participanteId ?? tutor.ParticipanteId;
                    return {
                        ...tutor,
                        idPersona,
                        documento: tutor.documento || tutor.Documento || '-',
                        telefono: tutor.telefono || tutor.Telefono || '-',
                        email: tutor.email || tutor.Email || '-',
                        nombrePersona: tutor.nombrePersona || tutor.NombrePersona || 'Tutor',
                    };
                });

            // Mostrar tutores apenas llegan (sin esperar atletas/clubes)
            const tutoresRes = await tutoresPromise;
            const tutoresEnriquecidos = mapTutores(tutoresRes);
            setTutores(tutoresEnriquecidos);
            setLoading(false);

            const [relacionesRes, atletasRes, clubesRes] = await Promise.all([
                relacionesPromise,
                atletasPromise,
                clubesPromise,
            ]);

            const clubesMap = new Map((clubesRes || []).map((c) => [c.idClub || c.IdClub, c]));

            const atletasEnriquecidos = (atletasRes || []).map((atleta) => {
                const club = clubesMap.get(atleta.idClub || atleta.IdClub);
                const persona = atleta.participante || atleta.Participante || {};
                const nombreFromPersona =
                    persona.nombre || persona.Nombre
                        ? `${persona.nombre || persona.Nombre} ${persona.apellido || persona.Apellido || ''}`.trim()
                        : '';
                const idPersona =
                    atleta.idPersona ?? atleta.IdPersona ?? atleta.participanteId ?? atleta.ParticipanteId;

                return {
                    ...atleta,
                    idPersona,
                    documento:
                        atleta.documento || atleta.Documento || persona.documento || persona.Documento || '-',
                    nombrePersona:
                        atleta.nombrePersona || atleta.NombrePersona || nombreFromPersona || 'Atleta',
                    fechaNacimiento:
                        atleta.fechaNacimiento ||
                        atleta.FechaNacimiento ||
                        persona.fechaNacimiento ||
                        persona.FechaNacimiento ||
                        null,
                    nombreClub: club
                        ? club.nombre || club.Nombre
                        : atleta.nombreClub ||
                          atleta.NombreClub ||
                          atleta.club?.nombre ||
                          atleta.Club?.Nombre ||
                          'Agente Libre',
                };
            });

            const atletaIds = new Set(
                atletasEnriquecidos.map((a) => a.idPersona).filter((id) => id != null)
            );

            const normalizeRelacion = (rel) => ({
                ...rel,
                idAtleta: rel.idAtleta ?? rel.IdAtleta ?? rel.participanteId ?? rel.ParticipanteId,
                idTutor: rel.idTutor ?? rel.IdTutor,
                participanteId: rel.participanteId ?? rel.ParticipanteId ?? rel.idAtleta ?? rel.IdAtleta,
            });

            let relacionesFiltradas = (relacionesRes || []).map(normalizeRelacion);
            let tutoresFinal = tutoresEnriquecidos;

            if (fedId && atletaIds.size > 0) {
                relacionesFiltradas = relacionesFiltradas.filter((rel) => atletaIds.has(rel.idAtleta));
                const tutorIdsEnFed = new Set(relacionesFiltradas.map((r) => r.idTutor));
                tutoresFinal = tutoresEnriquecidos.filter((t) => tutorIdsEnFed.has(t.idPersona));
            }

            setAtletas(atletasEnriquecidos);
            setAtletaTutorRelaciones(relacionesFiltradas);
            setTutores(tutoresFinal);
        } catch (error) {
            console.error('Error cargando tutores:', error);
            setLoading(false);
        }
    };

    const loadDocuments = async (personId) => {
        try {
            const docs = await api.get(`/Documentacion/persona/${personId}`);
            setExistingDocuments(docs || []);
        } catch (error) {
            console.error('Error cargando documentos:', error);
        }
    };

    const getAtletasRepresentados = (idTutor) => {
        const tutorId = Number(idTutor);
        if (!Number.isFinite(tutorId)) return [];

        const relacionesDelTutor = atletaTutorRelaciones.filter(
            (rel) => Number(rel.idTutor ?? rel.IdTutor) === tutorId
        );
        const atletasIds = new Set(
            relacionesDelTutor.map((rel) =>
                Number(rel.idAtleta ?? rel.IdAtleta ?? rel.participanteId ?? rel.ParticipanteId)
            )
        );

        return atletas.filter((atleta) => {
            const atletaId = Number(
                atleta.idPersona ?? atleta.IdPersona ?? atleta.participanteId ?? atleta.ParticipanteId
            );
            return atletasIds.has(atletaId);
        });
    };

    const tutoresFiltrados = tutores.filter(tutor => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            tutor.nombrePersona?.toLowerCase().includes(search) ||
            tutor.documento?.toLowerCase().includes(search) ||
            tutor.telefono?.toLowerCase().includes(search) ||
            tutor.email?.toLowerCase().includes(search)
        );
    });

    const { items: sortedTutores, requestSort, sortConfig } = useSort(tutoresFiltrados);

    const exportTutorToExcel = (tutor) => {
        if (!tutor) return;
        try {
            const atletasRepresentados = getAtletasRepresentados(tutor.idPersona);
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
            atletasRepresentados.forEach(atleta => {
                rows.push([atleta.nombrePersona, atleta.documento, atleta.nombreClub]);
            });
            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Ficha");
            XLSX.writeFile(wb, `Ficha_Tutor_${tutor.documento}.xlsx`);
        } catch (err) {
            console.error('Error al exportar Excel:', err);
        }
    };

    return (
        <div className={`page-container ${isNative ? 'mobile-view' : ''}`}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UserCheck size={isNative ? 24 : 28} />
                    <h2 className="page-title">{isNative ? 'Tutores' : 'Gestión de Tutores'}</h2>
                </div>
                <div className="flex gap-2">
                    {!isNative && (
                        <Button variant="secondary" onClick={() => setShowAddExistingModal(true)}>
                            <UserPlus size={20} /> Vincular
                        </Button>
                    )}
                    <Button onClick={() => {
                        const base = isSuperAdminView ? `/superadmin/federacion/${fedId}/tutores` : '/dashboard/tutores';
                        navigate(`${base}/nuevo`, { state: { returnPath: base } });
                    }} icon={Plus}>
                        {isNative ? 'Nuevo' : 'Nuevo Tutor'}
                    </Button>
                </div>
            </div>

            <Card className="mb-4">
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="dark-focused" />
                </div>
            </Card>

            {loading ? (
                <div className="text-center p-8"><div className="spinner"></div></div>
            ) : isNative ? (
                <div className="mobile-list-container">
                    {tutoresFiltrados.length === 0 ? (
                        <p className="text-center">No hay tutores registrados</p>
                    ) : (
                        tutoresFiltrados.map(tutor => {
                            const atletasRep = getAtletasRepresentados(tutor.idPersona);
                            return (
                                <MobileCard
                                    key={tutor.idPersona}
                                    title={tutor.nombrePersona}
                                    subtitle={tutor.email}
                                    badge={atletasRep.length > 0 ? <span className="badge badge-primary">{atletasRep.length} Atleta(s)</span> : null}
                                    details={[
                                        { label: 'DNI', value: tutor.documento || '-' },
                                        { label: 'Tel', value: tutor.telefono || '-' }
                                    ]}
                                    onClick={() => {
                                        setSelectedTutorForDetails(tutor);
                                        setShowDetailsModal(true);
                                    }}
                                    actions={
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" icon={Edit} onClick={(e) => { e.stopPropagation(); handleEditTutor(tutor.idPersona); }} />
                                            <Button variant="ghost" size="sm" icon={Plus} onClick={(e) => { e.stopPropagation(); setSelectedTutorForDocs(tutor); loadDocuments(tutor.idPersona); setShowUploadModal(true); }} />
                                            <Button variant="ghost" size="sm" icon={Eye} onClick={(e) => { e.stopPropagation(); setSelectedTutorForDocs(tutor); setShowViewerModal(true); }} />
                                        </div>
                                    }
                                />
                            );
                        })
                    )}
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="sortable-header" onClick={() => requestSort('nombrePersona')}>
                                    <div className="header-content">
                                        Nombre Completo
                                        {sortConfig.key === 'nombrePersona' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} className="opacity-30" />}
                                    </div>
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('documento')}>
                                    <div className="header-content">
                                        DNI
                                        {sortConfig.key === 'documento' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} className="opacity-30" />}
                                    </div>
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('telefono')}>
                                    <div className="header-content">
                                        Teléfono
                                        {sortConfig.key === 'telefono' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} className="opacity-30" />}
                                    </div>
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('email')}>
                                    <div className="header-content">
                                        Email
                                        {sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} className="opacity-30" />}
                                    </div>
                                </th>
                                <th>Atletas Representados</th>
                                <th>Documentación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTutores.map((tutor) => {
                                const atletasRepresentados = getAtletasRepresentados(tutor.idPersona);
                                return (
                                    <tr key={tutor.idPersona} onClick={() => { setSelectedTutorForDetails(tutor); setShowDetailsModal(true); }} style={{ cursor: 'pointer' }} className="hover:bg-gray-50">
                                        <td>{tutor.nombrePersona}</td>
                                        <td>{tutor.documento}</td>
                                        <td>{tutor.telefono}</td>
                                        <td>{tutor.email}</td>
                                        <td>
                                            {atletasRepresentados.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    {atletasRepresentados.map((atleta, idx) => (
                                                        <div key={idx} className="text-sm">
                                                            <strong>{atleta.nombrePersona}</strong> - DNI: {atleta.documento}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-secondary">Sin atletas</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="ghost" size="sm" className="p-1 h-auto" title="Subir" onClick={(e) => { e.stopPropagation(); setSelectedTutorForDocs(tutor); loadDocuments(tutor.idPersona); setShowUploadModal(true); }}><Plus size={18} className="text-primary" /></Button>
                                                <Button variant="ghost" size="sm" className="p-1 h-auto" title="Ver" onClick={(e) => { e.stopPropagation(); setSelectedTutorForDocs(tutor); setShowViewerModal(true); }}><Eye size={18} className="text-primary" /></Button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedTutorForLink(tutor); setShowLinkAthleteModal(true); }} title="Enlazar"><UserPlus size={18} /></Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleEditTutor(tutor.idPersona)}><Edit size={18} /></Button>
                                                <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDeleteClick(tutor)}><Trash2 size={18} /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

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
                    personDocumento={selectedTutorForDocs.documento || selectedTutorForDocs.persona?.documento || selectedTutorForDocs.persona?.dni}
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
                                    handleEditTutor(selectedTutorForDetails.idPersona);
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
                                                        handleEditAtleta(atleta.idPersona);
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
                                placeholder="Buscar por DNI (mín. 6 dígitos)..."
                                value={searchTermPersonas}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSearchTermPersonas(value);
                                    searchPersonaByDocumento(value);
                                }}
                            />
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            {personasDisponibles.map(p => (
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
                                    {searchTermPersonas.trim().length < 6
                                        ? 'Ingresá el DNI para buscar una persona mayor de edad.'
                                        : 'No se encontró persona disponible con ese DNI.'}
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
const LinkAthleteModal = ({ isOpen, onClose, tutor, atletas, onSuccess }) => {
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
                            SexoId: personaData.sexoId || personaData.SexoId || (typeof personaData.sexo === 'number' ? personaData.sexo : (personaData.sexo?.id || 1)),
                            Email: faltaEmail && emailTutor ? emailTutor : personaData.email,
                            Telefono: faltaTelefono && telefonoTutor ? telefonoTutor : personaData.telefono
                        };

                        await api.put(`/Persona/${idAtleta}`, updatedPersona);
                    }
                }
            }

            // 2. Crear el enlace (API espera ParticipanteId = atleta)
            const payload = {
                ParticipanteId: idAtleta,
                IdTutor: tutor.idPersona ?? tutor.participanteId ?? tutor.ParticipanteId,
                Parentesco: parseInt(parentesco, 10),
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
