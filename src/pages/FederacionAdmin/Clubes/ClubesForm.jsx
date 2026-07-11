import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Save } from 'lucide-react';
import '../../../styles/CompactForm.css';

const ClubesForm = () => {
    const { id, fedId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        siglas: '',
        email: '',
        telefono: '',
        direccion: '',
        estadoMatricula: 0
    });

    useEffect(() => {
        if (id) {
            api.get(`/Clubes/${id}`).then(data => {
                setFormData({
                    nombre: data.nombre || data.Nombre || '',
                    siglas: data.sigla || data.Sigla || data.siglas || data.Siglas || '',
                    email: data.email || data.Email || '',
                    telefono: data.telefono || data.Telefono || '',
                    direccion: data.direccion || data.Direccion || '',
                    estadoMatricula: data.estadoMatricula || data.EstadoMatricula || 1
                });
            }).catch(err => {
                console.error(err);
            });
        }
    }, [id]);

    const handleNavigateBack = () => {
        if (location.state?.returnPath) {
            navigate(location.state.returnPath);
        } else if (fedId) {
            navigate(`/superadmin/federacion/${fedId}/clubes`);
        } else {
            navigate('/dashboard/clubes');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                nombre: formData.nombre,
                sigla: formData.siglas, // backend usa 'sigla'
                email: formData.email,
                telefono: formData.telefono,
                direccion: formData.direccion,
                estadoMatricula: parseInt(formData.estadoMatricula),
                federacionId: fedId ? parseInt(fedId) : null
            };
            if (id) {
                await api.put(`/Clubes/${id}`, payload);
            } else {
                await api.post('/Clubes', payload);
            }
            handleNavigateBack();
        } catch (error) {
            console.error('Error guardando club:', error);
            alert(error.message || 'Error al guardar el club');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="page-container compact-form">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Button variant="ghost" size="sm" onClick={handleNavigateBack}>
                        <ArrowLeft size={18} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Club' : 'Nuevo Club'}</h2>
                </div>
            </div>

            <Card className="compact-form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <h3 className="form-section-title">Datos Identificatorios</h3>

                        <div className="form-group">
                            <label>Nombre Institucional *</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Sigla / Acrónimo</label>
                            <input name="siglas" value={formData.siglas} onChange={handleChange} className="form-input" maxLength="10" placeholder="Ej: CFD, CNS..." />
                        </div>

                        <h3 className="form-section-title">Información de Contacto</h3>

                        <div className="form-group">
                            <label>Email Oficial</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="contacto@club.org" />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" placeholder="+54 11 ..." />
                        </div>
                        <div className="form-group full-width">
                            <label>Dirección / Ubicación / Sede</label>
                            <input name="direccion" value={formData.direccion} onChange={handleChange} className="form-input" placeholder="Ciudad, Provincia..." />
                        </div>

                        <h3 className="form-section-title">Estado Administrativo</h3>

                        <div className="form-group">
                            <label>Estado de Matrícula (Federación)</label>
                            <select name="estadoMatricula" value={formData.estadoMatricula} onChange={handleChange} className="form-input">
                                <option value="0">Pendiente</option>
                                <option value="1">Pagado (Al Día)</option>
                                <option value="2">Vencido</option>
                                <option value="3">Parcial</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" size="sm" onClick={handleNavigateBack}>Cancelar</Button>
                        <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                            <Save size={16} /> Guardar Club
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ClubesForm;
