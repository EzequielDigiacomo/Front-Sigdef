import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { DISTANCIA_REGATA_MAP, CATEGORIA_EDAD_MAP, SEXO_MAP } from '../../../utils/enums';
import './ClubEventos.css';

const ClubEventosForm = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        onConfirm: () => { },
        showCancel: false
    });

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        tipoEvento: 1,
        fechaInicio: '',
        fechaFin: '',
        fechaInicioInscripciones: '',
        fechaFinInscripciones: '',
        ubicacion: '',
        ciudad: '',
        provincia: '',
        estado: 'PROGRAMADO',
        cupoMaximo: '',
        precioBase: '',
        tieneCronometraje: false,
        requiereCertificadoMedico: false,
        observaciones: '',
        distancias: []
    });

    useEffect(() => {
        if (id) {
            loadEvento();
        }
    }, [id]);

    const loadEvento = async () => {
        try {
            const data = await api.get(`/Evento/${id}`);
            setFormData({
                nombre: data.nombre || '',
                descripcion: data.descripcion || '',
                tipoEvento: data.tipoEvento || 1,
                fechaInicio: data.fechaInicio ? data.fechaInicio.split('T')[0] : '',
                fechaFin: data.fechaFin ? data.fechaFin.split('T')[0] : '',
                fechaInicioInscripciones: data.fechaInicioInscripciones ? data.fechaInicioInscripciones.split('T')[0] : '',
                fechaFinInscripciones: data.fechaFinInscripciones ? data.fechaFinInscripciones.split('T')[0] : '',
                ubicacion: data.ubicacion || '',
                ciudad: data.ciudad || '',
                provincia: data.provincia || '',
                cupoMaximo: data.cupoMaximo || '',
                precioBase: data.precioBase || '',
                tieneCronometraje: data.tieneCronometraje || false,
                requiereCertificadoMedico: data.requiereCertificadoMedico || false,
                observaciones: data.observaciones || '',
                distancias: data.distancias || [],
                estado: data.estado || 'PROGRAMADO'
            });
        } catch (error) {
            console.error('Error cargando evento:', error);
            setModalConfig({
                isOpen: true,
                type: 'danger',
                title: 'Error',
                message: 'Error al cargar el evento',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
                showCancel: false
            });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDistanciaChange = (index, field, value) => {
        const newDistancias = [...formData.distancias];
        // Ensure nested object exists
        if (!newDistancias[index]) return;
        newDistancias[index][field] = value;
        setFormData(prev => ({ ...prev, distancias: newDistancias }));
    };

    const addDistancia = () => {
        setFormData(prev => ({
            ...prev,
            distancias: [...prev.distancias, { distancia: '', categoria: '', sexo: '', descripcion: '' }]
        }));
    };

    const removeDistancia = (index) => {
        setFormData(prev => ({
            ...prev,
            distancias: prev.distancias.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (new Date(formData.fechaFin) < new Date(formData.fechaInicio)) {
                setModalConfig({
                    isOpen: true,
                    type: 'danger',
                    title: 'Error de Fechas',
                    message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
                    onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
                    showCancel: false
                });
                setLoading(false);
                return;
            }

            if (formData.fechaFinInscripciones && new Date(formData.fechaFinInscripciones) > new Date(formData.fechaInicio)) {
                setModalConfig({
                    isOpen: true,
                    type: 'danger',
                    title: 'Error de Fechas',
                    message: 'Las inscripciones no pueden cerrar después del inicio del evento',
                    onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
                    showCancel: false
                });
                setLoading(false);
                return;
            }

            const payload = {
                ...formData,
                IdClub: user.IdClub || user.idClub || user.clubId, // Sending PascalCase as requested
                nombre: formData.nombre,
                descripcion: formData.descripcion,
                tipoEvento: parseInt(formData.tipoEvento),
                fechaInicio: new Date(formData.fechaInicio).toISOString(),
                fechaFin: new Date(formData.fechaFin).toISOString(),
                fechaInicioInscripciones: formData.fechaInicioInscripciones ? new Date(formData.fechaInicioInscripciones).toISOString() : null,
                fechaFinInscripciones: formData.fechaFinInscripciones ? new Date(formData.fechaFinInscripciones).toISOString() : null,
                ubicacion: formData.ubicacion,
                ciudad: formData.ciudad,
                provincia: formData.provincia,
                cupoMaximo: formData.cupoMaximo ? parseInt(formData.cupoMaximo) : 0,
                precioBase: formData.precioBase ? parseFloat(formData.precioBase) : 0,
                tieneCronometraje: formData.tieneCronometraje,
                requiereCertificadoMedico: formData.requiereCertificadoMedico,
                observaciones: formData.observaciones,
                distancias: formData.distancias.map(d => ({
                    distancia: parseInt(d.distancia),
                    categoria: parseInt(d.categoria),
                    sexo: d.sexo ? parseInt(d.sexo) : null,
                    descripcion: d.descripcion
                }))
            };

            if (id) {
                await api.put(`/Evento/${id}`, payload);
            } else {
                await api.post('/Evento', payload);
            }

            setModalConfig({
                isOpen: true,
                type: 'success',
                title: '¡Éxito!',
                message: 'Evento guardado exitosamente',
                onConfirm: () => {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    navigate('/club/eventos');
                },
                showCancel: false
            });
        } catch (error) {
            console.error('Error guardando evento:', error);
            setModalConfig({
                isOpen: true,
                type: 'danger',
                title: 'Error',
                message: error.response?.data?.message || 'Error al guardar el evento. Intente nuevamente.',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
                showCancel: false
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/club/eventos')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Evento' : 'Nuevo Evento'}</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {/* Información General */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Nombre del Evento *</label>
                            <input
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Ej: Torneo Apertura 2024"
                                required
                            />
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Descripción</label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                className="form-input"
                                rows="3"
                                placeholder="Descripción detallada del evento..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Tipo de Evento</label>
                            <select
                                name="tipoEvento"
                                value={formData.tipoEvento}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="1">Carrera Oficial</option>
                                <option value="2">Campeonato</option>
                                <option value="3">Recreativo</option>
                                <option value="4">Entrenamiento</option>
                                <option value="5">Clasificatorio</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Estado</label>
                            <select
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="PROGRAMADO">Programado</option>
                                <option value="EN_CURSO">En Curso</option>
                                <option value="FINALIZADO">Finalizado</option>
                            </select>
                        </div>

                        {/* Fechas */}
                        <div className="form-group">
                            <label>Inicio Evento *</label>
                            <input
                                type="datetime-local"
                                name="fechaInicio"
                                value={formData.fechaInicio}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Fin Evento *</label>
                            <input
                                type="datetime-local"
                                name="fechaFin"
                                value={formData.fechaFin}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Apertura Inscripciones</label>
                            <input
                                type="datetime-local"
                                name="fechaInicioInscripciones"
                                value={formData.fechaInicioInscripciones}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Cierre Inscripciones</label>
                            <input
                                type="datetime-local"
                                name="fechaFinInscripciones"
                                value={formData.fechaFinInscripciones}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        {/* Ubicación */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Ubicación (Dirección) *</label>
                            <input
                                name="ubicacion"
                                value={formData.ubicacion}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Ej: Club Central, Av. Principal 123"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Ciudad</label>
                            <input
                                name="ciudad"
                                value={formData.ciudad}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Provincia</label>
                            <input
                                name="provincia"
                                value={formData.provincia}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>

                        {/* Detalles y Configuración */}
                        <div className="form-group">
                            <label>Cupo Máximo</label>
                            <input
                                type="number"
                                name="cupoMaximo"
                                value={formData.cupoMaximo}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Ej: 500"
                            />
                        </div>

                        <div className="form-group">
                            <label>Precio Base ($)</label>
                            <input
                                type="number"
                                name="precioBase"
                                value={formData.precioBase}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                            <input
                                type="checkbox"
                                name="tieneCronometraje"
                                checked={formData.tieneCronometraje}
                                onChange={handleChange}
                                id="chkCronometraje"
                            />
                            <label htmlFor="chkCronometraje" style={{ marginBottom: 0, cursor: 'pointer' }}>Tiene Cronometraje</label>
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                            <input
                                type="checkbox"
                                name="requiereCertificadoMedico"
                                checked={formData.requiereCertificadoMedico}
                                onChange={handleChange}
                                id="chkCertificado"
                            />
                            <label htmlFor="chkCertificado" style={{ marginBottom: 0, cursor: 'pointer' }}>Requiere Certificado Médico</label>
                        </div>

                        {/* Observaciones */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Observaciones</label>
                            <textarea
                                name="observaciones"
                                value={formData.observaciones}
                                onChange={handleChange}
                                className="form-input"
                                rows="2"
                            />
                        </div>

                        {/* Distancias y Categorías */}
                        <div className="form-section" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '1.1rem', fontWeight: 600 }}>Distancias, Categorías y Sexo</label>
                                <Button type="button" size="sm" variant="secondary" onClick={addDistancia}>
                                    <Plus size={16} /> Agregar Distancia
                                </Button>
                            </div>

                            {formData.distancias.map((item, index) => (
                                <div key={index} className="distancia-card">
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.8rem' }}>Distancia *</label>
                                        <select
                                            value={item.distancia}
                                            onChange={(e) => handleDistanciaChange(index, 'distancia', e.target.value)}
                                            className="form-input"
                                            required
                                        >
                                            <option value="">Seleccionar</option>
                                            {Object.entries(DISTANCIA_REGATA_MAP).map(([key, label]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.8rem' }}>Categoría *</label>
                                        <select
                                            value={item.categoria}
                                            onChange={(e) => handleDistanciaChange(index, 'categoria', e.target.value)}
                                            className="form-input"
                                            required
                                        >
                                            <option value="">Seleccionar</option>
                                            {Object.entries(CATEGORIA_EDAD_MAP).map(([key, label]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.8rem' }}>Sexo</label>
                                        <select
                                            value={item.sexo || ''}
                                            onChange={(e) => handleDistanciaChange(index, 'sexo', e.target.value)}
                                            className="form-input"
                                        >
                                            <option value="">Mixto/Todos</option>
                                            {Object.entries(SEXO_MAP).map(([key, label]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.8rem' }}>Descripción</label>
                                        <input
                                            value={item.descripcion}
                                            onChange={(e) => handleDistanciaChange(index, 'descripcion', e.target.value)}
                                            className="form-input"
                                            placeholder="Ej: Competitiva"
                                        />
                                    </div>

                                    <Button type="button" variant="ghost" className="text-danger" onClick={() => removeDistancia(index)} title="Eliminar">
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            ))}
                        </div>

                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => navigate('/club/eventos')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> {id ? 'Actualizar' : 'Guardar'} Evento
                        </Button>
                    </div>
                </form>
            </Card>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                showCancel={modalConfig.showCancel}
                confirmText="Aceptar"
            />
        </div>
    );
};

export default ClubEventosForm;
