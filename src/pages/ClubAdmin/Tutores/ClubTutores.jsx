import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { UserCheck, Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import DataTable from '../../../components/common/DataTable';
import '../Atletas/ClubAtletas.css';

const ClubTutores = () => {
    const navigate = useNavigate();
    const [tutores, setTutores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTutores();
    }, []);

    const fetchTutores = async () => {
        try {
            setLoading(true);
            // Intentar endpoint específico por club
            try {
                // Patrón probable: /Tutor/club/{id}
                const data = await api.get(`/Tutor/club/${user.clubId}`, { silentErrors: true });
                // Assuming backend filters correctly
                setTutores(data);
            } catch (specificError) {
                console.warn('⚠️ Endpoint específico falló, usando fallback:', specificError);

                // Fallback: Traer todos y filtrar
                const data = await api.get('/Tutor');
                const tutoresFiltrados = data.filter(t => (t.idClub || t.clubId) == user.clubId);
                setTutores(tutoresFiltrados);
            }
        } catch (error) {
            console.error('Error al cargar tutores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este tutor?')) {
            try {
                await api.delete(`/Tutor/${id}`);
                setTutores(tutores.filter(t => t.idPersona !== id));
            } catch (error) {
                console.error('Error al eliminar tutor:', error);
                alert('Error al eliminar el tutor. Por favor, intenta nuevamente.');
            }
        }
    };

    const filteredTutores = tutores.filter(tutor => {
        const nombreCompleto = (tutor.nombrePersona || `${tutor.persona?.nombre} ${tutor.persona?.apellido}` || '').toLowerCase();
        return nombreCompleto.includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando tutores...</p>
            </div>
        );
    }

    return (
        <div className="club-atletas"> { }
            <div className="page-header">
                <div>
                    <h1 className="text-gradient">Mis Tutores</h1>
                    <p className="page-subtitle">Gestiona los tutores y responsables</p>
                </div>
                <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => navigate('/club/tutores/nuevo')}
                >
                    Agregar Tutor
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="dark-focused" />
                </div>
            </Card>

            <DataTable
                columns={[
                    {
                        key: 'nombrePersona',
                        label: 'Nombre',
                        render: (value, row) => value || `${row.persona?.nombre} ${row.persona?.apellido}`
                    },
                    {
                        key: 'telefono',
                        label: 'Teléfono',
                        render: (value, row) => value || row.persona?.telefono || '-'
                    },
                    {
                        key: 'email',
                        label: 'Email',
                        render: (value, row) => value || row.persona?.email || '-'
                    },
                    {
                        key: 'direccion',
                        label: 'Dirección',
                        render: (value, row) => value || row.persona?.direccion || '-'
                    }
                ]}
                data={filteredTutores}
                loading={loading}
                emptyMessage="No hay tutores registrados"
                actions={(tutor) => (
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={Edit}
                            onClick={() => navigate(`/club/tutores/editar/${tutor.idPersona}`)}
                        />
                        <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDelete(tutor.idPersona)}
                        />
                    </div>
                )}
            />
        </div>
    );
};

export default ClubTutores;
