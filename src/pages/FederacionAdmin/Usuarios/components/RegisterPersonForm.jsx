import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { Search, Save, UserPlus } from 'lucide-react';
import { SEXO_MAP } from '../../../../utils/enums';
import Button from '../../../../components/common/Button';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import './RegisterPersonForm.css';

const RegisterPersonForm = ({ onUserCreated }) => {
    const [formData, setFormData] = useState({
        // Datos Persona
        nombre: '',
        apellido: '',
        documento: '',
        sexo: 1,
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',

        // Datos Usuario
        username: '',
        password: '',
        confirmPassword: '',
        rol: '',
        idClub: 0,
        estaActivo: true,

        // Datos Específicos
        idFederacion: 1 // Default
    });

    const [personaExists, setPersonaExists] = useState(false);
    const [idPersona, setIdPersona] = useState(0);

    const isFormValid = formData.nombre &&
        formData.apellido &&
        formData.documento &&
        formData.direccion &&
        formData.rol &&
        formData.username.length >= 4 &&
        formData.password.length >= 6 &&
        formData.password === formData.confirmPassword;

    const renderError = (condition, message) => {
        if (condition) return <small className="error-text">{message}</small>;
        return null;
    };

    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchingPersona, setSearchingPersona] = useState(false);
    const [resultModal, setResultModal] = useState({
        open: false,
        type: 'success',
        title: '',
        message: ''
    });

    const roles = [
        { value: 'Admin', label: 'Administrador' },
        { value: 'Entrenador', label: 'Entrenador' },
        { value: 'Atleta', label: 'Atleta' },
        { value: 'Delegado', label: 'Delegado' },
        { value: 'Usuario', label: 'Usuario General' }
    ];

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const data = await api.get('/Club');
                if (data) {
                    setClubs(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Error fetching clubs:', error);
            }
        };
        fetchClubs();
    }, []);

    const buscarPersona = async () => {
        if (!formData.documento || formData.documento.length < 7) return;

        setSearchingPersona(true);
        try {
            // Usamos silentErrors para evitar el log de 404 en consola si no existe
            const persona = await api.get(`/Persona/documento/${formData.documento}`, { silentErrors: true });
            if (persona) {
                setFormData(prev => ({
                    ...prev,
                    nombre: persona.nombre || persona.Nombre || '',
                    apellido: persona.apellido || persona.Apellido || '',
                    sexo: persona.sexo || persona.Sexo || 1,
                    fechaNacimiento: (persona.fechaNacimiento || persona.FechaNacimiento || '').split('T')[0],
                    email: persona.email || persona.Email || '',
                    telefono: persona.telefono || persona.Telefono || '',
                    direccion: persona.direccion || persona.Direccion || ''
                }));
                setIdPersona(persona.idPersona || persona.IdPersona || persona.id || persona.Id);
                setPersonaExists(true);
                setResultModal({
                    open: true,
                    type: 'success',
                    title: 'Persona Encontrada',
                    message: 'Se han precargado los datos de la persona existente.'
                });
            }
        } catch (error) {
            console.log('Persona no encontrada, se registrará como nueva.');
            setPersonaExists(false);
            setIdPersona(0);
        } finally {
            setSearchingPersona(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isFormValid) {
            setResultModal({
                open: true,
                type: 'danger',
                title: 'Validación',
                message: 'Por favor complete todos los campos obligatorios correctamente.'
            });
            return;
        }

        setLoading(true);
        try {
            console.log("🚀 Iniciando proceso de registro...");

            // 1. Procesar Persona (Usamos PascalCase ya que parece ser el estándar del backend para este modelo)
            const personaPayload = {
                Nombre: formData.nombre,
                Apellido: formData.apellido,
                Documento: formData.documento,
                Sexo: parseInt(formData.sexo),
                FechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : new Date().toISOString(),
                Email: formData.email || null,
                Telefono: formData.telefono || null,
                Direccion: formData.direccion || null
            };

            let currentIdPersona = idPersona;

            if (personaExists && currentIdPersona) {
                console.log("📝 Actualizando persona existente ID:", currentIdPersona);
                await api.put(`/Persona/${currentIdPersona}`, personaPayload);
            } else {
                console.log("🆕 Creando nueva persona...");
                const nuevaPersona = await api.post('/Persona', personaPayload);
                currentIdPersona = nuevaPersona.idPersona || nuevaPersona.IdPersona || nuevaPersona.id || nuevaPersona.Id;
            }

            if (!currentIdPersona) throw new Error("No se pudo obtener el ID de la persona.");

            // 2. Registrar Usuario (Mapeamos roles al estándar que acepta /Auth/registrar)
            // IMPORTANTE: Evitamos 'Club' porque el backend pide usar el otro endpoint.
            let apiRol = formData.rol;
            if (apiRol === 'Delegado') apiRol = 'Usuario';

            const userPayload = {
                idPersona: currentIdPersona,
                IdPersona: currentIdPersona,
                idClub: parseInt(formData.idClub) || 0,
                IdClub: parseInt(formData.idClub) || 0,
                idFederacion: 1,
                IdFederacion: 1,
                username: formData.username,
                Username: formData.username,
                password: formData.password,
                Password: formData.password,
                confirmPassword: formData.confirmPassword,
                ConfirmPassword: formData.confirmPassword,
                rol: apiRol,
                Rol: apiRol,
                estaActivo: formData.estaActivo,
                EstaActivo: formData.estaActivo
            };

            console.log("👤 Enviando registro de usuario...");
            await api.post('/Auth/registrar', userPayload);

            // 3. Registrar Rol específico si aplica
            const clubIdInt = parseInt(formData.idClub);

            if (formData.rol === 'Delegado') {
                console.log("🎖️ Registrando Delegado...");
                await api.post('/DelegadoClub', {
                    IdPersona: currentIdPersona,
                    IdClub: clubIdInt > 0 ? clubIdInt : null,
                    IdFederacion: 1,
                    IdRol: 3
                });
            } else if (formData.rol === 'Entrenador') {
                console.log("🧢 Registrando Entrenador...");
                await api.post('/Entrenador', {
                    idPersona: currentIdPersona,
                    idClub: clubIdInt > 0 ? clubIdInt : null
                });
            }

            setResultModal({
                open: true,
                type: 'success',
                title: '¡Éxito!',
                message: 'Persona y Usuario registrados correctamente.'
            });

            // Reset form
            setFormData({
                nombre: '', apellido: '', documento: '', sexo: 1, fechaNacimiento: '',
                email: '', telefono: '', direccion: '', username: '', password: '',
                confirmPassword: '', rol: '', idClub: 0, estaActivo: true, idFederacion: 1
            });
            setPersonaExists(false);
            setIdPersona(0);

            if (onUserCreated) onUserCreated();
        } catch (error) {
            setResultModal({
                open: true,
                type: 'danger',
                title: 'Error de Registro',
                message: error.message || 'Ocurrió un error inesperado.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="form-container expanded-form">
                <h3 className="form-title">Registrar Persona y Usuario</h3>

                <section className="form-section">
                    <h4 className="section-subtitle">Datos Personales</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Documento (DNI) *</label>
                            <div className="input-with-action">
                                <input
                                    type="text"
                                    name="documento"
                                    value={formData.documento}
                                    onChange={handleChange}
                                    onBlur={buscarPersona}
                                    className="form-input"
                                    required
                                />
                                <button type="button" onClick={buscarPersona} className="action-btn" disabled={searchingPersona}>
                                    {searchingPersona ? <span className="spinner-small"></span> : <Search size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nombre *</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} className="form-input" required />
                        </div>

                        <div className="form-group">
                            <label>Apellido *</label>
                            <input name="apellido" value={formData.apellido} onChange={handleChange} className="form-input" required />
                        </div>

                        <div className="form-group">
                            <label>Sexo *</label>
                            <select name="sexo" value={formData.sexo} onChange={handleChange} className="form-input">
                                {Object.entries(SEXO_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Fecha Nacimiento</label>
                            <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className="form-input" />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="ejemplo@correo.com" />
                        </div>

                        <div className="form-group">
                            <label>Teléfono</label>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" placeholder="Ej: 11 1234 5678" />
                        </div>

                        <div className="form-group full-width">
                            <label>Dirección *</label>
                            <input name="direccion" value={formData.direccion} onChange={handleChange} className="form-input" required placeholder="Calle, Número, Localidad" />
                            {renderError(!formData.direccion && formData.documento, "La dirección es obligatoria")}
                        </div>
                    </div>
                </section>

                <section className="form-section">
                    <h4 className="section-subtitle">Credenciales y Acceso</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre de Usuario *</label>
                            <input name="username" value={formData.username} onChange={handleChange} className="form-input" required />
                            {renderError(formData.username.length > 0 && formData.username.length < 4, "Mínimo 4 caracteres")}
                        </div>

                        <div className="form-group">
                            <label>Rol *</label>
                            <select name="rol" value={formData.rol} onChange={handleChange} className="form-input" required>
                                <option value="">Seleccione un rol</option>
                                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                            {renderError(!formData.rol && formData.username.length >= 4, "Selección obligatoria")}
                        </div>

                        <div className="form-group">
                            <label>Club Asociado</label>
                            <select name="idClub" value={formData.idClub} onChange={handleChange} className="form-input">
                                <option value="0">Ninguno (Federación)</option>
                                {clubs.map(c => <option key={c.idClub} value={c.idClub}>{c.nombre}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Contraseña *</label>
                            <input type="text" name="password" value={formData.password} onChange={handleChange} className="form-input" required />
                            {renderError(formData.password.length > 0 && formData.password.length < 6, "Mínimo 6 caracteres")}
                        </div>

                        <div className="form-group">
                            <label>Confirmar Contraseña *</label>
                            <input type="text" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-input" required />
                            {renderError(formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword, "Las contraseñas no coinciden")}
                        </div>
                    </div>
                </section>

                {(formData.rol === 'Atleta') && (
                    <section className="form-section">
                        <h4 className="section-subtitle">Datos de {formData.rol}</h4>
                    </section>
                )}

                <div className="form-group checkbox-group mt-4">
                    <label className="checkbox-label">
                        <input type="checkbox" name="estaActivo" checked={formData.estaActivo} onChange={handleChange} />
                        <span>Cuenta Activa</span>
                    </label>
                </div>

                <Button
                    type="submit"
                    variant={isFormValid ? "primary" : "secondary"}
                    isLoading={loading}
                    className="mt-6 w-full"
                    icon={UserPlus}
                >
                    Registrar todo
                </Button>
            </form>

            <ConfirmationModal
                isOpen={resultModal.open}
                onClose={() => setResultModal(prev => ({ ...prev, open: false }))}
                onConfirm={() => setResultModal(prev => ({ ...prev, open: false }))}
                title={resultModal.title}
                message={resultModal.message}
                type={resultModal.type}
                confirmText="Entendido"
                showCancel={false}
            />
        </>
    );
};

export default RegisterPersonForm;
