import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import { trackFormOutcome } from '../../../services/auditClient';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import { ArrowLeft, Save, CheckCircle, XCircle } from 'lucide-react';
import { CATEGORIA_MAP, PARENTESCO_MAP, SEXO_MAP } from '../../../utils/enums';
import { getCategoryByAge } from '../../../utils/categoryConfig';
import { validateRequiredFields, mapApiFieldErrorsWithTutor } from '../../../utils/formFieldErrors';
import useFormFieldErrors from '../../../hooks/useFormFieldErrors';
import FieldError from '../../../components/forms/FieldError';
import FormErrorsBanner from '../../../components/forms/FormErrorsBanner';
import AtletaPendingPhotos, {
    emptyAtletaPendingPhotos,
    uploadPendingAtletaPhotos,
    formatPhotosUploadNote,
} from '../../../components/forms/AtletaPendingPhotos';
import './Atletas.css';
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
    idClub: 'Club',
    categoria: 'Categoría',
    estadoPago: 'Estado de pago',
    montoBeca: 'Monto de beca',
    fechaVencimientoApto: 'Vencimiento apto médico',
    tutorDocumento: 'Documento del tutor',
    tutorNombre: 'Nombre del tutor',
    tutorApellido: 'Apellido del tutor',
    tutorParentesco: 'Parentesco',
    tutorTelefono: 'Teléfono del tutor',
    tutorEmail: 'Email del tutor',
};

const getParticipanteId = (data) =>
    data?.participanteId ?? data?.ParticipanteId ?? data?.idPersona ?? data?.IdPersona ?? null;

