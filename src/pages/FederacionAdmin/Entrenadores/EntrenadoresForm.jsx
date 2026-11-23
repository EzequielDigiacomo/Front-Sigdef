import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { withFederationScope, getClubId } from '../../../utils/apiHelpers';
import { ArrowLeft, Save } from 'lucide-react';
import { CATEGORIA_MAP, SEXO_MAP } from '../../../utils/enums';
import { validateRequiredFields } from '../../../utils/formFieldErrors';
import useFormFieldErrors from '../../../hooks/useFormFieldErrors';
import FieldError from '../../../components/forms/FieldError';
import FormErrorsBanner from '../../../components/forms/FormErrorsBanner';
import AtletaPendingPhotos, {
    emptyAtletaPendingPhotos,
    uploadPendingAtletaPhotos,
    formatPhotosUploadNote,
} from '../../../components/forms/AtletaPendingPhotos';
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
    licencia: 'Licencia',
    categoriaSeleccion: 'Categoría de selección',
    montoBeca: 'Monto de beca',
};

const resolveSexoId = (value) => {
    if (value == null || value === '') return 1;
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    if (typeof value === 'object') {
        return resolveSexoId(value.id ?? value.Id ?? value.sexoId ?? value.SexoId);
    }
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const EntrenadoresForm = () => {
    const { id, fedId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [clubes, setClubes] = useState([]);

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',
        sexo: 1,
        idClub: '',
        licencia: '',
        perteneceSeleccion: false,
        categoriaSeleccion: '0',
        becadoEnard: false,
        becadoSdn: false,
        montoBeca: '',
        presentoAptoMedico: false,
    });

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        shouldNavigate: false,
    });
    const [pendingPhotos, setPendingPhotos] = useState(emptyAtletaPendingPhotos);

    const {
        fieldErrors,
        clearFieldError,
        clearFieldErrors,
        applyApiError,
        applyErrors,
        hasFieldErrors,
    } = useFormFieldErrors(FIELD_LABELS);

    const listPath = fedId
        ? `/superadmin/federacion/${fedId}/entrenadores`
        : '/dashboard/entrenadores';

    const handleNavigateBack = () => {
        if (location.state?.returnPath) {
            navigate(location.state.returnPath);
        } else {
            navigate(listPath);
        }
    };

    const handleModalClose = () => {
        const shouldNav = modalConfig.shouldNavigate;
        setModalConfig((prev) => ({ ...prev, isOpen: false, shouldNavigate: false }));
        if (shouldNav) {
            handleNavigateBack();
        }
    };

    useEffect(() => {
        loadClubes();
        if (id) {
            const prefill = location.state?.entrenador;
            if (prefill) {
                const nombreCompleto = (prefill.nombrePersona || '').trim();
                const parts = nombreCompleto.split(/\s+/);
                setFormData((prev) => ({
                    ...prev,
                    nombre: prefill.nombre || parts[0] || prev.nombre,
                    apellido:
                        prefill.apellido ||
                        (parts.length > 1 ? parts.slice(1).join(' ') : prev.apellido),
                    documento: prefill.documento || prev.documento,
                    email: prefill.email || prev.email,
                    telefono: prefill.telefono || prev.telefono,
                    idClub: getClubId(prefill) ?? prev.idClub,
                    licencia: prefill.licencia || prefill.Licencia || prev.licencia,
                    perteneceSeleccion: !!(
                        prefill.perteneceSeleccion ??
                        prefill.PerteneceSeleccion ??
                        prev.perteneceSeleccion
                    ),
                    categoriaSeleccion: String(
                        prefill.categoriaSeleccion ??
                            prefill.CategoriaSeleccion ??
                            prev.categoriaSeleccion ??
                            '0'
                    ),
                    becadoEnard: !!(prefill.becadoEnard ?? prefill.BecadoEnard),
                    becadoSdn: !!(prefill.becadoSdn ?? prefill.BecadoSdn),
                    montoBeca:
                        prefill.montoBeca != null
                            ? String(prefill.montoBeca)
                            : prev.montoBeca,
                    presentoAptoMedico: !!(
                        prefill.presentoAptoMedico ?? prefill.PresentoAptoMedico
                    ),
                }));
            }
            loadEntrenador();
        }
    }, [id, fedId]);

    const loadClubes = async () => {
        try {
            const data = await api.get(withFederationScope('/Clubes', fedId)).catch(() =>
                api.get(withFederationScope('/Club', fedId))
            );
            setClubes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error cargando clubes:', error);
        }
    };

    const loadEntrenador = async () => {
        try {
            const data = await api.get(`/Entrenador/${id}`);
            const participante = data.participante || data.Participante || {};
            let personaExtra = {};
            try {
                personaExtra = await api.get(`/Persona/${id}`);
            } catch {
                /* opcional */
            }

            const sexoRaw =
                personaExtra.sexoId ??
                personaExtra.SexoId ??
                personaExtra.sexo ??
                personaExtra.Sexo ??
                participante.sexo ??
                1;

            const fecha =
                participante.fechaNacimiento ||
                participante.FechaNacimiento ||
                personaExtra.fechaNacimiento ||
                personaExtra.FechaNacimiento ||
                '';

            setFormData({
                nombre:
                    participante.nombre ||
                    participante.Nombre ||
                    personaExtra.nombre ||
                    personaExtra.Nombre ||
                    '',
                apellido:
                    participante.apellido ||
                    participante.Apellido ||
                    personaExtra.apellido ||
                    personaExtra.Apellido ||
                    '',
                documento:
                    participante.documento ||
                    participante.Documento ||
                    personaExtra.documento ||
                    personaExtra.Documento ||
                    '',
                sexo: resolveSexoId(sexoRaw),
                fechaNacimiento: fecha ? String(fecha).split('T')[0] : '',
                email:
                    participante.email ||
                    participante.Email ||
                    personaExtra.email ||
                    personaExtra.Email ||
                    '',
                telefono:
                    participante.telefono ||
                    participante.Telefono ||
                    personaExtra.telefono ||
                    personaExtra.Telefono ||
                    '',
                direccion:
                    participante.direccion ||
                    participante.Direccion ||
                    personaExtra.direccion ||
                    personaExtra.Direccion ||
                    '',
                idClub: getClubId(data) ?? '',
                licencia: data.licencia || data.Licencia || '',
                perteneceSeleccion: !!(data.perteneceSeleccion ?? data.PerteneceSeleccion),
                categoriaSeleccion: String(
                    data.categoriaSeleccion ?? data.CategoriaSeleccion ?? '0'
                ),
                becadoEnard: !!(data.becadoEnard ?? data.BecadoEnard),
                becadoSdn: !!(data.becadoSdn ?? data.BecadoSdn),
                montoBeca: String(data.montoBeca ?? data.MontoBeca ?? ''),
                presentoAptoMedico: !!(data.presentoAptoMedico ?? data.PresentoAptoMedico),
            });
        } catch (error) {
            console.error('Error cargando entrenador:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Error al cargar los datos del entrenador.',
                type: 'danger',
                shouldNavigate: true,
            });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        clearFieldError(name);
    };

    const buildPersonaPayload = () => ({
        nombre: formData.nombre,
        apellido: formData.apellido,
        documento: formData.documento,
        fechaNacimiento: formData.fechaNacimiento
            ? new Date(formData.fechaNacimiento).toISOString()
            : new Date().toISOString(),
        email: formData.email || '',
        telefono: formData.telefono || '',
        direccion: formData.direccion || '',
        sexoId: resolveSexoId(formData.sexo),
    });

    const buildEntrenadorPayload = (participanteId) => {
        const clubId =
            formData.idClub && formData.idClub !== '0' && formData.idClub !== ''
                ? parseInt(formData.idClub, 10)
                : null;

        return {
            participanteId,
            ParticipanteId: participanteId,
            idPersona: participanteId,
            idClub: Number.isFinite(clubId) ? clubId : null,
            licencia: formData.licencia || '',
            perteneceSeleccion: Boolean(formData.perteneceSeleccion),
            categoriaSeleccion: formData.perteneceSeleccion
                ? String(formData.categoriaSeleccion || '0')
                : '0',
            becadoEnard: Boolean(formData.becadoEnard),
            becadoSdn: Boolean(formData.becadoSdn),
            montoBeca: parseFloat(formData.montoBeca) || 0,
            presentoAptoMedico: Boolean(formData.presentoAptoMedico),
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearFieldErrors();

        const clientErrors = validateRequiredFields(formData, {
            nombre: 'El nombre es obligatorio.',
            apellido: 'El apellido es obligatorio.',
            documento: 'El documento es obligatorio.',
            sexo: 'Seleccioná el sexo.',
        });
        if (Object.keys(clientErrors).length) {
            applyErrors(clientErrors);
            return;
        }

        setLoading(true);

        try {
            const personaPayload = buildPersonaPayload();

            let idPersona = id ? parseInt(id, 10) : null;

            if (id) {
                await api.put(`/Persona/${id}`, personaPayload);
                await api.put(`/Entrenador/${id}`, buildEntrenadorPayload(idPersona));
            } else {
                try {
                    const personaExistente = await api.get(
                        `/Persona/documento/${formData.documento}`,
                        { silentErrors: true }
                    );
                    const existingId =
                        personaExistente?.participanteId ||
                        personaExistente?.ParticipanteId ||
                        personaExistente?.idPersona;
                    if (existingId) {
                        idPersona = existingId;
                        await api.put(`/Persona/${idPersona}`, personaPayload);
                    }
                } catch {
                    /* crear nueva */
                }

                if (!idPersona) {
                    const personaResponse = await api.post('/Persona', personaPayload);
                    idPersona =
                        personaResponse.participanteId ||
                        personaResponse.ParticipanteId ||
                        personaResponse.idPersona ||
                        personaResponse.IdPersona;
                }

                if (!idPersona) {
                    throw new Error('No se pudo obtener el ID de la persona');
                }

                await api.post('/Entrenador', buildEntrenadorPayload(parseInt(idPersona, 10)));
            }

            const photosNote = idPersona
                ? formatPhotosUploadNote(
                    await uploadPendingAtletaPhotos(idPersona, pendingPhotos)
                )
                : '';

            setModalConfig({
                isOpen: true,
                title: 'Éxito',
                message: `${id
                    ? 'Entrenador actualizado correctamente.'
                    : 'Entrenador creado correctamente.'}${photosNote}`,
                type: 'success',
                shouldNavigate: true,
            });
        } catch (error) {
            console.error('Error guardando:', error);
            const mapped = applyApiError(error);
            if (!Object.keys(mapped).length) {
                setModalConfig({
                    isOpen: true,
                    title: 'Error',
                    message: error.message || 'Error al guardar el entrenador.',
                    type: 'danger',
                    shouldNavigate: false,
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
                    <h2 className="page-title">
                        {id ? 'Editar Entrenador' : 'Nuevo Entrenador'}
                    </h2>
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
                                {Object.entries(SEXO_MAP)
                                    .filter(([key]) => key === '1' || key === '2')
                                    .map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
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

                        <AtletaPendingPhotos
                            value={pendingPhotos}
                            onChange={setPendingPhotos}
                            forceAllowImages
                            entityLabel="entrenador"
                        />

                        <h3 className="form-section-title">Club</h3>
                        <div className="form-group">
                            <label>Club</label>
                            <select
                                name="idClub"
                                value={formData.idClub}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.idClub ? 'error' : ''}`}
                            >
                                <option value="">Sin club</option>
                                {clubes.map((club) => {
                                    const clubOptId = getClubId(club, { allowBareId: true });
                                    return (
                                    <option
                                        key={clubOptId}
                                        value={clubOptId}
                                    >
                                        {club.nombre || club.Nombre}
                                    </option>
                                    );
                                })}
                            </select>
                            <FieldError message={fieldErrors.idClub} />
                        </div>
                        <div className="form-group">
                            <label>Licencia</label>
                            <input
                                name="licencia"
                                value={formData.licencia}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.licencia ? 'error' : ''}`}
                                maxLength={50}
                            />
                            <FieldError message={fieldErrors.licencia} />
                        </div>

                        <h3 className="form-section-title">Selección</h3>
                        <div className="form-group checkbox-group">
                            <input
                                type="checkbox"
                                name="perteneceSeleccion"
                                checked={formData.perteneceSeleccion}
                                onChange={handleChange}
                                id="seleccion"
                            />
                            <label htmlFor="seleccion">
                                Pertenece a Selección
                            </label>
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
                                    <option value="0">Sin asignar</option>
                                    {Object.entries(CATEGORIA_MAP).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={fieldErrors.categoriaSeleccion} />
                            </div>
                        )}

                        <h3 className="form-section-title">Becas y apto</h3>
                        <div className="form-group checkbox-group">
                            <input
                                type="checkbox"
                                name="becadoEnard"
                                checked={formData.becadoEnard}
                                onChange={handleChange}
                                id="enard"
                            />
                            <label htmlFor="enard">
                                Becado ENARD
                            </label>
                        </div>
                        <div className="form-group checkbox-group">
                            <input
                                type="checkbox"
                                name="becadoSdn"
                                checked={formData.becadoSdn}
                                onChange={handleChange}
                                id="sdn"
                            />
                            <label htmlFor="sdn">
                                Becado SDN
                            </label>
                        </div>
                        <div className="form-group">
                            <label>Monto Beca</label>
                            <input
                                type="text"
                                name="montoBeca"
                                value={formData.montoBeca}
                                onChange={handleChange}
                                className={`form-input ${fieldErrors.montoBeca ? 'error' : ''}`}
                                inputMode="decimal"
                            />
                            <FieldError message={fieldErrors.montoBeca} />
                        </div>
                        <div className="form-group checkbox-group">
                            <input
                                type="checkbox"
                                name="presentoAptoMedico"
                                checked={formData.presentoAptoMedico}
                                onChange={handleChange}
                                id="apto"
                            />
                            <label htmlFor="apto">
                                Presentó Apto Médico
                            </label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" size="sm" onClick={handleNavigateBack}>
                            Cancelar
                        </Button>
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

export default EntrenadoresForm;
