import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import Pagination from '../../../components/common/Pagination';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import { Plus, Edit, Trash2, Search, FileText, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { getCategoriaLabel, getEstadoPagoLabel, getEstadoPagoColor } from '../../../utils/enums';
import './Atletas.css';
import Modal from '../../../components/common/Modal';
import AtletaDetailModal from './components/AtletaDetailModal';
import * as XLSX from 'xlsx';

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
    const [sortConfig, setSortConfig] = useState({ key: 'idPersona', direction: 'desc' });
    const navigate = useNavigate();

    useEffect(() => {
        loadAtletas();
    }, []);

    const loadAtletas = async () => {
        try {
            // Carga optimizada de todos los recursos
            const [atletasData, relacionesData, personasData] = await Promise.all([
                api.get('/Atleta'),
                api.get('/AtletaTutor'),
                api.get('/Persona')
            ]);

            // Mapa de Personas para búsqueda rápida
            const personasMap = new Map();
            if (personasData) {
                personasData.forEach(p => {
                    const id = p.idPersona || p.IdPersona;
                    if (id) personasMap.set(id, p);
                });
            }

            // Mapa de Relaciones: AtletaID -> TutorID (Tomamos el primero si hay varios)
            const relacionesMap = new Map();
            if (relacionesData && Array.isArray(relacionesData)) {
                relacionesData.forEach(r => {
                    const idAtleta = r.idAtleta || r.IdAtleta;
                    const idTutor = r.idTutor || r.IdTutor;
                    if (idAtleta && idTutor && !relacionesMap.has(idAtleta)) {
                        relacionesMap.set(idAtleta, idTutor);
                    }
                });
            }

            const atletasProcesados = atletasData.map(atleta => {
                const idAtleta = atleta.idPersona || atleta.IdPersona;
                const persona = personasMap.get(idAtleta) || atleta.persona || atleta.Persona || {};
                const club = atleta.club || atleta.Club || {};

                // Calcular edad
                let edad = null;
                const fechaNac = persona.fechaNacimiento || persona.FechaNacimiento;
                if (fechaNac) {
                    const hoy = new Date();
                    const nacimiento = new Date(fechaNac);
                    edad = hoy.getFullYear() - nacimiento.getFullYear();
                    const mes = hoy.getMonth() - nacimiento.getMonth();
                    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                        edad--;
                    }
                }

                // Buscar Tutor
                let tutorData = null;
                const idTutor = relacionesMap.get(idAtleta);
                if (idTutor) {
                    const tutorPersona = personasMap.get(idTutor);
                    if (tutorPersona) {
                        tutorData = {
                            id: idTutor,
                            nombre: tutorPersona.nombre || tutorPersona.Nombre,
                            apellido: tutorPersona.apellido || tutorPersona.Apellido,
                            documento: tutorPersona.documento || tutorPersona.Documento,
                            telefono: tutorPersona.telefono || tutorPersona.Telefono
                        };
                    }
                }

                return {
                    ...atleta,
                    idPersona: idAtleta,
                    nombrePersona: `${persona.nombre || persona.Nombre || ''} ${persona.apellido || persona.Apellido || ''}`.trim(),
                    documento: persona.documento || persona.Documento || '-',
                    fechaNacimiento: fechaNac,
                    nombreClub: club.nombre || club.Nombre || 'Agente Libre',
                    edad: edad,
                    tutorInfo: tutorData
                };
            });

            // Ordenar por ID descendente
            atletasProcesados.sort((a, b) => b.idPersona - a.idPersona);
            setAtletas(atletasProcesados);
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

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
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

    // Ordenar atletas
    const sortedAtletas = [...filteredAtletas].sort((a, b) => {
        const { key, direction } = sortConfig;

        let valA = a[key];
        let valB = b[key];

        // Manejo especial para strings (ignorar mayúsculas)
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = (valB || '').toLowerCase();
        }

        // Manejo de valores nulos
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (valA < valB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAtletas = sortedAtletas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedAtletas.length / itemsPerPage);

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
                                <th onClick={() => requestSort('nombrePersona')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Nombre Completo {getSortIcon('nombrePersona')}
                                    </div>
                                </th>
                                <th>DNI</th>
                                <th onClick={() => requestSort('edad')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Edad {getSortIcon('edad')}
                                    </div>
                                </th>
                                <th onClick={() => requestSort('nombreClub')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Club {getSortIcon('nombreClub')}
                                    </div>
                                </th>
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

        </div>
    );
};

export default AtletasList;
