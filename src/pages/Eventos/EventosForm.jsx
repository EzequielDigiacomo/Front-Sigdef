import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ArrowLeft, Save } from 'lucide-react';
import '../Atletas/Atletas.css';

const EventosForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        fechaInicio: '',
        fechaFin: ''
    });

    useEffect(() => {
        if (id) {
            api.get(`/Evento/${id}`).then(data => setFormData(data)).catch(console.error);
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (id) {
                await api.put(`/Evento/${id}`, formData);
            } else {
                await api.post('/Evento', formData);
            }
            navigate('/eventos');
        } catch (error) {
            console.error('Error guardando evento:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/eventos')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Evento' : 'Nuevo Evento'}</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Nombre del Evento</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Fecha Inicio</label>
                            <input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Fecha Fin</label>
                            <input type="date" name="fechaFin" value={formData.fechaFin} onChange={handleChange} className="form-input" required />
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => navigate('/eventos')}>Cancelar</Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> Guardar Evento
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EventosForm;
