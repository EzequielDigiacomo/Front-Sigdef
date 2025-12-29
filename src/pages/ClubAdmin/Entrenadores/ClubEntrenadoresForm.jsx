import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save } from 'lucide-react';
import { CATEGORIA_MAP, SEXO_MAP } from '../../../utils/enums';
import '../Atletas/ClubAtletas.css';

const ClubEntrenadoresForm = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        // ... (data initialized here)
        nombre: '',
        apellido: '',
        documento: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',

        perteneceSeleccion: false,
        categoriaSeleccion: '',
        becadoEnard: false,
        becadoSdn: false,
        montoBeca: 0,
        presentoAptoMedico: false,
        sexo: 1,
        idClub: ''
    });

    const [clubes, setClubes] = useState([]);

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        shouldNavigate: false
    });

    const handleNavigateBack = () => {
        if (location.state?.returnPath) {
            navigate(location.state.returnPath);
        } else if (user.role === 'FEDERACION') {
            navigate('/dashboard/entrenadores');
        } else {
            navigate('/club/entrenadores');
        }
    };

    const handleModalClose = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (modalConfig.shouldNavigate) {
            handleNavigateBack();
        }
    };

    useEffect(() => {
        if (id) {
            loadEntrenador();
        } else if (user?.role === 'FEDERACION') {
            loadClubes();
            // Pre-seleccionar si viene del estado de navegación
            if (location.state?.clubId) {
                setFormData(prev => ({ ...prev, idClub: location.state.clubId }));
            }
        }
    }, [id, user]);

    const loadClubes = async () => {
        try {
            const data = await api.get('/Club');
            setClubes(data || []);
        } catch (error) {
            console.error('Error cargando clubes:', error);
        }
    };

    const loadEntrenador = async () => {
        try {
            const data = await api.get(`/Entrenador/${id}`);
            const persona = await api.get(`/Persona/${id}`);

            setFormData({
                nombre: persona.nombre || '',
                apellido: persona.apellido || '',
                documento: persona.documento || '',
                fechaNacimiento: persona.fechaNacimiento ? persona.fechaNacimiento.split('T')[0] : '',
                email: persona.email || '',
                telefono: persona.telefono || '',
                direccion: persona.direccion || '',
                sexo: persona.sexo || 1,
                perteneceSeleccion: data.perteneceSeleccion ?? false,
                categoriaSeleccion: data.categoriaSeleccion || '',
                becadoEnard: data.becadoEnard ?? false,
                becadoSdn: data.becadoSdn ?? false,
                montoBeca: data.montoBeca ?? 0,
                presentoAptoMedico: data.presentoAptoMedico ?? false,
                idClub: data.idClub || ''
            });

            if (user?.role === 'FEDERACION') {
                loadClubes();
            }
        } catch (error) {
            console.error('Error cargando entrenador:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Error al cargar los datos del entrenador.',
                type: 'danger',
                shouldNavigate: true
            });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Lógica para determinar el Club
        let targetClubId = null;

        if (user?.role === 'CLUB') {
            // Si es Club Admin, usamos su propio club automáticamente
            targetClubId = user.idClub || user.IdClub;
        } else {
            // Si es Federación, usamos el club seleccionado en el formulario o en el estado
            targetClubId = formData.idClub || location.state?.clubId;
        }

        if (!targetClubId) {
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'No se ha especificado un Club para este entrenador.',
                type: 'danger'
            });
            setLoading(false);
            return;
        }

        try {
            let idPersona = null;

            const personaPayload = {
                Nombre: formData.nombre,
                Apellido: formData.apellido,
                Documento: formData.documento,
                FechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : new Date().toISOString(),
                Email: formData.email || "",
                Telefono: formData.telefono || "",
                Direccion: formData.direccion || "",
                Sexo: parseInt(formData.sexo)
            };

            if (id) {
                // Update
                await api.put(`/Persona/${id}`, personaPayload);
                idPersona = parseInt(id);

                const entrenadorPayload = {
                    IdPersona: idPersona,
                    IdClub: parseInt(targetClubId),
                    PerteneceSeleccion: formData.perteneceSeleccion,
                    CategoriaSeleccion: formData.categoriaSeleccion || "",
                    BecadoEnard: formData.becadoEnard ?? false,
                    BecadoSdn: formData.becadoSdn ?? false,
                    MontoBeca: parseFloat(formData.montoBeca) || 0,
                    PresentoAptoMedico: formData.presentoAptoMedico ?? false
                };

                await api.put(`/Entrenador/${id}`, entrenadorPayload);
            } else {
                // Create
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

                const entrenadorPayload = {
                    IdPersona: idPersona,
                    IdClub: parseInt(targetClubId),
                    PerteneceSeleccion: formData.perteneceSeleccion ?? false,
                    CategoriaSeleccion: formData.categoriaSeleccion || "",
                    BecadoEnard: formData.becadoEnard ?? false,
                    BecadoSdn: formData.becadoSdn ?? false,
                    MontoBeca: parseFloat(formData.montoBeca) || 0,
                    PresentoAptoMedico: formData.presentoAptoMedico ?? false
                };

                await api.post('/Entrenador', entrenadorPayload);
            }

            setModalConfig({
                isOpen: true,
                title: 'Éxito',
                message: 'Entrenador guardado exitosamente!',
                type: 'success',
                shouldNavigate: true
            });
        } catch (error) {
            console.error('Error guardando:', error);

            if (error.message && error.message.includes('Email')) {
                setModalConfig({
                    isOpen: true,
                    title: 'Advertencia',
                    message: 'Entrenador guardado, pero hubo un error al leer los datos. Esto es un problema del backend.',
                    type: 'warning',
                    shouldNavigate: true
                });
            } else {
                setModalConfig({
                    isOpen: true,
                    title: 'Error',
                    message: 'Error al guardar. Revisa la consola para más detalles.',
                    type: 'danger',
                    shouldNavigate: false
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={handleNavigateBack}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Entrenador' : 'Nuevo Entrenador'}</h2>
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
                            <label>Sexo *</label>
                            <select
                                name="sexo"
                                value={formData.sexo}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                {Object.entries(SEXO_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
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

                        {user?.role === 'FEDERACION' && (
                            <>
                                <h3 className="form-section-title">Datos del Entrenador</h3>
                                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" name="perteneceSeleccion" checked={formData.perteneceSeleccion} onChange={handleChange} id="seleccion" />
                                    <label htmlFor="seleccion" style={{ marginBottom: 0 }}>Pertenece a Selección</label>
                                </div>
                                {formData.perteneceSeleccion && (
                                    <div className="form-group">
                                        <label>Categoría de Selección</label>
                                        <select
                                            name="categoriaSeleccion"
                                            value={formData.categoriaSeleccion}
                                            onChange={handleChange}
                                            className="form-input"
                                        >
                                            <option value="">Seleccione una categoría</option>
                                            {Object.entries(CATEGORIA_MAP).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <h3 className="form-section-title">Becas</h3>
                                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" name="becadoEnard" checked={formData.becadoEnard} onChange={handleChange} id="enard" />
                                    <label htmlFor="enard" style={{ marginBottom: 0 }}>Becado ENARD</label>
                                </div>
                                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" name="becadoSdn" checked={formData.becadoSdn} onChange={handleChange} id="sdn" />
                                    <label htmlFor="sdn" style={{ marginBottom: 0 }}>Becado SDN</label>
                                </div>
                                <div className="form-group">
                                    <label>Monto Beca</label>
                                    <input type="number" name="montoBeca" value={formData.montoBeca} onChange={handleChange} className="form-input" min="0" step="0.01" />
                                </div>

                                <h3 className="form-section-title">Apto Médico</h3>
                                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" name="presentoAptoMedico" checked={formData.presentoAptoMedico} onChange={handleChange} id="apto" />
                                    <label htmlFor="apto" style={{ marginBottom: 0 }}>Presentó Apto Médico</label>
                                </div>
                            </>
                        )}

                        {user?.role === 'FEDERACION' && (
                            <div className="form-group">
                                <label>Club Asignado *</label>
                                <select
                                    name="idClub"
                                    value={formData.idClub}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                >
                                    <option value="">Seleccione un Club</option>
                                    {clubes.map(club => (
                                        <option key={club.idClub} value={club.idClub}>
                                            {club.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={handleNavigateBack}>Cancelar</Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> {id ? 'Actualizar' : 'Guardar'} Entrenador
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

export default ClubEntrenadoresForm;
