import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import Pagination from '../../../components/common/Pagination';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import { Plus, Edit, Trash2, Search, FileText, Eye, ChevronUp, ChevronDown, ChevronsUpDown, AlertCircle, ArrowLeft } from 'lucide-react';
import { useSort } from '../../../hooks/useSort';
import { withFederationScope } from '../../../utils/apiHelpers';
import { getCategoriaLabel, getEstadoPagoLabel, getEstadoPagoColor, TIPO_DOCUMENTO_MAP } from '../../../utils/enums';
import { TutorStatusCell, calcEdad } from '../../../components/common/TutorStatusCell';
import './Atletas.css';
import Modal from '../../../components/common/Modal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import AtletaDetailModal from './components/AtletaDetailModal';
import { buildAtletaUpdatePayload, getParticipanteId } from '../../../utils/atletaUtils';
import * as XLSX from 'xlsx';
import { useDevice } from '../../../hooks/useDevice';
import MobileCard from '../../../components/common/MobileCard';

/** Misma fuente que SportTrack: nombre de catálogo; fallback al enum SIGDEF. */
const formatCategoria = (atleta) => {
    const nombre = atleta?.categoriaNombre ?? atleta?.CategoriaNombre;
    if (nombre) return nombre;
    const categoria = atleta?.categoria ?? atleta?.Categoria;
    if (categoria != null && categoria !== '') {
        return getCategoriaLabel(categoria);
    }
    const categoriaId = atleta?.categoriaId ?? atleta?.CategoriaId;
    if (categoriaId != null) {
        return getCategoriaLabel(categoriaId);
    }
    return '-';
};

