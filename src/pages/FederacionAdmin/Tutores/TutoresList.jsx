import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import { Plus, Edit, Trash2, Search, UserCheck, Eye } from 'lucide-react';
import '../Atletas/Atletas.css';

const TutoresList = () => {
    const [tutores, setTutores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Document Modals State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedTutorForDocs, setSelectedTutorForDocs] = useState(null);
    const [existingDocuments, setExistingDocuments] = useState([]);

    useEffect(() => {
        loadTutores();
    }, []);

    const loadTutores = async () => {
        try {
            const data = await api.get('/Tutor');
            setTutores(data);
        } catch (error) {
            console.error('Error cargando tutores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este tutor?')) {
            try {
                await api.delete(`/Tutor/${id}`);
                loadTutores();
            } catch (error) {
                console.error('Error eliminando tutor:', error);
                alert('Error al eliminar el tutor');
            }
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

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UserCheck size={28} />
                    <h2 className="page-title">Gestión de Tutores</h2>
                </div>
                <Button onClick={() => navigate('/tutores/new')}>
                    <Plus size={20} /> Nuevo Tutor
                </Button>
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
                                <th>Documentación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center">Cargando...</td></tr>
                            ) : tutores.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">No hay tutores registrados</td></tr>
                            ) : (
                                tutoresFiltrados.map((tutor) => (
                                    <tr key={tutor.idPersona}>
                                        <td>{tutor.nombrePersona || `${tutor.persona?.nombre} ${tutor.persona?.apellido}` || '-'}</td>
                                        <td>{tutor.documento || tutor.persona?.documento || '-'}</td>
                                        <td>{tutor.telefono || tutor.persona?.telefono || '-'}</td>
                                        <td>{tutor.email || tutor.persona?.email || '-'}</td>
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
                                            <div className="actions-cell">
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/tutores/${tutor.idPersona}/edit`)}>
                                                    <Edit size={18} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(tutor.idPersona)}>
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
        </div>
    );
};

export default TutoresList;
