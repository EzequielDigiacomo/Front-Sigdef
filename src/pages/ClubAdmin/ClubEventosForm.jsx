import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ArrowLeft, Save } from 'lucide-react';
import './ClubEventos.css'; // Reutilizamos estilos

const ClubEventosForm = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        fechaInicio: '',
        fechaFin: '',
        ubicacion: '',
        estado: 'PROGRAMADO'
    });

    useEffect(() => {
        if (id) {
            loadEvento();
        }
    }, [id]);

    const loadEvento = async () => {
        try {
            const data = await api.get(`/Evento/${id}`);
            setFormData({
                nombre: data.nombre || '',
                fechaInicio: data.fechaInicio ? data.fechaInicio.split('T')[0] : '',
                fechaFin: data.fechaFin ? data.fechaFin.split('T')[0] : '',
                ubicacion: data.ubicacion || '',
                estado: data.estado || 'PROGRAMADO'
            });
        } catch (error) {
            console.error('Error cargando evento:', error);
            alert('Error al cargar el evento');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validaciones básicas
            if (new Date(formData.fechaFin) < new Date(formData.fechaInicio)) {
                alert('La fecha de fin no puede ser anterior a la fecha de inicio');
                setLoading(false);
                return;
            }

            const payload = {
                ...formData,
                idClub: user.clubId, // Aseguramos que el evento pertenezca al club
                // Aseguramos formato ISO para fechas
                fechaInicio: new Date(formData.fechaInicio).toISOString(),
                fechaFin: new Date(formData.fechaFin).toISOString()
            };

            if (id) {
                await api.put(`/Evento/${id}`, payload);
            } else {
                await api.post('/Evento', payload);
            }

            alert('Evento guardado exitosamente');
            navigate('/club/eventos');
        } catch (error) {
            console.error('Error guardando evento:', error);
            alert('Error al guardar el evento. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/club/eventos')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Evento' : 'Nuevo Evento'}</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Nombre del Evento *</label>
                            <input
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Ej: Torneo Apertura 2024"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Fecha Inicio *</label>
                            <input
                                type="date"
                                name="fechaInicio"
                                value={formData.fechaInicio}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Fecha Fin *</label>
                            <input
                                type="date"
                                name="fechaFin"
                                value={formData.fechaFin}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Ubicación *</label>
                            <input
                                name="ubicacion"
                                value={formData.ubicacion}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Ej: Club Central, Av. Principal 123"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Estado</label>
                            <select
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="PROGRAMADO">Programado</option>
                                <option value="EN_CURSO">En Curso</option>
                                <option value="FINALIZADO">Finalizado</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => navigate('/club/eventos')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> {id ? 'Actualizar' : 'Guardar'} Evento
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ClubEventosForm;
