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

        licencia: '',
        perteneceSeleccion: false,
        categoriaSeleccion: '',
        becadoEnard: false,
        becadoSdn: false,
        montoBeca: 0,
        presentoAptoMedico: false,
        sexo: 1
    });

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
        if (id) loadEntrenador();
    }, [id]);

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
                licencia: data.licencia || '',
                perteneceSeleccion: data.perteneceSeleccion || false,
                categoriaSeleccion: data.categoriaSeleccion || '',
                becadoEnard: data.becadoEnard || false,
                becadoSdn: data.becadoSdn || false,
                montoBeca: data.montoBeca || 0,
                presentoAptoMedico: data.presentoAptoMedico || false
            });
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

        const targetClubId = location.state?.clubId || user.clubId;
        // Verify we have a club ID if creating new
        if (!id && !targetClubId) {
            alert('Error: No se ha especificado un Club para este entrenador.');
            setLoading(false);
            return;
        }

        try {
            let idPersona = null;

            const personaPayload = {
                nombre: formData.nombre,
                apellido: formData.apellido,
                documento: formData.documento,
                fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : new Date().toISOString(),
                email: formData.email || "",
                telefono: formData.telefono || "",
                direccion: formData.direccion || "",
                sexo: parseInt(formData.sexo)
            };

            if (id) {
                // Update
                await api.put(`/Persona/${id}`, personaPayload);
                idPersona = parseInt(id);

                const entrenadorPayload = {
                    idPersona: idPersona,
                    idClub: targetClubId, // Use determined clubId
                    licencia: formData.licencia,
                    perteneceSeleccion: formData.perteneceSeleccion,
                    categoriaSeleccion: formData.categoriaSeleccion || "",
                    becadoEnard: formData.becadoEnard,
                    becadoSdn: formData.becadoSdn,
                    montoBeca: parseFloat(formData.montoBeca) || 0,
                    presentoAptoMedico: formData.presentoAptoMedico
                };

                // Note: Updating Club ID might not be desired on edit unless explicitly intended. 
                // But for now we treat it as "current context determines club".
                // Ideally backend ignores idClub on update if not meant to change, or we fetch the existing one.
                // However, logic here re-sends it.

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
                    idPersona: idPersona,
                    idClub: targetClubId,
                    licencia: formData.licencia,
                    perteneceSeleccion: formData.perteneceSeleccion,
                    categoriaSeleccion: formData.categoriaSeleccion || "",
                    becadoEnard: formData.becadoEnard,
                    becadoSdn: formData.becadoSdn,
                    montoBeca: parseFloat(formData.montoBeca) || 0,
                    presentoAptoMedico: formData.presentoAptoMedico
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

                        <h3 className="form-section-title">Datos del Entrenador</h3>
                        <div className="form-group">
                            <label>Licencia *</label>
                            <input name="licencia" value={formData.licencia} onChange={handleChange} className="form-input" maxLength={50} required />
                        </div>
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
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => navigate('/club/entrenadores')}>Cancelar</Button>
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
