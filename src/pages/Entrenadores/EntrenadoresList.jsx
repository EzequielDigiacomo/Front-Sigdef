import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Card from '../../components/common/Card';
import { Award, Search, Filter } from 'lucide-react';
import FormField from '../../components/forms/FormField';
import FormSelect from '../../components/forms/FormSelect';
import Pagination from '../../components/common/Pagination';

const EntrenadoresList = () => {
    const [entrenadores, setEntrenadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        club: '',
        tipo: '' // 'club' or 'seleccion'
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
                    ...persona, // Spread persona properties (documento, email, telefono, etc.)
                    // Keep original properties if conflict, but usually persona has the details we want
                    id: ent.idPersona // Ensure unique key
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

        const matchesClub = filters.club ? item.idClub == filters.club : true;

        const matchesTipo = filters.tipo === 'seleccion' ? item.perteneceSeleccion :
            filters.tipo === 'club' ? !item.perteneceSeleccion : true;

        return matchesSearch && matchesClub && matchesTipo;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const columns = [
        {
            label: 'Nombre',
            key: 'nombrePersona',
            render: (value, row) => row.nombrePersona || `${row.nombre || ''} ${row.apellido || ''}`
        },
        { label: 'Documento', key: 'documento' },
        { label: 'Club', key: 'nombreClub', render: (value, row) => row.nombreClub || 'Sin Club' },
        { label: 'Licencia', key: 'licencia' },
        { label: 'Email', key: 'email' },
        { label: 'Teléfono', key: 'telefono' },
    ];

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1 className="page-title">
                    <Award size={24} className="text-primary" />
                    Entrenadores
                </h1>
                <p className="page-subtitle">Gestión de entrenadores de clubes y selección</p>
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
                    <div className="filter-item">
                        <FormSelect
                            name="tipo"
                            value={filters.tipo}
                            onChange={handleFilterChange}
                            options={[
                                { value: '', label: 'Todos los Tipos' },
                                { value: 'club', label: 'Entrenador de Club' },
                                { value: 'seleccion', label: 'Entrenador de Selección' }
                            ]}
                        />
                    </div>
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
