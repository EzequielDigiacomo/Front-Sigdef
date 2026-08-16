import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { withFederationScope } from '../../../utils/apiHelpers';
import { canAccessDashboardClub, extractPlanFromUser } from '../../../utils/planHelpers';
import { toFriendlyErrorMessage } from '../../../utils/friendlyError';
import '../../../styles/CompactForm.css';

const pickPersonaId = (p) =>
    p?.participanteId ?? p?.ParticipanteId ?? p?.idPersona ?? p?.IdPersona ?? p?.id ?? p?.Id ?? null;

const mapPersonaToForm = (persona) => ({
    nombre: persona.nombre || persona.Nombre || '',
    apellido: persona.apellido || persona.Apellido || '',
    documento: persona.documento || persona.Documento || persona.dni || persona.Dni || '',
    sexo: persona.sexoId ?? persona.SexoId ?? persona.sexo?.id ?? persona.Sexo?.Id ?? persona.sexo ?? persona.Sexo ?? 1,
    fechaNacimiento: String(persona.fechaNacimiento || persona.FechaNacimiento || '').split('T')[0],
    email: persona.email || persona.Email || '',
    telefono: persona.telefono || persona.Telefono || '',
    direccion: persona.direccion || persona.Direccion || '',
});

const DelegadosForm = () => {
    const { id, fedId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const clubLoginAllowed = canAccessDashboardClub(extractPlanFromUser(user) || user?.plan);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [personaFound, setPersonaFound] = useState(false);
    const [participanteId, setParticipanteId] = useState(null);
    const [clubes, setClubes] = useState([]);
    const [federacionNombre, setFederacionNombre] = useState('');
    const searchTimer = useRef(null);
    const lastSearchedDoc = useRef('');

    const goBack = () => {
        if (location.state?.returnPath) {
            navigate(location.state.returnPath);
            return;
        }
        if (fedId) {
            navigate(`/superadmin/federacion/${fedId}/delegados`);
            return;
        }
        navigate('/dashboard/delegados');
    };

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        sexo: 1,
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',
        idRol: 3,
        idClub: '',
        idFederacion: user?.idFederacion || 1,
    });

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        shouldNavigate: false,
    });

    useEffect(() => {
        loadClubes();
        loadFederacion();
        if (id) loadDelegado();
    }, [id, fedId]);

    useEffect(() => {
        if (location.state?.clubId) {
            setFormData((prev) => ({ ...prev, idClub: location.state.clubId }));
        }
    }, [location.state]);

    useEffect(() => () => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
    }, []);

    const loadDelegado = async () => {
        setLoading(true);
        try {
            const data = await api.get('/Auth/usuarios');
            const found = data.find((u) => String(u.id || u.idPersona || u.IdPersona) === String(id));
            if (found) {
                setFormData((prev) => ({
                    ...prev,
                    nombre: found.nombre || found.nombrePersona || '',
                    apellido: found.apellido || found.apellidoPersona || '',
                    documento: found.dni || found.documento || '',
                    email: found.email || '',
                    telefono: found.telefono || '',
                    idClub: found.clubId || found.idClub || '',
                    idFederacion: found.federacionId || found.idFederacion || prev.idFederacion,
                }));
                setParticipanteId(found.participanteId || found.ParticipanteId || null);
            }
        } catch (error) {
            showModal('Error', 'No se pudieron cargar los datos del delegado.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const loadFederacion = async () => {
        try {
            const effectiveFedId = fedId || user?.idFederacion;
            if (!effectiveFedId) return;
            const data = await api.get(`/Federaciones/${effectiveFedId}`);
            setFederacionNombre(data?.nombre || data?.Nombre || `Federación ID ${effectiveFedId}`);
            setFormData((prev) => ({ ...prev, idFederacion: parseInt(effectiveFedId, 10) }));
        } catch (error) {
            console.error('Error cargando federación:', error);
        }
    };

    const loadClubes = async () => {
        try {
            const effectiveFedId = fedId || user?.idFederacion;
            const data = await api.get(withFederationScope('/Clubes', effectiveFedId));
            setClubes(data || []);
        } catch (error) {
            showModal('Error', 'No se pudieron cargar los clubes.', 'danger');
        }
    };

    const showModal = (title, message, type = 'info', shouldNavigate = false) => {
        setModalConfig({ isOpen: true, title, message, type, shouldNavigate });
    };

    const handleModalClose = () => {
        const shouldNav = modalConfig.shouldNavigate;
        setModalConfig((prev) => ({ ...prev, isOpen: false, shouldNavigate: false }));
        if (shouldNav) goBack();
    };

    const applyPersona = (persona, { notify = true } = {}) => {
        const mapped = mapPersonaToForm(persona);
        const pid = pickPersonaId(persona);
        setFormData((prev) => ({
            ...prev,
            ...mapped,
            documento: mapped.documento || prev.documento,
            sexo: Number(mapped.sexo) || 1,
        }));
        setParticipanteId(pid);
        setPersonaFound(true);
        if (notify) {
            showModal(
                'Persona encontrada',
                'Se autocompletaron los datos. Podés asignarla como delegado aunque ya sea entrenador.',
                'success'
            );
        }
    };

    const clearPersonaLink = () => {
        setPersonaFound(false);
        setParticipanteId(null);
    };

    const buscarPersonaPorDni = async (docOverride, { notify = true } = {}) => {
        const documento = String(docOverride ?? formData.documento ?? '').replace(/\D/g, '').trim();
        if (documento.length < 7) {
            if (notify) showModal('DNI incompleto', 'Ingresá al menos 7 dígitos del DNI.', 'info');
            return null;
        }
        if (documento === lastSearchedDoc.current && personaFound) return participanteId;

        setSearching(true);
        try {
            let persona = null;
            try {
                persona = await api.get(`/Persona/documento/${encodeURIComponent(documento)}`, {
                    silentErrors: true,
                });
            } catch {
                persona = null;
            }

            // Fallback: buscar en entrenadores (misma persona, otro rol)
            if (!persona) {
                try {
                    const entrenadores = await api.get('/Entrenador', { silentErrors: true });
                    const list = Array.isArray(entrenadores) ? entrenadores : [];
                    const match = list.find((e) => {
                        const doc = String(e.documento || e.Documento || '').replace(/\D/g, '');
                        return doc === documento;
                    });
                    if (match) {
                        const nombreParts = String(match.nombrePersona || match.NombrePersona || '')
                            .trim()
                            .split(/\s+/);
                        persona = {
                            participanteId: match.participanteId ?? match.ParticipanteId ?? match.idPersona ?? match.IdPersona,
                            nombre: match.nombre || match.Nombre || nombreParts[0] || '',
                            apellido:
                                match.apellido ||
                                match.Apellido ||
                                (nombreParts.length > 1 ? nombreParts.slice(1).join(' ') : ''),
                            documento: match.documento || match.Documento || documento,
                            email: match.email || match.Email || '',
                            telefono: match.telefono || match.Telefono || '',
                            direccion: match.direccion || match.Direccion || '',
                            sexo: match.sexoId ?? match.SexoId ?? 1,
                            fechaNacimiento: match.fechaNacimiento || match.FechaNacimiento || '',
                        };
                    }
                } catch {
                    /* sin fallback */
                }
            }

            if (persona) {
                lastSearchedDoc.current = documento;
                applyPersona(persona, { notify });
                return pickPersonaId(persona);
            }

            clearPersonaLink();
            lastSearchedDoc.current = documento;
            if (notify) {
                showModal(
                    'Persona nueva',
                    'No hay persona con ese DNI. Completá los datos para crearla como delegado.',
                    'info'
                );
            }
            return null;
        } finally {
            setSearching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'documento') {
            clearPersonaLink();
            lastSearchedDoc.current = '';
            if (searchTimer.current) clearTimeout(searchTimer.current);
            const digits = String(value || '').replace(/\D/g, '');
            if (digits.length >= 7) {
                searchTimer.current = setTimeout(() => {
                    buscarPersonaPorDni(digits, { notify: false });
                }, 450);
            }
        }
    };

    const ensurePersona = async () => {
        let pid = participanteId;
        if (!pid) {
            pid = await buscarPersonaPorDni(formData.documento, { notify: false });
        }

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

        if (pid) {
            try {
                await api.put(`/Persona/${pid}`, personaPayload);
            } catch {
                // Si falla el update, seguimos con el id conocido
            }
            return pid;
        }

        const created = await api.post('/Persona', personaPayload);
        pid = pickPersonaId(created);
        if (!pid) throw new Error('No se pudo crear la persona.');
        setParticipanteId(pid);
        setPersonaFound(true);
        return pid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!id && !clubLoginAllowed) {
            showModal(
                'Plan insuficiente',
                'Tu plan no incluye login Club / delegados. Actualizá a Profesional o superior.',
                'danger'
            );
            return;
        }

        if (!formData.idClub) {
            showModal(
                'Club requerido',
                'Para crear el login de delegado tenés que seleccionar un club.',
                'danger'
            );
            return;
        }

        setLoading(true);
        try {
            // 1) Persona (reutiliza entrenador u otra ficha existente por DNI)
            const pid = await ensurePersona();

            // 2) Login Club (reutiliza usuario si el DNI/username ya existe)
            const userPayload = {
                username: formData.documento,
                password: formData.documento,
                email: formData.email || `${formData.documento}@sigdef.local`,
                rol: 'Club',
                rolFederacion: 'Club',
                clubId: parseInt(formData.idClub, 10),
                federacionId: parseInt(formData.idFederacion, 10) || undefined,
                nombre: formData.nombre,
                apellido: formData.apellido,
                dni: formData.documento,
                telefono: formData.telefono,
            };

            if (id) {
                await api.put(`/Auth/usuarios/${id}/perfil`, {
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    telefono: formData.telefono,
                    dni: formData.documento,
                    email: formData.email || undefined,
                });
            } else {
                await api.post('/Auth/register', userPayload);
            }

            // 3) Ficha DelegadoClub (permite coexistir con Entrenador)
            try {
                await api.post('/DelegadoClub', {
                    participanteId: pid,
                    ParticipanteId: pid,
                    idRol: parseInt(formData.idRol, 10) || 3,
                    idFederacion: parseInt(formData.idFederacion, 10) || null,
                    idClub: parseInt(formData.idClub, 10) || null,
                });
            } catch (err) {
                const msg = String(err?.message || '').toLowerCase();
                if (!msg.includes('ya figura como delegado') && !msg.includes('ya es delegado')) {
                    // No bloquear si el login ya quedó: avisar
                    console.warn('DelegadoClub:', err);
                }
            }

            showModal(
                'Éxito',
                personaFound || pid
                    ? 'Delegado guardado. La persona puede ser entrenador y delegado a la vez.'
                    : 'Delegado guardado correctamente.',
                'success',
                true
            );
        } catch (error) {
            console.error('Error guardando delegado:', error);
            showModal('Error', toFriendlyErrorMessage(error, {
                fallback: 'No se pudo guardar el delegado. Revisá los datos e intentá nuevamente.',
            }), 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container compact-form">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Button variant="ghost" size="sm" onClick={goBack}>
                        <ArrowLeft size={18} />
                    </Button>
                    <h2 className="page-title">Crear / Asignar Delegado</h2>
                </div>
            </div>

            {!id && !clubLoginAllowed && (
                <Card className="compact-form-card" style={{ marginBottom: '1rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-danger, #b91c1c)' }}>
                        El plan Esencial no incluye dashboard/login Club. Actualizá a Profesional o Ecosistema para crear delegados.
                    </p>
                </Card>
            )}

            <Card className="compact-form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <h3 className="form-section-title">Datos de la Persona</h3>

                        <div className="form-group">
                            <label>DNI *</label>
                            <div className="form-inline">
                                <input
                                    type="text"
                                    name="documento"
                                    value={formData.documento}
                                    onChange={handleChange}
                                    onBlur={() => buscarPersonaPorDni(undefined, { notify: !personaFound })}
                                    className="form-input"
                                    required
                                    autoComplete="off"
                                    placeholder="Al escribir se busca automáticamente"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => buscarPersonaPorDni()}
                                    title="Buscar por DNI"
                                    disabled={searching}
                                >
                                    {searching ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                                </Button>
                            </div>
                            {personaFound && (
                                <small className="form-hint" style={{ color: 'var(--primary, #3b82f6)' }}>
                                    Persona existente encontrada (puede ser entrenador y también delegado).
                                </small>
                            )}
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

                        <h3 className="form-section-title">Datos del Delegado</h3>

                        <div className="form-group">
                            <label>Club *</label>
                            <select
                                name="idClub"
                                value={formData.idClub}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                <option value="">-- Seleccionar club --</option>
                                {clubes.map((club) => (
                                    <option key={club.idClub} value={club.idClub}>
                                        {club.nombre} ({club.siglas})
                                    </option>
                                ))}
                            </select>
                            <small className="form-hint">Obligatorio para el login del panel del club.</small>
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
                                disabled
                            >
                                <option value={3}>Delegado Club</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" size="sm" onClick={goBack}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={loading}
                            disabled={!id && !clubLoginAllowed}
                            icon={Save}
                        >
                            Guardar Delegado
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
                confirmText="Entendido"
                showCancel={false}
                type={modalConfig.type}
            />
        </div>
    );
};

export default DelegadosForm;
