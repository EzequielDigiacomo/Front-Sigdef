import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save } from 'lucide-react';
import { PARENTESCO_MAP } from '../../../utils/enums';
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

        tipoTutor: 0,
        sexo: 1
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
            navigate('/club/tutores');
        }
    };

    useEffect(() => {
        if (id) loadTutor();
        fetchAtletas();
    }, [id]);

    const fetchAtletas = async () => {
        try {
            // Robust Club ID detection
            const clubId = user?.IdClub || user?.idClub || user?.club?.id || user?.clubId;
            if (!clubId) {
                console.error('No se pudo identificar el Club ID');
                return;
            }

            console.log('Cargando atletas para Club ID:', clubId);

            const [allAtletas, allPersonas, allRelaciones] = await Promise.all([
                api.get('/Atleta'),
                api.get('/Persona'),
                api.get('/AtletaTutor')
            ]);

            // Map Personas for name resolution
            const personasMap = new Map(allPersonas.map(p => [p.idPersona, p]));

            // Set of athletes with tutors
            const atletasConTutorIds = new Set(allRelaciones.map(r => r.idAtleta));

            // Filter athletes: 
            // 1. Belongs to Club
            // 2. Does NOT have a tutor (optional, based on user request "sin tutor asignado")
            // 3. Enrich with Persona data
            const atletasDisponibles = allAtletas
                .filter(a => {
                    const aClubId = a.idClub || a.clubId || a.IdClub; // Check all casing
                    // Loose comparison for ID (string vs number)
                    return aClubId && String(aClubId) === String(clubId);
                })
                .map(a => {
                    const persona = personasMap.get(a.idPersona);
                    return {
                        ...a,
                        nombrePersona: persona ? `${persona.nombre} ${persona.apellido}` : (a.nombrePersona || 'Sin Nombre'),
                        documento: persona ? persona.documento : (a.documento || '-')
                    };
                })
                .filter(a => !atletasConTutorIds.has(a.idPersona)); // Filter out those with tutors

            console.log(`Encontrados ${atletasDisponibles.length} atletas disponibles sin tutor.`);
            setAtletas(atletasDisponibles);

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
                tipoTutor: parentescoKey ? parseInt(parentescoKey) : 0,
                sexo: data.persona?.sexo || 1
            });
        } catch (error) {
            console.error('Error cargando tutor:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Error al cargar los datos del tutor',
                type: 'danger',
                shouldNavigate: true
            });
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

            const fechaNacimientoISO = formData.fechaNacimiento
                ? new Date(formData.fechaNacimiento).toISOString()
                : new Date().toISOString();

            const personaPayload = {
                Nombre: formData.nombre,
                Apellido: formData.apellido,
                Documento: formData.documento,
                Sexo: parseInt(formData.sexo),
                FechaNacimiento: fechaNacimientoISO,
                Email: formData.email || "",
                Telefono: formData.telefono || "",
                Direccion: formData.direccion || ""
            };

            const tutorPayload = {
                IdPersona: 0, // Will be overwritten
                TipoTutor: PARENTESCO_MAP[formData.tipoTutor] || 'Padre'
            };

            let idPersona = null;

            if (id) {

                await api.put(`/Persona/${id}`, personaPayload);
                await api.put(`/Tutor/${id}`, { ...tutorPayload, IdPersona: parseInt(id) });
                idPersona = parseInt(id);

            } else {

                let personaExistente = null;

                try {
                    console.log(`🔍 Buscando persona con DNI ${formData.documento}...`);
                    personaExistente = await api.get(`/Persona/documento/${formData.documento}`, {
                        silentErrors: true
                    });

                    if (personaExistente && personaExistente.idPersona) {
                        idPersona = personaExistente.idPersona;
                        console.log('✅ Persona encontrada con ID:', idPersona);

                        try {
                            const tutorExistente = await api.get(`/Tutor/${idPersona}`, { silentErrors: true });
                            console.log('⚠️ Persona ya es tutor, actualizando...');

                            await api.put(`/Persona/${idPersona}`, personaPayload);
                            await api.put(`/Tutor/${idPersona}`, {
                                ...tutorPayload,
                                IdPersona: idPersona
                            });

                        } catch (tutorError) {

                            if (personaExistente.tipoPersona && personaExistente.tipoPersona !== 'Persona Base') {
                                throw new Error(`Esta persona ya tiene el rol de: ${personaExistente.tipoPersona}. No se puede asignar como tutor.`);
                            }

                            console.log('➕ Persona existe pero no es tutor, creando tutor...');
                            await api.put(`/Persona/${idPersona}`, personaPayload);
                            await api.post('/Tutor', {
                                ...tutorPayload,
                                IdPersona: idPersona
                            });
                        }
                    }
                } catch (searchError) {

                    console.log('ℹ️ Persona no encontrada, se creará nueva');

                }

                if (!idPersona) {
                    console.log('➕ Creando nueva persona...');
                    const nuevaPersona = await api.post('/Persona', personaPayload);
                    idPersona = nuevaPersona.idPersona || nuevaPersona.IdPersona;

                    console.log('➕ Creando tutor...');
                    await api.post('/Tutor', {
                        ...tutorPayload,
                        IdPersona: idPersona
                    });
                }
            }

            if (selectedAtletaId) {
                try {
                    console.log(`🔗 Vinculando Tutor ${id || 'nuevo'} con Atleta ${selectedAtletaId}...`);

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
                }
            }

            setModalConfig({
                isOpen: true,
                title: 'Éxito',
                message: 'Tutor guardado exitosamente!',
                type: 'success',
                shouldNavigate: true
            });
        } catch (error) {
            console.error('Error guardando:', error);

            let errorMessage = 'Error al guardar. Revisa la consola para más detalles.';
            if (error.message.includes('ya tiene otro rol asignado') ||
                error.message.includes('ya tiene el rol de')) {
                errorMessage = `Error: ${error.message}\n\nUna persona no puede tener múltiples roles en el sistema.`;
            } else if (error.message.includes('Ya existe') ||
                error.message.includes('Tutor con')) {
                errorMessage = 'Error: ' + error.message;
            }

            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: errorMessage,
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
                            <label>Sexo *</label>
                            <select
                                name="sexo"
                                value={formData.sexo}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                <option value={1}>Masculino</option>
                                <option value={2}>Femenino</option>
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

export default ClubTutoresForm;
