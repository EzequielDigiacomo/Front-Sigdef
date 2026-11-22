import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save, Search } from 'lucide-react';
import '../Atletas/ClubAtletas.css';
import '../../../styles/CompactForm.css';
import { toFriendlyErrorMessage } from '../../../utils/friendlyError';
import { validateRequiredFields } from '../../../utils/formFieldErrors';
import useFormFieldErrors from '../../../hooks/useFormFieldErrors';
import FieldError from '../../../components/forms/FieldError';
import FormErrorsBanner from '../../../components/forms/FormErrorsBanner';

const FIELD_LABELS = {
    documento: 'DNI',
    nombre: 'Nombre',
    apellido: 'Apellido',
    sexo: 'Sexo',
    fechaNacimiento: 'Fecha de nacimiento',
    email: 'Email',
    telefono: 'Teléfono',
    direccion: 'Dirección',
};

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

    const [participanteId, setParticipanteId] = useState(null);
    const [personaFound, setPersonaFound] = useState(false);
    const searchTimer = useRef(null);
    const {
        fieldErrors,
        clearFieldError,
        clearFieldErrors,
        applyApiError,
        applyErrors,
        hasFieldErrors,
    } = useFormFieldErrors(FIELD_LABELS);

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
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [id]);

    const loadDelegado = async () => {
        try {
            const data = await api.get('/Auth/usuarios');
            const found = data.find(u => (u.id || u.idPersona || u.IdPersona).toString() === id);

            if (found) {
                setFormData({
                    nombre: found.nombre || found.nombrePersona || '',
                    apellido: found.apellido || found.apellidoPersona || '',
                    documento: found.dni || found.documento || '',
                    fechaNacimiento: '',
                    email: found.email || '',
                    telefono: found.telefono || '',
                    direccion: '',
                    sexo: 1,
                    idRol: 3,
                    idFederacion: found.federacionId || 1
                });
                setParticipanteId(found.participanteId || found.ParticipanteId || null);
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
        clearFieldError(name);

        if (name === 'documento' && !id) {
            setPersonaFound(false);
            setParticipanteId(null);
            if (searchTimer.current) clearTimeout(searchTimer.current);
            const digits = String(value || '').replace(/\D/g, '');
            if (digits.length >= 7) {
                searchTimer.current = setTimeout(() => buscarPersonaPorDni(digits, false), 450);
            }
        }
    };

    const buscarPersonaPorDni = async (docOverride, notify = true) => {
        const documento = String(docOverride ?? formData.documento ?? '').trim();
        if (documento.length < 7) return;
        try {
            const persona = await api.get(`/Persona/documento/${encodeURIComponent(documento)}`, { silentErrors: true });
            if (!persona) {
                if (notify) showModal('Persona nueva', 'No hay persona con ese DNI. Completá los datos.', 'info');
                return;
            }
            setFormData(prev => ({
                ...prev,
                nombre: persona.nombre || persona.Nombre || '',
                apellido: persona.apellido || persona.Apellido || '',
                documento: persona.documento || persona.Documento || documento,
                sexo: persona.sexoId ?? persona.SexoId ?? persona.sexo ?? 1,
                fechaNacimiento: String(persona.fechaNacimiento || persona.FechaNacimiento || '').split('T')[0],
                email: persona.email || persona.Email || '',
                telefono: persona.telefono || persona.Telefono || '',
                direccion: persona.direccion || persona.Direccion || '',
            }));
            setParticipanteId(persona.participanteId ?? persona.ParticipanteId ?? persona.idPersona ?? persona.IdPersona);
            setPersonaFound(true);
            if (notify) {
                showModal('Persona encontrada', 'Datos autocompletados. Puede ser entrenador y también delegado.', 'success');
            }
        } catch (err) {
            const msg = err?.message || '';
            if (notify) {
                if (/no está disponible|no esta disponible/i.test(msg)) {
                    showModal('DNI no disponible', msg, 'warning');
                } else {
                    showModal('Persona nueva', 'No hay persona con ese DNI. Completá los datos.', 'info');
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearFieldErrors();

        const clientErrors = validateRequiredFields(formData, {
            documento: 'El DNI es obligatorio.',
            nombre: 'El nombre es obligatorio.',
            apellido: 'El apellido es obligatorio.',
            fechaNacimiento: 'La fecha de nacimiento es obligatoria.',
        });
        const docDigits = String(formData.documento || '').replace(/\D/g, '');
        if (docDigits && docDigits.length < 7) {
            clientErrors.documento = 'Ingresá al menos 7 dígitos del DNI.';
        }
        if (Object.keys(clientErrors).length) {
            applyErrors(clientErrors);
            return;
        }

        setLoading(true);

        try {
            let pid = participanteId;
            const personaPayload = {
                nombre: formData.nombre,
                apellido: formData.apellido,
                documento: formData.documento,
                fechaNacimiento: formData.fechaNacimiento
                    ? new Date(formData.fechaNacimiento).toISOString()
                    : new Date('2000-01-01T00:00:00.000Z').toISOString(),
                email: formData.email || null,
                telefono: formData.telefono || null,
                direccion: formData.direccion || null,
                sexoId: parseInt(formData.sexo, 10) || 1,
            };

            if (!pid) {
                try {
                    const existing = await api.get(`/Persona/documento/${encodeURIComponent(formData.documento)}`, { silentErrors: true });
                    pid = existing?.participanteId ?? existing?.ParticipanteId ?? existing?.idPersona ?? existing?.IdPersona;
                } catch { /* nueva */ }
            }

            if (pid) {
                await api.put(`/Persona/${pid}`, personaPayload).catch(() => {});
            } else {
                const created = await api.post('/Persona', personaPayload);
                pid = created?.participanteId ?? created?.ParticipanteId ?? created?.idPersona ?? created?.IdPersona;
            }

            const userPayload = {
                username: formData.documento,
                password: formData.documento,
                email: formData.email || `${formData.documento}@sigdef.local`,
                rol: 'Club',
                rolFederacion: 'Club',
                clubId: parseInt(clubId, 10),
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

            if (pid) {
                await api.post('/DelegadoClub', {
                    participanteId: pid,
                    idRol: 3,
                    idFederacion: formData.idFederacion || user?.idFederacion || null,
                    idClub: parseInt(clubId, 10),
                }).catch(() => {});
            }

            showModal(
                'Éxito',
                personaFound
                    ? 'Delegado guardado. La persona puede ser entrenador y delegado a la vez.'
                    : 'Delegado guardado correctamente.',
                'success',
                true
            );
        } catch (error) {
            console.error('Error guardando:', error);
            const mapped = applyApiError(error);
            if (!Object.keys(mapped).length) {
                showModal(
                    'Error',
                    toFriendlyErrorMessage(error, {
                        fallback: 'No se pudo guardar el delegado. Revisá los datos e intentá nuevamente.',
                    }),
                    'danger'
                );
            }
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
                <form onSubmit={handleSubmit} noValidate>
                    {hasFieldErrors && (
                        <FormErrorsBanner errors={fieldErrors} labels={FIELD_LABELS} />
                    )}
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
                                    className={`form-input ${fieldErrors.documento ? 'error' : ''}`}
                                    aria-invalid={!!fieldErrors.documento}
                                    disabled={!!id} // Disable DNI edit on update to prevent changing identity easily
                                />
                                {!id && (
                                    <Button type="button" variant="secondary" size="sm" onClick={buscarPersonaPorDni}>
                                        <Search size={16} />
                                    </Button>
                                )}
                            </div>
                            <FieldError message={fieldErrors.documento} />
                        </div>

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
                            <label>Sexo *</label>
                            <select
                                name="sexo"
                                value={formData.sexo}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.sexo ? 'error' : ''}`}
                            >
                                <option value={1}>Masculino</option>
                                <option value={2}>Femenino</option>
                            </select>
                            <FieldError message={fieldErrors.sexo} />
                        </div>
                        <div className="form-group">
                            <label>Fecha Nacimiento *</label>
                            <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className={`form-input ${fieldErrors.fechaNacimiento ? 'error' : ''}`} aria-invalid={!!fieldErrors.fechaNacimiento} />
                            <FieldError message={fieldErrors.fechaNacimiento} />
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
