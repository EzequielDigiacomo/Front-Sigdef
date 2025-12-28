import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Save } from 'lucide-react';
import FormSelect from '../../../components/forms/FormSelect';

const DistanciasForm = () => {
    const { eventoId, id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        distancia: '',
        tipoBote: '',
        categoria: '',
        sexo: ''
    });

    // Enums
    const distanciaOptions = [
        { value: 1, label: '200 Metros' },
        { value: 2, label: '350 Metros' },
        { value: 3, label: '400 Metros' },
        { value: 4, label: '500 Metros' },
        { value: 5, label: '1000 Metros' },
        { value: 6, label: '2 Kilómetros' },
        { value: 7, label: '3 Kilómetros' },
        { value: 8, label: '5 Kilómetros' },
        { value: 9, label: '10 Kilómetros' },
        { value: 10, label: '15 Kilómetros' },
        { value: 11, label: '22 Kilómetros' },
        { value: 12, label: '25 Kilómetros' },
        { value: 13, label: '32 Kilómetros' }
    ];

    const boteOptions = [
        { value: 0, label: 'K1' },
        { value: 1, label: 'K2' },
        { value: 2, label: 'K4' },
        { value: 3, label: 'C1' },
        { value: 4, label: 'C2' },
        { value: 5, label: 'C4' }
    ];

    const categoriaOptions = [
        { value: 0, label: 'Infantil' },
        { value: 1, label: 'Cadete' },
        { value: 2, label: 'Junior' },
        { value: 3, label: 'Sub23' },
        { value: 4, label: 'Senior' },
        { value: 5, label: 'Master' },
        { value: 6, label: 'Veterano' }
    ];

    const sexoOptions = [
        { value: 0, label: 'Masculino' },
        { value: 1, label: 'Femenino' },
        { value: 2, label: 'Mixto' }
    ];

    useEffect(() => {
        if (id) {
            loadDistancia();
        }
    }, [id]);

    const loadDistancia = async () => {
        try {
            const data = await api.get(`/DistanciaEvento/${id}`);
            setFormData(data);
        } catch (error) {
            console.error('Error cargando distancia:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                idEvento: parseInt(eventoId)
            };

            if (id) {
                await api.put(`/DistanciaEvento/${id}`, payload);
            } else {
                await api.post('/DistanciaEvento', payload);
            }
            navigate(`/dashboard/eventos/${eventoId}/distancias`);
        } catch (error) {
            console.error('Error guardando distancia:', error);
            alert('Error al guardar la distancia');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate(`/dashboard/eventos/${eventoId}/distancias`)}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Distancia' : 'Nueva Distancia'}</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>Distancia *</label>
                        <select
                            name="distancia"
                            value={formData.distancia}
                            onChange={handleChange}
                            className="form-input"
                            required
                        >
                            <option value="">Seleccione una distancia</option>
                            {distanciaOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Tipo de Bote *</label>
                        <select
                            name="tipoBote"
                            value={formData.tipoBote}
                            onChange={handleChange}
                            className="form-input"
                            required
                        >
                            <option value="">Seleccione un bote</option>
                            {boteOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Categoría *</label>
                        <select
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleChange}
                            className="form-input"
                            required
                        >
                            <option value="">Seleccione una categoría</option>
                            {categoriaOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Sexo *</label>
                        <select
                            name="sexo"
                            value={formData.sexo}
                            onChange={handleChange}
                            className="form-input"
                            required
                        >
                            <option value="">Seleccione sexo</option>
                            {sexoOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-actions" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                        <Button type="button" variant="secondary" onClick={() => navigate(`/dashboard/eventos/${eventoId}/distancias`)}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> Guardar
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default DistanciasForm;
