
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { CATEGORIA_MAP, SEXO_MAP } from '../../../utils/enums';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import './EntrenadorSeleccion.css';
 
const EntrenadorSeleccionForm = () => {
    const { id, fedId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [clubes, setClubes] = useState([]);
 
    const goBack = () => {
        if (location.state?.returnPath) {
            navigate(location.state.returnPath);
        } else if (fedId) {
            navigate(`/superadmin/federacion/${fedId}/entrenadores`);
        } else {
            navigate('/dashboard/entrenadores');
        }
    };

    // Confirmation Modal State
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationConfig, setConfirmationConfig] = useState({
        type: 'success',
        title: '',
        message: '',
        onConfirm: () => { }
    });

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
        categoriaSeleccion: '0',
        becadoEnard: false,
        becadoSdn: false,
        montoBeca: '',
        presentoAptoMedico: false
    });

    useEffect(() => {
        loadClubes();
        if (id) {
            // Prefill inmediato si venimos del modal/listado con datos
            const prefill = location.state?.entrenador;
            if (prefill) {
                const nombreCompleto = (prefill.nombrePersona || '').trim();
                const parts = nombreCompleto.split(/\s+/);
                const nombreGuess = prefill.nombre || parts[0] || '';
                const apellidoGuess =
                    prefill.apellido || (parts.length > 1 ? parts.slice(1).join(' ') : '');

                setFormData((prev) => ({
                    ...prev,
                    nombre: nombreGuess || prev.nombre,
                    apellido: apellidoGuess || prev.apellido,
                    documento: prefill.documento || prev.documento,
                    email: prefill.email || prev.email,
                    telefono: prefill.telefono || prev.telefono,
                    idClub: prefill.idClub ?? prefill.IdClub ?? prev.idClub,
                    categoriaSeleccion: String(prefill.categoriaSeleccion ?? prefill.CategoriaSeleccion ?? prev.categoriaSeleccion ?? '0'),
                    becadoEnard: !!(prefill.becadoEnard ?? prefill.BecadoEnard ?? prev.becadoEnard),
                    becadoSdn: !!(prefill.becadoSdn ?? prefill.BecadoSdn ?? prev.becadoSdn),
                    montoBeca:
                        prefill.montoBeca != null
                            ? String(prefill.montoBeca)
                            : prev.montoBeca,
                    presentoAptoMedico: !!(
                        prefill.presentoAptoMedico ??
                        prefill.PresentoAptoMedico ??
                        prev.presentoAptoMedico
                    ),
                }));
            }
            loadEntrenador();
        }
    }, [id]);

    const loadClubes = async () => {
        try {
            const data = await api.get('/Club');
            setClubes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error cargando clubes:', error);
        }
    };

    const resolveSexoId = (value) => {
        if (value == null || value === '') return 1;
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
        if (typeof value === 'object') {
            const nested = value.id ?? value.Id ?? value.sexoId ?? value.SexoId;
            return resolveSexoId(nested);
        }
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    };

    const buildPersonaPayload = () => ({
        nombre: formData.nombre,
        apellido: formData.apellido,
        documento: formData.documento,
        fechaNacimiento: formData.fechaNacimiento
            ? new Date(formData.fechaNacimiento).toISOString()
            : new Date().toISOString(),
        email: formData.email || '',
        telefono: formData.telefono || '',
        direccion: formData.direccion || '',
        sexoId: resolveSexoId(formData.sexo),
    });

    const loadEntrenador = async () => {
        try {
            const data = await api.get(`/Entrenador/${id}`);
            const participante = data.participante || data.Participante || {};

            let personaExtra = {};
            try {
                personaExtra = await api.get(`/Persona/${id}`);
            } catch {
                /* opcional */
            }

            const sexoRaw =
                personaExtra.sexoId ??
                personaExtra.SexoId ??
                personaExtra.sexo ??
                personaExtra.Sexo ??
                participante.sexoId ??
                participante.SexoId ??
                participante.sexo ??
                participante.Sexo ??
                1;

            const fecha =
                participante.fechaNacimiento ||
                participante.FechaNacimiento ||
                personaExtra.fechaNacimiento ||
                personaExtra.FechaNacimiento ||
                '';

            setFormData({
                nombre: participante.nombre || participante.Nombre || personaExtra.nombre || personaExtra.Nombre || '',
                apellido: participante.apellido || participante.Apellido || personaExtra.apellido || personaExtra.Apellido || '',
                documento:
                    participante.documento ||
                    participante.Documento ||
                    personaExtra.documento ||
                    personaExtra.Documento ||
                    '',
                sexo: resolveSexoId(sexoRaw),
                fechaNacimiento: fecha ? String(fecha).split('T')[0] : '',
                email: participante.email || participante.Email || personaExtra.email || personaExtra.Email || '',
                telefono:
                    participante.telefono ||
                    participante.Telefono ||
                    personaExtra.telefono ||
                    personaExtra.Telefono ||
                    '',
                direccion:
                    participante.direccion ||
                    participante.Direccion ||
                    personaExtra.direccion ||
                    personaExtra.Direccion ||
                    '',
                idClub: data.idClub ?? data.IdClub ?? '',
                categoriaSeleccion: String(data.categoriaSeleccion ?? data.CategoriaSeleccion ?? '0'),
                becadoEnard: !!(data.becadoEnard ?? data.BecadoEnard),
                becadoSdn: !!(data.becadoSdn ?? data.BecadoSdn),
                montoBeca: (data.montoBeca ?? data.MontoBeca)?.toString?.() || String(data.montoBeca ?? data.MontoBeca ?? ''),
                presentoAptoMedico: !!(data.presentoAptoMedico ?? data.PresentoAptoMedico),
            });
        } catch (error) {
            console.error('Error cargando entrenador:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'montoBeca') {

            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const getMontoBecaNumber = (montoBecaString) => {
        if (montoBecaString === '' || montoBecaString === null || montoBecaString === undefined) {
            return 0;
        }
        const numberValue = parseFloat(montoBecaString);
        return isNaN(numberValue) ? 0 : numberValue;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log('📤 Enviando datos...', formData);

            if (id) {

                console.log('🔄 Actualizando entrenador existente...');

                const personaData = buildPersonaPayload();
                console.log('👤 Datos persona:', personaData);
                await api.put(`/Persona/${id}`, personaData);

                const clubId =
                    formData.idClub && formData.idClub !== '0' && formData.idClub !== ''
                        ? parseInt(formData.idClub, 10)
                        : null;

                const entrenadorData = {
                    participanteId: parseInt(id, 10),
                    ParticipanteId: parseInt(id, 10),
                    idPersona: parseInt(id, 10),
                    idClub: Number.isFinite(clubId) ? clubId : null,
                    licencia: formData.licencia || 'N/A',
                    perteneceSeleccion: true,
                    categoriaSeleccion: String(formData.categoriaSeleccion ?? '0'),
                    becadoEnard: Boolean(formData.becadoEnard),
                    becadoSdn: Boolean(formData.becadoSdn),
                    montoBeca: getMontoBecaNumber(formData.montoBeca),
                    presentoAptoMedico: Boolean(formData.presentoAptoMedico),
                };
                console.log('🏃 Datos entrenador:', entrenadorData);
                await api.put(`/Entrenador/${id}`, entrenadorData);

            } else {

                console.log('🆕 Creando nuevo entrenador...');

                const personaData = buildPersonaPayload();
                console.log('👤 Creando persona:', personaData);
                const personaResponse = await api.post('/Persona', personaData);
                console.log('✅ Persona creada:', personaResponse);

                const idPersona = personaResponse.participanteId || personaResponse.ParticipanteId || personaResponse.idPersona || personaResponse.IdPersona || personaResponse.id;
                console.log('🆔 ID Persona obtenido:', idPersona);

                if (!idPersona) {
                    throw new Error('No se pudo obtener el ID de la persona creada');
                }

                const clubId =
                    formData.idClub && formData.idClub !== '0' && formData.idClub !== ''
                        ? parseInt(formData.idClub, 10)
                        : null;

                const entrenadorData = {
                    participanteId: parseInt(idPersona, 10),
                    ParticipanteId: parseInt(idPersona, 10),
                    idPersona: parseInt(idPersona, 10),
                    idClub: Number.isFinite(clubId) ? clubId : null,
                    licencia: formData.licencia || 'N/A',
                    perteneceSeleccion: true,
                    categoriaSeleccion: String(formData.categoriaSeleccion ?? '0'),
                    becadoEnard: Boolean(formData.becadoEnard),
                    becadoSdn: Boolean(formData.becadoSdn),
                    montoBeca: getMontoBecaNumber(formData.montoBeca),
                    presentoAptoMedico: Boolean(formData.presentoAptoMedico),
                };
                console.log('🏃 Creando entrenador:', entrenadorData);
                await api.post('/Entrenador', entrenadorData);
            }

            console.log('✅ Operación completada exitosamente');

            setConfirmationConfig({
                type: 'success',
                title: 'Operación Exitosa',
                message: id ? 'Entrenador actualizado correctamente.' : 'Entrenador creado correctamente.',
                onConfirm: () => {
                    setShowConfirmation(false);
                    goBack();
                },
                showCancel: false,
                confirmText: 'Continuar'
            });
            setShowConfirmation(true);

        } catch (error) {
            console.error('❌ Error guardando:', error);
            console.error('🔍 Detalles del error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            const errorMessage = error.response?.data?.message || error.response?.data || error.message;
            setConfirmationConfig({
                type: 'danger',
                title: 'Error',
                message: `Error al guardar el entrenador: ${errorMessage} `,
                onConfirm: () => setShowConfirmation(false),
                showCancel: false,
                confirmText: 'Entendido'
            });
            setShowConfirmation(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={goBack}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Entrenador de Selección' : 'Nuevo Entrenador de Selección'}</h2>
                </div>
            </div>

            <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                                    .filter(([key]) => key === "1" || key === "2")
                                    .map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
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
                        <div className="form-group">
                            <label>Dirección</label>
                            <input
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        <h3 className="form-section-title">Datos como Entrenador de Selección</h3>

                        <div className="form-group">
                            <label>Club</label>
                            <select
                                name="idClub"
                                value={formData.idClub}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="">Seleccione un Club</option>
                                <option value="0">--- Sin Club ---</option>
                                {clubes.map(club => (
                                    <option key={club.idClub ?? club.IdClub} value={club.idClub ?? club.IdClub}>
                                        {club.nombre || club.Nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Categoría de Selección *</label>
                            <select
                                name="categoriaSeleccion"
                                value={formData.categoriaSeleccion}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                <option value="0">--- Sin asignar ---</option>
                                {Object.entries(CATEGORIA_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                name="presentoAptoMedico"
                                checked={formData.presentoAptoMedico}
                                onChange={handleChange}
                                id="apto"
                            />
                            <label htmlFor="apto" style={{ marginBottom: 0 }}>
                                Presentó Apto Médico
                            </label>
                        </div>

                        <h3 className="form-section-title">Becas</h3>

                        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                name="becadoEnard"
                                checked={formData.becadoEnard}
                                onChange={handleChange}
                                id="enard"
                            />
                            <label htmlFor="enard" style={{ marginBottom: 0 }}>
                                Becado ENARD
                            </label>
                        </div>

                        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                name="becadoSdn"
                                checked={formData.becadoSdn}
                                onChange={handleChange}
                                id="sdn"
                            />
                            <label htmlFor="sdn" style={{ marginBottom: 0 }}>
                                Becado SDN
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Monto Beca</label>
                            <input
                                type="text"
                                name="montoBeca"
                                value={formData.montoBeca}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Ingrese el monto de la beca"
                                inputMode="decimal"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={goBack}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> {id ? 'Actualizar' : 'Crear'} Entrenador
                        </Button>
                    </div>
                </form>
            </Card>

            <ConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={confirmationConfig.onConfirm}
                title={confirmationConfig.title}
                message={confirmationConfig.message}
                type={confirmationConfig.type}
                confirmText={confirmationConfig.confirmText || 'Confirmar'}
                cancelText={confirmationConfig.cancelText || 'Cancelar'}
                showCancel={confirmationConfig.showCancel !== false}
            />
        </div>
    );
};

export default EntrenadorSeleccionForm;
