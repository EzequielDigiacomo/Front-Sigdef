import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { PARENTESCO_MAP } from '../../utils/enums';
import './ClubTutoresForm.css';

const ClubTutoresForm = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [atletas, setAtletas] = useState([]);
    const [selectedAtletaId, setSelectedAtletaId] = useState('');
    const [busquedaAtleta, setBusquedaAtleta] = useState('');

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: '',
        tipoTutor: 0
    });

    useEffect(() => {
        if (id) loadTutor();
        fetchAtletas();
    }, [id]);

    const fetchAtletas = async () => {
        try {
            const todosAtletas = await api.get('/Atleta');
            // Filtrar solo atletas del club actual
            const atletasDelClub = todosAtletas.filter(a => {
                const atletaClubId = a.idClub || a.clubId;
                return atletaClubId === user.clubId;
            });
            setAtletas(atletasDelClub);
        } catch (error) {
            console.error('Error cargando atletas:', error);
        }
    };

    const loadTutor = async () => {
        try {
            const data = await api.get(`/Tutor/${id}`);
            const parentescoKey = Object.keys(PARENTESCO_MAP).find(
                key => PARENTESCO_MAP[key] === data.tipoTutor
            );

            setFormData({
                nombre: data.persona?.nombre || data.nombrePersona?.split(' ')[0] || '',
                apellido: data.persona?.apellido || data.nombrePersona?.split(' ').slice(1).join(' ') || '',
                documento: data.documento || data.persona?.documento || '',
                fechaNacimiento: data.persona?.fechaNacimiento ? data.persona.fechaNacimiento.split('T')[0] : '',
                email: data.email || data.persona?.email || '',
                telefono: data.telefono || data.persona?.telefono || '',
                direccion: data.persona?.direccion || '',
                tipoTutor: parentescoKey ? parseInt(parentescoKey) : 0
            });
        } catch (error) {
            console.error('Error cargando tutor:', error);
            alert('Error al cargar los datos del tutor');
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'select-one' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Preparar payload de Persona
            const fechaNacimientoISO = formData.fechaNacimiento
                ? new Date(formData.fechaNacimiento).toISOString()
                : new Date().toISOString();

            const personaPayload = {
                nombre: formData.nombre,
                apellido: formData.apellido,
                documento: formData.documento,
                fechaNacimiento: fechaNacimientoISO,
                email: formData.email || "",
                telefono: formData.telefono || "",
                direccion: formData.direccion || ""
            };

            const tutorPayload = {
                idPersona: 0, // Se asignará después
                tipoTutor: PARENTESCO_MAP[formData.tipoTutor] || 'Padre'
            };

            let idPersona = null;

            if (id) {
                // MODO EDICIÓN - Solo para tutores existentes
                await api.put(`/Persona/${id}`, personaPayload);
                await api.put(`/Tutor/${id}`, { ...tutorPayload, idPersona: parseInt(id) });
                idPersona = parseInt(id);

            } else {
                // MODO CREACIÓN - Flujo mejorado
                let personaExistente = null;

                // 1. Buscar persona por documento (CON silentErrors: true)
                try {
                    console.log(`🔍 Buscando persona con DNI ${formData.documento}...`);
                    personaExistente = await api.get(`/Persona/documento/${formData.documento}`, {
                        silentErrors: true
                    });

                    if (personaExistente && personaExistente.idPersona) {
                        idPersona = personaExistente.idPersona;
                        console.log('✅ Persona encontrada con ID:', idPersona);

                        // Verificar si ya tiene rol de tutor (SIN silentErrors para ver errores reales)
                        try {
                            const tutorExistente = await api.get(`/Tutor/${idPersona}`);
                            console.log('⚠️ Persona ya es tutor, actualizando...');

                            // Actualizar persona y tutor
                            await api.put(`/Persona/${idPersona}`, personaPayload);
                            await api.put(`/Tutor/${idPersona}`, {
                                ...tutorPayload,
                                idPersona: idPersona
                            });

                        } catch (tutorError) {
                            // Si NO es tutor, verificar si tiene otro rol
                            if (personaExistente.tipoPersona && personaExistente.tipoPersona !== 'Persona Base') {
                                throw new Error(`Esta persona ya tiene el rol de: ${personaExistente.tipoPersona}. No se puede asignar como tutor.`);
                            }

                            // Si es "Persona Base", crear el tutor
                            console.log('➕ Persona existe pero no es tutor, creando tutor...');
                            await api.put(`/Persona/${idPersona}`, personaPayload);
                            await api.post('/Tutor', {
                                ...tutorPayload,
                                idPersona: idPersona
                            });
                        }
                    }
                } catch (searchError) {
                    // ERROR ESPERADO - Persona no encontrada, no es un problema
                    console.log('ℹ️ Persona no encontrada, se creará nueva');
                    // No relanzamos el error, continuamos con el flujo normal
                }

                // 2. Si no se encontró persona, crear nueva
                if (!idPersona) {
                    console.log('➕ Creando nueva persona...');
                    const nuevaPersona = await api.post('/Persona', personaPayload);
                    idPersona = nuevaPersona.idPersona || nuevaPersona.IdPersona;

                    console.log('➕ Creando tutor...');
                    await api.post('/Tutor', {
                        ...tutorPayload,
                        idPersona: idPersona
                    });
                }
            }

            // 3. Vincular con Atleta si se seleccionó uno
            if (selectedAtletaId) {
                try {
                    console.log(`🔗 Vinculando Tutor ${id || 'nuevo'} con Atleta ${selectedAtletaId}...`);

                    // Si es nuevo, necesitamos el ID de la persona del tutor que acabamos de crear/encontrar
                    // En el flujo actual, idPersona ya debería tener el valor correcto
                    let tutorIdParaVinculo = id ? parseInt(id) : idPersona;

                    if (tutorIdParaVinculo) {
                        await api.post('/AtletaTutor', {
                            idAtleta: parseInt(selectedAtletaId),
                            idTutor: tutorIdParaVinculo,
                            parentesco: parseInt(formData.tipoTutor)
                        });
                        console.log('✅ Vinculación exitosa');
                    }
                } catch (linkError) {
                    console.error('Error al vincular atleta:', linkError);
                    // No fallamos todo el proceso si solo falla el vínculo, pero avisamos
                    alert('El tutor se guardó, pero hubo un error al vincularlo con el atleta (posiblemente ya estén vinculados).');
                }
            }

            alert('Tutor guardado exitosamente!');
            navigate('/club/tutores');
        } catch (error) {
            console.error('Error guardando:', error);

            // Manejo específico de errores
            if (error.message.includes('ya tiene otro rol asignado') ||
                error.message.includes('ya tiene el rol de')) {
                alert(`Error: ${error.message}\n\nUna persona no puede tener múltiples roles en el sistema.`);
            } else if (error.message.includes('Ya existe') ||
                error.message.includes('Tutor con')) {
                alert('Error: ' + error.message);
            } else {
                alert('Error al guardar. Revisa la consola para más detalles.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/club/tutores')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Tutor' : 'Nuevo Tutor'}</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <h3 className="form-section-title">Datos Personales del Tutor</h3>

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
                        <div className="form-group">
                            <label>Dirección</label>
                            <input
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        <h3 className="form-section-title">Información del Tutor</h3>

                        <div className="form-group">
                            <label>Tipo de Tutor *</label>
                            <select
                                name="tipoTutor"
                                value={formData.tipoTutor}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                {Object.entries(PARENTESCO_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <h3 className="form-section-title">Asignar Atleta (Opcional)</h3>
                        <div className="form-group">
                            <label>Buscar Atleta (Nombre o DNI)</label>
                            <input
                                type="text"
                                placeholder="Escribe para filtrar..."
                                value={busquedaAtleta}
                                onChange={(e) => setBusquedaAtleta(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Seleccionar Atleta</label>
                            <select
                                value={selectedAtletaId}
                                onChange={(e) => setSelectedAtletaId(e.target.value)}
                                className="form-input"
                            >
                                <option value="">-- Seleccionar Atleta --</option>
                                {atletas
                                    .filter(a => {
                                        if (!busquedaAtleta) return true;
                                        const search = busquedaAtleta.toLowerCase();
                                        const nombre = (a.nombrePersona || '').toLowerCase();
                                        // Asumimos que podemos tener acceso al DNI si viene en el objeto, si no, filtramos por nombre
                                        return nombre.includes(search);
                                    })
                                    .map(atleta => (
                                        <option key={atleta.idPersona} value={atleta.idPersona}>
                                            {atleta.nombrePersona}
                                        </option>
                                    ))
                                }
                            </select>
                            <small>Selecciona un atleta para vincularlo automáticamente a este tutor.</small>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => navigate('/club/tutores')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> {id ? 'Actualizar' : 'Guardar'} Tutor
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ClubTutoresForm;