import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save } from 'lucide-react';
import { CATEGORIA_MAP, PARENTESCO_MAP } from '../../../utils/enums';
import { getCategoryByAge } from '../../../utils/categoryConfig';
import './ClubAtletas.css';
import '../../../styles/CompactForm.css';

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
                    idPersona: id ? parseInt(id) : 0,
                    idClub: user.clubId,
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
                tutor: esMenor && tutorData.documento ? {
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

            setModalConfig({
                isOpen: true,
                title: 'Éxito',
                message: 'Atleta y tutor procesados exitosamente!',
                type: 'success',
                shouldNavigate: true
            });
        } catch (error) {
            console.error('Error guardando:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error al guardar',
                message: error.message || 'Error al procesar la solicitud. Revisa la consola.',
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
                    <Button variant="ghost" size="sm" onClick={() => navigate('/club/atletas')}>
                        <ArrowLeft size={18} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Atleta' : 'Nuevo Atleta'}</h2>
                </div>
            </div>
            <Card className="compact-form-card">
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
                                    {tutorData.existe && <small className="form-hint" style={{ color: 'var(--success)' }}>✓ Tutor encontrado en el sistema</small>}
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
                            <input
                                value={user.clubNombre || `Club ID: ${user.clubId}`}
                                className="form-input"
                                disabled
                            />
                            <small className="form-hint">El atleta se registrará automáticamente en tu club</small>
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
                            <input type="number" name="montoBeca" value={formData.montoBeca} onChange={handleChange} className="form-input" />
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
