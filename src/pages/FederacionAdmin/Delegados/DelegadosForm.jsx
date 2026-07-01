import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const DelegadosForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [clubes, setClubes] = useState([]);
    const [federacionNombre, setFederacionNombre] = useState('');

    // Estado del formulario unificado (Persona + Delegado)
    const [formData, setFormData] = useState({
        // Datos Persona
        nombre: '',
        apellido: '',
        documento: '',
        sexo: 1, // Por defecto Masculino
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',

        // Datos Delegado
        idRol: 3, // Delegado Club
        idClub: '', // Vacío implica Agente Libre
        idFederacion: user?.idFederacion || 1
    });

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        shouldNavigate: false
    });

    useEffect(() => {
        loadClubes();
        loadFederacion();
        if (id) {
            loadDelegado();
        }
    }, [id]);

    const loadDelegado = async () => {
        setLoading(true);
        try {
            const data = await api.get('/Auth/usuarios');
            const user = data.find(u => (u.id || u.idPersona || u.IdPersona).toString() === id);

            if (user) {
                setFormData(prev => ({
                    ...prev,
                    nombre: user.nombre || user.nombrePersona || '',
                    apellido: user.apellido || user.apellidoPersona || '',
                    documento: user.dni || user.documento || '',
                    sexo: 1, // Default
                    fechaNacimiento: '', // No birthdate in Auth/usuarios usually
                    email: user.email || '',
                    telefono: user.telefono || '',
                    direccion: '',

                    // Datos Delegado
                    idRol: 3,
                    idClub: user.clubId || '',
                    idFederacion: user.federacionId || 1
                }));
            }
        } catch (error) {
            console.error('Error cargando datos del delegado:', error);
            showModal('Error', 'No se pudieron cargar los datos del delegado.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (location.state?.clubId) {
            setFormData(prev => ({ ...prev, idClub: location.state.clubId }));
        }
    }, [location.state]);

    const loadFederacion = async () => {
        try {
            const fedId = user?.idFederacion || 1;
            const data = await api.get(`/Federacion/${fedId}`);
            setFederacionNombre(data?.nombre || data?.Nombre || `Federación ID ${fedId}`);
            setFormData(prev => ({ ...prev, idFederacion: fedId }));
        } catch (error) {
            console.error(`Error cargando federación individual ${user?.idFederacion || 1}:`, error);
            setFederacionNombre(`Federación (ID ${user?.idFederacion || 1})`);
            setFormData(prev => ({ ...prev, idFederacion: user?.idFederacion || 1 }));
        }
    };

    const loadClubes = async () => {
        try {
            const data = await api.get('/Club');
            setClubes(data);
        } catch (error) {
            console.error('Error cargando clubes:', error);
            showModal('Error', 'No se pudieron cargar los clubes.', 'danger');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const showModal = (title, message, type = 'info', shouldNavigate = false) => {
        setModalConfig({ isOpen: true, title, message, type, shouldNavigate });
    };

    const handleModalClose = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (modalConfig.shouldNavigate) {
            navigate('/dashboard/delegados');
        }
    };

    const buscarPersonaPorDni = async () => {
        // Feature not supported natively with Auth/usuarios unless we call an external service
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
                rol: "Club",
                clubId: formData.idClub ? parseInt(formData.idClub) : null,
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
            console.error('Error guardando delegado:', error);
            showModal('Error', error.message || 'Error al guardar el delegado.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/dashboard/delegados')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">Crear / Asignar Delegado</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <h3 className="form-section-title" style={{ gridColumn: '1 / -1' }}>Datos de la Persona</h3>

                        <div className="form-group">
                            <label>DNI *</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    name="documento"
                                    value={formData.documento}
                                    onChange={handleChange}
                                    onBlur={buscarPersonaPorDni}
                                    className="form-input"
                                    required
                                />
                                <Button type="button" variant="secondary" onClick={buscarPersonaPorDni} title="Buscar existencia">
                                    <Search size={18} />
                                </Button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nombre *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Apellido *</label>
                            <input
                                type="text"
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
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
                            <label>Fecha Nacimiento</label>
                            <input
                                type="date"
                                name="fechaNacimiento"
                                value={formData.fechaNacimiento}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="text"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Dirección</label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        <h3 className="form-section-title" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>Datos del Delegado</h3>

                        <div className="form-group">
                            <label>Club (Opcional - Agente Libre)</label>
                            <select
                                name="idClub"
                                value={formData.idClub}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="">-- Agente Libre (Sin Club) --</option>
                                {clubes.map((club) => (
                                    <option key={club.idClub} value={club.idClub}>
                                        {club.nombre} ({club.siglas})
                                    </option>
                                ))}
                            </select>
                            <small className="form-text text-muted">Si no selecciona un club, el delegado quedará como agente libre.</small>
                        </div>

                        <div className="form-group">
                            <label>Federación</label>
                            <input
                                type="text"
                                value={federacionNombre}
                                className="form-input"
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label>Rol</label>
                            <select
                                name="idRol"
                                value={formData.idRol}
                                onChange={handleChange}
                                className="form-input"
                                disabled // Por ahora fijo en Delegado
                            >
                                <option value={3}>Delegado Club</option>
                            </select>
                        </div>

                    </div>

                    <div className="form-actions" style={{ marginTop: '2rem' }}>
                        <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/delegados')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} className="mr-2" /> Guardar Delegado
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

export default DelegadosForm;
