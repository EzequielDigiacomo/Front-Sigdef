import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import Pagination from '../../../components/common/Pagination';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import { Plus, Edit, Trash2, Search, FileText, Eye } from 'lucide-react';
import { getCategoriaLabel, getEstadoPagoLabel, getEstadoPagoColor } from '../../../utils/enums';
import './Atletas.css';
import Modal from '../../../components/common/Modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AtletasList = () => {
    const [atletas, setAtletas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAtleta, setSelectedAtleta] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Upload Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedAthleteForUpload, setSelectedAthleteForUpload] = useState(null);

    // Viewer Modal State
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedAthleteForViewer, setSelectedAthleteForViewer] = useState(null);
    const [existingDocuments, setExistingDocuments] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);
    const navigate = useNavigate();

    useEffect(() => {
        loadAtletas();
    }, []);

    const loadAtletas = async () => {
        try {
            const data = await api.get('/Atleta');
            // Enriquecer cada atleta con datos de Persona y tutor (si es menor)
            const atletasEnriquecidos = await Promise.all(
                data.map(async (atleta) => {
                    // Obtener datos de Persona para DNI (si no viene en el DTO)
                    let personaData = null;
                    try {
                        personaData = await api.get(`/Persona/${atleta.idPersona}`);
                    } catch (err) {
                        console.error('Error obteniendo Persona', err);
                    }

                    // Calcular edad para saber si necesita tutor
                    // Calcular edad para saber si necesita tutor
                    const fechaNac = personaData?.fechaNacimiento || atleta.fechaNacimiento;
                    let edad = null;
                    let tutorInfo = null;
                    if (fechaNac) {
                        const hoy = new Date();
                        const nacimiento = new Date(fechaNac);
                        edad = hoy.getFullYear() - nacimiento.getFullYear();
                        const mes = hoy.getMonth() - nacimiento.getMonth();
                        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                            edad--;
                        }
                        if (edad < 18) {
                            try {
                                const relaciones = await api.get(`/AtletaTutor/atleta/${atleta.idPersona}`);
                                if (relaciones && relaciones.length > 0) {
                                    const tutorId = relaciones[0].idTutor;
                                    const tutorPersona = await api.get(`/Persona/${tutorId}`);
                                    tutorInfo = {
                                        nombre: tutorPersona.nombre || '',
                                        apellido: tutorPersona.apellido || '',
                                        documento: tutorPersona.documento || '',
                                        telefono: tutorPersona.telefono || ''
                                    };
                                }
                            } catch (err) {
                                console.error('Error obteniendo tutor', err);
                            }
                        }
                    }

                    return {
                        ...atleta,
                        documento: personaData?.documento || atleta.documento || '-',
                        fechaNacimiento: personaData?.fechaNacimiento || atleta.fechaNacimiento || null,
                        edad: edad,
                        fechaCreacion: atleta.fechaCreacion || personaData?.fechaCreacion || new Date().toISOString(),
                        tutorInfo
                    };
                })
            );

            // Ordenar por ID descendente (más reciente primero)
            atletasEnriquecidos.sort((a, b) => b.idPersona - a.idPersona);
            setAtletas(atletasEnriquecidos);
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

    const getEntrenadorSeleccion = (atleta) => {
        if (atleta.perteneceSeleccion && atleta.categoria) {
            return `Entrenador ${getCategoriaLabel(atleta.categoria)}`;
        }
        return '-';
    };

    const handleRowClick = (atleta) => {
        setSelectedAtleta(atleta);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedAtleta(null);
    };

    const exportToExcel = () => {
        const dataToExport = currentAtletas.map(atleta => ({
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
    };

    const exportToPDF = async () => {
        const input = document.getElementById('modal-content-export');
        if (!input) return;

        try {
            const canvas = await html2canvas(input, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Atleta_${selectedAtleta.nombrePersona.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error("Error exportando PDF", err);
        }
    };
    // Filtrar atletas por búsqueda
    const filteredAtletas = atletas.filter(atleta => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            atleta.nombrePersona?.toLowerCase().includes(search) ||
            atleta.documento?.toLowerCase().includes(search) ||
            atleta.nombreClub?.toLowerCase().includes(search) ||
            atleta.tutorInfo?.nombre?.toLowerCase().includes(search) ||
            atleta.tutorInfo?.apellido?.toLowerCase().includes(search)
        );
    });

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAtletas = filteredAtletas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAtletas.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };



    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">Gestión de Atletas</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="secondary" onClick={exportToExcel}>
                        <FileText size={20} /> Exportar Excel
                    </Button>
                    <Button onClick={() => navigate('/dashboard/atletas/nuevo')}>
                        <Plus size={20} /> Nuevo Atleta
                    </Button>
                </div>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar por nombre, DNI, club..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>DNI</th>
                                <th>Edad</th>
                                <th>Club</th>
                                <th>Categoría</th>
                                <th>Fecha Alta</th>
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
                                currentAtletas.map((atleta) => (
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
                                                <span className="text-muted">-</span>
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
                                            -
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

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title="Detalle del Atleta"
                footer={
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={exportToPDF}>
                            <FileText size={18} /> PDF
                        </Button>
                        <Button variant="secondary" onClick={handleCloseModal}>Cerrar</Button>
                        {selectedAtleta && (
                            <Button
                                variant="primary"
                                onClick={() => {
                                    handleCloseModal();
                                    navigate(`/dashboard/atletas/editar/${selectedAtleta.idPersona}`, {
                                        state: { returnPath: '/dashboard/atletas' }
                                    });
                                }}
                            >
                                <Edit size={18} /> Editar Atleta
                            </Button>
                        )}
                    </div>
                }
            >
                {selectedAtleta && (
                    <div id="modal-content-export" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)' }}>
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <h2 style={{ margin: 0, color: 'var(--primary)' }}>Ficha del Atleta</h2>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>SIGDEF - Sistema de Gestión Deportiva</p>
                        </div>
                        <div>
                            <label className="detail-label">Nombre Completo</label>
                            <div className="detail-value">{selectedAtleta.nombrePersona}</div>
                        </div>
                        <div>
                            <label className="detail-label">Documento</label>
                            <div className="detail-value">{selectedAtleta.documento}</div>
                        </div>
                        <div>
                            <label className="detail-label">Club</label>
                            <div className="detail-value">{selectedAtleta.nombreClub}</div>
                        </div>
                        <div>
                            <label className="detail-label">Categoría</label>
                            <div className="detail-value">{getCategoriaLabel(selectedAtleta.categoria)}</div>
                        </div>
                        {selectedAtleta.tutorInfo && (
                            <>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="detail-label">Tutor</label>
                                    <div className="detail-value">
                                        {selectedAtleta.tutorInfo.nombre} {selectedAtleta.tutorInfo.apellido}<br />
                                        DNI: {selectedAtleta.tutorInfo.documento}<br />
                                        Tel: {selectedAtleta.tutorInfo.telefono || 'N/A'}
                                    </div>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="detail-label">Selección Nacional</label>
                            <div className="detail-value">
                                {selectedAtleta.perteneceSeleccion ? (
                                    <span className="badge badge-success">Sí</span>
                                ) : (
                                    <span className="badge badge-secondary">No</span>
                                )}
                            </div>
                        </div>
                        {selectedAtleta.perteneceSeleccion && (
                            <div>
                                <label className="detail-label">Entrenador de Selección</label>
                                <div className="detail-value highlight">{getEntrenadorSeleccion(selectedAtleta)}</div>
                            </div>
                        )}
                        <div>
                            <label className="detail-label">Estado de Pago</label>
                            <div>
                                <span className={`badge badge-${getEstadoPagoColor(selectedAtleta.estadoPago)}`}> {getEstadoPagoLabel(selectedAtleta.estadoPago)} </span>
                            </div>
                        </div>
                        <div>
                            <label className="detail-label">Fecha de Nacimiento</label>
                            <div className="detail-value">{selectedAtleta.fechaNacimiento ? new Date(selectedAtleta.fechaNacimiento).toLocaleDateString() : '-'}</div>
                        </div>
                    </div>
                )}
            </Modal>

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
        </div>
    );
};

export default AtletasList;
