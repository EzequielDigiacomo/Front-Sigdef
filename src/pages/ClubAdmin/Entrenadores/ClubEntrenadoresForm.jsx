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
import { validateRequiredFields } from '../../../utils/formFieldErrors';
import useFormFieldErrors from '../../../hooks/useFormFieldErrors';
import FieldError from '../../../components/forms/FieldError';
import FormErrorsBanner from '../../../components/forms/FormErrorsBanner';
import '../../../styles/CompactForm.css';

const FIELD_LABELS = {
    nombre: 'Nombre',
    apellido: 'Apellido',
    documento: 'Documento',
    fechaNacimiento: 'Fecha de nacimiento',
    sexo: 'Sexo',
    email: 'Email',
    telefono: 'Teléfono',
    direccion: 'Dirección',
    licencia: 'Licencia',
    categoriaSeleccion: 'Categoría de selección',
    montoBeca: 'Monto de beca',
};

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

    const {
        fieldErrors,
        clearFieldError,
        clearFieldErrors,
        applyApiError,
        applyErrors,
        hasFieldErrors,
    } = useFormFieldErrors(FIELD_LABELS);

    const handleNavigateBack = () => {
        if (location.state?.returnPath) {
            navigate(location.state.returnPath);
            return;
        }
        navigate('/club/entrenadores');
    };

    const handleModalClose = () => {
        const shouldNav = modalConfig.shouldNavigate;
        setModalConfig((prev) => ({ ...prev, isOpen: false, shouldNavigate: false }));
        if (shouldNav) {
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
                 sexo: persona.sexo?.id || persona.Sexo?.Id || persona.sexoId || persona.SexoId || (typeof persona.sexo === 'number' ? persona.sexo : 1),
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
        clearFieldError(name);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearFieldErrors();

        const clientErrors = validateRequiredFields(formData, {
            nombre: 'El nombre es obligatorio.',
            apellido: 'El apellido es obligatorio.',
            documento: 'El documento es obligatorio.',
            fechaNacimiento: 'La fecha de nacimiento es obligatoria.',
            sexo: 'Seleccioná el sexo.',
            licencia: 'La licencia es obligatoria.',
        });
        if (Object.keys(clientErrors).length) {
            applyErrors(clientErrors);
            return;
        }

        setLoading(true);

        const targetClubId = location.state?.clubId || user?.IdClub || user?.idClub || user?.clubId || user?.club?.id;
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
                sexoId: parseInt(formData.sexo)
            };

            if (id) {
                // Update
                await api.put(`/Persona/${id}`, personaPayload);
                idPersona = parseInt(id);

                 const entrenadorPayload = {
                    participanteId: idPersona,
                    ParticipanteId: idPersona,
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
                    idPersona = personaResponse.participanteId || personaResponse.ParticipanteId || personaResponse.idPersona || personaResponse.IdPersona;
                }

                const entrenadorPayload = {
                    participanteId: idPersona,
                    ParticipanteId: idPersona,
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

            const mapped = applyApiError(error);
            if (Object.keys(mapped).length) {
                // Errores por campo ya mostrados en el formulario
            } else if (error.message && error.message.includes('Email')) {
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
        <div className="page-container compact-form">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Button variant="ghost" size="sm" onClick={handleNavigateBack}>
                        <ArrowLeft size={18} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Entrenador' : 'Nuevo Entrenador'}</h2>
                </div>
            </div>

            <Card className="compact-form-card">
                <form onSubmit={handleSubmit} noValidate>
                    {hasFieldErrors && (
                        <FormErrorsBanner errors={fieldErrors} labels={FIELD_LABELS} />
                    )}
                    <div className="form-grid">
                        <h3 className="form-section-title">Datos Personales</h3>
                        <div className="form-group">
                            <label>Nombre *</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} className={`form-input ${fieldErrors.nombre ? 'error' : ''}`} aria-invalid={!!fieldErrors.nombre} />
                            <FieldError message={fieldErrors.nombre} />
                        </div>
                        <div className="form-group">
                            <label>Apellido *</label>
                            <input name="apellido" value={formData.apellido} onChange={handleChange} className={`form-input ${fieldErrors.apellido ? 'error' : ''}`} aria-invalid={!!fieldErrors.apellido} />
                            <FieldError message={fieldErrors.apellido} />
                        </div>
                        <div className="form-group">
                            <label>Documento *</label>
                            <input name="documento" value={formData.documento} onChange={handleChange} className={`form-input ${fieldErrors.documento ? 'error' : ''}`} aria-invalid={!!fieldErrors.documento} />
                            <FieldError message={fieldErrors.documento} />
                        </div>
                        <div className="form-group">
                            <label>Fecha Nacimiento *</label>
                            <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className={`form-input ${fieldErrors.fechaNacimiento ? 'error' : ''}`} aria-invalid={!!fieldErrors.fechaNacimiento} />
                            <FieldError message={fieldErrors.fechaNacimiento} />
                        </div>
                        <div className="form-group">
                            <label>Sexo *</label>
                            <select
                                name="sexo"
                                value={formData.sexo}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.sexo ? 'error' : ''}`}
                            >
                                {Object.entries(SEXO_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <FieldError message={fieldErrors.sexo} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className={`form-input ${fieldErrors.email ? 'error' : ''}`} />
                            <FieldError message={fieldErrors.email} />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className={`form-input ${fieldErrors.telefono ? 'error' : ''}`} />
                            <FieldError message={fieldErrors.telefono} />
                        </div>
                        <div className="form-group">
                            <label>Dirección</label>
                            <input name="direccion" value={formData.direccion} onChange={handleChange} className={`form-input ${fieldErrors.direccion ? 'error' : ''}`} />
                            <FieldError message={fieldErrors.direccion} />
                        </div>

                        <h3 className="form-section-title">Datos del Entrenador</h3>
                        <div className="form-group">
                            <label>Licencia *</label>
                            <input name="licencia" value={formData.licencia} onChange={handleChange} className={`form-input ${fieldErrors.licencia ? 'error' : ''}`} aria-invalid={!!fieldErrors.licencia} maxLength={50} />
                            <FieldError message={fieldErrors.licencia} />
                        </div>
                        <div className="form-group checkbox-group">
                            <input type="checkbox" name="perteneceSeleccion" checked={formData.perteneceSeleccion} onChange={handleChange} id="seleccion" />
                            <label htmlFor="seleccion">Pertenece a Selección</label>
                        </div>
                        {formData.perteneceSeleccion && (
                            <div className="form-group">
                                <label>Categoría de Selección</label>
                                <select
                                    name="categoriaSeleccion"
                                    value={formData.categoriaSeleccion}
                                    onChange={handleChange}
                                    className={`form-input ${fieldErrors.categoriaSeleccion ? 'error' : ''}`}
                                >
                                    <option value="">Seleccione una categoría</option>
                                    {Object.entries(CATEGORIA_MAP).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                <FieldError message={fieldErrors.categoriaSeleccion} />
                            </div>
                        )}

                        <h3 className="form-section-title">Becas</h3>
                        <div className="form-group checkbox-group">
                            <input type="checkbox" name="becadoEnard" checked={formData.becadoEnard} onChange={handleChange} id="enard" />
                            <label htmlFor="enard">Becado ENARD</label>
                        </div>
                        <div className="form-group checkbox-group">
                            <input type="checkbox" name="becadoSdn" checked={formData.becadoSdn} onChange={handleChange} id="sdn" />
                            <label htmlFor="sdn">Becado SDN</label>
                        </div>
                        <div className="form-group">
                            <label>Monto Beca</label>
                            <input type="number" name="montoBeca" value={formData.montoBeca} onChange={handleChange} className={`form-input ${fieldErrors.montoBeca ? 'error' : ''}`} min="0" step="0.01" />
                            <FieldError message={fieldErrors.montoBeca} />
                        </div>

                        <h3 className="form-section-title">Apto Médico</h3>
                        <div className="form-group checkbox-group">
                            <input type="checkbox" name="presentoAptoMedico" checked={formData.presentoAptoMedico} onChange={handleChange} id="apto" />
                            <label htmlFor="apto">Presentó Apto Médico</label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" size="sm" onClick={handleNavigateBack}>Cancelar</Button>
                        <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                            <Save size={16} /> {id ? 'Actualizar' : 'Guardar'} Entrenador
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
