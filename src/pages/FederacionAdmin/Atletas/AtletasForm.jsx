import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { CATEGORIA_MAP, PARENTESCO_MAP } from '../../../utils/enums';
import { getCategoryByAge } from '../../../utils/categoryConfig';
import './Atletas.css';

const AtletasForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [clubes, setClubes] = useState([]);
    const [esMenor, setEsMenor] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
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

    useEffect(() => {
        loadClubes();
        if (id) {
            loadAtleta();
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
            setFormData({
                nombre: data.persona?.nombre || '',
                apellido: data.persona?.apellido || '',
                documento: data.persona?.documento || '',
                fechaNacimiento: data.persona?.fechaNacimiento ? data.persona.fechaNacimiento.split('T')[0] : '',
                email: data.persona?.email || '',
                telefono: data.persona?.telefono || '',
                direccion: data.persona?.direccion || '',
                idClub: data.idClub || '',
                categoria: data.categoria || 0,
                becadoEnard: data.becadoEnard || false,
                becadoSdn: data.becadoSdn || false,
                montoBeca: data.montoBeca || 0,
                presentoAptoMedico: data.presentoAptoMedico || false,
                estadoPago: data.estadoPago || 0,
                perteneceSeleccion: data.perteneceSeleccion || false
            });
        } catch (error) {
            console.error('Error cargando atleta:', error);
        }
    };

    const buscarTutor = async (documento) => {
        if (!documento || documento.length < 7) {
            setTutorData(prev => ({ ...prev, documento, nombre: '', apellido: '', telefono: '', email: '', existe: false, idPersona: null }));
            return;
        }

        try {
            const persona = await api.get(`/Persona/documento/${documento}`);

            setTutorData({
                documento,
                nombre: persona.nombre || persona.Nombre || '',
                apellido: persona.apellido || persona.Apellido || '',
                telefono: persona.telefono || persona.Telefono || '',
                email: persona.email || persona.Email || '',
                parentesco: 0,
                existe: true,
                idPersona: persona.idPersona || persona.IdPersona
            });
        } catch (error) {
            setTutorData(prev => ({ ...prev, documento, nombre: '', apellido: '', telefono: '', email: '', existe: false, idPersona: null }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'categoria' || name === 'idClub' ? parseInt(value) || value : value)
        }));
    };

    const handleTutorChange = (e) => {
        const { name, value } = e.target;
        setTutorData(prev => ({ ...prev, [name]: name === 'parentesco' ? parseInt(value) : value }));

        if (name === 'documento') {
            if (window.tutorSearchTimeout) clearTimeout(window.tutorSearchTimeout);
            window.tutorSearchTimeout = setTimeout(() => buscarTutor(value), 500);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let idPersona;

            const emailInput = formData.email || (esMenor && tutorData.email ? tutorData.email : null);
            const telefonoInput = formData.telefono || (esMenor && tutorData.telefono ? tutorData.telefono : null);

            const emailFinal = emailInput === "" ? null : emailInput;
            const telefonoFinal = telefonoInput === "" ? null : telefonoInput;
            const direccionFinal = formData.direccion === "" ? null : formData.direccion;

            const fechaNacimientoISO = formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : new Date().toISOString();

            const personaPayload = {
                Nombre: formData.nombre,
                Apellido: formData.apellido,
                Documento: formData.documento,
                FechaNacimiento: fechaNacimientoISO,
                Email: emailFinal || "",
                Telefono: telefonoFinal || "",
                Direccion: direccionFinal || ""
            };

            const getAtletaPayload = (idPersona) => ({
                IdPersona: idPersona,
                IdClub: parseInt(formData.idClub),
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

                try {
                    console.log(`🔍 Buscando persona con DNI ${formData.documento}...`);
                    const personaExistente = await api.get(`/Persona/documento/${formData.documento}`);

                    if (personaExistente && (personaExistente.idPersona || personaExistente.IdPersona)) {
                        idPersona = personaExistente.idPersona || personaExistente.IdPersona;
                        console.log('⚠️ Persona encontrada, reutilizando ID:', idPersona);

                        console.log('🔄 Actualizando datos de persona existente...');
                        await api.put(`/Persona/${idPersona}`, personaPayload);
                    }
                } catch (error) {
                    console.log('ℹ️ Persona no encontrada, se creará una nueva.');
                }

                if (!idPersona) {
                    console.log('➕ Creando nueva Persona:', personaPayload);
                    const personaResponse = await api.post('/Persona', personaPayload);
                    console.log('✅ Persona creada:', personaResponse);
                    idPersona = personaResponse.IdPersona || personaResponse.idPersona;
                }

                try {

                    await api.get(`/Atleta/${idPersona}`);
                    console.log('⚠️ Esta persona ya es atleta.');

                    await api.put(`/Atleta/${idPersona}`, getAtletaPayload(idPersona));
                } catch (error) {

                    console.log('➕ Creando registro de Atleta...');
                    await api.post('/Atleta', getAtletaPayload(idPersona));
                }

                if (esMenor && tutorData.documento) {
                    console.log('🔍 Procesando tutor...');
                    let idTutor;

                    if (!tutorData.existe) {

                        console.log('➕ Creando Persona para el Tutor...');
                        const tutorPersonaPayload = {
                            Nombre: tutorData.nombre,
                            Apellido: tutorData.apellido,
                            Documento: tutorData.documento,
                            FechaNacimiento: new Date().toISOString(),
                            Email: tutorData.email || "",
                            Telefono: tutorData.telefono || "",
                            Direccion: ""
                        };

                        const tutorPersonaResponse = await api.post('/Persona', tutorPersonaPayload);
                        const idPersonaTutor = tutorPersonaResponse.IdPersona || tutorPersonaResponse.idPersona;

                        console.log('➕ Registrando como Tutor...');
                        const tutorPayload = {
                            IdPersona: idPersonaTutor,
                            TipoTutor: PARENTESCO_MAP[tutorData.parentesco] || 'Padre/Madre',
                            NombrePersona: `${tutorData.nombre} ${tutorData.apellido}`,
                            Documento: tutorData.documento,
                            Telefono: tutorData.telefono || '',
                            Email: tutorData.email || ''
                        };

                        await api.post('/Tutor', tutorPayload);
                        idTutor = idPersonaTutor;
                    } else {

                        console.log('✅ Usando Tutor existente ID:', tutorData.idPersona);
                        idTutor = tutorData.idPersona;

                        try {
                            await api.get(`/Tutor/${idTutor}`);
                        } catch (e) {
                            console.log('➕ La persona existe pero no es Tutor, registrándolo...');
                            const tutorPayload = {
                                IdPersona: idTutor,
                                TipoTutor: PARENTESCO_MAP[tutorData.parentesco] || 'Padre/Madre',
                                NombrePersona: `${tutorData.nombre} ${tutorData.apellido}`,
                                Documento: tutorData.documento,
                                Telefono: tutorData.telefono || '',
                                Email: tutorData.email || ''
                            };
                            await api.post('/Tutor', tutorPayload);
                        }
                    }

                    console.log('🔗 Vinculando Atleta y Tutor...');
                    try {
                        await api.post('/AtletaTutor', {
                            IdAtleta: idPersona,
                            IdTutor: idTutor,
                            Parentesco: tutorData.parentesco
                        });
                        console.log('✅ Vinculación exitosa');
                    } catch (error) {
                        console.error('Error vinculando tutor (posiblemente ya existe la relación):', error);

                    }
                }
            }

            alert('Atleta guardado exitosamente!');
            if (location.state?.returnPath) {
                navigate(location.state.returnPath);
            } else {
                navigate('/atletas');
            }
        } catch (error) {
            console.error('Error guardando:', error);
            alert('Error al guardar. Revisa la consola para más detalles.');
        } finally {
            setLoading(false);
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
                            <label>Email {esMenor && '(opcional - se usará el del tutor si está vacío)'}</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Teléfono {esMenor && '(opcional - se usará el del tutor si está vacío)'}</label>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" />
                        </div>

                        {esMenor && !id && (
                            <>
                                <h3 className="form-section-title">Datos del Tutor (Menor de 18 años)</h3>

                                <div className="form-group">
                                    <label>Documento del Tutor *</label>
                                    <input
                                        name="documento"
                                        value={tutorData.documento}
                                        onChange={handleTutorChange}
                                        className="form-input"
                                        placeholder="Buscar por documento..."
                                        required
                                    />
                                    {tutorData.existe && <small style={{ color: 'var(--success)' }}>✓ Tutor encontrado en el sistema</small>}
                                </div>
                                <div className="form-group">
                                    <label>Nombre del Tutor *</label>
                                    <input
                                        name="nombre"
                                        value={tutorData.nombre}
                                        onChange={handleTutorChange}
                                        className="form-input"
                                        disabled={tutorData.existe}
                                        required
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
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Parentesco *</label>
                                    <select name="parentesco" value={tutorData.parentesco} onChange={handleTutorChange} className="form-input" required>
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

                        <h3 className="form-section-title">Datos Deportivos</h3>

                        <div className="form-group">
                            <label>Club *</label>
                            <select name="idClub" value={formData.idClub} onChange={handleChange} className="form-input" required>
                                <option value="">Seleccione un Club</option>
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
        </div>
    );
};

export default AtletasForm;
