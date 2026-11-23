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
import AtletaPendingPhotos, {
    emptyAtletaPendingPhotos,
    uploadPendingAtletaPhotos,
    formatPhotosUploadNote,
} from '../../../components/forms/AtletaPendingPhotos';
import {
    mapPersonaToDelegadoForm,
    pickPersonaId,
    resolveDocumentoFromUser,
} from '../../../utils/delegadoHelpers';
import { trackFormOutcome } from '../../../services/auditClient';

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
    const [pendingPhotos, setPendingPhotos] = useState(emptyAtletaPendingPhotos);
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
            const list = Array.isArray(data) ? data : [];
            const found = list.find((u) =>
                String(u.id || u.Id || u.idPersona || u.IdPersona) === String(id)
            );

            if (!found) {
                showModal('Error', 'No se encontró el delegado a editar.', 'danger', true);
                return;
            }

            let documento = resolveDocumentoFromUser(found);
            let pid = found.participanteId ?? found.ParticipanteId ?? null;
            let personaExtra = {};

            const mergePersona = (persona) => {
                if (!persona) return;
                personaExtra = mapPersonaToDelegadoForm(persona);
                pid = pickPersonaId(persona) || pid;
                if (personaExtra.documento) documento = personaExtra.documento;
            };

            if (pid) {
                try {
                    const persona = await api.get(`/Persona/${pid}`, { silentErrors: true });
                    mergePersona(persona);
                } catch { /* seguir con fallbacks */ }
            }

            if (!personaExtra.documento && documento) {
                try {
                    const persona = await api.get(
                        `/Persona/documento/${encodeURIComponent(documento)}`,
                        { silentErrors: true }
                    );
                    mergePersona(persona);
                } catch { /* seguir */ }
            }

            if (pid && !personaExtra.documento) {
                try {
                    const detail = await api.get(`/DelegadoClub/${pid}`, { silentErrors: true });
                    mergePersona(detail?.participante || detail?.Participante);
                } catch { /* seguir */ }
            }

            setFormData({
                nombre: personaExtra.nombre || found.nombre || found.Nombre || found.nombrePersona || '',
                apellido: personaExtra.apellido || found.apellido || found.Apellido || found.apellidoPersona || '',
                documento: personaExtra.documento || documento || '',
                fechaNacimiento: personaExtra.fechaNacimiento || '',
                email: personaExtra.email || found.email || found.Email || '',
                telefono: personaExtra.telefono || found.telefono || found.Telefono || '',
                direccion: personaExtra.direccion || '',
                sexo: Number(personaExtra.sexo) || 1,
                idRol: 3,
                idFederacion: found.federacionId || found.FederacionId || found.idFederacion || user?.idFederacion || 1,
            });
            setParticipanteId(pid || null);
            if (personaExtra.documento || documento) setPersonaFound(true);
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

        const auditCtx = {
            esEdicion: Boolean(id),
            delegadoUserId: id || null,
            nombre: formData.nombre || null,
            apellido: formData.apellido || null,
            documento: formData.documento || null,
            clubId,
        };

        trackFormOutcome({
            entity: 'Delegado',
            outcome: 'attempt',
            message: id ? 'Club intenta actualizar delegado' : 'Club intenta crear delegado',
            context: auditCtx,
        });

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
            trackFormOutcome({
                entity: 'Delegado',
                outcome: 'validation_error',
                errors: clientErrors,
                fieldLabels: FIELD_LABELS,
                context: auditCtx,
            });
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

            const photosNote = pid
                ? formatPhotosUploadNote(await uploadPendingAtletaPhotos(pid, pendingPhotos))
                : '';
            const okMsg = `${personaFound
                ? 'Delegado guardado. La persona puede ser entrenador y delegado a la vez.'
                : 'Delegado guardado correctamente.'}${photosNote}`;
            trackFormOutcome({
                entity: 'Delegado',
                outcome: 'ok',
                message: okMsg,
                context: auditCtx,
            });
            showModal('Éxito', okMsg, 'success', true);
        } catch (error) {
            console.error('Error guardando:', error);
            trackFormOutcome({
                entity: 'Delegado',
                outcome: 'error',
                message: error.message || 'No se pudo guardar el delegado',
                context: {
                    ...auditCtx,
                    endpoint: error.endpoint || null,
                    httpStatus: error.status ?? null,
                },
            });
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
                                    disabled={!!id && !!formData.documento}
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

                        <AtletaPendingPhotos
                            value={pendingPhotos}
                            onChange={setPendingPhotos}
                            entityLabel="delegado"
                        />
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
