import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import Pagination from '../../../components/common/Pagination';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import { Plus, Edit, Trash2, Search, FileText, Eye, UserX } from 'lucide-react';
import { getCategoriaLabel, getEstadoPagoLabel } from '../../../utils/enums';
import '../Atletas/Atletas.css';
import AtletaDetailModal from '../Atletas/components/AtletaDetailModal';
import * as XLSX from 'xlsx';

const AgentesLibresList = () => {
    const [atletas, setAtletas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAtleta, setSelectedAtleta] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const navigate = useNavigate();

    // Modales de documentos
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedAthleteForUpload, setSelectedAthleteForUpload] = useState(null);
    const [selectedAthleteForViewer, setSelectedAthleteForViewer] = useState(null);
    const [existingDocuments, setExistingDocuments] = useState([]);

    useEffect(() => {
        loadAgentesLibres();
    }, []);

    const loadAgentesLibres = async () => {
        try {
            setLoading(true);
            const [atletasData, relacionesData, personasData] = await Promise.all([
                api.get('/Atleta'),
                api.get('/AtletaTutor'),
                api.get('/Persona')
            ]);

            const personasMap = new Map();
            if (personasData) {
                personasData.forEach(p => personasMap.set(p.idPersona || p.IdPersona, p));
            }

            const relacionesMap = new Map();
            if (relacionesData) {
                relacionesData.forEach(r => {
                    const idA = r.idAtleta || r.IdAtleta;
                    if (idA && !relacionesMap.has(idA)) relacionesMap.set(idA, r.idTutor || r.IdTutor);
                });
            }

            const procesados = atletasData
                .filter(a => !(a.idClub || a.IdClub)) // Solo Agentes Libres
                .map(atleta => {
                    const idA = atleta.idPersona || atleta.IdPersona;
                    const persona = personasMap.get(idA) || atleta.persona || atleta.Persona || {};

                    let edad = null;
                    const fechaNac = persona.fechaNacimiento || persona.FechaNacimiento;
                    if (fechaNac) {
                        const hoy = new Date();
                        const naci = new Date(fechaNac);
                        edad = hoy.getFullYear() - naci.getFullYear();
                        const m = hoy.getMonth() - naci.getMonth();
                        if (m < 0 || (m === 0 && hoy.getDate() < naci.getDate())) edad--;
                    }

                    return {
                        ...atleta,
                        idPersona: idA,
                        nombrePersona: `${persona.nombre || ''} ${persona.apellido || ''}`.trim(),
                        documento: persona.documento || '-',
                        fechaNacimiento: fechaNac,
                        edad,
                        nombreClub: 'Agente Libre'
                    };
                });

            procesados.sort((a, b) => b.idPersona - a.idPersona);
            setAtletas(procesados);
        } catch (error) {
            console.error('Error cargando agentes libres:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDocuments = async (personId) => {
        try {
            const docs = await api.get(`/Documentacion/persona/${personId}`);
            setExistingDocuments(docs || []);
        } catch (error) {
            setExistingDocuments([]);
        }
    };

    const filteredAtletas = atletas.filter(a => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return a.nombrePersona.toLowerCase().includes(s) || a.documento.toLowerCase().includes(s);
    });

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = filteredAtletas.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredAtletas.length / itemsPerPage);

    const exportToExcel = () => {
        const data = filteredAtletas.map(a => ({
            'Nombre': a.nombrePersona,
            'DNI': a.documento,
            'Edad': a.edad,
            'Categoría': a.categoria ? getCategoriaLabel(a.categoria) : '-'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "AgentesLibres");
        XLSX.writeFile(wb, "AgentesLibres_SIGDEF.xlsx");
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <UserX size={32} className="text-primary" />
                    <h2 className="page-title">Agentes Libres</h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="secondary" onClick={exportToExcel}>
                        <FileText size={20} /> Exportar Excel
                    </Button>
                </div>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField
                        icon={Search}
                        placeholder="Buscar por nombre o DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>DNI</th>
                                <th>Edad</th>
                                <th>Categoría</th>
                                <th>Documentación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center">Cargando...</td></tr>
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">No hay agentes libres registrados</td></tr>
                            ) : (
                                currentItems.map((atleta) => (
                                    <tr key={atleta.idPersona} onClick={() => { setSelectedAtleta(atleta); setShowModal(true); }} style={{ cursor: 'pointer' }}>
                                        <td>{atleta.nombrePersona}</td>
                                        <td>{atleta.documento}</td>
                                        <td>{atleta.edad ?? '-'}</td>
                                        <td>{atleta.categoria ? getCategoriaLabel(atleta.categoria) : '-'}</td>
                                        <td>
                                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedAthleteForUpload(atleta); loadDocuments(atleta.idPersona); setShowUploadModal(true); }}>
                                                    <Plus size={18} />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedAthleteForViewer(atleta); setShowViewerModal(true); }}>
                                                    <Eye size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="actions-cell" onClick={e => e.stopPropagation()}>
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/atletas/editar/${atleta.idPersona}`, { state: { returnPath: '/dashboard/agentes-libres' } })}>
                                                    <Edit size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </Card>

            <AtletaDetailModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                athlete={selectedAtleta}
                onRefresh={loadAgentesLibres}
            />

            {showUploadModal && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    personName={selectedAthleteForUpload?.nombrePersona}
                    personId={selectedAthleteForUpload?.idPersona}
                    existingDocuments={existingDocuments}
                    onSuccess={loadAgentesLibres}
                />
            )}

            {showViewerModal && (
                <DocumentViewerModal
                    isOpen={showViewerModal}
                    onClose={() => setShowViewerModal(false)}
                    personName={selectedAthleteForViewer?.nombrePersona}
                    personId={selectedAthleteForViewer?.idPersona}
                />
            )}
        </div>
    );
};

export default AgentesLibresList;
