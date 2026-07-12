import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import DataTable from '../../../components/common/DataTable';
import Card from '../../../components/common/Card';
import { Award, Search, Edit, Trash2, Plus, Eye, UserCog, UserPlus, UserMinus, ArrowLeft } from 'lucide-react';
import FormField from '../../../components/forms/FormField';
import FormSelect from '../../../components/forms/FormSelect';
import Pagination from '../../../components/common/Pagination';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import AssignCategoryModal from './components/AssignCategoryModal';
import AddCoachToSelectionModal from './components/AddCoachToSelectionModal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { withFederationScope } from '../../../utils/apiHelpers';
import { getCategoriaLabel } from '../../../utils/enums';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Button from '../../../components/common/Button';
import { useDevice } from '../../../hooks/useDevice';
import MobileCard from '../../../components/common/MobileCard';
import EntrenadorDetailModal from './components/EntrenadorDetailModal';

const hasClub = (item) => {
    const clubId = item.idClub ?? item.IdClub;
    return clubId != null && clubId !== 0 && clubId !== '0';
};

const EntrenadoresList = () => {
    const { isNative } = useDevice();
    const { fedId } = useParams();
    const isSuperAdminView = Boolean(fedId);
    const navigate = useNavigate();
    const location = useLocation();

    const [entrenadores, setEntrenadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', club: '', ambito: 'todos' });
    const [clubes, setClubes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedEntrenadorForDocs, setSelectedEntrenadorForDocs] = useState(null);
    const [existingDocuments, setExistingDocuments] = useState([]);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedEntrenadorForCategory, setSelectedEntrenadorForCategory] = useState(null);
    const [showAddCoachModal, setShowAddCoachModal] = useState(false);

    const [selectedEntrenador, setSelectedEntrenador] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationConfig, setConfirmationConfig] = useState({
        type: 'info',
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const basePath = isSuperAdminView
        ? `/superadmin/federacion/${fedId}/entrenadores`
        : '/dashboard/entrenadores';

    useEffect(() => {
        fetchData();
    }, [fedId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters.search, filters.club, filters.ambito]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const entrenadoresPromise = api.get(withFederationScope('/Entrenador', fedId));
            const clubesPromise = api.get(withFederationScope('/Clubes', fedId)).catch(() => []);

            const mapEntrenadores = (entrenadoresData) =>
                (entrenadoresData || []).map((ent) => {
                    const id = ent.participanteId ?? ent.ParticipanteId ?? ent.idPersona ?? ent.IdPersona;
                    return {
                        ...ent,
                        id,
                        idPersona: id,
                        participanteId: id,
                        idClub: ent.idClub ?? ent.IdClub ?? null,
                        nombrePersona: ent.nombrePersona || ent.NombrePersona || '-',
                        documento: ent.documento || ent.Documento || '-',
                        email: ent.email || ent.Email || '-',
                        telefono: ent.telefono || ent.Telefono || '-',
                        licencia: ent.licencia || ent.Licencia || '-',
                        nombreClub: ent.nombreClub || ent.NombreClub || '',
                        categoriaSeleccion: ent.categoriaSeleccion ?? ent.CategoriaSeleccion ?? '',
                        perteneceSeleccion: !!(ent.perteneceSeleccion ?? ent.PerteneceSeleccion ?? false),
                        becadoEnard: !!(ent.becadoEnard ?? ent.BecadoEnard),
                        becadoSdn: !!(ent.becadoSdn ?? ent.BecadoSdn),
                        montoBeca: ent.montoBeca ?? ent.MontoBeca ?? 0,
                        presentoAptoMedico: !!(ent.presentoAptoMedico ?? ent.PresentoAptoMedico),
                    };
                });

            // Pintar grilla apenas llegan entrenadores (sin esperar clubes)
            const entrenadoresData = await entrenadoresPromise;
            setEntrenadores(mapEntrenadores(entrenadoresData));
            setLoading(false);

            const clubesData = await clubesPromise;
            setClubes(clubesData || []);
        } catch (error) {
            console.error('Error fetching entrenadores:', error);
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const filteredData = entrenadores.filter((item) => {
        const searchTerm = filters.search.toLowerCase();
        const nombreCompleto = (item.nombrePersona || '').toLowerCase();
        const matchesSearch =
            !searchTerm ||
            nombreCompleto.includes(searchTerm) ||
            (item.documento && String(item.documento).includes(filters.search));

        const matchesClub = filters.club ? String(item.idClub) === String(filters.club) : true;
        const inClub = hasClub(item);
        const inSeleccion = !!item.perteneceSeleccion;

        let matchesAmbito = true;
        switch (filters.ambito) {
            case 'club':
                matchesAmbito = inClub;
                break;
            case 'seleccion':
                matchesAmbito = inSeleccion;
                break;
            case 'ambos':
                matchesAmbito = inClub && inSeleccion;
                break;
            default:
                matchesAmbito = true;
        }

        return matchesSearch && matchesClub && matchesAmbito;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const handleRowClick = (row) => {
        setSelectedEntrenador(row);
        setShowDetailModal(true);
    };

    const handleEdit = (rowOrId) => {
        const row = typeof rowOrId === 'object' ? rowOrId : null;
        const id = row?.idPersona ?? row?.id ?? rowOrId;
        navigate(`${basePath}/editar/${id}`, {
            state: {
                returnPath: location.pathname,
                ...(row ? { entrenador: row } : {}),
            },
        });
    };

    const handleDelete = () => {
        setConfirmationConfig({
            type: 'info',
            title: 'Funcionalidad Pendiente',
            message: 'La funcionalidad de eliminar entrenador está pendiente en el backend.',
            onConfirm: () => setShowConfirmation(false),
            showCancel: false,
            confirmText: 'Entendido',
        });
        setShowConfirmation(true);
    };

    const handleUnlinkFromSelection = (coach) => {
        setConfirmationConfig({
            type: 'danger',
            title: 'Desvincular de selección',
            message: `¿Deseas retirar a ${coach.nombrePersona} del equipo de selección? Seguirá figurando como entrenador de club si tiene uno asignado.`,
            onConfirm: async () => {
                setShowConfirmation(false);
                const prev = { ...coach };
                setEntrenadores((list) =>
                    list.map((e) =>
                        String(e.idPersona) === String(coach.idPersona)
                            ? { ...e, perteneceSeleccion: false, categoriaSeleccion: '0' }
                            : e
                    )
                );

                try {
                    await api.put(`/Entrenador/${coach.idPersona}`, {
                        participanteId: coach.idPersona,
                        ParticipanteId: coach.idPersona,
                        idPersona: coach.idPersona,
                        idClub: coach.idClub || null,
                        licencia: coach.licencia === '-' ? '' : coach.licencia || '',
                        perteneceSeleccion: false,
                        categoriaSeleccion: '0',
                        becadoEnard: !!coach.becadoEnard,
                        becadoSdn: !!coach.becadoSdn,
                        montoBeca: coach.montoBeca || 0,
                        presentoAptoMedico: !!coach.presentoAptoMedico,
                    });
                } catch (error) {
                    console.error('Error unlinking coach:', error);
                    setEntrenadores((list) =>
                        list.map((e) =>
                            String(e.idPersona) === String(coach.idPersona) ? prev : e
                        )
                    );
                    setConfirmationConfig({
                        type: 'danger',
                        title: 'Error',
                        message: 'No se pudo desvincular al entrenador de la selección.',
                        onConfirm: () => setShowConfirmation(false),
                        showCancel: false,
                        confirmText: 'Entendido',
                    });
                    setShowConfirmation(true);
                }
            },
            showCancel: true,
            confirmText: 'Desvincular',
            cancelText: 'Cancelar',
        });
        setShowConfirmation(true);
    };

    const loadDocuments = async (personId) => {
        try {
            const docs = await api.get(`/Documentacion/persona/${personId}`);
            setExistingDocuments(docs || []);
        } catch (error) {
            console.error('Error cargando documentos:', error);
        }
    };

    const renderSeleccionBadge = (row) => {
        if (!row.perteneceSeleccion) {
            return <span className="badge badge-secondary">No</span>;
        }
        const cat = getCategoriaLabel(row.categoriaSeleccion);
        return (
            <span className="badge badge-info" title={cat}>
                Sí — {cat}
            </span>
        );
    };

    const columns = [
        {
            label: 'Nombre y Apellido',
            key: 'nombrePersona',
            render: (value, row) => (
                <span className="font-medium text-primary">{row.nombrePersona}</span>
            ),
        },
        { label: 'Documento', key: 'documento', align: 'center', render: (val) => val || '-' },
        {
            label: 'Club',
            key: 'nombreClub',
            render: (val, row) =>
                hasClub(row) ? (
                    val || row.nombreClub || 'Club'
                ) : (
                    <span className="badge badge-secondary">Sin club</span>
                ),
        },
        {
            label: 'Selección',
            key: 'perteneceSeleccion',
            align: 'center',
            render: (_val, row) => renderSeleccionBadge(row),
        },
        { label: 'Licencia', key: 'licencia', render: (val) => val || '-' },
        { label: 'Email', key: 'email', render: (val) => val || '-', align: 'center' },
        { label: 'Teléfono', key: 'telefono', render: (val) => val || '-' },
        {
            label: 'Documentación',
            key: 'documentacion',
            align: 'center',
            render: (_val, row) => (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        title="Subir"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntrenadorForDocs(row);
                            loadDocuments(row.idPersona);
                            setShowUploadModal(true);
                        }}
                    >
                        <Plus size={18} className="text-primary" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        title="Ver"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntrenadorForDocs(row);
                            setShowViewerModal(true);
                        }}
                    >
                        <Eye size={18} className="text-primary" />
                    </Button>
                </div>
            ),
        },
        {
            label: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_value, row) => (
                <div className="flex justify-center gap-2">
                    {row.perteneceSeleccion && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEntrenadorForCategory(row);
                                    setShowCategoryModal(true);
                                }}
                                title="Asignar Categoría"
                            >
                                <UserCog size={18} className="text-primary" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnlinkFromSelection(row);
                                }}
                                title="Desvincular de selección"
                            >
                                <UserMinus size={18} className="text-primary" />
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(row);
                        }}
                        title="Editar"
                    >
                        <Edit size={18} className="text-primary" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        title="Eliminar"
                    >
                        <Trash2 size={18} />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className={`page-container ${isNative ? 'mobile-view' : ''}`}>
            {isSuperAdminView && (
                <div
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: '10px',
                        padding: '0.7rem 1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1rem',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => navigate(`/superadmin/federacion/${fedId}`)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#60a5fa',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            padding: 0,
                        }}
                    >
                        <ArrowLeft size={15} /> Volver al dashboard de la federación
                    </button>
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <Award size={24} className="text-primary" />
                        {isNative ? 'Entrenadores' : 'Entrenadores'}
                    </h1>
                    {!isNative && (
                        <p className="page-subtitle">
                            Club y selección en un solo listado
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddCoachModal(true)}>
                        {isNative ? (
                            <UserPlus size={20} />
                        ) : (
                            <>
                                <UserPlus size={20} /> Vincular a Selección
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={() =>
                            navigate(`${basePath}/nuevo`, {
                                state: { returnPath: location.pathname },
                            })
                        }
                    >
                        <Plus size={20} /> {isNative ? 'Crear' : 'Nuevo Entrenador'}
                    </Button>
                </div>
            </div>

            <Card className="mb-6">
                <div className="filters-grid">
                    <div className="filter-item">
                        <FormField
                            icon={Search}
                            placeholder="Buscar..."
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            variant="dark-focused"
                        />
                    </div>
                    {!isNative && (
                        <div className="filter-item">
                            <FormSelect
                                name="club"
                                value={filters.club}
                                onChange={handleFilterChange}
                                options={[
                                    { value: '', label: 'Todos los Clubes' },
                                    ...clubes.map((c) => ({
                                        value: c.idClub ?? c.IdClub,
                                        label: c.nombre || c.Nombre,
                                    })),
                                ]}
                            />
                        </div>
                    )}
                    <div className="filter-item">
                        <FormSelect
                            name="ambito"
                            value={filters.ambito}
                            onChange={handleFilterChange}
                            options={[
                                { value: 'todos', label: 'Todos' },
                                { value: 'club', label: 'Solo club' },
                                { value: 'seleccion', label: 'Solo selección' },
                                { value: 'ambos', label: 'En ambos' },
                            ]}
                        />
                    </div>
                </div>
            </Card>

            <Card>
                {isNative ? (
                    <div className="mobile-list-container">
                        {loading ? (
                            <p className="text-center">Cargando...</p>
                        ) : filteredData.length === 0 ? (
                            <p className="text-center">Sin resultados</p>
                        ) : (
                            filteredData.map((coach) => (
                                <MobileCard
                                    key={coach.idPersona}
                                    title={coach.nombrePersona}
                                    subtitle={
                                        hasClub(coach)
                                            ? coach.nombreClub || 'Club'
                                            : 'Sin club'
                                    }
                                    badge={renderSeleccionBadge(coach)}
                                    details={[
                                        { label: 'DNI', value: coach.documento || '-' },
                                        { label: 'Licencia', value: coach.licencia || '-' },
                                    ]}
                                    actions={
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={Edit}
                                                onClick={() => handleEdit(coach)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={Eye}
                                                onClick={() => handleRowClick(coach)}
                                            />
                                        </div>
                                    }
                                    onClick={() => handleRowClick(coach)}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <>
                        <DataTable
                            columns={columns}
                            data={currentData}
                            loading={loading}
                            emptyMessage="No se encontraron entrenadores."
                            onRowClick={handleRowClick}
                            keyField="idPersona"
                        />
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </Card>

            {showUploadModal && selectedEntrenadorForDocs && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedEntrenadorForDocs(null);
                    }}
                    onSuccess={() => fetchData()}
                    personName={selectedEntrenadorForDocs.nombrePersona}
                    personId={selectedEntrenadorForDocs.idPersona}
                    existingDocuments={existingDocuments}
                />
            )}

            {showViewerModal && selectedEntrenadorForDocs && (
                <DocumentViewerModal
                    isOpen={showViewerModal}
                    onClose={() => {
                        setShowViewerModal(false);
                        setSelectedEntrenadorForDocs(null);
                    }}
                    personName={selectedEntrenadorForDocs.nombrePersona}
                    personDocumento={selectedEntrenadorForDocs.documento}
                    personId={selectedEntrenadorForDocs.idPersona}
                />
            )}

            {showCategoryModal && selectedEntrenadorForCategory && (
                <AssignCategoryModal
                    isOpen={showCategoryModal}
                    onClose={() => {
                        setShowCategoryModal(false);
                        setSelectedEntrenadorForCategory(null);
                    }}
                    onSuccess={() => {
                        setShowCategoryModal(false);
                        setSelectedEntrenadorForCategory(null);
                        fetchData();
                    }}
                    coach={selectedEntrenadorForCategory}
                />
            )}

            {showAddCoachModal && (
                <AddCoachToSelectionModal
                    isOpen={showAddCoachModal}
                    fedId={fedId}
                    onClose={() => setShowAddCoachModal(false)}
                    onSuccess={() => {
                        setShowAddCoachModal(false);
                        fetchData();
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={confirmationConfig.onConfirm}
                title={confirmationConfig.title}
                message={confirmationConfig.message}
                type={confirmationConfig.type}
                confirmText={confirmationConfig.confirmText || 'Confirmar'}
                cancelText={confirmationConfig.cancelText || 'Cancelar'}
                showCancel={confirmationConfig.showCancel !== false}
            />

            <EntrenadorDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedEntrenador(null);
                }}
                entrenador={selectedEntrenador}
                fedId={fedId}
                returnPath={location.pathname}
            />
        </div>
    );
};

export default EntrenadoresList;
