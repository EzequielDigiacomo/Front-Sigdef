import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import { Plus, Edit, Trash2, Search, Briefcase } from 'lucide-react';
import { useDevice } from '../../../hooks/useDevice';
import MobileCard from '../../../components/common/MobileCard';

const DelegadosList = () => {
    const { isNative } = useDevice();
    const { fedId } = useParams();
    const isSuperAdminView = Boolean(fedId);
    const [delegados, setDelegados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const handleEdit = (id) => {
        const base = isSuperAdminView ? `/superadmin/federacion/${fedId}/delegados` : '/dashboard/delegados';
        navigate(`${base}/editar/${id}`, { state: { returnPath: location.pathname } });
    };

    useEffect(() => {
        loadDelegados();
    }, []);

    const loadDelegados = async () => {
        try {
            const data = await api.get('/Auth/usuarios');
            // Filtrar usuarios que actúan como delegados
            setDelegados(data.filter(u => u.rol === 'Club' || u.rol === 'Delegado' || u.rol === 'DelegadoClub'));
        } catch (error) {
            console.error('Error cargando delegados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este delegado?')) {
            try {
                await api.delete(`/Auth/usuarios/${id}`);
                loadDelegados();
            } catch (error) {
                console.error('Error eliminando delegado:', error);
                alert('Error al eliminar el delegado');
            }
        }
    };

    const delegadosFiltrados = delegados.filter(delegado => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const nombre = (delegado.nombreCompleto || delegado.nombrePersona || delegado.NombrePersona || '').toLowerCase();
        const club = (delegado.clubNombre || delegado.nombreClub || delegado.NombreClub || '').toLowerCase();
        return nombre.includes(search) || club.includes(search);
    });

    return (
        <div className={`page-container ${isNative ? 'mobile-view' : ''}`}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Briefcase size={28} />
                    <h2 className="page-title">{isNative ? 'Delegados' : 'Gestión de Delegados Club'}</h2>
                </div>
                <Button
                    onClick={() => {
                        const base = isSuperAdminView ? `/superadmin/federacion/${fedId}/delegados` : '/dashboard/delegados';
                        navigate(`${base}/nuevo`, { state: { returnPath: base } });
                    }}
                    variant="primary" icon={Plus}
                >
                    {isNative ? 'Nuevo' : 'Nuevo Delegado'}
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField
                        icon={Search}
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        variant="dark-focused"
                    />
                </div>

                {isNative ? (
                    <div className="mobile-list-container">
                        {loading ? (
                            <p className="text-center">Cargando...</p>
                        ) : delegadosFiltrados.length === 0 ? (
                            <p className="text-center">No hay delegados registrados</p>
                        ) : (
                            delegadosFiltrados.map((delegado) => (
                                <MobileCard 
                                    key={delegado.id || delegado.idPersona || delegado.IdPersona}
                                    title={delegado.nombreCompleto || delegado.nombrePersona || delegado.NombrePersona || '-'}
                                    subtitle={delegado.clubNombre || delegado.nombreClub || delegado.NombreClub || 'Agente Libre'}
                                    details={[
                                        { label: 'DNI', value: delegado.dni || delegado.documento || delegado.Documento || '-' },
                                        { label: 'Email', value: delegado.email || delegado.Email || '-' }
                                    ]}
                                    actions={
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(delegado.id || delegado.idPersona || delegado.IdPersona)} />
                                            <Button variant="ghost" size="sm" icon={Trash2} className="text-danger" onClick={() => handleDelete(delegado.id || delegado.idPersona || delegado.IdPersona)} />
                                        </div>
                                    }
                                />
                            ))
                        )}
                    </div>
                ) : (
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
                                        const nombre = delegado.nombreCompleto || delegado.nombrePersona || delegado.NombrePersona || '-';
                                        const club = delegado.clubNombre || delegado.nombreClub || delegado.NombreClub || 'Agente Libre';
                                        const dni = delegado.dni || delegado.documento || delegado.Documento || '-';
                                        const email = delegado.email || delegado.Email || '-';
                                        const tel = delegado.telefono || delegado.Telefono || '-';
                                        const id = delegado.id || delegado.idPersona || delegado.IdPersona;

                                        return (
                                            <tr key={id}>
                                                <td>{nombre}</td>
                                                <td>{club}</td>
                                                <td>{dni}</td>
                                                <td>{email}</td>
                                                <td>{tel}</td>
                                                <td>
                                                    <div className="actions-cell">
                                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(id)}>
                                                            <Edit size={18} />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(id)}>
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
                )}
            </Card>
        </div>
    );
};

export default DelegadosList;
