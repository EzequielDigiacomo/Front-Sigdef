import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import { Plus, Edit, Trash2, Search, Briefcase } from 'lucide-react';

const DelegadosList = () => {
    const [delegados, setDelegados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadDelegados();
    }, []);

    const loadDelegados = async () => {
        try {
            const data = await api.get('/DelegadoClub');
            setDelegados(data);
        } catch (error) {
            console.error('Error cargando delegados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este delegado?')) {
            try {
                await api.delete(`/DelegadoClub/${id}`);
                loadDelegados();
            } catch (error) {
                console.error('Error eliminando delegado:', error);
                alert('Error al eliminar el delegado');
            }
        }
    };

    // Filtrar delegados por término de búsqueda
    const delegadosFiltrados = delegados.filter(delegado => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();

        const nombre = (delegado.nombrePersona || delegado.NombrePersona || '').toLowerCase();
        const club = (delegado.nombreClub || delegado.NombreClub || '').toLowerCase();
        const dni = (delegado.documento || delegado.Documento || '').toLowerCase();
        const email = (delegado.email || delegado.Email || '').toLowerCase();
        const tel = (delegado.telefono || delegado.Telefono || '').toLowerCase();

        return (
            nombre.includes(search) ||
            club.includes(search) ||
            dni.includes(search) ||
            email.includes(search) ||
            tel.includes(search)
        );
    });

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Briefcase size={28} />
                    <h2 className="page-title">Gestión de Delegados Club</h2>
                </div>
                <Button onClick={() => navigate('/dashboard/delegados/nuevo')}>
                    <Plus size={20} /> Nuevo Delegado
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField
                        icon={Search}
                        placeholder="Buscar por nombre, club, DNI, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>Club</th>
                                <th>DNI</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center">Cargando...</td></tr>
                            ) : delegados.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">No hay delegados registrados</td></tr>
                            ) : (
                                (delegadosFiltrados.map((delegado) => {
                                    const nombre = delegado.nombrePersona || delegado.NombrePersona || '-';
                                    const club = delegado.nombreClub || delegado.NombreClub || 'Agente Libre';
                                    const dni = delegado.documento || delegado.Documento || '-';
                                    const email = delegado.email || delegado.Email || '-';
                                    const tel = delegado.telefono || delegado.Telefono || '-';

                                    return (
                                        <tr key={delegado.idPersona || delegado.IdPersona}>
                                            <td>{nombre}</td>
                                            <td>{club}</td>
                                            <td>{dni}</td>
                                            <td>{email}</td>
                                            <td>{tel}</td>
                                            <td>
                                                <div className="actions-cell">
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/delegados/editar/${delegado.idPersona || delegado.IdPersona}`)}>
                                                        <Edit size={18} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(delegado.idPersona || delegado.IdPersona)}>
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default DelegadosList;