const normalizeAtleta = (a) => {
    const tutorInfoRaw = a.tutorInfo ?? a.TutorInfo ?? null;
    const tutorInfo = tutorInfoRaw
        ? {
              ...tutorInfoRaw,
              nombre: tutorInfoRaw.nombre ?? tutorInfoRaw.Nombre ?? '',
              apellido: tutorInfoRaw.apellido ?? tutorInfoRaw.Apellido ?? '',
              documento: tutorInfoRaw.documento ?? tutorInfoRaw.Documento ?? '',
              telefono: tutorInfoRaw.telefono ?? tutorInfoRaw.Telefono ?? '',
          }
        : null;

    const fechaRaw =
        a.fechaNacimiento ??
        a.FechaNacimiento ??
        a.participante?.fechaNacimiento ??
        a.Participante?.FechaNacimiento ??
        a.persona?.fechaNacimiento ??
        null;
    const fechaNacimiento = calcEdad(fechaRaw) != null ? fechaRaw : null;

    const edad =
        a.edad != null && Number(a.edad) >= 0 && Number(a.edad) <= 120
            ? Number(a.edad)
            : a.Edad != null && Number(a.Edad) >= 0 && Number(a.Edad) <= 120
              ? Number(a.Edad)
              : calcEdad(fechaNacimiento);

    const tieneTutor =
        Boolean(tutorInfo) ||
        Boolean(a.tieneTutor) ||
        (Array.isArray(a.tutores) && a.tutores.length > 0) ||
        (Array.isArray(a.Tutores) && a.Tutores.length > 0);

    return {
        ...a,
        idPersona: a.idPersona ?? a.IdPersona ?? a.participanteId ?? a.ParticipanteId,
        nombrePersona: a.nombrePersona ?? a.NombrePersona ?? '-',
        documento: a.documento ?? a.Documento ?? '-',
        nombreClub: a.nombreClub ?? a.NombreClub ?? 'Agente Libre',
        categoria: a.categoria ?? a.Categoria ?? null,
        categoriaId: a.categoriaId ?? a.CategoriaId ?? null,
        categoriaNombre: a.categoriaNombre ?? a.CategoriaNombre ?? null,
        perteneceSeleccion: a.perteneceSeleccion ?? a.PerteneceSeleccion ?? false,
        estadoPago: a.estadoPago ?? a.EstadoPago,
        fechaCreacion: a.fechaCreacion ?? a.FechaCreacion,
        tutorInfo,
        fechaNacimiento,
        edad,
        tieneTutor,
        cantidadDocumentos: a.cantidadDocumentos ?? a.CantidadDocumentos ?? 0,
    };
};
const AtletasList = () => {
    const { isNative } = useDevice();
    const { fedId } = useParams();                          // Presente cuando el SuperAdmin entra a /superadmin/federacion/:fedId/atletas
    const isSuperAdminView = Boolean(fedId);
    const [atletas, setAtletas] = useState([]);
    // ... rest of state
    const [loading, setLoading] = useState(true);
    const [selectedAtleta, setSelectedAtleta] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    // Sort logic
    const { items: sortedAtletas, requestSort, sortConfig } = useSort(atletas);

    // Upload Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedAthleteForUpload, setSelectedAthleteForUpload] = useState(null);
    
    // Viewer Modal State
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedAthleteForViewer, setSelectedAthleteForViewer] = useState(null);
    const [existingDocuments, setExistingDocuments] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const navigate = useNavigate();
    const location = useLocation();
    
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [clubs, setClubs] = useState([]);
    const [selectedClubForBulk, setSelectedClubForBulk] = useState('');
    const [bulkStatus, setBulkStatus] = useState(1); // Default to 'Pagado'
    const [bulkUpdating, setBulkUpdating] = useState(false);
    
    // Confirmation Modal States
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'info'
    });
    
    // Debounce state for searchTerm
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        loadAtletas();
        loadClubs();
    }, [currentPage, itemsPerPage, debouncedSearchTerm, fedId]);

    const loadClubs = async () => {
        try {
            const data = await api.get(withFederationScope('/Clubes', fedId));
            setClubs(data || []);
        } catch (error) {
            console.error('Error cargando clubes:', error);
        }
    };

    const handleBulkUpdate = async () => {
        if (!selectedClubForBulk) {
            alert('Por favor selecciona un club.');
            return;
        }

        const clubName = clubs.find(c => c.idClub === parseInt(selectedClubForBulk))?.nombre || 'el club seleccionado';
        const statusLabel = getEstadoPagoLabel(bulkStatus).toUpperCase();

        setConfirmModal({
            isOpen: true,
            title: 'Confirmar Actualización Masiva',
            message: `¿Estás seguro de marcar como ${statusLabel} a TODOS los atletas del club "${clubName}"? Esta acción no se puede deshacer de forma masiva.`,
            type: 'danger',
            onConfirm: executeBulkUpdate
        });
    };

    const executeBulkUpdate = async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setBulkUpdating(true);
        try {
            const allAtletas = await api.get(withFederationScope('/Atleta', fedId));
            const clubAtletas = allAtletas.filter(a => (a.idClub || a.IdClub) === parseInt(selectedClubForBulk));
            
            let count = 0;
            for (const atleta of clubAtletas) {
                const participanteId = getParticipanteId(atleta);
                const payload = buildAtletaUpdatePayload(atleta, { estadoPago: bulkStatus });
                await api.put(`/Atleta/${participanteId}`, payload);
                count++;
            }
            
            setConfirmModal({
                isOpen: true,
                title: 'Actualización Exitosa',
                message: `Se han actualizado ${count} atletas del club con éxito.`,
                type: 'success',
                showCancel: false,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
            loadAtletas();
        } catch (error) {
            console.error('Error en actualización masiva:', error);
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'Ocurrió un error al intentar actualizar los atletas.',
                type: 'danger',
                showCancel: false,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setBulkUpdating(false);
        }
    };

    const loadAtletas = async () => {
        try {
            setLoading(true);
            
            // Intentar endpoint paginado primero
            try {
                const response = await api.get(withFederationScope(
                    `/Atleta/paged?pageNumber=${currentPage}&pageSize=${itemsPerPage}&searchTerm=${encodeURIComponent(debouncedSearchTerm)}`,
                    fedId
                ));
                
                if (response && response.data) {
                    const normalized = (response.data || []).map(normalizeAtleta);
                    const relaciones = await api.get(withFederationScope('/AtletaTutor', fedId)).catch(() => []);
                    const conTutor = new Set(
                        (Array.isArray(relaciones) ? relaciones : [])
                            .map((r) => Number(r.idAtleta ?? r.IdAtleta ?? r.participanteId ?? r.ParticipanteId))
                            .filter((id) => Number.isFinite(id))
                    );
                    setAtletas(normalized.map((a) => ({
                        ...a,
                        tieneTutor: Boolean(a.tieneTutor) || conTutor.has(Number(a.idPersona)),
                    })));
                    setTotalPages(response.totalPages || 1);
                    setTotalRecords(response.totalRecords || 0);
                    return;
                }
            } catch (pagedError) {
                console.warn('Endpoint /Atleta/paged no disponible, usando fallback:', pagedError.message);
            }

            // Fallback: usar /Atleta completo con paginación client-side
            const allAtletas = await api.get(withFederationScope('/Atleta', fedId));
            let atletasArray = Array.isArray(allAtletas) ? allAtletas : [];

            // Si estamos en modo SuperAdmin (fedId presente), filtramos por federación
            // NOTA: el backend de SIGDEF no expone un filtro por federación en /Atleta
            // así que hacemos el filtrado client-side usando los clubes de la federación.
            if (fedId) {
                try {
                    const clubesFed = await api.get('/Club');
                    const clubIdsFed = (Array.isArray(clubesFed) ? clubesFed : [])
                        .filter(c => String(c.idFederacion ?? c.federacionId ?? '') === String(fedId))
                        .map(c => c.idClub);
                    // Si no hay clubes con idFederacion, mostramos todos (datos no tienen el campo)
                    if (clubIdsFed.length > 0) {
                        atletasArray = atletasArray.filter(a =>
                            clubIdsFed.includes(a.idClub ?? a.IdClub)
                        );
                    }
                } catch (filterErr) {
                    console.warn('No se pudo filtrar atletas por federación:', filterErr);
                }
            }

            // Normalizar campos
            const normalized = atletasArray.map(a => {
                const base = normalizeAtleta(a);
                return {
                    ...base,
                    nombrePersona: base.nombrePersona !== '-'
                        ? base.nombrePersona
                        : (a.persona ? `${a.persona.nombre} ${a.persona.apellido}` : '-'),
                    documento: base.documento !== '-'
                        ? base.documento
                        : (a.persona?.documento || '-'),
                    nombreClub: a.nombreClub || a.club?.nombre || base.nombreClub,
                    tutorInfo: base.tutorInfo || (a.tutores?.[0] ? {
                        nombre: a.tutores[0].nombreTutor?.split(' ')[0] || '',
                        apellido: a.tutores[0].nombreTutor?.split(' ').slice(1).join(' ') || '',
                        documento: '',
                        telefono: ''
                    } : null),
                    fechaNacimiento:
                        base.fechaNacimiento ||
                        a.persona?.fechaNacimiento ||
                        a.participante?.fechaNacimiento ||
                        a.Participante?.FechaNacimiento ||
                        null,
                    edad: base.edad ?? calcEdad(
                        a.persona?.fechaNacimiento ||
                        a.participante?.fechaNacimiento ||
                        a.Participante?.FechaNacimiento
                    ),
                };
            });

            // Filtrar por búsqueda
            const filtered = debouncedSearchTerm
                ? normalized.filter(a =>
                    (a.nombrePersona || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    (a.documento || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    (a.nombreClub || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                )
                : normalized;

            const total = filtered.length;
            const totalPgs = Math.max(1, Math.ceil(total / itemsPerPage));
            const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            const relaciones = await api.get(withFederationScope('/AtletaTutor', fedId)).catch(() => []);
            const conTutor = new Set(
                (Array.isArray(relaciones) ? relaciones : [])
                    .map((r) => Number(r.idAtleta ?? r.IdAtleta ?? r.participanteId ?? r.ParticipanteId))
                    .filter((id) => Number.isFinite(id))
            );

            setAtletas(paginated.map((a) => ({
                ...a,
                tieneTutor: Boolean(a.tieneTutor) || conTutor.has(Number(a.idPersona)),
            })));
            setTotalPages(totalPgs);
            setTotalRecords(total);
        } catch (error) {
            console.error('Error cargando atletas:', error);
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

    const handleRowClick = (atleta) => {
        setSelectedAtleta(atleta);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedAtleta(null);
    };

    const exportToExcel = async () => {
        try {
            const response = await api.get(withFederationScope('/Atleta/paged?pageNumber=1&pageSize=5000', fedId));
            const dataToExport = (response.data || []).map(atleta => ({
                'Nombre Completo': atleta.nombrePersona,
                'DNI': atleta.documento,
                'Edad': atleta.edad,
                'Club': atleta.nombreClub,
                'Categoría': formatCategoria(atleta),
                'Fecha Alta': atleta.fechaCreacion ? new Date(atleta.fechaCreacion).toLocaleDateString('es-AR') : '-',
                'Tutor': atleta.tutorInfo ? `${atleta.tutorInfo.nombre} ${atleta.tutorInfo.apellido}` : '-',
                'Selección': atleta.perteneceSeleccion ? 'Sí' : 'No',
                'Estado Pago': getEstadoPagoLabel(atleta.estadoPago)
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Atletas");
            XLSX.writeFile(wb, "Atletas_SIGDEF.xlsx");
        } catch (e) {
            console.error("Error exportando a excel:", e);
        }
    };

    const currentAtletas = atletas;

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className={`page-container ${isNative ? 'mobile-view' : ''}`}>

            {/* Banner contextual cuando el SuperAdmin ve una federación específica */}
            {isSuperAdminView && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: '10px',
                    padding: '0.7rem 1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                }}>
                    <button
                        onClick={() => navigate(`/superadmin/federacion/${fedId}`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600', fontSize: '0.85rem', padding: 0 }}
                    >
                        <ArrowLeft size={15} /> Volver al dashboard de la federación
                    </button>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Modo Supervisión SuperAdmin</span>
                </div>
            )}

            <div className="page-header">
                <h2 className="page-title">{isSuperAdminView ? 'Atletas de la Federación' : 'Gestión de Atletas'}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {!isNative && (
                        <Button variant="secondary" onClick={exportToExcel}>
                            <FileText size={20} /> Exportar Excel
                        </Button>
                    )}
                    <Button onClick={() => {
                            const nuevoPath = isSuperAdminView
                                ? `/superadmin/federacion/${fedId}/atletas/nuevo`
                                : '/dashboard/atletas/nuevo';
                            navigate(nuevoPath, { state: { returnPath: isSuperAdminView ? `/superadmin/federacion/${fedId}/atletas` : '/dashboard/atletas' } });
                        }}>
                        <Plus size={20} /> Nuevo
                    </Button>
                </div>
            </div>

            {isNative ? (
                <div className="mobile-list-container">
                    <div className="mobile-search">
                        <FormField icon={Search} placeholder="Buscar atleta..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    {loading ? (
                        <p className="text-center">Cargando...</p>
                    ) : atletas.length === 0 ? (
                        <p className="text-center">No hay atletas registrados</p>
                    ) : (
                        atletas.map(atleta => (
                            <MobileCard 
                                key={atleta.idPersona}
                                title={atleta.nombrePersona}
                                subtitle={atleta.nombreClub}
                                badge={atleta.perteneceSeleccion ? <span className="badge badge-success">Selección</span> : null}
                                details={[
                                    { label: 'DNI', value: atleta.documento },
                                    { label: 'Categoría', value: formatCategoria(atleta) },
                                    {
                                        label: 'Tutor',
                                        value: (
                                            <TutorStatusCell
                                                edad={atleta.edad}
                                                tieneTutor={atleta.tieneTutor}
                                                fechaNacimiento={atleta.fechaNacimiento}
                                                categoria={atleta.categoria}
                                                categoriaId={atleta.categoriaId}
                                                categoriaNombre={atleta.categoriaNombre}
                                            />
                                        ),
                                    },
                                    { label: 'Pago', value: (
                                        <span className={`badge badge-${getEstadoPagoColor(atleta.estadoPago)}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                            {getEstadoPagoLabel(atleta.estadoPago)}
                                        </span>
                                    )}
                                ]}
                                actions={
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/dashboard/atletas/editar/${atleta.idPersona}`);
                                        }}>
                                            <Edit size={18} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            title="Subir documentos"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedAthleteForUpload(atleta);
                                                loadDocuments(atleta.idPersona);
                                                setShowUploadModal(true);
                                            }}
                                        >
                                            <Plus size={18} className="text-primary" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            title="Ver documentos"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedAthleteForViewer(atleta);
                                                setShowViewerModal(true);
                                            }}
                                        >
                                            <Eye size={18} className="text-primary" />
                                        </Button>
                                    </div>
                                }
                                onClick={() => handleRowClick(atleta)}
                            />
                        ))
                    )}
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
            ) : (
                <Card>
                    <div className="filters-bar" style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <FormField icon={Search} placeholder="Buscar por nombre, DNI, club..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        
                        <div className="bulk-actions" style={{ 
                            display: 'flex', 
                            gap: '0.75rem', 
                            alignItems: 'center', 
                            padding: '0.5rem 1rem', 
                            backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                Pago x Club:
                            </span>
                            <select 
                                className="form-input" 
                                style={{ width: '150px', padding: '0.4rem', fontSize: '0.85rem' }}
                                value={selectedClubForBulk}
                                onChange={(e) => setSelectedClubForBulk(e.target.value)}
                            >
                                <option value="">Seleccionar Club</option>
                                {clubs.map(club => (
                                    <option key={club.idClub} value={club.idClub}>{club.nombre}</option>
                                ))}
                            </select>
                            <select 
                                className="form-input" 
                                style={{ width: '120px', padding: '0.4rem', fontSize: '0.85rem' }}
                                value={bulkStatus}
                                onChange={(e) => setBulkStatus(parseInt(e.target.value))}
                            >
                                <option value={1}>Pagado</option>
                                <option value={0}>Pendiente</option>
                                <option value={2}>Vencido</option>
                                <option value={3}>Parcial</option>
                            </select>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleBulkUpdate} 
                                disabled={bulkUpdating || !selectedClubForBulk}
                                isLoading={bulkUpdating}
                            >
                                Aplicar
                            </Button>
                        </div>
                    </div>

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
                                    <th className="sortable-header" onClick={() => requestSort('edad')}>
                                        <div className="header-content">
                                            Edad
                                            {sortConfig.key === 'edad' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} className="opacity-30" />}
                                        </div>
                                    </th>
                                    <th className="sortable-header" onClick={() => requestSort('nombreClub')}>
                                        <div className="header-content">
                                            Club
                                            {sortConfig.key === 'nombreClub' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} className="opacity-30" />}
                                        </div>
                                    </th>
                                    <th className="sortable-header" onClick={() => requestSort('categoria')}>
                                        <div className="header-content">
                                            Categoría
                                            {sortConfig.key === 'categoria' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} className="opacity-30" />}
                                        </div>
                                    </th>
                                    <th className="sortable-header" onClick={() => requestSort('fechaCreacion')}>
                                        <div className="header-content">
                                            Fecha Alta
                                            {sortConfig.key === 'fechaCreacion' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} className="opacity-30" />}
                                        </div>
                                    </th>
                                    <th>Tutor</th>
                                    <th>Selección</th>
                                    <th>Estado Pago</th>
                                    <th>Documentación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="11" className="text-center">Cargando...</td></tr>
                                ) : atletas.length === 0 ? (
                                    <tr><td colSpan="11" className="text-center">No hay atletas registrados</td></tr>
                                ) : (
                                    sortedAtletas.map((atleta) => (
                                        <tr
                                            key={atleta.idPersona}
                                            onClick={() => handleRowClick(atleta)}
                                            style={{ cursor: 'pointer' }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td>{atleta.nombrePersona || '-'}</td>
                                            <td>{atleta.documento}</td>
                                            <td>{atleta.edad !== null ? `${atleta.edad} ` : '-'}</td>
                                            <td>{atleta.nombreClub || '-'}</td>
                                            <td>{formatCategoria(atleta)}</td>
                                            <td>
                                                {atleta.fechaCreacion ? (
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        {new Date(atleta.fechaCreacion).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        <br />
                                                        {new Date(atleta.fechaCreacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="text-center">
                                                <TutorStatusCell
                                                    edad={atleta.edad}
                                                    tieneTutor={atleta.tieneTutor}
                                                    fechaNacimiento={atleta.fechaNacimiento}
                                                    categoria={atleta.categoria}
                                                    categoriaId={atleta.categoriaId}
                                                    categoriaNombre={atleta.categoriaNombre}
                                                    title={
                                                        atleta.tutorInfo
                                                            ? `Tutor: ${atleta.tutorInfo.nombre} ${atleta.tutorInfo.apellido}`.trim()
                                                            : undefined
                                                    }
                                                />
                                            </td>
                                            <td>
                                                {atleta.perteneceSeleccion ? (
                                                    <span className="badge badge-success">Sí</span>
                                                ) : (
                                                    <span className="badge badge-secondary">No</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge badge-${getEstadoPagoColor(atleta.estadoPago)}`}>
                                                    {getEstadoPagoLabel(atleta.estadoPago)}
                                                </span>
                                            </td>
                                            <td className="docs-col">
                                                <div
                                                    className="docs-cell"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title={`${atleta.cantidadDocumentos || 0} de ${Object.keys(TIPO_DOCUMENTO_MAP).length} documentos`}
                                                >
                                                    <div className="docs-cell-actions">
                                                        <button
                                                            type="button"
                                                            className="docs-icon-btn"
                                                            title="Subir documento"
                                                            onClick={() => {
                                                                setSelectedAthleteForUpload(atleta);
                                                                loadDocuments(atleta.idPersona);
                                                                setShowUploadModal(true);
                                                            }}
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="docs-icon-btn"
                                                            title="Ver documentos"
                                                            onClick={() => {
                                                                setSelectedAthleteForViewer(atleta);
                                                                setShowViewerModal(true);
                                                            }}
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="docs-cell-meter">
                                                        <div className="docs-segments">
                                                            {Object.keys(TIPO_DOCUMENTO_MAP).map((key, i) => (
                                                                <span
                                                                    key={key}
                                                                    className={`docs-segment ${(atleta.cantidadDocumentos || 0) > i ? 'filled' : ''}`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="docs-count">
                                                            {atleta.cantidadDocumentos || 0}/{Object.keys(TIPO_DOCUMENTO_MAP).length}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/atletas/editar/${atleta.idPersona}`, { state: { returnPath: '/dashboard/atletas' } })}>
                                                        <Edit size={18} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-danger">
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </Card>
            )}

            <AtletaDetailModal
                isOpen={showModal}
                onClose={handleCloseModal}
                athlete={selectedAtleta}
                onRefresh={loadAtletas}
            />

            {/* Document Upload Modal */}
            {showUploadModal && selectedAthleteForUpload && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedAthleteForUpload(null);
                    }}
                    onSuccess={() => {
                        // Reload athletes to update status if necessary (though simplified status logic might not change immediately without deeper check)
                        loadAtletas();
                    }}
                    personName={selectedAthleteForUpload.nombrePersona}
                    personId={selectedAthleteForUpload.idPersona}
                    existingDocuments={existingDocuments}
                />
            )}

            {/* Document Viewer Modal */}
            {showViewerModal && selectedAthleteForViewer && (
                <DocumentViewerModal
                    isOpen={showViewerModal}
                    onClose={() => {
                        setShowViewerModal(false);
                        setSelectedAthleteForViewer(null);
                    }}
                    personName={selectedAthleteForViewer.nombrePersona}
                    personDocumento={selectedAthleteForViewer.documento}
                    personId={selectedAthleteForViewer.idPersona}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                showCancel={confirmModal.showCancel !== false}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

        </div>
    );
};

export default AtletasList;
