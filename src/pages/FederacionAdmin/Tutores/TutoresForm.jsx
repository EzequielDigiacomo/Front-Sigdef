import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { PARENTESCO_MAP, SEXO_MAP } from '../../../utils/enums';
import { withFederationScope } from '../../../utils/apiHelpers';
import '../../../styles/CompactForm.css';

const TutoresForm = () => {
    const { id, fedId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [clubes, setClubes] = useState([]);
    const [atletas, setAtletas] = useState([]);
    const [loadingAtletas, setLoadingAtletas] = useState(false);
    const [busquedaAtleta, setBusquedaAtleta] = useState('');

    const [initialLinkedAtletaId, setInitialLinkedAtletaId] = useState('');

    const goBack = () => {
        if (location.state?.returnPath) {
            navigate(location.state.returnPath);
            return;
        }
        if (fedId) {
            navigate(`/superadmin/federacion/${fedId}/tutores`);
            return;
        }
        navigate('/dashboard/tutores');
    };

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',
        sexo: 1,
        tipoTutor: 0,
        idClub: '',
        idAtleta: '',
    });

    useEffect(() => {
        loadClubes();
        if (id) loadTutor();
    }, [id, fedId]);

    useEffect(() => {
        if (formData.idClub) {
            loadAtletasDelClub(formData.idClub, formData.idAtleta);
        } else {
            setAtletas([]);
        }
    }, [formData.idClub]);

    const loadClubes = async () => {
        try {
            const data = await api.get(withFederationScope('/Clubes', fedId)).catch(() =>
                api.get(withFederationScope('/Club', fedId))
            );
            setClubes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error cargando clubes:', error);
            setClubes([]);
        }
    };

    const loadAtletasDelClub = async (clubId, includeAtletaId = null) => {
        setLoadingAtletas(true);
        try {
            const [allAtletas, relaciones] = await Promise.all([
                api.get(withFederationScope('/Atleta', fedId)).catch(() => []),
                api.get(withFederationScope('/AtletaTutor', fedId)).catch(() => []),
            ]);

            const conTutor = new Set(
                (Array.isArray(relaciones) ? relaciones : []).map(
                    (r) => r.idAtleta ?? r.IdAtleta ?? r.participanteId ?? r.ParticipanteId
                )
            );

            const resolveNombre = (a) => {
                const persona = a.participante || a.Participante || a.persona || a.Persona;
                const fromRoot = (a.nombrePersona || a.NombrePersona || '').trim();
                if (fromRoot) return fromRoot;
                if (persona) {
                    const nombre = persona.nombre || persona.Nombre || '';
                    const apellido = persona.apellido || persona.Apellido || '';
                    const full = `${nombre} ${apellido}`.trim();
                    if (full) return full;
                }
                const flat = `${a.nombre || a.Nombre || ''} ${a.apellido || a.Apellido || ''}`.trim();
                return flat || 'Sin nombre';
            };

            const resolveDocumento = (a) => {
                const persona = a.participante || a.Participante || a.persona || a.Persona;
                return (
                    a.documento ||
                    a.Documento ||
                    persona?.documento ||
                    persona?.Documento ||
                    persona?.dni ||
                    persona?.Dni ||
                    ''
                );
            };

            const resolveFechaNacimiento = (a) => {
                const persona = a.participante || a.Participante || a.persona || a.Persona;
                return (
                    a.fechaNacimiento ||
                    a.FechaNacimiento ||
                    persona?.fechaNacimiento ||
                    persona?.FechaNacimiento ||
                    null
                );
            };

            const calcEdad = (fechaNacimiento) => {
                if (!fechaNacimiento) return null;
                const nacimiento = new Date(fechaNacimiento);
                if (Number.isNaN(nacimiento.getTime())) return null;
                const hoy = new Date();
                let edad = hoy.getFullYear() - nacimiento.getFullYear();
                const mes = hoy.getMonth() - nacimiento.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
                return edad;
            };

            const delClub = (Array.isArray(allAtletas) ? allAtletas : [])
                .filter((a) => String(a.idClub ?? a.IdClub ?? a.clubId) === String(clubId))
                .map((a) => {
                    const idPersona =
                        a.idPersona ?? a.IdPersona ?? a.participanteId ?? a.ParticipanteId;
                    const fechaNacimiento = resolveFechaNacimiento(a);
                    const edad = calcEdad(fechaNacimiento);
                    return {
                        idPersona,
                        nombrePersona: resolveNombre(a),
                        documento: resolveDocumento(a),
                        fechaNacimiento,
                        edad,
                        tieneTutor: conTutor.has(idPersona),
                    };
                })
                .filter((a) => a.idPersona)
                .filter(
                    (a) =>
                        (a.edad != null && a.edad < 18) ||
                        String(a.idPersona) === String(includeAtletaId)
                );

            setAtletas(delClub);
        } catch (error) {
            console.error('Error cargando atletas del club:', error);
            setAtletas([]);
        } finally {
            setLoadingAtletas(false);
        }
    };

    const pickFirst = (...vals) => {
        for (const v of vals) {
            if (v != null && String(v).trim() !== '') return v;
        }
        return '';
    };

    const loadTutor = async () => {
        try {
            const [tutorRes, personaRes] = await Promise.all([
                api.get(`/Tutor/${id}`),
                api.get(`/Persona/${id}`).catch(() => null),
            ]);

            const nested =
                tutorRes.participante ||
                tutorRes.Participante ||
                tutorRes.persona ||
                tutorRes.Persona ||
                {};
            const persona = personaRes || nested;

            const tipoRaw = tutorRes.tipoTutor || tutorRes.TipoTutor || '';
            let parentescoKey = Object.keys(PARENTESCO_MAP).find(
                (key) => PARENTESCO_MAP[key] === tipoRaw
            );

            const relaciones = tutorRes.atletasTutores || tutorRes.AtletasTutores || [];
            const primera = relaciones[0];
            const idAtletaLinked = primera
                ? String(
                      primera.participanteId ??
                          primera.ParticipanteId ??
                          primera.idAtleta ??
                          primera.IdAtleta ??
                          ''
                  )
                : '';

            if (primera) {
                const par = primera.parentesco ?? primera.Parentesco;
                if (par != null && PARENTESCO_MAP[par] != null) {
                    parentescoKey = String(par);
                }
            }

            let idClub = '';
            if (idAtletaLinked) {
                try {
                    const atleta = await api.get(`/Atleta/${idAtletaLinked}`);
                    idClub = String(
                        atleta.idClub ??
                            atleta.IdClub ??
                            atleta.club?.idClub ??
                            atleta.Club?.IdClub ??
                            ''
                    );
                } catch (err) {
                    console.warn('No se pudo resolver club del atleta vinculado:', err);
                }

                if (!idClub) {
                    const nombreClub = primera.nombreClub || primera.NombreClub;
                    if (nombreClub) {
                        try {
                            const clubs =
                                clubes.length > 0
                                    ? clubes
                                    : (await api.get(withFederationScope('/Clubes', fedId)).catch(() =>
                                          api.get(withFederationScope('/Club', fedId))
                                      )) || [];
                            const match = (Array.isArray(clubs) ? clubs : []).find(
                                (c) => (c.nombre || c.Nombre) === nombreClub
                            );
                            if (match) idClub = String(match.idClub ?? match.IdClub);
                        } catch {
                            /* ignore */
                        }
                    }
                }
            }

            const fecha =
                persona.fechaNacimiento ||
                persona.FechaNacimiento ||
                nested.fechaNacimiento ||
                nested.FechaNacimiento ||
                '';

            setInitialLinkedAtletaId(idAtletaLinked);
            setFormData({
                nombre: pickFirst(persona.nombre, persona.Nombre, nested.nombre, nested.Nombre),
                apellido: pickFirst(
                    persona.apellido,
                    persona.Apellido,
                    nested.apellido,
                    nested.Apellido
                ),
                documento: pickFirst(
                    persona.documento,
                    persona.Documento,
                    persona.dni,
                    persona.Dni,
                    nested.documento,
                    nested.Documento,
                    tutorRes.documento,
                    tutorRes.Documento
                ),
                fechaNacimiento: fecha ? String(fecha).split('T')[0] : '',
                email: pickFirst(persona.email, persona.Email, nested.email, nested.Email),
                telefono: pickFirst(
                    persona.telefono,
                    persona.Telefono,
                    nested.telefono,
                    nested.Telefono
                ),
                direccion: pickFirst(
                    persona.direccion,
                    persona.Direccion,
                    nested.direccion,
                    nested.Direccion
                ),
                sexo:
                    persona.sexoId ??
                    persona.SexoId ??
                    persona.sexo ??
                    persona.Sexo ??
                    nested.sexoId ??
                    nested.Sexo ??
                    1,
                tipoTutor: parentescoKey != null ? parseInt(parentescoKey, 10) : 0,
                idClub,
                idAtleta: idAtletaLinked,
            });
        } catch (error) {
            console.error('Error cargando tutor:', error);
            alert('No se pudieron cargar los datos del tutor.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'idClub' ? value : value,
            ...(name === 'idClub' ? { idAtleta: '' } : {}),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const fechaNacimientoISO = formData.fechaNacimiento
                ? new Date(formData.fechaNacimiento).toISOString()
                : null;

            const personaPayload = {
                nombre: formData.nombre,
                apellido: formData.apellido,
                documento: formData.documento,
                fechaNacimiento: fechaNacimientoISO,
                email: formData.email || '',
                telefono: formData.telefono || '',
                direccion: formData.direccion || '',
                sexoId: parseInt(formData.sexo, 10) || 1,
            };

            const tipoTutorLabel = PARENTESCO_MAP[formData.tipoTutor] || 'Padre';

            let idPersona = id ? parseInt(id, 10) : null;

            if (id) {
                await api.put(`/Persona/${id}`, personaPayload);
                await api.put(`/Tutor/${id}`, {
                    participanteId: parseInt(id, 10),
                    tipoTutor: tipoTutorLabel,
                });
            } else {
                const personaResponse = await api.post('/Persona', personaPayload);
                idPersona =
                    personaResponse.participanteId ||
                    personaResponse.ParticipanteId ||
                    personaResponse.IdPersona ||
                    personaResponse.idPersona;

                await api.post('/Tutor', {
                    participanteId: idPersona,
                    tipoTutor: tipoTutorLabel,
                });
            }

            if (
                formData.idAtleta &&
                idPersona &&
                String(formData.idAtleta) !== String(initialLinkedAtletaId)
            ) {
                try {
                    await api.post('/AtletaTutor', {
                        ParticipanteId: parseInt(formData.idAtleta, 10),
                        participanteId: parseInt(formData.idAtleta, 10),
                        IdTutor: idPersona,
                        idTutor: idPersona,
                        Parentesco: parseInt(formData.tipoTutor, 10),
                        parentesco: parseInt(formData.tipoTutor, 10),
                    });
                } catch (linkError) {
                    console.error('Error vinculando atleta:', linkError);
                    alert(
                        'Tutor guardado, pero no se pudo vincular al atleta. Podés enlazarlo después desde la lista.'
                    );
                }
            }

            goBack();
        } catch (error) {
            console.error('Error guardando:', error);
            alert('Error al guardar el tutor. Verifica los datos e intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const normalizeDoc = (value) => String(value || '').replace(/[\s.\-]/g, '').toLowerCase();

    const atletasFiltrados = atletas.filter((a) => {
        if (!busquedaAtleta.trim()) return true;
        const q = busquedaAtleta.trim().toLowerCase();
        const qDoc = normalizeDoc(busquedaAtleta);
        const nombre = (a.nombrePersona || '').toLowerCase();
        const documento = normalizeDoc(a.documento);
        return nombre.includes(q) || (qDoc && documento.includes(qDoc));
    });

    const atletaSeleccionado = atletas.find(
        (a) => String(a.idPersona) === String(formData.idAtleta)
    );

    return (
        <div className="page-container compact-form">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Button variant="ghost" size="sm" onClick={goBack}>
                        <ArrowLeft size={18} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Tutor' : 'Nuevo Tutor'}</h2>
                </div>
            </div>

            <Card className="compact-form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <h3 className="form-section-title">Datos Personales</h3>

                        <div className="form-group">
                            <label>Nombre *</label>
                            <input
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
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Documento *</label>
                            <input
                                name="documento"
                                value={formData.documento}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
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
                            <label>Sexo *</label>
                            <select
                                name="sexo"
                                value={formData.sexo}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                {Object.entries(SEXO_MAP)
                                    .filter(([key]) => key === '1' || key === '2')
                                    .map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tipo / Parentesco *</label>
                            <select
                                name="tipoTutor"
                                value={formData.tipoTutor}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                {Object.entries(PARENTESCO_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
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
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Dirección</label>
                            <input
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        <h3 className="form-section-title">Asignación a club</h3>
                        <p className="form-hint full-width">
                            Solo se listan atletas menores de 18 del club elegido. El tutor se vincula a través del atleta.
                        </p>

                        <div className="form-group">
                            <label>Club</label>
                            <select
                                name="idClub"
                                value={formData.idClub}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="">Sin asignar (después)</option>
                                {clubes.map((club) => {
                                    const clubId = club.idClub ?? club.IdClub;
                                    return (
                                        <option key={clubId} value={clubId}>
                                            {club.nombre || club.Nombre}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="athlete-picker">
                            <label>Atleta menor (opcional)</label>

                            {!formData.idClub ? (
                                <p className="athlete-picker-empty">
                                    Primero seleccioná un club para ver atletas menores.
                                </p>
                            ) : loadingAtletas ? (
                                <p className="athlete-picker-empty">Cargando atletas del club...</p>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={busquedaAtleta}
                                        onChange={(e) => setBusquedaAtleta(e.target.value)}
                                        className="form-input"
                                        placeholder="Buscar por nombre o DNI..."
                                    />

                                    <p className="athlete-picker-meta">
                                        {atletas.length === 0
                                            ? 'No hay menores de 18 en este club.'
                                            : busquedaAtleta.trim()
                                              ? `${atletasFiltrados.length} de ${atletas.length} menores coinciden`
                                              : `${atletas.length} menores disponibles en el club`}
                                    </p>

                                    {atletaSeleccionado && (
                                        <div className="athlete-picker-selected">
                                            <span>
                                                Seleccionado:{' '}
                                                <strong>{atletaSeleccionado.nombrePersona}</strong>
                                                {atletaSeleccionado.documento
                                                    ? ` — ${atletaSeleccionado.documento}`
                                                    : ''}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setFormData((prev) => ({ ...prev, idAtleta: '' }))
                                                }
                                            >
                                                Quitar
                                            </Button>
                                        </div>
                                    )}

                                    {atletas.length === 0 ? (
                                        <p className="athlete-picker-empty">
                                            No se encontraron atletas menores de 18 en este club.
                                        </p>
                                    ) : atletasFiltrados.length === 0 ? (
                                        <p className="athlete-picker-empty">
                                            No se encontró ningún atleta con “{busquedaAtleta.trim()}”.
                                            Probá con otra parte del nombre o DNI.
                                        </p>
                                    ) : (
                                        <ul className="athlete-picker-list">
                                            {atletasFiltrados.map((atleta) => (
                                                <li key={atleta.idPersona}>
                                                    <button
                                                        type="button"
                                                        className={`athlete-picker-item${
                                                            String(formData.idAtleta) ===
                                                            String(atleta.idPersona)
                                                                ? ' is-selected'
                                                                : ''
                                                        }`}
                                                        onClick={() =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                idAtleta: String(atleta.idPersona),
                                                            }))
                                                        }
                                                    >
                                                        <strong>{atleta.nombrePersona}</strong>
                                                        <span>
                                                            {atleta.edad != null
                                                                ? `${atleta.edad} años`
                                                                : 'Edad n/d'}
                                                            {atleta.documento
                                                                ? ` · DNI ${atleta.documento}`
                                                                : ''}
                                                            {atleta.tieneTutor
                                                                ? ' · Ya tiene tutor'
                                                                : ''}
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" size="sm" onClick={goBack}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                            <Save size={16} /> Guardar Tutor
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default TutoresForm;
