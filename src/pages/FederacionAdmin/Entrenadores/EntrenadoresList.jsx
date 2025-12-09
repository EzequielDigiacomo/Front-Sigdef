import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import DataTable from '../../../components/common/DataTable';
import Card from '../../../components/common/Card';
import { Award, Search, Filter, Edit, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import FormField from '../../../components/forms/FormField';
import FormSelect from '../../../components/forms/FormSelect';
import Pagination from '../../../components/common/Pagination';
import { getCategoriaLabel } from '../../../utils/enums';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';

const EntrenadoresList = ({ viewMode = 'club' }) => { // viewMode: 'club' | 'seleccion'
    const navigate = useNavigate(); // Hook for navigation
    const [entrenadores, setEntrenadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        club: '',
        // tipo removed as it is controlled by viewMode
    });
    const [clubes, setClubes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [entrenadoresData, clubesData, personasData] = await Promise.all([
                api.get('/Entrenador'),
                api.get('/Club'),
                api.get('/Persona')
            ]);

            // Join entrenador with persona
            const enrichedEntrenadores = (entrenadoresData || []).map(ent => {
                const persona = (personasData || []).find(p => p.idPersona === ent.idPersona);
                return {
                    ...ent,
                    ...persona,
                    id: ent.idPersona
                };
            });

            setEntrenadores(enrichedEntrenadores);
            setClubes(clubesData || []);
        } catch (error) {
            console.error('Error fetching entrenadores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredData = entrenadores.filter(item => {
        const searchTerm = filters.search.toLowerCase();
        const nombreCompleto = (item.nombrePersona || `${item.nombre || ''} ${item.apellido || ''}`).toLowerCase();

        const matchesSearch = nombreCompleto.includes(searchTerm) ||
            (item.documento && item.documento.includes(searchTerm));

        let matchesContext = true;
        if (viewMode === 'club') {
            // Modo Club: Debe tener club. Filtro de club opcional aplica.
            const hasClub = item.idClub && item.idClub !== 0;
            const matchesClubFilter = filters.club ? item.idClub == filters.club : true;
            matchesContext = hasClub && matchesClubFilter;
        } else if (viewMode === 'seleccion') {
            // Modo Selección: Debe ser de selección.
            matchesContext = item.perteneceSeleccion === true;
        }

        return matchesSearch && matchesContext;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleEdit = (id) => {
        navigate(viewMode === 'seleccion'
            ? `/dashboard/entrenadores-seleccion/editar/${id}`
            : `/dashboard/entrenadores/editar/${id}` // Ajustar si la ruta de club es distinta
        );
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este entrenador?')) {
            try {
                // await api.delete(`/Entrenador/${id}`); // Descomentar cuando esté implementado
                alert('Funcionalidad de eliminar pendiente de implementación en backend');
                fetchData();
            } catch (error) {
                console.error('Error deleting:', error);
            }
        }
    };

    const columns = [
        {
            label: 'Nombre y Apellido',
            key: 'nombrePersona',
            render: (value, row) => <span className="font-medium text-primary">{row.nombrePersona || `${row.nombre || ''} ${row.apellido || ''}`}</span>
        },
        { label: 'Documento', key: 'documento' },
        { label: 'Club', key: 'nombreClub', render: (val) => val || 'Sin Club' },
        { label: 'Email', key: 'email', render: (val) => val || '-' },

        // Columnas específicas de modo Selección
        ...(viewMode === 'seleccion' ? [
            {
                label: 'Beca ENARD',
                key: 'becadoEnard',
                render: (val) => val ? <span className="badge badge-success">SÍ</span> : <span className="badge badge-secondary">NO</span>
            },
            {
                label: 'Beca SND',
                key: 'becadoSdn',
                render: (val) => val ? <span className="badge badge-success">SÍ</span> : <span className="badge badge-secondary">NO</span>
            },
            {
                label: 'Monto',
                key: 'montoBeca',
                render: (val) => val ? `$${val.toLocaleString()}` : '$0'
            },
            {
                label: 'Apto Médico',
                key: 'presentoAptoMedico',
                render: (val) => val ? <span className="badge badge-success">SÍ</span> : <span className="badge badge-danger">NO</span>
            },
            {
                label: 'Categoría',
                key: 'categoriaSeleccion',
                render: (val) => val || '-' // Valor ya es string (ej: "Cadete")
            },
            {
                label: 'Documentación',
                key: 'documentacion',
                render: (val, row) => {
                    const completo = row.documento && row.presentoAptoMedico;
                    return completo ? (
                        <div className="flex items-center gap-1 text-success font-medium">
                            <CheckCircle size={16} /> <span>Completa</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-warning font-medium">
                            <AlertTriangle size={16} /> <span>Incompleta</span>
                        </div>
                    );
                }
            }
        ] : [
            // Columnas específicas de modo Club
            { label: 'Licencia', key: 'licencia' },
            { label: 'Teléfono', key: 'telefono' }
        ]),
        {
            label: 'Acciones',
            key: 'actions',
            render: (value, row) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row.id)} title="Editar">
                        <Edit size={18} className="text-primary" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(row.id)} title="Eliminar">
                        <Trash2 size={18} />
                    </Button>
                </div>
            )
        }
    ];

    const title = viewMode === 'club' ? 'Entrenadores de Clubes' : 'Entrenadores de Selección';
    const subtitle = viewMode === 'club'
        ? 'Gestión de entrenadores asociados a clubes'
        : 'Listado de entrenadores del cuerpo técnico nacional';

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">
                    <Award size={24} className="text-primary" />
                    {title}
                </h1>
                <p className="page-subtitle">{subtitle}</p>
            </div>

            <Card className="mb-6">
                <div className="filters-grid">
                    <div className="filter-item">
                        <FormField
                            icon={Search}
                            placeholder="Buscar por nombre o documento..."
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>
                    {viewMode === 'club' && (
                        <div className="filter-item">
                            <FormSelect
                                icon={Filter}
                                name="club"
                                value={filters.club}
                                onChange={handleFilterChange}
                                options={[
                                    { value: '', label: 'Todos los Clubes' },
                                    ...clubes.map(c => ({ value: c.idClub, label: c.nombre }))
                                ]}
                            />
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <DataTable
                    columns={columns}
                    data={currentData}
                    loading={loading}
                    emptyMessage="No se encontraron entrenadores."
                />
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </Card>
        </div>
    );
};

export default EntrenadoresList;
