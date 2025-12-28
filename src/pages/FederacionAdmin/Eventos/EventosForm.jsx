import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import '../Atletas/Atletas.css';

const EventosForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const tipoEventoMap = {
        'CarreraOficial': 1,
        'Campeonato': 2,
        'Recreativo': 3,
        'Entrenamiento': 4,
        'Clasificatorio': 5
    };

    const distanciaRegataMap = {
        'DoscientosMetros': 1,
        'TrecientosCincuentaMetros': 2,
        'QuatroCientosMetros': 3,
        'QuinientosMetros': 4,
        'MilMetros': 5,
        'DosKilometros': 6,
        'TresKilometros': 7,
        'CincoKilometros': 8,
        'DiezKilometros': 9,
        'QuinceKilometros': 10,
        'VeintiDosKilometros': 11,
        'VeintiCincoKilometros': 12,
        'TreintaDosKilometros': 13
    };

    const getKeyByValue = (object, value) => {
        return Object.keys(object).find(key => object[key] === value);
    };

    const tipoEventoOptions = [
        { value: 'CarreraOficial', label: 'Carrera Oficial' },
        { value: 'Campeonato', label: 'Campeonato' },
        { value: 'Recreativo', label: 'Recreativo' },
        { value: 'Entrenamiento', label: 'Entrenamiento' },
        { value: 'Clasificatorio', label: 'Clasificatorio' },
    ];

    const distanciaRegataOptions = [
        { value: 'DoscientosMetros', label: '200 Metros' },
        { value: 'TrecientosCincuentaMetros', label: '350 Metros' },
        { value: 'QuatroCientosMetros', label: '400 Metros' },
        { value: 'QuinientosMetros', label: '500 Metros' },
        { value: 'MilMetros', label: '1000 Metros' },
        { value: 'DosKilometros', label: '2 Kilómetros' },
        { value: 'TresKilometros', label: '3 Kilómetros' },
        { value: 'CincoKilometros', label: '5 Kilómetros' },
        { value: 'DiezKilometros', label: '10 Kilómetros' },
        { value: 'QuinceKilometros', label: '15 Kilómetros' },
        { value: 'VeintiDosKilometros', label: '22 Kilómetros' },
        { value: 'VeintiCincoKilometros', label: '25 Kilómetros' },
        { value: 'TreintaDosKilometros', label: '32 Kilómetros' },
    ];

    const tipoBoteOptions = [
        { value: 0, label: 'K1' },
        { value: 1, label: 'K2' },
        { value: 2, label: 'K4' },
        { value: 3, label: 'C1' },
        { value: 4, label: 'C2' },
        { value: 5, label: 'C4' }
    ];

    const categoriaOptions = [
        { value: 1, label: 'Preinfantil (6-9 años)' },
        { value: 2, label: 'Infantil (10-12 años)' },
        { value: 3, label: 'Cadete (13-14 años)' },
        { value: 4, label: 'Junior (15-17 años)' },
        { value: 5, label: 'Sub21 (18-20 años)' },
        { value: 6, label: 'Sub23 (18-22 años)' },
        { value: 7, label: 'Senior (18-35 años)' },
        { value: 8, label: 'Master (35+ años)' }
    ];

    const sexoOptions = [
        { value: 1, label: 'Masculino' },
        { value: 2, label: 'Femenino' },
        { value: 3, label: 'Mixto' }
    ];

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        tipoEvento: 'CarreraOficial',
        fechaInicio: '',
        fechaFin: '',
        fechaInicioInscripciones: '',
        fechaFinInscripciones: '',
        ubicacion: '',
        ciudad: '',
        provincia: '',
        distancias: [],
        precioBase: 0,
        cupoMaximo: 100,
        tieneCronometraje: true,
        requiereCertificadoMedico: false,
        observaciones: '',
        idClub: null // Added idClub
    });

    const [newDistancia, setNewDistancia] = useState({ distancia: 'DoscientosMetros', tipoBote: '', categoria: '', sexo: '' });

    useEffect(() => {
        if (id) {
            loadEvento();
        } else if (location.state?.clubId) {
            setFormData(prev => ({ ...prev, idClub: location.state.clubId }));
        }
    }, [id, location.state]);

    const loadEvento = async () => {
        try {
            const data = await api.get(`/Evento/${id}`);

            const tipoEventoStr = getKeyByValue(tipoEventoMap, data.tipoEvento) || 'CarreraOficial';
            // Backend devuelve 'distancias' (EventoResponseDto.Distancias)
            const distanciasRaw = data.distancias || [];
            const distanciasStr = distanciasRaw.map(d => ({
                ...d,
                // Map backend properties to form state
                distancia: getKeyByValue(distanciaRegataMap, d.distanciaRegata) || 'DoscientosMetros',
                categoria: d.categoriaEdad, // Backend EventoDistanciaDto.CategoriaEdad -> form categoria
                sexo: d.sexoCompetencia,    // Backend EventoDistanciaDto.SexoCompetencia -> form sexo
                // tipoBote matches
            }));

            setFormData({
                ...data,
                tipoEvento: tipoEventoStr,
                distancias: distanciasStr,
                fechaInicio: data.fechaInicio ? data.fechaInicio.split('T')[0] : '',
                fechaFin: data.fechaFin ? data.fechaFin.split('T')[0] : '',
                fechaInicioInscripciones: data.fechaInicioInscripciones ? data.fechaInicioInscripciones.split('T')[0] : '',
                fechaFinInscripciones: data.fechaFinInscripciones ? data.fechaFinInscripciones.split('T')[0] : '',
            });
        } catch (error) {
            console.error('Error cargando evento:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddDistancia = () => {
        if (newDistancia.categoria === '' || newDistancia.sexo === '' || newDistancia.tipoBote === '') {
            alert('Por favor complete todos los campos de la distancia');
            return;
        }
        setFormData(prev => ({
            ...prev,
            distancias: [...prev.distancias, newDistancia]
        }));
        setNewDistancia({ distancia: 'DoscientosMetros', tipoBote: '', categoria: '', sexo: '' });
    };

    const handleRemoveDistancia = (index) => {
        setFormData(prev => ({
            ...prev,
            distancias: prev.distancias.filter((_, i) => i !== index)
        }));
    };

    const getDistanciaLabel = (value) => {
        const option = distanciaRegataOptions.find(o => o.value === value);
        return option ? option.label : value;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {

            const payload = {
                ...formData,
                tipoEvento: tipoEventoMap[formData.tipoEvento], // Maps string to int
                // Map form distancias to backend DTO structure
                distancias: formData.distancias.map(d => ({
                    distanciaRegata: distanciaRegataMap[d.distancia],
                    categoriaEdad: parseInt(d.categoria),
                    sexoCompetencia: parseInt(d.sexo),
                    tipoBote: parseInt(d.tipoBote),
                    descripcion: d.descripcion || ''
                })),
                fechaInicio: new Date(formData.fechaInicio).toISOString(),
                fechaFin: new Date(formData.fechaFin).toISOString(),
                fechaInicioInscripciones: formData.fechaInicioInscripciones ? new Date(formData.fechaInicioInscripciones).toISOString() : null,
                fechaFinInscripciones: formData.fechaFinInscripciones ? new Date(formData.fechaFinInscripciones).toISOString() : null,
            };

            // Remove helper property only used in form
            delete payload.eventoDistancias;


            if (id) {
                await api.put(`/Evento/${id}`, payload);
            } else {
                await api.post('/Evento', payload);
            }
            if (location.state?.returnPath) {
                navigate(location.state.returnPath);
            } else {
                navigate('/dashboard/eventos');
            }
        } catch (error) {
            console.error('Error guardando evento:', error);
            alert('Error al guardar el evento. Verifique los datos.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (location.state?.returnPath) {
            navigate(location.state.returnPath);
        } else {
            navigate('/dashboard/eventos');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={handleCancel}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Evento' : 'Nuevo Evento'}</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        { }
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Nombre del Evento *</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} className="form-input" required maxLength={100} />
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Descripción</label>
                            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} className="form-input" maxLength={500} rows={3} />
                        </div>

                        <div className="form-group">
                            <label>Tipo de Evento *</label>
                            <select name="tipoEvento" value={formData.tipoEvento} onChange={handleChange} className="form-input" required>
                                {tipoEventoOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        { }
                        <div className="form-group">
                            <label>Fecha Inicio *</label>
                            <input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Fecha Fin *</label>
                            <input type="date" name="fechaFin" value={formData.fechaFin} onChange={handleChange} className="form-input" required />
                        </div>

                        <div className="form-group">
                            <label>Inicio Inscripciones</label>
                            <input type="date" name="fechaInicioInscripciones" value={formData.fechaInicioInscripciones} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Fin Inscripciones</label>
                            <input type="date" name="fechaFinInscripciones" value={formData.fechaFinInscripciones} onChange={handleChange} className="form-input" />
                        </div>

                        { }
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Ubicación</label>
                            <input name="ubicacion" value={formData.ubicacion} onChange={handleChange} className="form-input" maxLength={200} />
                        </div>
                        <div className="form-group">
                            <label>Ciudad</label>
                            <input name="ciudad" value={formData.ciudad} onChange={handleChange} className="form-input" maxLength={100} />
                        </div>
                        <div className="form-group">
                            <label>Provincia</label>
                            <input name="provincia" value={formData.provincia} onChange={handleChange} className="form-input" maxLength={100} />
                        </div>

                        { }
                        <div className="form-group">
                            <label>Precio Base</label>
                            <input type="number" name="precioBase" value={formData.precioBase} onChange={handleChange} className="form-input" min="0" max="100000" />
                        </div>
                        <div className="form-group">
                            <label>Cupo Máximo</label>
                            <input type="number" name="cupoMaximo" value={formData.cupoMaximo} onChange={handleChange} className="form-input" min="1" max="10000" />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" name="tieneCronometraje" checked={formData.tieneCronometraje} onChange={handleChange} />
                            <label>Tiene Cronometraje</label>
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" name="requiereCertificadoMedico" checked={formData.requiereCertificadoMedico} onChange={handleChange} />
                            <label>Requiere Certificado Médico</label>
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Observaciones</label>
                            <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} className="form-input" maxLength={1000} rows={2} />
                        </div>
                    </div>

                    { }
                    <div style={{ marginTop: '2rem' }}>
                        <h3>Distancias</h3>
                        <div className="form-grid" style={{ alignItems: 'end' }}>
                            <div className="form-group">
                                <label>Distancia</label>
                                <select
                                    value={newDistancia.distancia}
                                    onChange={(e) => setNewDistancia({ ...newDistancia, distancia: e.target.value })}
                                    className="form-input"
                                >
                                    {distanciaRegataOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Bote</label>
                                <select
                                    value={newDistancia.tipoBote}
                                    onChange={(e) => setNewDistancia({ ...newDistancia, tipoBote: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    className="form-input"
                                >
                                    <option value="">Seleccione Bote</option>
                                    {tipoBoteOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Categoría</label>
                                <select
                                    value={newDistancia.categoria}
                                    onChange={(e) => setNewDistancia({ ...newDistancia, categoria: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    className="form-input"
                                >
                                    <option value="">Seleccione Categoría</option>
                                    {categoriaOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Sexo</label>
                                <select
                                    value={newDistancia.sexo}
                                    onChange={(e) => setNewDistancia({ ...newDistancia, sexo: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    className="form-input"
                                >
                                    <option value="">Seleccione Sexo</option>
                                    {sexoOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <Button type="button" onClick={handleAddDistancia} variant="secondary">
                                    <Plus size={18} /> Agregar
                                </Button>
                            </div>
                        </div>

                        <div className="table-responsive" style={{ marginTop: '1rem' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Distancia</th>
                                        <th>Bote</th>
                                        <th>Categoría</th>
                                        <th>Sexo</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.distancias.map((dist, index) => (
                                        <tr key={index}>
                                            <td>{getDistanciaLabel(dist.distancia)}</td>
                                            <td>{tipoBoteOptions.find(b => b.value === dist.tipoBote)?.label || '-'}</td>
                                            <td>{categoriaOptions.find(c => c.value === dist.categoria)?.label || '-'}</td>
                                            <td>{sexoOptions.find(s => s.value === dist.sexo)?.label || '-'}</td>
                                            <td>
                                                <Button type="button" variant="ghost" size="sm" className="text-danger" onClick={() => handleRemoveDistancia(index)}>
                                                    <Trash2 size={18} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {formData.distancias.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center">No hay distancias agregadas</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="form-actions" style={{ marginTop: '2rem' }}>
                        <Button type="button" variant="secondary" onClick={handleCancel}>Cancelar</Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> Guardar Evento
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EventosForm;