const AtletasForm = () => {
    const { id, fedId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [clubes, setClubes] = useState([]);
    const [esMenor, setEsMenor] = useState(false);
    const [tutorLater, setTutorLater] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        sexo: 1,
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',
        idClub: '',
        categoria: 0,
        becadoEnard: false,
        becadoSdn: false,
        montoBeca: 0,
        presentoAptoMedico: false,
        fechaVencimientoApto: '',
        estadoPago: 0,
        perteneceSeleccion: false
    });

    const [tutorData, setTutorData] = useState({
        documento: '',
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        parentesco: 0,
        existe: false,
        idPersona: null
    });

    const [tutorSearchStatus, setTutorSearchStatus] = useState('idle'); // idle, loading, found, not_found
    const [pendingPhotos, setPendingPhotos] = useState(emptyAtletaPendingPhotos);

    const [resultModal, setResultModal] = useState({
        open: false,
        type: 'success',
        title: '',
        message: ''
    });

    const {
        fieldErrors,
        clearFieldError,
        clearFieldErrors,
        applyErrors,
        hasFieldErrors,
    } = useFormFieldErrors(FIELD_LABELS);

    useEffect(() => {
        loadClubes();
        if (id) {
            loadAtleta();
            // Fetch tutor data if exists
            const fetchTutor = async () => {
                try {
                    const relRes = await api.get('/AtletaTutor');
                    const atletaId = parseInt(id, 10);
                    const relacion = (Array.isArray(relRes) ? relRes : []).find((r) => {
                        const relAtletaId = Number(
                            r.idAtleta ?? r.IdAtleta ?? r.participanteId ?? r.ParticipanteId
                        );
                        return relAtletaId === atletaId;
                    });
                    if (relacion) {
                        const idTutor = relacion.idTutor ?? relacion.IdTutor;
                        const tutorRes = await api.get(`/Persona/${idTutor}`);
                        setTutorData({
                            documento: tutorRes.documento ?? tutorRes.Documento ?? '',
                            nombre: tutorRes.nombre ?? tutorRes.Nombre ?? '',
                            apellido: tutorRes.apellido ?? tutorRes.Apellido ?? '',
                            telefono: tutorRes.telefono ?? tutorRes.Telefono ?? '',
                            email: tutorRes.email ?? tutorRes.Email ?? '',
                            parentesco: relacion.parentesco ?? relacion.Parentesco ?? relacion.idParentesco ?? 0,
                            existe: true,
                            idPersona: idTutor
                        });
                        setTutorLater(false);
                    }
                } catch (e) { console.log("No tutor found or error fetching", e); }
            };
            fetchTutor();

        } else if (location.state?.clubId) {
            setFormData(prev => ({ ...prev, idClub: location.state.clubId }));
        }
    }, [id, location.state]);

    useEffect(() => {
        if (formData.fechaNacimiento) {
            const edad = calcularEdad(formData.fechaNacimiento);
            setEsMenor(edad < 18);

            // Auto-assign category based on age
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

    const loadClubes = async () => {
        try {
            const data = await api.get('/Club');
            setClubes(data);
        } catch (error) {
            console.error('Error cargando clubes:', error);
        }
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
            const p = personaRes || nested;

            const pick = (...vals) => {
                for (const v of vals) {
                    if (v != null && String(v).trim() !== '') return v;
                }
                return '';
            };

            const fecha =
                p.fechaNacimiento ||
                p.FechaNacimiento ||
                nested.fechaNacimiento ||
                nested.FechaNacimiento ||
                '';

            const sexoRaw =
                p.sexoId ??
                p.SexoId ??
                p.sexo ??
                p.Sexo ??
                nested.sexoId ??
                nested.Sexo ??
                1;
            const sexo =
                typeof sexoRaw === 'object'
                    ? sexoRaw.id ?? sexoRaw.Id ?? 1
                    : sexoRaw;

            setFormData({
                nombre: pick(p.nombre, p.Nombre, nested.nombre, nested.Nombre),
                apellido: pick(p.apellido, p.Apellido, nested.apellido, nested.Apellido),
                documento: pick(
                    p.documento,
                    p.Documento,
                    p.dni,
                    p.Dni,
                    nested.documento,
                    nested.Documento
                ),
                sexo: sexo || 1,
                fechaNacimiento: fecha ? String(fecha).split('T')[0] : '',
                email: pick(p.email, p.Email, nested.email, nested.Email),
                telefono: pick(p.telefono, p.Telefono, nested.telefono, nested.Telefono),
                direccion: pick(p.direccion, p.Direccion, nested.direccion, nested.Direccion),

                idClub: data.idClub ?? data.IdClub ?? '',
                categoria: data.categoria ?? data.Categoria ?? 0,
                becadoEnard: data.becadoEnard ?? data.BecadoEnard ?? false,
                becadoSdn: data.becadoSdn ?? data.BecadoSdn ?? false,
                montoBeca: data.montoBeca ?? data.MontoBeca ?? 0,
                presentoAptoMedico: data.presentoAptoMedico ?? data.PresentoAptoMedico ?? false,
                fechaVencimientoApto: (data.fechaVencimientoApto ?? data.FechaVencimientoApto)
                    ? String(data.fechaVencimientoApto ?? data.FechaVencimientoApto).slice(0, 10)
                    : '',
                estadoPago: data.estadoPago ?? data.EstadoPago ?? 0,
                perteneceSeleccion: data.perteneceSeleccion ?? data.PerteneceSeleccion ?? false,
            });
        } catch (error) {
            console.error('Error cargando atleta:', error);
        }
    };

    const buscarTutor = async (documentoRaw) => {
        const documento = documentoRaw ? documentoRaw.replace(/[\s.]/g, '') : '';
        if (!documento || documento.length < 7) {
            setTutorData(prev => ({ ...prev, documento, nombre: '', apellido: '', telefono: '', email: '', existe: false, idPersona: null }));
            setTutorSearchStatus('idle');
            return;
        }

        setTutorSearchStatus('loading');
        try {
            // Intenta búsqueda directa
            const persona = await api.get(`/Persona/documento/${documento}`, { silentErrors: true });

            setTutorData(prev => ({
                ...prev,
                documento,
                nombre: persona.nombre || persona.Nombre || '',
                apellido: persona.apellido || persona.Apellido || '',
                telefono: persona.telefono || persona.Telefono || '',
                email: persona.email || persona.Email || '',
                existe: true,
                idPersona: getParticipanteId(persona)
            }));
            setTutorSearchStatus('found');
        } catch (error) {
            console.warn("Búsqueda directa falló, intentando búsqueda general...", error);
            try {
                // Fallback: Buscar en todas las personas
                const allPersonas = await api.get('/Persona', { silentErrors: true });
                if (Array.isArray(allPersonas)) {
                    const found = allPersonas.find(p =>
                        (p.documento && p.documento.replace(/[\s.]/g, '') === documento) ||
                        (p.Documento && p.Documento.replace(/[\s.]/g, '') === documento)
                    );

                    if (found) {
                        console.log("✅ Persona encontrada en búsqueda general:", found);
                        setTutorData(prev => ({
                            ...prev,
                            documento,
                            nombre: found.nombre || found.Nombre || '',
                            apellido: found.apellido || found.Apellido || '',
                            telefono: found.telefono || found.Telefono || '',
                            email: found.email || found.Email || '',
                            existe: true,
                            idPersona: getParticipanteId(found)
                        }));
                        setTutorSearchStatus('found');
                        return; // Éxito en fallback
                    }
                }
            } catch (fallbackError) {
                console.error("Falló también la búsqueda general", fallbackError);
            }

            // Si falla todo
            setTutorData(prev => ({ ...prev, documento, nombre: '', apellido: '', telefono: '', email: '', existe: false, idPersona: null }));
            setTutorSearchStatus('not_found');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (['categoria', 'idClub', 'sexo'].includes(name) ? parseInt(value) || value : (name === 'documento' ? value.replace(/[\s.]/g, '') : value))
        }));
        clearFieldError(name);
    };

    const handleTutorChange = (e) => {
        const { name, value } = e.target;
        clearFieldError(`tutor${name.charAt(0).toUpperCase()}${name.slice(1)}`);
        const sanitizedValue = name === 'documento' ? value.replace(/[\s.]/g, '') : value;

        setTutorData(prev => ({ ...prev, [name]: name === 'parentesco' ? parseInt(value) : sanitizedValue }));

        if (name === 'documento') {
            if (window.tutorSearchTimeout) clearTimeout(window.tutorSearchTimeout);
            window.tutorSearchTimeout = setTimeout(() => buscarTutor(sanitizedValue), 500);
        }
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
        });
        if (esMenor && !tutorLater) {
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
                context: { documento: formData.documento || null, atletaId: id || null, federacionScope: fedId || null },
                modulo: 'Atletas',
            });
            return;
        }

        setLoading(true);

        trackFormOutcome({
            entity: 'Atleta',
            outcome: 'attempt',
            message: id ? 'Federación edita atleta' : 'Federación crea/carga atleta',
            context: { documento: formData.documento || null, atletaId: id || null, federacionScope: fedId || null },
            modulo: 'Atletas',
        });

        try {
            let idPersona;

            const emailInput = formData.email || (esMenor && !tutorLater && tutorData.email ? tutorData.email : null);
            const telefonoInput = formData.telefono || (esMenor && !tutorLater && tutorData.telefono ? tutorData.telefono : null);

            const emailFinal = emailInput === "" ? null : emailInput;
            const telefonoFinal = telefonoInput === "" ? null : telefonoInput;
            const direccionFinal = formData.direccion === "" ? null : formData.direccion;

            const fechaNacimientoISO = formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : new Date().toISOString();

            const personaPayload = {
                Nombre: formData.nombre,
                Apellido: formData.apellido,
                Documento: formData.documento,
                SexoId: parseInt(formData.sexo),
                FechaNacimiento: fechaNacimientoISO,
                Email: emailFinal,
                Telefono: telefonoFinal,
                Direccion: direccionFinal
            };

            const getDatosDeportivos = (participanteId = 0) => ({
                ParticipanteId: participanteId,
                IdClub: formData.idClub ? parseInt(formData.idClub) : null,
                Categoria: parseInt(formData.categoria) || 0,
                BecadoEnard: formData.becadoEnard,
                BecadoSdn: formData.becadoSdn,
                MontoBeca: parseFloat(formData.montoBeca) || 0,
                PresentoAptoMedico: formData.presentoAptoMedico,
                FechaVencimientoApto: formData.fechaVencimientoApto || null,
                EstadoPago: parseInt(formData.estadoPago),
                PerteneceSeleccion: formData.perteneceSeleccion,
                FechaAptoMedico: null
            });

            const getAtletaPayload = (participanteId) => getDatosDeportivos(participanteId);

            if (id) {

                await api.put(`/Persona/${id}`, personaPayload);
                await api.put(`/Atleta/${id}`, getAtletaPayload(parseInt(id)));
                idPersona = parseInt(id);
            } else {
                const fullPayload = {
                    PersonaAtleta: personaPayload,
                    DatosDeportivos: getDatosDeportivos(0),
                    EsMenor: esMenor,
                    TutorFederacion: (esMenor && !tutorLater && tutorData.documento) ? {
                        IdPersonaTutor: tutorData.idPersona || null,
                        PersonaTutor: tutorData.idPersona ? null : {
                            Nombre: tutorData.nombre,
                            Apellido: tutorData.apellido,
                            Documento: tutorData.documento.replace(/[\s.]/g, ''),
                            SexoId: 1,
                            FechaNacimiento: new Date('1980-01-01').toISOString(),
                            Email: tutorData.email || '',
                            Telefono: tutorData.telefono || '',
                            Direccion: ''
                        },
                        Parentesco: parseInt(tutorData.parentesco) || 0
                    } : null
                };

                const atletaResponse = await api.post('/Atleta/full', fullPayload);
                idPersona = getParticipanteId(atletaResponse) ?? atletaResponse?.participanteId ?? atletaResponse?.ParticipanteId;
                if (!idPersona) {
                    throw new Error('No se pudo obtener el ID del atleta creado.');
                }
            }

            // Tutor ya procesado en /Atleta/full para altas nuevas; solo flujo manual en edición
            if (id && esMenor && !tutorLater && tutorData.documento) {
                let idTutorPersona = tutorData.idPersona;
                const sanitizedTutorDni = tutorData.documento.replace(/[\s.]/g, '');

                if (!idTutorPersona) {
                    try {
                        let found = null;
                        try {
                            found = await api.get(`/Persona/documento/${sanitizedTutorDni}`, { silentErrors: true });
                        } catch (e) {
                            const all = await api.get('/Persona', { silentErrors: true });
                            if (Array.isArray(all)) {
                                found = all.find(p => (p.documento || p.Documento || '').replace(/[\s.]/g, '') === sanitizedTutorDni);
                            }
                        }

                        if (found) {
                            idTutorPersona = getParticipanteId(found);
                        } else {
                            const tutorPersonaPayload = {
                                Nombre: tutorData.nombre,
                                Apellido: tutorData.apellido,
                                Documento: sanitizedTutorDni,
                                Sexo: 1,
                                FechaNacimiento: new Date('1980-01-01').toISOString(),
                                Email: tutorData.email || "",
                                Telefono: tutorData.telefono || "",
                                Direccion: ""
                            };
                            const res = await api.post('/Persona', tutorPersonaPayload);
                            idTutorPersona = getParticipanteId(res);
                        }
                    } catch (err) {
                        console.error("Error asegurando persona del tutor:", err);
                    }
                }

                if (idTutorPersona) {
                    try {
                        await api.get(`/Tutor/${idTutorPersona}`, { silentErrors: true });
                    } catch (e) {
                        const tutorRolePayload = {
                            ParticipanteId: idTutorPersona,
                            TipoTutor: PARENTESCO_MAP[tutorData.parentesco] || 'Padre/Madre'
                        };
                        await api.post('/Tutor', tutorRolePayload);
                    }

                    try {
                        const relRes = await api.get('/AtletaTutor');
                        const existingRel = Array.isArray(relRes)
                            ? relRes.find(r => (getParticipanteId(r) ?? r.idAtleta ?? r.IdAtleta) === idPersona)
                            : null;

                        const relPayload = {
                            ParticipanteId: idPersona,
                            IdTutor: idTutorPersona,
                            Parentesco: parseInt(tutorData.parentesco)
                        };

                        if (existingRel) {
                            const idRel = existingRel.idAtletaTutor ?? existingRel.IdAtletaTutor;
                            if (idRel) await api.delete(`/AtletaTutor/${idRel}`);
                        }
                        await api.post('/AtletaTutor', relPayload);
                    } catch (err) {
                        console.error("Error vinculando tutor:", err);
                    }
                }
            }

            let photosNote = '';
            if (idPersona) {
                photosNote = formatPhotosUploadNote(
                    await uploadPendingAtletaPhotos(idPersona, pendingPhotos)
                );
            }

            trackFormOutcome({
                entity: 'Atleta',
                outcome: 'ok',
                message: 'El atleta ha sido guardado correctamente.',
                context: { documento: formData.documento || null, atletaId: id || null, federacionScope: fedId || null },
                modulo: 'Atletas',
            });
            setResultModal({
                open: true,
                type: 'success',
                title: '¡Éxito!',
                message: `El atleta ha sido guardado correctamente.${photosNote}`
            });
        } catch (error) {
            console.error('Error guardando:', error);
            trackFormOutcome({
                entity: 'Atleta',
                outcome: 'error',
                message: error.message || 'Error al guardar atleta',
                context: {
                    documento: formData.documento || null,
                    atletaId: id || null,
                    endpoint: error.endpoint || (id ? `/Atleta/${id}` : '/Atleta/full'),
                    httpStatus: error.status ?? null,
                },
                modulo: 'Atletas',
            });
            const mapped = mapApiFieldErrorsWithTutor(error);
            if (Object.keys(mapped).length) {
                applyErrors(mapped);
            } else {
                setResultModal({
                    open: true,
                    type: 'error',
                    title: 'Error',
                    message: `Hubo un problema al guardar: ${error.message || 'Error desconocido'}`
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCloseResultModal = () => {
        const wasSuccess = resultModal.type === 'success';
        setResultModal((prev) => ({ ...prev, open: false }));
        if (wasSuccess) {
            if (location.state?.returnPath) {
                navigate(location.state.returnPath);
            } else if (fedId) {
                navigate(`/superadmin/federacion/${fedId}/atletas`);
            } else {
                navigate('/dashboard/atletas');
            }
        }
    };

    const handleCancel = () => {
        if (location.state?.returnPath) {
            navigate(location.state.returnPath);
        } else if (fedId) {
            navigate(`/superadmin/federacion/${fedId}/atletas`);
        } else {
            navigate('/dashboard/atletas');
        }
    };

    return (
        <div className="page-container compact-form">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
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
                                {Object.entries(SEXO_MAP)
                                    .filter(([key]) => key === "1" || key === "2")
                                    .map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                            </select>
                            <FieldError message={fieldErrors.sexo} />
                        </div>
                        <div className="form-group">
                            <label>Email {esMenor ? (tutorLater ? '(opcional)' : '(opcional - se usará el del tutor si está vacío)') : ''}</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className={`form-input ${fieldErrors.email ? 'error' : ''}`} />
                            <FieldError message={fieldErrors.email} />
                        </div>
                        <div className="form-group">
                            <label>Teléfono {esMenor ? (tutorLater ? '(opcional)' : '(opcional - se usará el del tutor si está vacío)') : ''}</label>
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
                            forceAllowImages
                            entityLabel="atleta"
                        />

                        {esMenor && (
                            <>
                                <div className="form-section-banner">
                                    <h3 className="form-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Datos del Tutor (Menor de 18 años)</h3>
                                    <label className="checkbox-group" style={{ margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={tutorLater}
                                            onChange={(e) => setTutorLater(e.target.checked)}
                                        />
                                        {id ? 'Editar/Ver tutor' : 'Crear tutor más tarde'}
                                    </label>
                                </div>

                                {id && tutorLater && (
                                    <p className="form-hint full-width">
                                        Desmarcar para editar o asignar tutor.
                                    </p>
                                )}

                                {!tutorLater && (
                                    <>
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
                                            <div className="form-hint" style={{ minHeight: '1.1rem' }}>
                                                {tutorSearchStatus === 'loading' && <span>Buscando...</span>}
                                                {tutorSearchStatus === 'found' && <span style={{ color: 'var(--success)' }}>Persona encontrada, datos precargados.</span>}
                                                {tutorSearchStatus === 'not_found' && <span>No existe ese DNI registrado, complete los datos.</span>}
                                            </div>
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
                            </>
                        )}

                        <h3 className="form-section-title">Datos Deportivos</h3>

                        <div className="form-group">
                            <label>Club</label>
                            <select name="idClub" value={formData.idClub} onChange={handleChange} className={`form-input ${fieldErrors.idClub ? 'error' : ''}`}>
                                <option value="">Sin Asignar (Agente Libre)</option>
                                {clubes.map(club => (
                                    <option key={club.idClub} value={club.idClub}>{club.nombre}</option>
                                ))}
                            </select>
                            <FieldError message={fieldErrors.idClub} />
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

                        <div className="form-group checkbox-group">
                            <input type="checkbox" name="presentoAptoMedico" checked={formData.presentoAptoMedico} onChange={handleChange} id="apto" />
                            <label htmlFor="apto">Presentó Apto Médico</label>
                        </div>
                        <div className="form-group">
                            <label>Vencimiento apto médico</label>
                            <input
                                type="date"
                                name="fechaVencimientoApto"
                                value={formData.fechaVencimientoApto}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.fechaVencimientoApto ? 'error' : ''}`}
                            />
                            <FieldError message={fieldErrors.fechaVencimientoApto} />
                        </div>

                        <div className="form-group checkbox-group">
                            <input type="checkbox" name="perteneceSeleccion" checked={formData.perteneceSeleccion} onChange={handleChange} id="seleccion" />
                            <label htmlFor="seleccion">Pertenece a Selección</label>
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
                        <Button type="button" variant="secondary" size="sm" onClick={handleCancel}>Cancelar</Button>
                        <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                            <Save size={16} /> Guardar Atleta
                        </Button>
                    </div>
                </form>
            </Card>

            <Modal
                isOpen={resultModal.open}
                onClose={handleCloseResultModal}
                title={resultModal.title}
                footer={
                    <Button onClick={handleCloseResultModal} variant={resultModal.type === 'success' ? 'primary' : 'danger'}>
                        Entendido
                    </Button>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem', textAlign: 'center' }}>
                    {resultModal.type === 'success' ? (
                        <CheckCircle size={48} color="var(--success)" />
                    ) : (
                        <XCircle size={48} color="var(--danger)" />
                    )}
                    <p style={{ fontSize: '1.1rem' }}>{resultModal.message}</p>
                </div>
            </Modal>
        </div>
    );
};

export default AtletasForm;
