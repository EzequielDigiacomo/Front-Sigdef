import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import { ArrowLeft, Save, CheckCircle, XCircle } from 'lucide-react';
import { CATEGORIA_MAP, PARENTESCO_MAP, SEXO_MAP } from '../../../utils/enums';
import { getCategoryByAge } from '../../../utils/categoryConfig';
import './Atletas.css';

const AtletasForm = () => {
    const { id } = useParams();
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


    const [resultModal, setResultModal] = useState({
        open: false,
        type: 'success',
        title: '',
        message: ''
    });

    useEffect(() => {
        loadClubes();
        if (id) {
            loadAtleta();
            // Fetch tutor data if exists
            const fetchTutor = async () => {
                try {
                    const relRes = await api.get('/AtletaTutor');
                    const relacion = relRes.find(r => r.idAtleta === parseInt(id));
                    if (relacion) {
                        const tutorRes = await api.get(`/Persona/${relacion.idTutor}`);
                        setTutorData({
                            documento: tutorRes.documento,
                            nombre: tutorRes.nombre,
                            apellido: tutorRes.apellido,
                            telefono: tutorRes.telefono,
                            email: tutorRes.email,
                            parentesco: relacion.idParentesco,
                            existe: true,
                            idPersona: relacion.idTutor
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
            const data = await api.get(`/Atleta/${id}`);
            console.log('📦 DATOS ATLETA DETALLE:', JSON.stringify(data, null, 2));
            const p = data.persona || data.Persona || {};

            setFormData({
                nombre: p.nombre || p.Nombre || '',
                apellido: p.apellido || p.Apellido || '',
                documento: p.documento || p.Documento || '',
                sexo: p.sexo || p.Sexo || 1,
                fechaNacimiento: (p.fechaNacimiento || p.FechaNacimiento || '').split('T')[0],
                email: p.email || p.Email || '',
                telefono: p.telefono || p.Telefono || '',
                direccion: p.direccion || p.Direccion || '',

                idClub: data.idClub || data.IdClub || '',
                categoria: data.categoria || data.Categoria || 0,
                becadoEnard: data.becadoEnard || data.BecadoEnard || false,
                becadoSdn: data.becadoSdn || data.BecadoSdn || false,
                montoBeca: data.montoBeca || data.MontoBeca || 0,
                presentoAptoMedico: data.presentoAptoMedico || data.PresentoAptoMedico || false,
                estadoPago: data.estadoPago || data.EstadoPago || 0,
                perteneceSeleccion: data.perteneceSeleccion || data.PerteneceSeleccion || false
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
                idPersona: persona.idPersona || persona.IdPersona
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
                            idPersona: found.idPersona || found.IdPersona
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
    };

    const handleTutorChange = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = name === 'documento' ? value.replace(/[\s.]/g, '') : value;

        setTutorData(prev => ({ ...prev, [name]: name === 'parentesco' ? parseInt(value) : sanitizedValue }));

        if (name === 'documento') {
            if (window.tutorSearchTimeout) clearTimeout(window.tutorSearchTimeout);
            window.tutorSearchTimeout = setTimeout(() => buscarTutor(sanitizedValue), 500);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

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
                Sexo: parseInt(formData.sexo),
                FechaNacimiento: fechaNacimientoISO,
                Email: emailFinal,
                Telefono: telefonoFinal,
                Direccion: direccionFinal
            };

            const getAtletaPayload = (idPersona) => ({
                IdPersona: idPersona,
                IdClub: formData.idClub ? parseInt(formData.idClub) : null,
                Categoria: parseInt(formData.categoria) || 0,
                BecadoEnard: formData.becadoEnard,
                BecadoSdn: formData.becadoSdn,
                MontoBeca: parseFloat(formData.montoBeca) || 0,
                PresentoAptoMedico: formData.presentoAptoMedico,
                EstadoPago: 0,
                PerteneceSeleccion: formData.perteneceSeleccion,
                FechaAptoMedico: null
            });

            if (id) {

                await api.put(`/Persona/${id}`, personaPayload);
                await api.put(`/Atleta/${id}`, getAtletaPayload(parseInt(id)));
                idPersona = parseInt(id);
            } else {
                // Nuevo Atleta: Buscar o Crear Persona
                try {
                    const personaExistente = await api.get(`/Persona/documento/${formData.documento}`, { silentErrors: true });
                    if (personaExistente && (personaExistente.idPersona || personaExistente.IdPersona)) {
                        idPersona = personaExistente.idPersona || personaExistente.IdPersona;
                        await api.put(`/Persona/${idPersona}`, personaPayload);
                    }
                } catch (error) {
                    console.log('ℹ️ Persona no encontrada, se creará una nueva.');
                }

                if (!idPersona) {
                    const personaResponse = await api.post('/Persona', personaPayload);
                    idPersona = personaResponse.IdPersona || personaResponse.idPersona;
                }

                // Asegurar registro de Atleta
                try {
                    await api.get(`/Atleta/${idPersona}`, { silentErrors: true });
                    await api.put(`/Atleta/${idPersona}`, getAtletaPayload(idPersona));
                } catch (error) {
                    await api.post('/Atleta', getAtletaPayload(idPersona));
                }
            }

            // --- PROCESAMIENTO DEL TUTOR (Común para Nuevo y Editar) ---
            if (esMenor && !tutorLater && tutorData.documento) {
                console.log('🔍 Procesando tutor...');
                let idTutorPersona = tutorData.idPersona;
                const sanitizedTutorDni = tutorData.documento.replace(/[\s.]/g, '');

                // 1. Asegurar Persona del Tutor
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
                            idTutorPersona = found.idPersona || found.IdPersona;
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
                            idTutorPersona = res.idPersona || res.IdPersona;
                        }
                    } catch (err) {
                        console.error("Error asegurando persona del tutor:", err);
                    }
                }

                if (idTutorPersona) {
                    // 2. Asegurar Rol de Tutor
                    try {
                        await api.get(`/Tutor/${idTutorPersona}`, { silentErrors: true });
                    } catch (e) {
                        const tutorRolePayload = {
                            IdPersona: idTutorPersona,
                            TipoTutor: PARENTESCO_MAP[tutorData.parentesco] || 'Padre/Madre',
                            NombrePersona: `${tutorData.nombre || ''} ${tutorData.apellido || ''}`.trim(),
                            Documento: sanitizedTutorDni,
                            Telefono: tutorData.telefono || '',
                            Email: tutorData.email || ''
                        };
                        await api.post('/Tutor', tutorRolePayload);
                    }

                    // 3. Vincular Atleta y Tutor
                    try {
                        const relRes = await api.get('/AtletaTutor');
                        const existingRel = Array.isArray(relRes) ? relRes.find(r => (r.idAtleta || r.IdAtleta) === idPersona) : null;

                        const relPayload = {
                            IdAtleta: idPersona,
                            IdTutor: idTutorPersona,
                            IdParentesco: parseInt(tutorData.parentesco)
                        };

                        if (existingRel) {
                            const idRel = existingRel.idAtletaTutor || existingRel.IdAtletaTutor;
                            await api.delete(`/AtletaTutor/${idRel}`);
                        }
                        await api.post('/AtletaTutor', relPayload);
                    } catch (err) {
                        console.error("Error vinculando tutor:", err);
                    }
                }
            }

            setResultModal({
                open: true,
                type: 'success',
                title: '¡Éxito!',
                message: 'El atleta ha sido guardado correctamente.'
            });
        } catch (error) {
            console.error('Error guardando:', error);
            setResultModal({
                open: true,
                type: 'error',
                title: 'Error',
                message: `Hubo un problema al guardar: ${error.message || 'Error desconocido'}`
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseResultModal = () => {
        setResultModal(prev => ({ ...prev, open: false }));
        if (resultModal.type === 'success') {
            if (location.state?.returnPath) {
                navigate(location.state.returnPath);
            } else {
                navigate('/atletas');
            }
        }
    };

    const handleCancel = () => {
        if (location.state?.returnPath) {
            navigate(location.state.returnPath);
        } else {
            navigate('/atletas');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={handleCancel}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Atleta' : 'Nuevo Atleta'}</h2>
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
                            <select name="sexo" value={formData.sexo} onChange={handleChange} className="form-input" required>
                                {Object.entries(SEXO_MAP)
                                    .filter(([key]) => key === "1" || key === "2")
                                    .map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Email {esMenor ? (tutorLater ? '(opcional)' : '(opcional - se usará el del tutor si está vacío)') : ''}</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Teléfono {esMenor ? (tutorLater ? '(opcional)' : '(opcional - se usará el del tutor si está vacío)') : ''}</label>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Dirección</label>
                            <input name="direccion" value={formData.direccion} onChange={handleChange} className="form-input" />
                        </div>

                        {esMenor && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 className="form-section-title" style={{ marginBottom: 0 }}>Datos del Tutor (Menor de 18 años)</h3>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={tutorLater}
                                            onChange={(e) => setTutorLater(e.target.checked)}
                                        />
                                        {id ? 'Editar/Ver tutor' : 'Crear tutor más tarde'}
                                    </label>
                                </div>

                                {id && tutorLater && (
                                    <small style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                        Desmarcar para editar o asignar tutor.
                                    </small>
                                )}

                                {!tutorLater && (
                                    <>
                                        <div className="form-group">
                                            <label>Documento del Tutor *</label>
                                            <input
                                                name="documento"
                                                value={tutorData.documento}
                                                onChange={handleTutorChange}
                                                className="form-input"
                                                placeholder="Buscar por documento..."
                                                required={!tutorLater}
                                            />
                                            <div style={{ minHeight: '20px', fontSize: '0.85rem', marginTop: '4px' }}>
                                                {tutorSearchStatus === 'loading' && <span style={{ color: 'var(--text-secondary)' }}>🔍 Buscando...</span>}
                                                {tutorSearchStatus === 'found' && <span style={{ color: 'var(--success)' }}>✓ Persona encontrada, datos precargados.</span>}
                                                {tutorSearchStatus === 'not_found' && <span style={{ color: 'var(--text-secondary)' }}>No existe ese DNI registrado, complete los datos.</span>}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Nombre del Tutor *</label>
                                            <input
                                                name="nombre"
                                                value={tutorData.nombre}
                                                onChange={handleTutorChange}
                                                className="form-input"
                                                disabled={tutorData.existe}
                                                required={!tutorLater}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Apellido del Tutor *</label>
                                            <input
                                                name="apellido"
                                                value={tutorData.apellido}
                                                onChange={handleTutorChange}
                                                className="form-input"
                                                disabled={tutorData.existe}
                                                required={!tutorLater}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Parentesco *</label>
                                            <select name="parentesco" value={tutorData.parentesco} onChange={handleTutorChange} className="form-input" required={!tutorLater}>
                                                {Object.entries(PARENTESCO_MAP).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Teléfono del Tutor</label>
                                            <input
                                                name="telefono"
                                                value={tutorData.telefono}
                                                onChange={handleTutorChange}
                                                className="form-input"
                                                disabled={tutorData.existe}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email del Tutor</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={tutorData.email}
                                                onChange={handleTutorChange}
                                                className="form-input"
                                                disabled={tutorData.existe}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        <h3 className="form-section-title">Datos Deportivos</h3>

                        <div className="form-group">
                            <label>Club</label>
                            <select name="idClub" value={formData.idClub} onChange={handleChange} className="form-input">
                                <option value="">Sin Asignar (Agente Libre)</option>
                                {clubes.map(club => (
                                    <option key={club.idClub} value={club.idClub}>{club.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Categoría</label>
                            <select name="categoria" value={formData.categoria} onChange={handleChange} className="form-input">
                                {Object.entries(CATEGORIA_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" name="presentoAptoMedico" checked={formData.presentoAptoMedico} onChange={handleChange} id="apto" />
                            <label htmlFor="apto" style={{ marginBottom: 0 }}>Presentó Apto Médico</label>
                        </div>

                        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" name="perteneceSeleccion" checked={formData.perteneceSeleccion} onChange={handleChange} id="seleccion" />
                            <label htmlFor="seleccion" style={{ marginBottom: 0 }}>Pertenece a Selección</label>
                        </div>

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
                            <input type="number" name="montoBeca" value={formData.montoBeca} onChange={handleChange} className="form-input" />
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={handleCancel}>Cancelar</Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> Guardar Atleta
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
