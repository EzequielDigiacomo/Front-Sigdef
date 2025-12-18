import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save, Search } from 'lucide-react';

const DelegadosForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [clubes, setClubes] = useState([]);

    // Estado del formulario unificado (Persona + Delegado)
    const [formData, setFormData] = useState({
        // Datos Persona
        nombre: '',
        apellido: '',
        documento: '',
        sexo: 1, // Por defecto Masculino
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',

        // Datos Delegado
        idRol: 3, // Delegado Club
        idClub: '', // Vacío implica Agente Libre
        idFederacion: 1
    });

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        shouldNavigate: false
    });

    useEffect(() => {
        loadClubes();
    }, []);

    useEffect(() => {
        if (location.state?.clubId) {
            setFormData(prev => ({ ...prev, idClub: location.state.clubId }));
        }
    }, [location.state]);

    const loadClubes = async () => {
        try {
            const data = await api.get('/Club');
            setClubes(data);
        } catch (error) {
            console.error('Error cargando clubes:', error);
            showModal('Error', 'No se pudieron cargar los clubes.', 'danger');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const showModal = (title, message, type = 'info', shouldNavigate = false) => {
        setModalConfig({ isOpen: true, title, message, type, shouldNavigate });
    };

    const handleModalClose = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (modalConfig.shouldNavigate) {
            navigate('/dashboard/delegados');
        }
    };

    const buscarPersonaPorDni = async () => {
        if (!formData.documento || formData.documento.length < 7) return;

        try {
            const persona = await api.get(`/Persona/documento/${formData.documento}`);
            if (persona) {
                // Populate form with existing persona data
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
                showModal('Persona Encontrada', 'Se han cargado los datos de la persona existente.', 'success');
            }
        } catch (error) {
            // No existe, no hacemos nada (el usuario llenará los datos)
            console.log('Persona no encontrada, continuar carga manual.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Preparar Payload Persona
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

            let idPersonaFinal = null;

            // 2. Buscar o Crear/Actualizar Persona
            try {
                const personaExistente = await api.get(`/Persona/documento/${formData.documento}`);
                if (personaExistente) {
                    idPersonaFinal = personaExistente.idPersona || personaExistente.IdPersona;
                    await api.put(`/Persona/${idPersonaFinal}`, personaPayload);
                }
            } catch (err) {
                // No existe, crear
            }

            if (!idPersonaFinal) {
                const nuevaPersona = await api.post('/Persona', personaPayload);
                idPersonaFinal = nuevaPersona.idPersona || nuevaPersona.IdPersona;
            }

            // 3. Crear Registro Delegado
            const delegadoPayload = {
                idPersona: idPersonaFinal,
                idRol: parseInt(formData.idRol),
                idFederacion: parseInt(formData.idFederacion),
                idClub: formData.idClub ? parseInt(formData.idClub) : null // Agente Libre si es null/vacío
            };

            // Verificamos si ya existe como delegado (opcional, por si acaso)
            // Aquí asumimos POST directo. Si ya existe, el backend podría fallar.
            // Idealmente checkeamos antes, pero por simplicidad hacemos POST.
            // Si el backend soporta upsert o checkeo, mejor.
            // Dado que "DelegadoClub" es la tabla intermedia, podríamos checkear si ya existe.

            await api.post('/DelegadoClub', delegadoPayload);

            showModal('Éxito', 'Delegado guardado correctamente.', 'success', true);

        } catch (error) {
            console.error('Error guardando delegado:', error);
            showModal('Error', error.message || 'Error al guardar el delegado.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/dashboard/delegados')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">Crear / Asignar Delegado</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <h3 className="form-section-title" style={{ gridColumn: '1 / -1' }}>Datos de la Persona</h3>

                        <div className="form-group">
                            <label>DNI *</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    name="documento"
                                    value={formData.documento}
                                    onChange={handleChange}
                                    onBlur={buscarPersonaPorDni}
                                    className="form-input"
                                    required
                                />
                                <Button type="button" variant="secondary" onClick={buscarPersonaPorDni} title="Buscar existencia">
                                    <Search size={18} />
                                </Button>
                            </div>
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

                        <h3 className="form-section-title" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>Datos del Delegado</h3>

                        <div className="form-group">
                            <label>Club (Opcional - Agente Libre)</label>
                            <select
                                name="idClub"
                                value={formData.idClub}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="">-- Agente Libre (Sin Club) --</option>
                                {clubes.map((club) => (
                                    <option key={club.idClub} value={club.idClub}>
                                        {club.nombre} ({club.siglas})
                                    </option>
                                ))}
                            </select>
                            <small className="form-text text-muted">Si no selecciona un club, el delegado quedará como agente libre.</small>
                        </div>

                        <div className="form-group">
                            <label>Rol</label>
                            <select
                                name="idRol"
                                value={formData.idRol}
                                onChange={handleChange}
                                className="form-input"
                                disabled // Por ahora fijo en Delegado
                            >
                                <option value={3}>Delegado Club</option>
                            </select>
                        </div>

                    </div>

                    <div className="form-actions" style={{ marginTop: '2rem' }}>
                        <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/delegados')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} className="mr-2" /> Guardar Delegado
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

export default DelegadosForm;
