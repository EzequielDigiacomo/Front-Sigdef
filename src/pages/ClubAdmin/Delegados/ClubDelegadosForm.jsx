import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save, Search } from 'lucide-react';
import '../Atletas/ClubAtletas.css';
import '../../../styles/CompactForm.css';

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
        idFederacion: user?.idFederacion || 1
    });

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        shouldNavigate: false
    });

    const handleModalClose = () => {
        const shouldNav = modalConfig.shouldNavigate;
        setModalConfig((prev) => ({ ...prev, isOpen: false, shouldNavigate: false }));
        if (shouldNav) {
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
            const data = await api.get('/Auth/usuarios');
            const user = data.find(u => (u.id || u.idPersona || u.IdPersona).toString() === id);

            if (user) {
                setFormData({
                    nombre: user.nombre || user.nombrePersona || '',
                    apellido: user.apellido || user.apellidoPersona || '',
                    documento: user.dni || user.documento || '',
                    fechaNacimiento: '', 
                    email: user.email || '',
                    telefono: user.telefono || '',
                    direccion: '',
                    sexo: 1,

                    idRol: 3,
                    idFederacion: user.federacionId || 1
                });
            }
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
        // Feature not supported natively with Auth/usuarios
        console.log('Búsqueda por DNI no disponible en este contexto.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userPayload = {
                username: formData.documento, // DNI as username
                password: formData.documento, // DNI as password for initial creation
                email: formData.email || `${formData.documento}@sigdef.com`,
                rol: 'Club',
                rolFederacion: 'Club',
                clubId: parseInt(clubId),
                nombre: formData.nombre,
                apellido: formData.apellido,
                dni: formData.documento,
                telefono: formData.telefono
            };

            if (id) {
                await api.put(`/Auth/usuarios/${id}/perfil`, {
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    telefono: formData.telefono,
                    dni: formData.documento
                });
            } else {
                await api.post('/Auth/register', userPayload);
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
        <div className="page-container compact-form">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/club/delegados')}>
                        <ArrowLeft size={18} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Delegado' : 'Nuevo Delegado'}</h2>
                </div>
            </div>

            <Card className="compact-form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <h3 className="form-section-title">Datos Personales</h3>

                        <div className="form-group">
                            <label>DNI *</label>
                            <div className="form-inline">
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
                                    <Button type="button" variant="secondary" size="sm" onClick={buscarPersonaPorDni}>
                                        <Search size={16} />
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

                    <div className="form-actions">
                        <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/club/delegados')}>Cancelar</Button>
                        <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                            <Save size={16} className="mr-2" /> {id ? 'Actualizar' : 'Guardar'} Delegado
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
