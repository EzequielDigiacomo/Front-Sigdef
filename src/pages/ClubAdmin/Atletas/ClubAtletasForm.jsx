import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { trackFormOutcome } from '../../../services/auditClient';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save } from 'lucide-react';
import { CATEGORIA_MAP, PARENTESCO_MAP } from '../../../utils/enums';
import { getCategoryByAge } from '../../../utils/categoryConfig';
import { validateRequiredFields, mapApiFieldErrorsWithTutor } from '../../../utils/formFieldErrors';
import useFormFieldErrors from '../../../hooks/useFormFieldErrors';
import FieldError from '../../../components/forms/FieldError';
import FormErrorsBanner from '../../../components/forms/FormErrorsBanner';
import './ClubAtletas.css';
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
    categoria: 'Categoría',
    estadoPago: 'Estado de pago',
    montoBeca: 'Monto de beca',
    tutorDocumento: 'Documento del tutor',
    tutorNombre: 'Nombre del tutor',
    tutorApellido: 'Apellido del tutor',
    tutorParentesco: 'Parentesco',
    tutorTelefono: 'Teléfono del tutor',
    tutorEmail: 'Email del tutor',
};

const ClubAtletasForm = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [esMenor, setEsMenor] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',
        categoria: 0,
        becadoEnard: false,
        becadoSdn: false,
        montoBeca: 0,
        presentoAptoMedico: false,
        estadoPago: 0,
        perteneceSeleccion: false,
        sexo: 1, // Default Masculino or force user to select
    });

    const [tutorData, setTutorData] = useState({
        documento: '',
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        parentesco: 0,
        existe: false,
        idPersona: null,
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
        applyErrors,
        hasFieldErrors,
    } = useFormFieldErrors(FIELD_LABELS);

    const handleModalClose = () => {
        const shouldNav = modalConfig.shouldNavigate;
        setModalConfig((prev) => ({ ...prev, isOpen: false, shouldNavigate: false }));
        if (shouldNav) {
            navigate('/club/atletas');
        }
    };

    useEffect(() => {
        if (id) loadAtleta();
    }, [id]);

    useEffect(() => {
        if (formData.fechaNacimiento) {
            const edad = calcularEdad(formData.fechaNacimiento);
            setEsMenor(edad < 18);
            
            // Auto-assign category
            const autoCategory = getCategoryByAge(edad);
            setFormData(prev => ({ ...prev, categoria: autoCategory }));
        }
    }, [formData.fechaNacimiento]);

    const calcularEdad = (fechaNacimiento) => {
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
        return edad;
    };

    const loadAtleta = async () => {
        try {
            const [data, personaRes] = await Promise.all([
                api.get(`/Atleta/${id}`),
                api.get(`/Persona/${id}`).catch(() => null),
            ]);

            const nested =
                data.participante ||
                data.Participante ||
                data.persona ||
                data.Persona ||
                {};
            const persona = personaRes || nested;
            const athleteId =
                data.idPersona ||
                data.IdPersona ||
                data.participanteId ||
                data.ParticipanteId ||
                parseInt(id, 10);

            const pick = (...vals) => {
                for (const v of vals) {
                    if (v != null && String(v).trim() !== '') return v;
                }
                return '';
            };

            const fecha =
                persona.fechaNacimiento ||
                persona.FechaNacimiento ||
                nested.fechaNacimiento ||
                nested.FechaNacimiento ||
                '';

            const sexoRaw =
                persona.sexoId ??
                persona.SexoId ??
                persona.sexo ??
                persona.Sexo ??
                nested.sexoId ??
                nested.Sexo ??
                1;
            const sexo =
                typeof sexoRaw === 'object'
                    ? sexoRaw.id ?? sexoRaw.Id ?? 1
                    : sexoRaw;

            setFormData({
                nombre: pick(persona.nombre, persona.Nombre, nested.nombre, nested.Nombre),
                apellido: pick(
                    persona.apellido,
                    persona.Apellido,
                    nested.apellido,
                    nested.Apellido
                ),
                documento: pick(
                    persona.documento,
                    persona.Documento,
                    persona.dni,
                    persona.Dni,
                    nested.documento,
                    nested.Documento
                ),
                fechaNacimiento: fecha ? String(fecha).split('T')[0] : '',
                email: pick(persona.email, persona.Email, nested.email, nested.Email),
                telefono: pick(
                    persona.telefono,
                    persona.Telefono,
                    nested.telefono,
                    nested.Telefono
                ),
                direccion: pick(
                    persona.direccion,
                    persona.Direccion,
                    nested.direccion,
                    nested.Direccion
                ),
                categoria: data.categoria ?? data.Categoria ?? 0,
                becadoEnard: data.becadoEnard ?? data.BecadoEnard ?? false,
                becadoSdn: data.becadoSdn ?? data.BecadoSdn ?? false,
                montoBeca: data.montoBeca ?? data.MontoBeca ?? 0,
                presentoAptoMedico: data.presentoAptoMedico ?? data.PresentoAptoMedico ?? false,
                estadoPago: data.estadoPago ?? data.EstadoPago ?? 0,
                perteneceSeleccion: data.perteneceSeleccion ?? data.PerteneceSeleccion ?? false,
                sexo: sexo || 1,
            });

            if (athleteId) {
                try {
                    const relaciones = await api.get('/AtletaTutor');
                    const relacion = (Array.isArray(relaciones) ? relaciones : []).find((r) => {
                        const relAtletaId = Number(
                            r.idAtleta ?? r.IdAtleta ?? r.participanteId ?? r.ParticipanteId
                        );
                        return relAtletaId === Number(athleteId);
                    });

                    if (relacion) {
                        try {
                            const idTutor = relacion.idTutor ?? relacion.IdTutor;
                            const personaTutor = await api.get(`/Persona/${idTutor}`);

                            setTutorData({
                                documento:
                                    personaTutor.documento ||
                                    personaTutor.Documento ||
                                    '',
                                nombre: personaTutor.nombre || personaTutor.Nombre || '',
                                apellido:
                                    personaTutor.apellido || personaTutor.Apellido || '',
                                telefono:
                                    personaTutor.telefono || personaTutor.Telefono || '',
                                email: personaTutor.email || personaTutor.Email || '',
                                parentesco:
                                    relacion.parentesco ?? relacion.Parentesco ?? 0,
                                existe: true,
                                idPersona: idTutor,
                            });
                        } catch (detailError) {
                            console.error('Error fetching tutor details inside form:', detailError);
                        }
                    }
                } catch (error) {
                    console.log('Error buscando relaciones de tutor:', error);
                }
            }
        } catch (error) {
            console.error('Error cargando atleta:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Error al cargar los datos del atleta.',
                type: 'danger',
                shouldNavigate: true
            });
        }
    };

    const buscarTutor = async (documento) => {
        if (!documento || documento.length < 7) {
            setTutorData(prev => ({ ...prev, documento, nombre: '', apellido: '', telefono: '', email: '', existe: false, idPersona: null }));
            return;
        }
        try {
            const persona = await api.get(`/Persona/documento/${documento}`, { silentErrors: true });
            setTutorData({
                documento,
                nombre: persona.nombre || '',
                apellido: persona.apellido || '',
                telefono: persona.telefono || '',
                email: persona.email || '',
                parentesco: 0,
                existe: true,
                idPersona: persona.idPersona,
            });
        } catch (error) {
            setTutorData(prev => ({ ...prev, documento, nombre: '', apellido: '', telefono: '', email: '', existe: false, idPersona: null }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'categoria' ? parseInt(value) || value : value),
        }));
        clearFieldError(name);
    };

    const handleTutorChange = (e) => {
        const { name, value } = e.target;
        clearFieldError(`tutor${name.charAt(0).toUpperCase()}${name.slice(1)}`);
        setTutorData(prev => ({ ...prev, [name]: name === 'parentesco' ? parseInt(value) : value }));
        if (name === 'documento') {
            if (window.tutorSearchTimeout) clearTimeout(window.tutorSearchTimeout);
            window.tutorSearchTimeout = setTimeout(() => buscarTutor(value), 500);
        }
    };

    const clubId = user?.idClub ?? user?.clubId ?? user?.IdClub ?? null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearFieldErrors();

        const clientErrors = validateRequiredFields(formData, {
            nombre: 'El nombre es obligatorio.',
            apellido: 'El apellido es obligatorio.',
            documento: 'El documento es obligatorio.',
            fechaNacimiento: 'La fecha de nacimiento es obligatoria.',
            sexo: 'Seleccioná el sexo.',
        });
        if (esMenor) {
            Object.assign(clientErrors, validateRequiredFields(
                {
                    tutorDocumento: tutorData.documento,
                    tutorNombre: tutorData.nombre,
                    tutorApellido: tutorData.apellido,
                },
                {
                    tutorDocumento: 'El documento del tutor es obligatorio.',
                    tutorNombre: 'El nombre del tutor es obligatorio.',
                    tutorApellido: 'El apellido del tutor es obligatorio.',
                }
            ));
        }
        if (Object.keys(clientErrors).length) {
            applyErrors(clientErrors);
            trackFormOutcome({
                entity: 'Atleta',
                outcome: 'validation_error',
                errors: clientErrors,
                fieldLabels: {
                    nombre: 'Nombre',
                    apellido: 'Apellido',
                    documento: 'DNI',
                    fechaNacimiento: 'Fecha de nacimiento',
                    sexo: 'Sexo',
                    tutorDocumento: 'DNI tutor',
                    tutorNombre: 'Nombre tutor',
                    tutorApellido: 'Apellido tutor',
                },
                context: { clubId, documento: formData.documento || null, esEdicion: Boolean(id) },
                modulo: 'Atletas',
            });
            return;
        }

        setLoading(true);

        trackFormOutcome({
            entity: 'Atleta',
            outcome: 'attempt',
            message: 'Club intenta guardar/cargar atleta',
            context: { documento: formData.documento || null, clubId, esEdicion: Boolean(id) },
            modulo: 'Atletas',
        });

        try {
            if (!clubId) {
                throw new Error('No se pudo determinar el club de la sesión. Cerrá sesión y volvé a ingresar.');
            }

            // Preparar el payload atómico
            const payload = {
                personaAtleta: {
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    documento: formData.documento,
                    fechaNacimiento: formData.fechaNacimiento,
                    sexoId: parseInt(formData.sexo),
                    email: formData.email || "",
                    telefono: formData.telefono || "",
                    direccion: formData.direccion || ""
                },
                datosDeportivos: {
                    participanteId: id ? parseInt(id, 10) : 0,
                    idClub: Number(clubId),
                    categoria: parseInt(formData.categoria) || 0,
                    becadoEnard: formData.becadoEnard,
                    becadoSdn: formData.becadoSdn,
                    montoBeca: parseFloat(formData.montoBeca) || 0,
                    presentoAptoMedico: formData.presentoAptoMedico,
                    estadoPago: parseInt(formData.estadoPago),
                    perteneceSeleccion: formData.perteneceSeleccion,
                    fechaAptoMedico: null
                },
                esMenor: esMenor,
                tutorFederacion: esMenor && tutorData.documento ? {
                    idPersonaTutor: tutorData.idPersona,
                    personaTutor: !tutorData.existe ? {
                        nombre: tutorData.nombre,
                        apellido: tutorData.apellido,
                        documento: tutorData.documento,
                        fechaNacimiento: new Date(new Date().setFullYear(new Date().getFullYear() - 30)).toISOString(),
                        email: tutorData.email || "",
                        telefono: tutorData.telefono || "",
                        direccion: ""
                    } : null,
                    parentesco: parseInt(tutorData.parentesco)
                } : null
            };

            console.log('🚀 Enviando registro atómico:', payload);
            
            // Usamos el nuevo endpoint atómico
            await api.post('/Atleta/full', payload);

            trackFormOutcome({
                entity: 'Atleta',
                outcome: 'ok',
                message: 'Atleta enviado a revisión federativa',
                context: { documento: formData.documento || null, clubId, esEdicion: Boolean(id) },
                modulo: 'Atletas',
            });
            setModalConfig({
                isOpen: true,
                title: 'Éxito',
                message: 'Atleta enviado a revisión federativa. Quedará pendiente hasta que la federación lo apruebe.',
                type: 'success',
                shouldNavigate: true
            });
        } catch (error) {
            console.error('Error guardando:', error);
            trackFormOutcome({
                entity: 'Atleta',
                outcome: 'error',
                message: error.message || 'Error al guardar atleta',
                context: {
                    documento: formData.documento || null,
                    clubId,
                    endpoint: error.endpoint || '/Atleta/full',
                    httpStatus: error.status ?? null,
                },
                modulo: 'Atletas',
            });
            const mapped = mapApiFieldErrorsWithTutor(error);
            if (Object.keys(mapped).length) {
                applyErrors(mapped);
            } else {
                setModalConfig({
                    isOpen: true,
                    title: 'Error al guardar',
                    message: error.message || 'Error al procesar la solicitud. Revisa la consola.',
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
                    <Button variant="ghost" size="sm" onClick={() => navigate('/club/atletas')}>
                        <ArrowLeft size={18} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Atleta' : 'Nuevo Atleta'}</h2>
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
                            <select name="sexo" value={formData.sexo} onChange={handleChange} className={`form-input ${fieldErrors.sexo ? 'error' : ''}`}>
                                <option value={1}>Masculino</option>
                                <option value={2}>Femenino</option>
                            </select>
                            <FieldError message={fieldErrors.sexo} />
                        </div>
                        <div className="form-group">
                            <label>Email {esMenor && '(opcional - se usará el del tutor si está vacío)'}</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className={`form-input ${fieldErrors.email ? 'error' : ''}`} />
                            <FieldError message={fieldErrors.email} />
                        </div>
                        <div className="form-group">
                            <label>Teléfono {esMenor && '(opcional - se usará el del tutor si está vacío)'}</label>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className={`form-input ${fieldErrors.telefono ? 'error' : ''}`} />
                            <FieldError message={fieldErrors.telefono} />
                        </div>
                        <div className="form-group">
                            <label>Dirección</label>
                            <input name="direccion" value={formData.direccion} onChange={handleChange} className={`form-input ${fieldErrors.direccion ? 'error' : ''}`} />
                            <FieldError message={fieldErrors.direccion} />
                        </div>

                        {esMenor && (
                            <>
                                <h3 className="form-section-title">Datos del Tutor (Menor de 18 años)</h3>
                                <div className="form-group">
                                    <label>Documento del Tutor *</label>
                                    <input
                                        id="tutorDocumento"
                                        name="documento"
                                        value={tutorData.documento}
                                        onChange={handleTutorChange}
                                        className={`form-input ${fieldErrors.tutorDocumento ? 'error' : ''}`}
                                        aria-invalid={!!fieldErrors.tutorDocumento}
                                        placeholder="Buscar por documento..."
                                    />
                                    <FieldError message={fieldErrors.tutorDocumento} />
                                    {tutorData.existe && <small className="form-hint" style={{ color: 'var(--success)' }}>✓ Tutor encontrado en el sistema</small>}
                                </div>
                                <div className="form-group">
                                    <label>Nombre del Tutor *</label>
                                    <input
                                        id="tutorNombre"
                                        name="nombre"
                                        value={tutorData.nombre}
                                        onChange={handleTutorChange}
                                        className={`form-input ${fieldErrors.tutorNombre ? 'error' : ''}`}
                                        aria-invalid={!!fieldErrors.tutorNombre}
                                        disabled={tutorData.existe}
                                    />
                                    <FieldError message={fieldErrors.tutorNombre} />
                                </div>
                                <div className="form-group">
                                    <label>Apellido del Tutor *</label>
                                    <input
                                        id="tutorApellido"
                                        name="apellido"
                                        value={tutorData.apellido}
                                        onChange={handleTutorChange}
                                        className={`form-input ${fieldErrors.tutorApellido ? 'error' : ''}`}
                                        aria-invalid={!!fieldErrors.tutorApellido}
                                        disabled={tutorData.existe}
                                    />
                                    <FieldError message={fieldErrors.tutorApellido} />
                                </div>
                                <div className="form-group">
                                    <label>Parentesco *</label>
                                    <select id="tutorParentesco" name="parentesco" value={tutorData.parentesco} onChange={handleTutorChange} className={`form-input ${fieldErrors.tutorParentesco ? 'error' : ''}`}>
                                        {Object.entries(PARENTESCO_MAP).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                    <FieldError message={fieldErrors.tutorParentesco} />
                                </div>
                                <div className="form-group">
                                    <label>Teléfono del Tutor</label>
                                    <input
                                        id="tutorTelefono"
                                        name="telefono"
                                        value={tutorData.telefono}
                                        onChange={handleTutorChange}
                                        className={`form-input ${fieldErrors.tutorTelefono ? 'error' : ''}`}
                                        disabled={tutorData.existe}
                                    />
                                    <FieldError message={fieldErrors.tutorTelefono} />
                                </div>
                                <div className="form-group">
                                    <label>Email del Tutor</label>
                                    <input
                                        id="tutorEmail"
                                        type="email"
                                        name="email"
                                        value={tutorData.email}
                                        onChange={handleTutorChange}
                                        className={`form-input ${fieldErrors.tutorEmail ? 'error' : ''}`}
                                        disabled={tutorData.existe}
                                    />
                                    <FieldError message={fieldErrors.tutorEmail} />
                                </div>
                            </>
                        )}

                        <h3 className="form-section-title">Datos Deportivos</h3>
                        <div className="form-group">
                            <label>Club</label>
                            <input
                                value={user?.clubNombre || (clubId ? `Club ID: ${clubId}` : 'Club no detectado en la sesión')}
                                className="form-input"
                                disabled
                            />
                            <small className="form-hint">
                                {clubId
                                    ? 'El atleta se registrará automáticamente en tu club'
                                    : 'Error: reiniciá sesión; no hay club asociado al usuario'}
                            </small>
                        </div>
                        <div className="form-group">
                            <label>Categoría</label>
                            <select name="categoria" value={formData.categoria} onChange={handleChange} className="form-input">
                                {Object.entries(CATEGORIA_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group checkbox-group">
                            <input type="checkbox" name="presentoAptoMedico" checked={formData.presentoAptoMedico} onChange={handleChange} id="apto" />
                            <label htmlFor="apto">Presentó Apto Médico</label>
                        </div>
                        <div className="form-group checkbox-group">
                            <input type="checkbox" name="perteneceSeleccion" checked={formData.perteneceSeleccion} onChange={handleChange} id="seleccion" />
                            <label htmlFor="seleccion">Pertenece a Selección</label>
                        </div>
                        <div className="form-group">
                            <label>Estado de Pago (Matrícula)</label>
                            <select name="estadoPago" value={formData.estadoPago} onChange={handleChange} className="form-input">
                                <option value="0">Adeudado (Pendiente)</option>
                                <option value="1">Abonado (Pagado)</option>
                                <option value="2">Vencido</option>
                                <option value="3">Parcial</option>
                            </select>
                        </div>

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
                            <input type="number" name="montoBeca" value={formData.montoBeca} onChange={handleChange} className={`form-input ${fieldErrors.montoBeca ? 'error' : ''}`} />
                            <FieldError message={fieldErrors.montoBeca} />
                        </div>
                    </div>
                    <div className="form-actions">
                        <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/club/atletas')}>Cancelar</Button>
                        <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                            <Save size={16} /> {id ? 'Actualizar' : 'Guardar'} Atleta
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

export default ClubAtletasForm;
