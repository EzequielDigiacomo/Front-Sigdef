import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Save } from 'lucide-react';
import '../Atletas/Atletas.css';

const ClubesForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        siglas: ''
    });

    useEffect(() => {
        if (id) {
            api.get(`/Club/${id}`).then(data => setFormData(data)).catch(console.error);
        }
    }, [id]);

    const handleNavigateBack = () => {
        if (location.state?.returnPath) {
            navigate(location.state.returnPath);
        } else {
            navigate('/dashboard/clubes');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (id) {
                await api.put(`/Club/${id}`, formData);
            } else {
                await api.post('/Club', formData);
            }
            handleNavigateBack();
        } catch (error) {
            console.error('Error guardando club:', error);
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
                    <Button variant="ghost" onClick={handleNavigateBack}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Club' : 'Nuevo Club'}</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre del Club</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Siglas</label>
                            <input name="siglas" value={formData.siglas} onChange={handleChange} className="form-input" maxLength="10" />
                        </div>
                        <div className="form-group">
                            <label>Dirección</label>
                            <input name="direccion" value={formData.direccion} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" />
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={handleNavigateBack}>Cancelar</Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> Guardar Club
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ClubesForm;
