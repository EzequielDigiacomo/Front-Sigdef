import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import Pagination from '../../../components/common/Pagination';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import { Plus, Edit, Trash2, Search, FileText, Eye, ChevronUp, ChevronDown, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { useSort } from '../../../hooks/useSort';
import { getCategoriaLabel, getEstadoPagoLabel, getEstadoPagoColor } from '../../../utils/enums';
import './Atletas.css';
import Modal from '../../../components/common/Modal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import AtletaDetailModal from './components/AtletaDetailModal';
import * as XLSX from 'xlsx';
import { useDevice } from '../../../hooks/useDevice';
import MobileCard from '../../../components/common/MobileCard';

const AtletasList = () => {
    const { isNative } = useDevice();
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
    }, [currentPage, itemsPerPage, debouncedSearchTerm]);

    const loadClubs = async () => {
        try {
            const data = await api.get('/Club');
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
            const allAtletas = await api.get('/Atleta');
            const clubAtletas = allAtletas.filter(a => (a.idClub || a.IdClub) === parseInt(selectedClubForBulk));
            
            let count = 0;
            for (const atleta of clubAtletas) {
                const payload = { ...atleta, estadoPago: bulkStatus };
                await api.put(`/Atleta/${atleta.idPersona || atleta.IdPersona}`, payload);
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
                const response = await api.get(`/Atleta/paged?pageNumber=${currentPage}&pageSize=${itemsPerPage}&searchTerm=${debouncedSearchTerm}`);
                
                if (response && response.data) {
                    setAtletas(response.data);
                    setTotalPages(response.totalPages || 1);
                    setTotalRecords(response.totalRecords || 0);
                    return;
                }
            } catch (pagedError) {
                console.warn('Endpoint /Atleta/paged no disponible, usando fallback:', pagedError.message);
            }

            // Fallback: usar /Atleta completo con paginación client-side
            const allAtletas = await api.get('/Atleta');
            const atletasArray = Array.isArray(allAtletas) ? allAtletas : [];

            // Normalizar campos
            const normalized = atletasArray.map(a => ({
                idPersona: a.idPersona || a.IdPersona,
                nombrePersona: a.nombrePersona || (a.persona ? `${a.persona.nombre} ${a.persona.apellido}` : '-'),
                documento: a.documento || a.persona?.documento || '-',
                nombreClub: a.nombreClub || a.club?.nombre || 'Agente Libre',
                categoria: a.categoria ?? a.Categoria,
                perteneceSeleccion: a.perteneceSeleccion || a.PerteneceSeleccion || false,
                estadoPago: a.estadoPago ?? a.EstadoPago,
                fechaCreacion: a.fechaCreacion || a.FechaCreacion,
                tutorInfo: a.tutores?.[0] ? {
                    nombre: a.tutores[0].nombreTutor?.split(' ')[0] || '',
                    apellido: a.tutores[0].nombreTutor?.split(' ').slice(1).join(' ') || '',
                    documento: '',
                    telefono: ''
                } : null,
                edad: a.persona?.fechaNacimiento 
                    ? (new Date()).getFullYear() - new Date(a.persona.fechaNacimiento).getFullYear()
                    : null,
                cantidadDocumentos: 0
            }));

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

            setAtletas(paginated);
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
            const response = await api.get('/Atleta/paged?pageNumber=1&pageSize=5000');
            const dataToExport = (response.data || []).map(atleta => ({
                'Nombre Completo': atleta.nombrePersona,
                'DNI': atleta.documento,
                'Edad': atleta.edad,
                'Club': atleta.nombreClub,
                'Categoría': atleta.categoria != null ? getCategoriaLabel(atleta.categoria) : '-',
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
            <div className="page-header">
                <h2 className="page-title">Gestión de Atletas</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {!isNative && (
                        <Button variant="secondary" onClick={exportToExcel}>
                            <FileText size={20} /> Exportar Excel
                        </Button>
                    )}
                    <Button onClick={() => navigate(isNative ? '/login' : '/dashboard/atletas/nuevo')}>
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
                                    { label: 'Categoría', value: atleta.categoria != null ? getCategoriaLabel(atleta.categoria) : '-' },
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
                                            <td>{atleta.categoria != null ? getCategoriaLabel(atleta.categoria) : '-'}</td>
                                            <td>
                                                {atleta.fechaCreacion ? (
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        {new Date(atleta.fechaCreacion).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        <br />
                                                        {new Date(atleta.fechaCreacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {atleta.tutorInfo ? (
                                                    <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                        <div><strong>{atleta.tutorInfo.nombre} {atleta.tutorInfo.apellido}</strong></div>
                                                        <div>DNI: {atleta.tutorInfo.documento}</div>
                                                        <div>Tel: {atleta.tutorInfo.telefono || 'N/A'}</div>
                                                    </div>
                                                ) : (
                                                    atleta.edad !== null && atleta.edad < 18 ? (
                                                        <span className="text-warning" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                                            ⚠️ Sin tutor asignado
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )
                                                )}
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
                                            <td style={{ minWidth: '110px' }}>
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="p-1 h-auto"
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
                                                            className="p-1 h-auto"
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
                                                    <div 
                                                        className="w-full flex flex-col px-1" 
                                                        title={`${atleta.cantidadDocumentos || 0} de 7 documentos subidos`} 
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div style={{ display: 'flex', gap: '2px', width: '100%', height: '5px' }}>
                                                            {[...Array(7)].map((_, i) => (
                                                                <div 
                                                                    key={i} 
                                                                    style={{ 
                                                                        flex: 1, 
                                                                        borderRadius: '2px',
                                                                        backgroundColor: i < (atleta.cantidadDocumentos || 0) ? '#10b981' : 'rgba(255, 255, 255, 0.1)' 
                                                                    }}
                                                                ></div>
                                                            ))}
                                                        </div>
                                                        <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', marginTop: '4px' }}>
                                                            {atleta.cantidadDocumentos || 0}/7 Docs
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
