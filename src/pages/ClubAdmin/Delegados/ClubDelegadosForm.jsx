import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save } from 'lucide-react';
import '../Atletas/ClubAtletas.css';

const ClubDelegadosForm = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({

        nombre: '',
        apellido: '',
        documento: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',

        idRol: 1,
        idFederacion: 1
    });

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        shouldNavigate: false
    });

    const handleModalClose = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (modalConfig.shouldNavigate) {
            navigate('/club/delegados');
        }
    };

    useEffect(() => {
        if (id) loadDelegado();
    }, [id]);

    const loadDelegado = async () => {
        try {
            const data = await api.get(`/DelegadoClub/${id}`);
            const persona = await api.get(`/Persona/${id}`);

            setFormData({
                nombre: persona.nombre || '',
                apellido: persona.apellido || '',
                documento: persona.documento || '',
                fechaNacimiento: persona.fechaNacimiento ? persona.fechaNacimiento.split('T')[0] : '',
                email: persona.email || '',
                telefono: persona.telefono || '',
                direccion: persona.direccion || '',
                idRol: data.idRol || 1,
                idFederacion: data.idFederacion || 1
            });
        } catch (error) {
            console.error('Error cargando delegado:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Error al cargar los datos del delegado.',
                type: 'danger',
                shouldNavigate: true
            });
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let idPersona = null;

            const personaPayload = {
                nombre: formData.nombre,
                apellido: formData.apellido,
                documento: formData.documento,
                fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : new Date().toISOString(),
                email: formData.email || "",
                telefono: formData.telefono || "",
                direccion: formData.direccion || ""
            };

            if (id) {

                await api.put(`/Persona/${id}`, personaPayload);
                idPersona = parseInt(id);

                const delegadoPayload = {
                    idPersona: idPersona,
                    idRol: parseInt(formData.idRol),
                    idFederacion: parseInt(formData.idFederacion)
                };

                await api.put(`/DelegadoClub/${id}`, delegadoPayload);
            } else {

                try {
                    const personaExistente = await api.get(`/Persona/documento/${formData.documento}`, { silentErrors: true });
                    if (personaExistente && personaExistente.idPersona) {
                        idPersona = personaExistente.idPersona;
                        await api.put(`/Persona/${idPersona}`, personaPayload);
                    }
                } catch (error) {
                    console.log('Persona no encontrada, se creará una nueva.');
                }

                if (!idPersona) {
                    const personaResponse = await api.post('/Persona', personaPayload);
                    idPersona = personaResponse.idPersona || personaResponse.IdPersona;
                }

                const delegadoPayload = {
                    idPersona: idPersona,
                    idRol: parseInt(formData.idRol),
                    idFederacion: parseInt(formData.idFederacion)
                };

                await api.post('/DelegadoClub', delegadoPayload);
            }

            setModalConfig({
                isOpen: true,
                title: 'Éxito',
                message: 'Delegado guardado exitosamente!',
                type: 'success',
                shouldNavigate: true
            });
        } catch (error) {
            console.error('Error guardando:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Error al guardar. Revisa la consola para más detalles.',
                type: 'danger',
                shouldNavigate: false
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/club/delegados')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Delegado' : 'Nuevo Delegado'}</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <h3 className="form-section-title">Datos Personales</h3>
                        <div className="form-group">
                            <label>Nombre *</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Apellido *</label>
                            <input name="apellido" value={formData.apellido} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Documento *</label>
                            <input name="documento" value={formData.documento} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Fecha Nacimiento *</label>
                            <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Dirección</label>
                            <input name="direccion" value={formData.direccion} onChange={handleChange} className="form-input" />
                        </div>

                        <h3 className="form-section-title">Datos del Delegado</h3>
                        <div className="form-group">
                            <label>ID Rol *</label>
                            <input type="number" name="idRol" value={formData.idRol} onChange={handleChange} className="form-input" min="1" required />
                            <small style={{ color: 'var(--text-secondary)' }}>Ingresa el ID del rol del delegado</small>
                        </div>
                        <div className="form-group">
                            <label>ID Federación *</label>
                            <input type="number" name="idFederacion" value={formData.idFederacion} onChange={handleChange} className="form-input" min="1" required />
                            <small style={{ color: 'var(--text-secondary)' }}>Ingresa el ID de la federación</small>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => navigate('/club/delegados')}>Cancelar</Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> {id ? 'Actualizar' : 'Guardar'} Delegado
                        </Button>
                    </div>
                </form>
            </Card>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={handleModalClose}
                onConfirm={handleModalClose}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.type === 'danger' ? 'Entendido' : 'Aceptar'}
                showCancel={false}
                type={modalConfig.type}
            />
        </div>
    );
};

export default ClubDelegadosForm;
