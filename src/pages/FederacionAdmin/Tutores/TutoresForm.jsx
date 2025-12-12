import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Save } from 'lucide-react';

const TutoresForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: ''
    });

    useEffect(() => {
        if (id) loadTutor();
    }, [id]);

    const loadTutor = async () => {
        try {
            const data = await api.get(`/Tutor/${id}`);
            setFormData({
                nombre: data.persona?.nombre || '',
                apellido: data.persona?.apellido || '',
                documento: data.persona?.documento || '',
                fechaNacimiento: data.persona?.fechaNacimiento ? data.persona.fechaNacimiento.split('T')[0] : '',
                email: data.persona?.email || '',
                telefono: data.persona?.telefono || '',
                direccion: data.persona?.direccion || ''
            });
        } catch (error) {
            console.error('Error cargando tutor:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id) {

                await api.put(`/Persona/${id}`, {
                    Nombre: formData.nombre,
                    Apellido: formData.apellido,
                    Documento: formData.documento,
                    FechaNacimiento: formData.fechaNacimiento,
                    Email: formData.email,
                    Telefono: formData.telefono,
                    Direccion: formData.direccion
                });
            } else {

                const personaResponse = await api.post('/Persona', {
                    Nombre: formData.nombre,
                    Apellido: formData.apellido,
                    Documento: formData.documento,
                    FechaNacimiento: formData.fechaNacimiento,
                    Email: formData.email,
                    Telefono: formData.telefono,
                    Direccion: formData.direccion
                });

                const idPersona = personaResponse.IdPersona || personaResponse.idPersona;

                await api.post('/Tutor', {
                    IdPersona: idPersona
                });
            }

            navigate('/dashboard/tutores');
        } catch (error) {
            console.error('Error guardando:', error);
            alert('Error al guardar el tutor. Verifica los datos e intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/dashboard/tutores')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Tutor' : 'Nuevo Tutor'}</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
// ... (omitting lines to keep replacement concise, focusing on fixing the navigate calls)
                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/tutores')}>Cancelar</Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> Guardar Tutor
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default TutoresForm;
