import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FormField from '../../../components/forms/FormField';
import { Plus, Edit, Trash2, Search, ClipboardList } from 'lucide-react';
import '../Atletas/Atletas.css';

const InscripcionesList = () => {
    const [inscripciones, setInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroEvento, setFiltroEvento] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadInscripciones();
    }, []);

    const loadInscripciones = async () => {
        try {
            const data = await api.get('/Inscripcion');
            setInscripciones(data);
        } catch (error) {
            console.error('Error cargando inscripciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta inscripción?')) {
            try {
                await api.delete(`/Inscripcion/${id}`);
                loadInscripciones();
            } catch (error) {
                console.error('Error eliminando inscripción:', error);
                alert('Error al eliminar la inscripción');
            }
        }
    };

    const inscripcionesFiltradas = inscripciones.filter(i =>
        i.nombreEvento?.toLowerCase().includes(filtroEvento.toLowerCase()) ||
        i.nombreAtleta?.toLowerCase().includes(filtroEvento.toLowerCase()) ||
        i.nombreClub?.toLowerCase().includes(filtroEvento.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ClipboardList size={28} />
                    <h2 className="page-title">Gestión de Inscripciones</h2>
                </div>
                <Button onClick={() => navigate('/inscripciones/new')}>
                    <Plus size={20} /> Nueva Inscripción
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar por evento, atleta o club..." value={filtroEvento} onChange={(e) => setFiltroEvento(e.target.value)} />
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Atleta</th>
                                <th>Club</th>
                                <th>Evento</th>
                                <th>Fecha Inscripción</th>
                                <th>Fecha Evento</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center">Cargando...</td></tr>
                            ) : inscripcionesFiltradas.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">No hay inscripciones registradas</td></tr>
                            ) : (
                                inscripcionesFiltradas.map((inscripcion) => (
                                    <tr key={inscripcion.idInscripcion}>
                                        <td>{inscripcion.nombreAtleta || '-'}</td>
                                        <td>{inscripcion.nombreClub || '-'}</td>
                                        <td>{inscripcion.nombreEvento || '-'}</td>
                                        <td>{inscripcion.fechaInscripcion ? new Date(inscripcion.fechaInscripcion).toLocaleDateString() : '-'}</td>
                                        <td>
                                            {inscripcion.fechaInicioEvento && inscripcion.fechaFinEvento
                                                ? `${new Date(inscripcion.fechaInicioEvento).toLocaleDateString()} - ${new Date(inscripcion.fechaFinEvento).toLocaleDateString()}`
                                                : '-'
                                            }
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(inscripcion.idInscripcion)}>
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
        </div>
    );
};

export default InscripcionesList;
