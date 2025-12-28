import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save, Search } from 'lucide-react';
import '../Atletas/ClubAtletas.css';

const ClubDelegadosForm = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Get Club ID from authenticated user context
    const clubId = user?.idClub || user?.IdClub;

    const [formData, setFormData] = useState({
        // Datos Persona
        nombre: '',
        apellido: '',
        documento: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',
        sexo: 1,

        // Datos Delegado
        idRol: 3, // Delegado Club (Default)
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

    const showModal = (title, message, type = 'info', shouldNavigate = false) => {
        setModalConfig({ isOpen: true, title, message, type, shouldNavigate });
    };

    useEffect(() => {
        if (id) loadDelegado();
    }, [id]);

    const loadDelegado = async () => {
        try {
            const data = await api.get(`/DelegadoClub/${id}`);
            // Assuming 'id' in URL is actually the IdPersona based on current routing logic, 
            // or we fetch Delegate then Person. If 'id' is Delegate ID, adjust accordingly.
            // Usually Route is /delegados/editar/:idPersona

            // If the endpoint is GET /DelegadoClub/{idPersona}
            const persona = await api.get(`/Persona/${data.idPersona}`);

            setFormData({
                nombre: persona.nombre || persona.Nombre || '',
                apellido: persona.apellido || persona.Apellido || '',
                documento: persona.documento || persona.Documento || '',
                fechaNacimiento: (persona.fechaNacimiento || persona.FechaNacimiento || '').split('T')[0],
                email: persona.email || persona.Email || '',
                telefono: persona.telefono || persona.Telefono || '',
                direccion: persona.direccion || persona.Direccion || '',
                sexo: persona.sexo || persona.Sexo || 1,

                idRol: data.idRol || 3,
                idFederacion: data.idFederacion || 1
            });
        } catch (error) {
            console.error('Error cargando delegado:', error);
            showModal('Error', 'Error al cargar los datos del delegado.', 'danger', true);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) : value
        }));
    };

    const buscarPersonaPorDni = async () => {
        if (!formData.documento || formData.documento.length < 7) return;

        try {
            const persona = await api.get(`/Persona/documento/${formData.documento}`);
            if (persona) {
                setFormData(prev => ({
                    ...prev,
                    nombre: persona.nombre || persona.Nombre || '',
                    apellido: persona.apellido || persona.Apellido || '',
                    sexo: persona.sexo || persona.Sexo || 1,
                    fechaNacimiento: (persona.fechaNacimiento || persona.FechaNacimiento || '').split('T')[0],
                    email: persona.email || persona.Email || '',
                    telefono: persona.telefono || persona.Telefono || '',
                    direccion: persona.direccion || persona.Direccion || ''
                }));
                // Optional: alert user found
            }
        } catch (error) {
            // Not found, user enters data manually
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let idPersonaFinal = id ? parseInt(id) : null;

            const personaPayload = {
                Nombre: formData.nombre,
                Apellido: formData.apellido,
                Documento: formData.documento,
                Sexo: parseInt(formData.sexo),
                FechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : new Date().toISOString(),
                Email: formData.email || null,
                Telefono: formData.telefono || null,
                Direccion: formData.direccion || null
            };

            // 1. Create or Update Persona
            if (idPersonaFinal) {
                await api.put(`/Persona/${idPersonaFinal}`, personaPayload);
            } else {
                // Check existance by DNI for creation
                try {
                    const personaExistente = await api.get(`/Persona/documento/${formData.documento}`);
                    if (personaExistente) {
                        idPersonaFinal = personaExistente.idPersona || personaExistente.IdPersona;
                        await api.put(`/Persona/${idPersonaFinal}`, personaPayload);
                    }
                } catch (e) { /* Not found */ }

                if (!idPersonaFinal) {
                    const nuevaPersona = await api.post('/Persona', personaPayload);
                    idPersonaFinal = nuevaPersona.idPersona || nuevaPersona.IdPersona;
                }
            }

            // 2. Create or Update Delegado Record
            const delegadoPayload = {
                idPersona: idPersonaFinal,
                idRol: parseInt(formData.idRol),
                idFederacion: parseInt(formData.idFederacion),
                idClub: parseInt(clubId) // Assign to CURRENT LOGGED IN CLUB
            };

            if (id) {
                // Update mode
                // Assuming PUT /DelegadoClub/{idPersona}
                await api.put(`/DelegadoClub/${idPersonaFinal}`, delegadoPayload);
            } else {
                // Create mode
                await api.post('/DelegadoClub', delegadoPayload);
            }

            showModal('Éxito', 'Delegado guardado correctamente.', 'success', true);

        } catch (error) {
            console.error('Error guardando:', error);
            showModal('Error', error.message || 'Error al guardar el delegado.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    if (!clubId) {
        return <div className="p-4">Error: No se pudo identificar el Club del usuario.</div>;
    }

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
                        <h3 className="form-section-title" style={{ gridColumn: '1 / -1' }}>Datos Personales</h3>

                        <div className="form-group">
                            <label>DNI *</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    name="documento"
                                    value={formData.documento}
                                    onChange={handleChange}
                                    onBlur={buscarPersonaPorDni}
                                    className="form-input"
                                    required
                                    disabled={!!id} // Disable DNI edit on update to prevent changing identity easily
                                />
                                {!id && (
                                    <Button type="button" variant="secondary" onClick={buscarPersonaPorDni}>
                                        <Search size={18} />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nombre *</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Apellido *</label>
                            <input name="apellido" value={formData.apellido} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Sexo *</label>
                            <select
                                name="sexo"
                                value={formData.sexo}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value={1}>Masculino</option>
                                <option value={2}>Femenino</option>
                            </select>
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
                    </div>

                    <div className="form-actions" style={{ marginTop: '2rem' }}>
                        <Button type="button" variant="secondary" onClick={() => navigate('/club/delegados')}>Cancelar</Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} className="mr-2" /> {id ? 'Actualizar' : 'Guardar'} Delegado
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
