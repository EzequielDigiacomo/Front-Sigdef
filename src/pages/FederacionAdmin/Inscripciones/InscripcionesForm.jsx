import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import '../Atletas/Atletas.css';
import { getCategoriaEdadLabel, getDistanciaShortLabel, getSexoLabel } from '../../../utils/enums';

const InscripcionesForm = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const eventoIdFromUrl = searchParams.get('eventoId');

    const isClubContext = user.role === 'CLUB';

    const [loading, setLoading] = useState(false);
    const [eventos, setEventos] = useState([]);
    const [eventoDetalle, setEventoDetalle] = useState(null);
    const [clubes, setClubes] = useState([]);
    const [atletasDisponibles, setAtletasDisponibles] = useState([]);
    const [atletasSeleccionados, setAtletasSeleccionados] = useState([]);

    const [formData, setFormData] = useState({
        idEvento: eventoIdFromUrl || '',
        idClub: isClubContext ? user.idClub : '',
        fechaInscripcion: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadEventos();

        if (!isClubContext) {
            loadClubes();
        }
    }, []);

    useEffect(() => {
        if (formData.idEvento) {
            loadEventoDetalle(formData.idEvento);
        } else {
            setEventoDetalle(null);
        }
    }, [formData.idEvento]);

    useEffect(() => {
        if (formData.idClub) {
            loadAtletasPorClub(formData.idClub);
        } else {
            setAtletasDisponibles([]);
        }
    }, [formData.idClub]);

    const loadEventos = async () => {
        try {
            const data = await api.get('/Evento');
            const eventosFuturos = data.filter(e => new Date(e.fechaFin) >= new Date());
            setEventos(eventosFuturos);
        } catch (error) {
            console.error('Error cargando eventos:', error);
        }
    };

    const loadEventoDetalle = async (id) => {
        try {
            const data = await api.get(`/Evento/${id}`);
            setEventoDetalle(data);
            checkEventoStatus(data);
        } catch (error) {
            console.error('Error cargando detalle evento:', error);
        }
    };

    const loadClubes = async () => {
        try {
            const data = await api.get('/Club');
            setClubes(data);
        } catch (error) {
            console.error('Error cargando clubes:', error);
        }
    };

    const loadAtletasPorClub = async (idClub) => {
        try {
            const todosAtletas = await api.get('/Atleta');
            const atletasDelClub = todosAtletas.filter(a => a.idClub === parseInt(idClub));

            let atletasParaMostrar = [];

            if (formData.idEvento) {
                const inscripciones = await api.get(`/Inscripcion/evento/${formData.idEvento}`);
                const idsInscritos = inscripciones.map(i => i.idAtleta);
                atletasParaMostrar = atletasDelClub.filter(a => !idsInscritos.includes(a.idPersona));
            } else {
                atletasParaMostrar = atletasDelClub;
            }

            // Enriquecer con datos de Persona para obtener DNI
            const atletasEnriquecidos = await Promise.all(atletasParaMostrar.map(async (atleta) => {
                try {
                    const personaData = await api.get(`/Persona/${atleta.idPersona}`);
                    return {
                        ...atleta,
                        documento: personaData.documento || atleta.documento || '-',
                        nombrePersona: `${personaData.nombre} ${personaData.apellido}` // Asegurar nombre completo
                    };
                } catch (err) {
                    console.warn(`No se pudo cargar persona ${atleta.idPersona}`, err);
                    return atleta;
                }
            }));

            atletasEnriquecidos.sort((a, b) => {
                const catA = a.categoria !== null ? a.categoria : 999;
                const catB = b.categoria !== null ? b.categoria : 999;
                return catA - catB;
            });

            setAtletasDisponibles(atletasEnriquecidos);
        } catch (error) {
            console.error('Error cargando atletas:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const checkEventoStatus = (evento) => {
        const now = new Date();
        const finInsc = evento.fechaFinInscripciones ? new Date(evento.fechaFinInscripciones) : null;
        const finEvento = new Date(evento.fechaFin);

        if (finEvento < now) {
            alert('Advertencia: Este evento ya ha finalizado. Es probable que no se permitan nuevas inscripciones.');
        } else if (finInsc && finInsc < now) {
            alert('Advertencia: El periodo de inscripción para este evento ha finalizado.');
        }
    };

    const handleSelectAtleta = (atleta) => {
        if (!atletasSeleccionados.find(a => a.idPersona === atleta.idPersona)) {
            // No default selection, user must choose from dropdown
            setAtletasSeleccionados(prev => [...prev, { ...atleta, selectedConfigStr: '' }]);
        }
    };

    const handleConfigChange = (idAtleta, configStr) => {
        setAtletasSeleccionados(prev =>
            prev.map(a => (a.idPersona === idAtleta ? { ...a, selectedConfigStr: configStr } : a))
        );
    };

    const handleRemoveAtleta = (idAtleta) => {
        setAtletasSeleccionados(prev => prev.filter(a => a.idPersona !== idAtleta));
    };

    const handleSelectAll = () => {
        const todos = atletasDisponibles.map(atleta => ({ ...atleta, selectedConfigStr: '' }));
        setAtletasSeleccionados(todos);
    };

    const handleClearAll = () => {
        setAtletasSeleccionados([]);
    };

    const parseConfigStr = (str) => {
        if (!str) return null;
        const parts = str.split('|');
        return {
            distancia: parseInt(parts[0]),
            categoria: parseInt(parts[1]),
            sexo: parts[2] && parts[2] !== 'null' ? parseInt(parts[2]) : null
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.idEvento) {
            alert('Debe seleccionar un evento');
            return;
        }
        if (atletasSeleccionados.length === 0) {
            alert('Debe seleccionar al menos un atleta');
            return;
        }

        // Validate that all athletes have a config selected
        const unconfigured = atletasSeleccionados.find(a => !a.selectedConfigStr);
        if (unconfigured) {
            alert(`Por favor seleccione una categoría/distancia para el atleta ${unconfigured.nombrePersona}`);
            return;
        }

        setLoading(true);
        try {
            const fechaISO = new Date(formData.fechaInscripcion + 'T00:00:00Z').toISOString();
            const promesas = atletasSeleccionados.map(atleta => {
                const config = parseConfigStr(atleta.selectedConfigStr);
                return api.post('/Inscripcion', {
                    IdAtleta: atleta.idPersona,
                    IdEvento: parseInt(formData.idEvento),
                    FechaInscripcion: fechaISO,
                    Categoria: config.categoria,
                    Distancia: config.distancia, // Assuming backend accepts this
                    Sexo: config.sexo // Assuming backend accepts this
                });
            });
            await Promise.all(promesas);
            alert(`${atletasSeleccionados.length} atleta(s) inscrito(s) exitosamente`);

            if (isClubContext) {
                navigate('/club/eventos-disponibles');
            } else {
                navigate('/dashboard/inscripciones');
            }
        } catch (error) {
            console.error('Error guardando inscripciones:', error);
            const errorMessage = error.message || 'Error al guardar las inscripciones. Algunos atletas pueden ya estar inscritos.';
            alert(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (isClubContext) {
            navigate('/club/eventos-disponibles');
        } else {
            navigate('/dashboard/inscripciones');
        }
    };

    const getAvailableOptions = () => {
        if (!eventoDetalle || !eventoDetalle.distancias) return [];
        return eventoDetalle.distancias.map(d => {
            const distLabel = getDistanciaShortLabel(d.distanciaRegata || d.distancia);
            // Fix: Check for categoriaEdad, then categoria. Ensure we pass the value, not the whole object if it was malformed.
            const catValue = d.categoriaEdad !== undefined ? d.categoriaEdad : d.categoria;
            const catLabel = getCategoriaEdadLabel(catValue); // This uses CATEGORIA_EDAD_MAP

            // Fix Sex Label logic
            const sexValue = d.sexoCompetencia !== undefined ? d.sexoCompetencia : d.sexo;
            const sexLabel = sexValue !== null && sexValue !== undefined ? getSexoLabel(sexValue) : 'Mixto';

            return {
                value: `${d.distanciaRegata || d.distancia}|${catValue}|${sexValue}`,
                label: `${distLabel} - ${catLabel} (${sexLabel})`
            };
        });
    };

    const options = getAvailableOptions();

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={handleBack}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">Nueva Inscripción</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <div className="form-grid">
                        <h3 className="form-section-title">Datos de la Inscripción</h3>

                        <div className="form-group">
                            <label>Evento *</label>
                            <select
                                name="idEvento"
                                value={formData.idEvento}
                                onChange={handleChange}
                                className="form-input"
                                required
                                disabled={!!eventoIdFromUrl}
                            >
                                <option value="">Seleccione un evento</option>
                                {eventos.map(evento => (
                                    <option key={evento.idEvento} value={evento.idEvento}>
                                        {evento.nombre} ({new Date(evento.fechaInicio).toLocaleDateString()} - {new Date(evento.fechaFin).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                            {eventoIdFromUrl && (
                                <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                                    Evento pre-seleccionado desde eventos disponibles
                                </small>
                            )}
                        </div>

                        {!isClubContext && (
                            <div className="form-group">
                                <label>Club *</label>
                                <select
                                    name="idClub"
                                    value={formData.idClub}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                >
                                    <option value="">Seleccione un club</option>
                                    {clubes.map(club => (
                                        <option key={club.idClub} value={club.idClub}>{club.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Fecha de Inscripción *</label>
                            <input
                                type="date"
                                name="fechaInscripcion"
                                value={formData.fechaInscripcion}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                    </div>
                </Card>

                {formData.idClub && (
                    <Card style={{ marginTop: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="form-section-title" style={{ margin: 0 }}>
                                Atletas Disponibles ({atletasDisponibles.length})
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button type="button" variant="secondary" size="sm" onClick={handleSelectAll}>Seleccionar Todos</Button>
                                <Button type="button" variant="secondary" size="sm" onClick={handleClearAll}>Limpiar</Button>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Atleta</th>
                                        <th>Documento</th>
                                        <th>Categoría</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atletasDisponibles.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center">No hay atletas disponibles en este club</td></tr>
                                    ) : (
                                        atletasDisponibles.map(atleta => (
                                            <tr key={atleta.idPersona}>
                                                <td>{atleta.nombrePersona}</td>
                                                <td>{atleta.documento || '-'}</td>
                                                <td>{atleta.categoria !== null ? getCategoriaEdadLabel(atleta.categoria) : '-'}</td>
                                                <td>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSelectAtleta(atleta)}
                                                        disabled={!!atletasSeleccionados.find(a => a.idPersona === atleta.idPersona)}
                                                    >
                                                        <UserPlus size={18} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {atletasSeleccionados.length > 0 && (
                    <Card style={{ marginTop: '1.5rem' }}>
                        <h3 className="form-section-title">Atletas Seleccionados ({atletasSeleccionados.length})</h3>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Atleta</th>
                                        <th>Documento</th>
                                        <th>Categoría / Distancia</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atletasSeleccionados.map(atleta => (
                                        <tr key={atleta.idPersona}>
                                            <td>{atleta.nombrePersona}</td>
                                            <td>{atleta.documento || '-'}</td>
                                            <td>
                                                <select
                                                    value={atleta.selectedConfigStr || ''}
                                                    onChange={e => handleConfigChange(atleta.idPersona, e.target.value)}
                                                    className="form-input"
                                                    style={{ width: '100%' }}
                                                    required
                                                >
                                                    <option value="">Seleccionar Opción</option>
                                                    {options.map((opt, i) => (
                                                        <option key={i} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-danger"
                                                    onClick={() => handleRemoveAtleta(atleta.idPersona)}
                                                >
                                                    Quitar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                    <Button type="button" variant="secondary" onClick={handleBack}>Cancelar</Button>
                    <Button type="submit" variant="primary" isLoading={loading} disabled={atletasSeleccionados.length === 0}>
                        <Save size={18} /> Inscribir {atletasSeleccionados.length} Atleta(s)
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default InscripcionesForm;
