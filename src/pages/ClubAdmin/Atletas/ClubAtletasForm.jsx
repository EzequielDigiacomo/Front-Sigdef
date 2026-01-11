import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save, UserX } from 'lucide-react';
import { CATEGORIA_MAP, PARENTESCO_MAP } from '../../../utils/enums';
import './ClubAtletas.css';

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
    const [showDejarLibreConfirm, setShowDejarLibreConfirm] = useState(false);

    const handleModalClose = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (modalConfig.shouldNavigate) {
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
            const data = await api.get(`/Atleta/${id}`);
            setFormData({
                nombre: data.persona?.nombre || '',
                apellido: data.persona?.apellido || '',
                documento: data.persona?.documento || '',
                fechaNacimiento: data.persona?.fechaNacimiento ? data.persona.fechaNacimiento.split('T')[0] : '',
                email: data.persona?.email || '',
                telefono: data.persona?.telefono || '',
                direccion: data.persona?.direccion || '',
                categoria: data.categoria || 0,
                becadoEnard: data.becadoEnard || false,
                becadoSdn: data.becadoSdn || false,
                montoBeca: data.montoBeca || 0,
                presentoAptoMedico: data.presentoAptoMedico || false,
                estadoPago: data.estadoPago || 0,
                perteneceSeleccion: data.perteneceSeleccion || false,
                sexo: data.persona?.sexo || 1,
            });

            if (data.idPersona) {
                try {
                    // Fetch all relations and filter (reliable fallback)
                    const relaciones = await api.get('/AtletaTutor');
                    const relacion = relaciones.find(r => r.idAtleta === data.idPersona);

                    if (relacion) {
                        try {
                            // Check if relation object has tutor embedded or just ID
                            const idTutor = relacion.idTutor;
                            // Fetch basic tutor info
                            const tutor = await api.get(`/Tutor/${idTutor}`);
                            // Fetch full persona info
                            const idPersonaTutor = tutor.idPersona || idTutor;
                            const personaTutor = await api.get(`/Persona/${idPersonaTutor}`);

                            setTutorData({
                                documento: personaTutor.documento || '',
                                nombre: personaTutor.nombre || '',
                                apellido: personaTutor.apellido || '',
                                telefono: personaTutor.telefono || '',
                                email: personaTutor.email || '',
                                parentesco: relacion.parentesco || 0,
                                existe: true,
                                idPersona: idPersonaTutor,
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

    const handleDejarLibre = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/Atleta/${id}`);
            const athletePayload = {
                IdPersona: parseInt(id),
                IdClub: null, // Liberar al atleta
                Categoria: data.categoria || 0,
                BecadoEnard: data.becadoEnard,
                BecadoSdn: data.becadoSdn,
                MontoBeca: data.montoBeca || 0,
                PresentoAptoMedico: data.presentoAptoMedico,
                EstadoPago: data.estadoPago,
                PerteneceSeleccion: data.perteneceSeleccion,
                FechaAptoMedico: data.fechaAptoMedico
            };

            await api.put(`/Atleta/${id}`, athletePayload);

            setModalConfig({
                isOpen: true,
                title: 'Atleta Liberado',
                message: 'El atleta ha sido desvinculado del club y ahora figura como Agente Libre.',
                type: 'success',
                shouldNavigate: true
            });
        } catch (error) {
            console.error('Error al dejar libre:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'No se pudo liberar al atleta. Intente nuevamente.',
                type: 'danger',
                shouldNavigate: false
            });
        } finally {
            setLoading(false);
            setShowDejarLibreConfirm(false);
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
    };

    const handleTutorChange = (e) => {
        const { name, value } = e.target;
        setTutorData(prev => ({ ...prev, [name]: name === 'parentesco' ? parseInt(value) : value }));
        if (name === 'documento') {
            if (window.tutorSearchTimeout) clearTimeout(window.tutorSearchTimeout);
            window.tutorSearchTimeout = setTimeout(() => buscarTutor(value), 500);
        }
    };

    const handleTutorManagement = async (idAtleta) => {
        console.log('🔍 Procesando tutor para atleta:', idAtleta);
        let idTutor;

        if (!tutorData.existe) {

            console.log('➕ Creando Persona para el Tutor...');

            const fechaNacimientoTutor = new Date();
            fechaNacimientoTutor.setFullYear(fechaNacimientoTutor.getFullYear() - 30);

            const tutorPersonaPayload = {
                nombre: tutorData.nombre,
                apellido: tutorData.apellido,
                documento: tutorData.documento,
                fechaNacimiento: fechaNacimientoTutor.toISOString(),
                email: tutorData.email || "",
                telefono: tutorData.telefono || "",
                direccion: ""
            };

            const tutorPersonaResponse = await api.post('/Persona', tutorPersonaPayload);
            const idPersonaTutor = tutorPersonaResponse.idPersona || tutorPersonaResponse.IdPersona;

            console.log('➕ Registrando como Tutor...');
            const tutorPayload = {
                idPersona: idPersonaTutor,
                tipoTutor: PARENTESCO_MAP[tutorData.parentesco] || 'Padre'
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
                    idPersona: idTutor,
                    tipoTutor: PARENTESCO_MAP[tutorData.parentesco] || 'Padre'
                };
                await api.post('/Tutor', tutorPayload);
            }
        }

        console.log('🔗 Vinculando Atleta y Tutor...');
        try {
            await api.post('/AtletaTutor', {
                idAtleta: idAtleta,
                idTutor: idTutor,
                parentesco: tutorData.parentesco
            });
            console.log('✅ Vinculación exitosa');
        } catch (error) {
            console.error('Error vinculando tutor (posiblemente ya existe la relación):', error);

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
                Direccion: direccionFinal || "",
                Sexo: parseInt(formData.sexo)
            };

            const getAtletaPayload = (idPersona) => ({
                IdPersona: idPersona,
                IdClub: user.idClub || user.clubId || user.IdClub,
                Categoria: parseInt(formData.categoria) || 0,
                BecadoEnard: formData.becadoEnard,
                BecadoSdn: formData.becadoSdn,
                MontoBeca: parseFloat(formData.montoBeca) || 0,
                PresentoAptoMedico: formData.presentoAptoMedico,
                EstadoPago: 0,
                PerteneceSeleccion: false,
                FechaAptoMedico: null
            });

            if (id) {

                await api.put(`/Persona/${id}`, personaPayload);
                await api.put(`/Atleta/${id}`, getAtletaPayload(parseInt(id)));
                idPersona = parseInt(id);

                if (esMenor && tutorData.documento) {
                    await handleTutorManagement(idPersona);
                } else {

                    try {
                        await api.delete(`/AtletaTutor/atleta/${idPersona}`);
                    } catch (error) {
                        console.log('No había relación tutor para eliminar');
                    }
                }
            } else {

                try {
                    console.log(`🔍 Buscando persona con DNI ${formData.documento}...`);
                    const personaExistente = await api.get(`/Persona/documento/${formData.documento}`, { silentErrors: true });

                    if (personaExistente && personaExistente.idPersona) {
                        idPersona = personaExistente.idPersona;
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
                    idPersona = personaResponse.idPersona || personaResponse.IdPersona;
                }

                try {
                    await api.get(`/Atleta/${idPersona}`, { silentErrors: true });
                    console.log('⚠️ Esta persona ya es atleta.');

                    await api.put(`/Atleta/${idPersona}`, getAtletaPayload(idPersona));
                } catch (error) {

                    console.log('➕ Creando registro de Atleta...');
                    await api.post('/Atleta', getAtletaPayload(idPersona));
                }

                if (esMenor && tutorData.documento) {
                    await handleTutorManagement(idPersona);
                }
            }

            setModalConfig({
                isOpen: true,
                title: 'Éxito',
                message: 'Atleta guardado exitosamente!',
                type: 'success',
                shouldNavigate: true
            });
        } catch (error) {
            console.error('Error guardando:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Error al guardar. Revisa la consola para más detalles.',
                type: 'danger',
                shouldNavigate: false
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/club/atletas')}>
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
                                <option value={1}>Masculino</option>
                                <option value={2}>Femenino</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Email {esMenor && '(opcional - se usará el del tutor si está vacío)'}</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Teléfono {esMenor && '(opcional - se usará el del tutor si está vacío)'}</label>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Dirección</label>
                            <input name="direccion" value={formData.direccion} onChange={handleChange} className="form-input" />
                        </div>

                        {esMenor && (
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
                            <label>Club</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    value={user.clubNombre || `Club ID: ${user.clubId}`}
                                    className="form-input"
                                    disabled
                                    style={{ flex: 1 }}
                                />
                                {id && (
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        onClick={() => setShowDejarLibreConfirm(true)}
                                        title="Dejar Libre al Atleta"
                                    >
                                        <UserX size={18} /> Dejar Libre
                                    </Button>
                                )}
                            </div>
                            <small>El atleta se registrará automáticamente en tu club. Si lo dejas libre, ya no pertenecerá a ningún club.</small>
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
                            <input type="number" name="montoBeca" value={formData.montoBeca} onChange={handleChange} className="form-input" />
                        </div>
                    </div>
                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => navigate('/club/atletas')}>Cancelar</Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> {id ? 'Actualizar' : 'Guardar'} Atleta
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

            <ConfirmationModal
                isOpen={showDejarLibreConfirm}
                onClose={() => setShowDejarLibreConfirm(false)}
                onConfirm={handleDejarLibre}
                title="¿Confirmar desvinculación?"
                message={`¿Estás seguro que deseas dejar libre a ${formData.nombre} ${formData.apellido}? Esta acción lo transformará en un Agente Libre y dejará de pertenecer a tu club.`}
                confirmText="Sí, Dejar Libre"
                cancelText="Cancelar"
                type="danger"
            />
        </div>
    );
};

export default ClubAtletasForm;
