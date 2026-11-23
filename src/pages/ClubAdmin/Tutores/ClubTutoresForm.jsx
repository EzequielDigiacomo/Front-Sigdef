import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save } from 'lucide-react';
import { PARENTESCO_MAP } from '../../../utils/enums';
import './ClubTutoresForm.css';
import { validateRequiredFields } from '../../../utils/formFieldErrors';
import useFormFieldErrors from '../../../hooks/useFormFieldErrors';
import FieldError from '../../../components/forms/FieldError';
import FormErrorsBanner from '../../../components/forms/FormErrorsBanner';
import { toUserFacingErrorMessage } from '../../../utils/friendlyError';
import '../../../styles/CompactForm.css';

const FIELD_LABELS = {
    nombre: 'Nombre',
    apellido: 'Apellido',
    documento: 'Documento',
    fechaNacimiento: 'Fecha de nacimiento',
    sexo: 'Sexo',
    tipoTutor: 'Tipo de tutor',
    email: 'Email',
    telefono: 'Teléfono',
    direccion: 'Dirección',
};

const ClubTutoresForm = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [atletas, setAtletas] = useState([]);
    const [selectedAtletaId, setSelectedAtletaId] = useState(
        () => searchParams.get('atletaId') || ''
    );
    const [busquedaAtleta, setBusquedaAtleta] = useState('');

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',

        tipoTutor: 0,
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

    const handleModalClose = () => {
        const shouldNav = modalConfig.shouldNavigate;
        setModalConfig((prev) => ({ ...prev, isOpen: false, shouldNavigate: false }));
        if (shouldNav) {
            navigate('/club/tutores');
        }
    };

    useEffect(() => {
        if (id) loadTutor();
        fetchAtletas();
    }, [id]);

    const fetchAtletas = async () => {
        try {
            const clubId = user?.IdClub || user?.idClub || user?.club?.id || user?.clubId;
            if (!clubId) {
                console.error('No se pudo identificar el Club ID');
                return;
            }

            const preselectedAtletaId = searchParams.get('atletaId') || selectedAtletaId;

            const [allAtletas, allRelaciones] = await Promise.all([
                api.get('/Atleta').catch(() => []),
                api.get('/AtletaTutor').catch(() => []),
            ]);

            const getAtletaId = (a) =>
                a.idPersona ?? a.IdPersona ?? a.participanteId ?? a.ParticipanteId;
            const getRelAtletaId = (r) =>
                r.idAtleta ?? r.IdAtleta ?? r.participanteId ?? r.ParticipanteId;

            const atletasConTutorIds = new Set(
                (Array.isArray(allRelaciones) ? allRelaciones : [])
                    .map((r) => Number(getRelAtletaId(r)))
                    .filter((n) => Number.isFinite(n))
            );

            const atletasDisponibles = (Array.isArray(allAtletas) ? allAtletas : [])
                .filter((a) => {
                    const aClubId = a.idClub || a.clubId || a.IdClub;
                    return aClubId && String(aClubId) === String(clubId);
                })
                .map((a) => {
                    const idPersona = Number(getAtletaId(a));
                    const persona = a.participante || a.Participante || {};
                    const nombreFromPersona =
                        persona.nombre || persona.Nombre
                            ? `${persona.nombre || persona.Nombre} ${
                                  persona.apellido || persona.Apellido || ''
                              }`.trim()
                            : '';
                    return {
                        ...a,
                        idPersona,
                        nombrePersona:
                            a.nombrePersona ||
                            a.NombrePersona ||
                            nombreFromPersona ||
                            'Sin Nombre',
                        documento:
                            a.documento ||
                            a.Documento ||
                            persona.documento ||
                            persona.Documento ||
                            persona.dni ||
                            persona.Dni ||
                            '-',
                    };
                })
                .filter(
                    (a) =>
                        !atletasConTutorIds.has(a.idPersona) ||
                        String(a.idPersona) === String(preselectedAtletaId)
                );

            setAtletas(atletasDisponibles);
            if (preselectedAtletaId) {
                setSelectedAtletaId(String(preselectedAtletaId));
            }
        } catch (error) {
            console.error('Error cargando atletas:', error);
        }
    };

    const loadTutor = async () => {
        try {
            const [data, personaRes] = await Promise.all([
                api.get(`/Tutor/${id}`),
                api.get(`/Persona/${id}`).catch(() => null),
            ]);

            const nested =
                data.participante || data.Participante || data.persona || data.Persona || {};
            const persona = personaRes || nested;

            const tipoRaw = data.tipoTutor || data.TipoTutor || '';
            const parentescoKey = Object.keys(PARENTESCO_MAP).find(
                (key) => PARENTESCO_MAP[key] === tipoRaw
            );

            const fecha =
                persona.fechaNacimiento ||
                persona.FechaNacimiento ||
                nested.fechaNacimiento ||
                nested.FechaNacimiento ||
                '';

            setFormData({
                nombre: persona.nombre || persona.Nombre || nested.nombre || nested.Nombre || '',
                apellido:
                    persona.apellido ||
                    persona.Apellido ||
                    nested.apellido ||
                    nested.Apellido ||
                    '',
                documento:
                    persona.documento ||
                    persona.Documento ||
                    persona.dni ||
                    persona.Dni ||
                    nested.documento ||
                    nested.Documento ||
                    data.documento ||
                    '',
                fechaNacimiento: fecha ? String(fecha).split('T')[0] : '',
                email: persona.email || persona.Email || nested.email || nested.Email || '',
                telefono:
                    persona.telefono ||
                    persona.Telefono ||
                    nested.telefono ||
                    nested.Telefono ||
                    '',
                direccion:
                    persona.direccion ||
                    persona.Direccion ||
                    nested.direccion ||
                    nested.Direccion ||
                    '',
                tipoTutor: parentescoKey ? parseInt(parentescoKey, 10) : 0,
                sexo:
                    persona.sexoId ??
                    persona.SexoId ??
                    persona.sexo ??
                    persona.Sexo ??
                    nested.sexo ??
                    1,
            });
        } catch (error) {
            console.error('Error cargando tutor:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Error al cargar los datos del tutor',
                type: 'danger',
                shouldNavigate: true
            });
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'select-one' ? parseInt(value) : value
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
            sexo: 'Seleccioná el sexo.',
            tipoTutor: 'Seleccioná el tipo de tutor.',
        });
        if (Object.keys(clientErrors).length) {
            applyErrors(clientErrors);
            return;
        }

        setLoading(true);

        try {

            const fechaNacimientoISO = formData.fechaNacimiento
                ? new Date(formData.fechaNacimiento).toISOString()
                : new Date().toISOString();

            const personaPayload = {
                nombre: formData.nombre,
                apellido: formData.apellido,
                documento: formData.documento,
                fechaNacimiento: fechaNacimientoISO,
                email: formData.email || "",
                telefono: formData.telefono || "",
                direccion: formData.direccion || "",
                sexoId: parseInt(formData.sexo)
            };

            const buildTutorPayload = (personaId) => ({
                participanteId: personaId,
                ParticipanteId: personaId,
                idPersona: personaId,
                tipoTutor: PARENTESCO_MAP[formData.tipoTutor] || 'Padre',
                TipoTutor: PARENTESCO_MAP[formData.tipoTutor] || 'Padre',
            });

            let idPersona = null;

            if (id) {

                await api.put(`/Persona/${id}`, personaPayload);
                idPersona = parseInt(id, 10);
                await api.put(`/Tutor/${id}`, buildTutorPayload(idPersona));

            } else {

                let personaExistente = null;

                try {
                    console.log(`🔍 Buscando persona con DNI ${formData.documento}...`);
                    personaExistente = await api.get(`/Persona/documento/${formData.documento}`, {
                        silentErrors: true
                    });

                    if (personaExistente && personaExistente.idPersona) {
                        idPersona = personaExistente.idPersona;
                        console.log('✅ Persona encontrada con ID:', idPersona);

                        try {
                            const tutorExistente = await api.get(`/Tutor/${idPersona}`);
                            console.log('⚠️ Persona ya es tutor, actualizando...');

                            await api.put(`/Persona/${idPersona}`, personaPayload);
                            await api.put(`/Tutor/${idPersona}`, buildTutorPayload(idPersona));

                        } catch (tutorError) {

                            if (personaExistente.tipoPersona && personaExistente.tipoPersona !== 'Persona Base') {
                                throw new Error(`Esta persona ya tiene el rol de: ${personaExistente.tipoPersona}. No se puede asignar como tutor.`);
                            }

                            console.log('➕ Persona existe pero no es tutor, creando tutor...');
                            await api.put(`/Persona/${idPersona}`, personaPayload);
                            await api.post('/Tutor', buildTutorPayload(idPersona));
                        }
                    }
                } catch (searchError) {

                    console.log('ℹ️ Persona no encontrada, se creará nueva');

                }

                if (!idPersona) {
                    console.log('➕ Creando nueva persona...');
                    const nuevaPersona = await api.post('/Persona', personaPayload);
                    idPersona = nuevaPersona.participanteId || nuevaPersona.ParticipanteId || nuevaPersona.idPersona || nuevaPersona.IdPersona;

                    console.log('➕ Creando tutor...');
                    await api.post('/Tutor', buildTutorPayload(idPersona));
                }
            }

            if (selectedAtletaId) {
                try {
                    console.log(`🔗 Vinculando Tutor ${id || 'nuevo'} con Atleta ${selectedAtletaId}...`);

                    let tutorIdParaVinculo = id ? parseInt(id) : idPersona;

                    if (tutorIdParaVinculo) {
                        await api.post('/AtletaTutor', {
                            ParticipanteId: parseInt(selectedAtletaId, 10),
                            participanteId: parseInt(selectedAtletaId, 10),
                            IdTutor: tutorIdParaVinculo,
                            idTutor: tutorIdParaVinculo,
                            Parentesco: parseInt(formData.tipoTutor, 10),
                            parentesco: parseInt(formData.tipoTutor, 10),
                        });
                        console.log('✅ Vinculación exitosa');
                    }
                } catch (linkError) {
                    console.error('Error al vincular atleta:', linkError);
                }
            }

            setModalConfig({
                isOpen: true,
                title: 'Éxito',
                message: 'Tutor guardado exitosamente!',
                type: 'success',
                shouldNavigate: true
            });
        } catch (error) {
            console.error('Error guardando:', error);

            const mapped = applyApiError(error, {
                parentesco: 'tipoTutor',
                Parentesco: 'tipoTutor',
                TipoTutor: 'tipoTutor',
                ParticipanteId: 'documento',
                participanteId: 'documento',
            });
            if (Object.keys(mapped).length) {
                return;
            }

            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: toUserFacingErrorMessage(error, {
                    role: user?.role,
                    fallback: 'No se pudo guardar el tutor. Revisá los datos e intentá nuevamente.',
                }),
                type: 'danger',
                shouldNavigate: false
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container compact-form">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/club/tutores')}>
                        <ArrowLeft size={18} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Tutor' : 'Nuevo Tutor'}</h2>
                </div>
            </div>

            <Card className="compact-form-card">
                <form onSubmit={handleSubmit} noValidate>
                    {hasFieldErrors && (
                        <FormErrorsBanner errors={fieldErrors} labels={FIELD_LABELS} />
                    )}
                    <div className="form-grid">
                        <h3 className="form-section-title">Datos Personales del Tutor</h3>

                        <div className="form-group">
                            <label>Nombre *</label>
                            <input
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.nombre ? 'error' : ''}`}
                                aria-invalid={!!fieldErrors.nombre}
                            />
                            <FieldError message={fieldErrors.nombre} />
                        </div>
                        <div className="form-group">
                            <label>Apellido *</label>
                            <input
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.apellido ? 'error' : ''}`}
                                aria-invalid={!!fieldErrors.apellido}
                            />
                            <FieldError message={fieldErrors.apellido} />
                        </div>
                        <div className="form-group">
                            <label>Documento *</label>
                            <input
                                name="documento"
                                value={formData.documento}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.documento ? 'error' : ''}`}
                                aria-invalid={!!fieldErrors.documento}
                            />
                            <FieldError message={fieldErrors.documento} />
                        </div>
                        <div className="form-group">
                            <label>Fecha Nacimiento</label>
                            <input
                                type="date"
                                name="fechaNacimiento"
                                value={formData.fechaNacimiento}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.fechaNacimiento ? 'error' : ''}`}
                            />
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
                                <option value={1}>Masculino</option>
                                <option value={2}>Femenino</option>
                            </select>
                            <FieldError message={fieldErrors.sexo} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                            />
                            <FieldError message={fieldErrors.email} />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.telefono ? 'error' : ''}`}
                            />
                            <FieldError message={fieldErrors.telefono} />
                        </div>
                        <div className="form-group">
                            <label>Dirección</label>
                            <input
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.direccion ? 'error' : ''}`}
                            />
                            <FieldError message={fieldErrors.direccion} />
                        </div>

                        <h3 className="form-section-title">Información del Tutor</h3>

                        <div className="form-group">
                            <label>Tipo de Tutor *</label>
                            <select
                                name="tipoTutor"
                                value={formData.tipoTutor}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.tipoTutor ? 'error' : ''}`}
                            >
                                {Object.entries(PARENTESCO_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <FieldError message={fieldErrors.tipoTutor} />
                        </div>

                        <h3 className="form-section-title">Asignar Atleta (Opcional)</h3>
                        <div className="form-group">
                            <label>Buscar Atleta (Nombre o DNI)</label>
                            <input
                                type="text"
                                placeholder="Escribe para filtrar..."
                                value={busquedaAtleta}
                                onChange={(e) => setBusquedaAtleta(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Seleccionar Atleta</label>
                            <select
                                value={selectedAtletaId}
                                onChange={(e) => setSelectedAtletaId(e.target.value)}
                                className="form-input"
                            >
                                <option value="">-- Seleccionar Atleta --</option>
                                {atletas
                                    .filter(a => {
                                        if (!busquedaAtleta) return true;
                                        const search = busquedaAtleta.toLowerCase();
                                        const nombre = (a.nombrePersona || '').toLowerCase();

                                        return nombre.includes(search);
                                    })
                                    .map(atleta => (
                                        <option key={atleta.idPersona} value={atleta.idPersona}>
                                            {atleta.nombrePersona}
                                        </option>
                                    ))
                                }
                            </select>
                            <small className="form-hint">Selecciona un atleta para vincularlo automáticamente a este tutor.</small>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/club/tutores')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                            <Save size={16} /> {id ? 'Actualizar' : 'Guardar'} Tutor
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

export default ClubTutoresForm;
