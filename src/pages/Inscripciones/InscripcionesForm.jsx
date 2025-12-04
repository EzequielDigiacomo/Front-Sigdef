import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import '../Atletas/Atletas.css';
import { getCategoriaLabel } from '../../utils/enums';

const InscripcionesForm = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const eventoIdFromUrl = searchParams.get('eventoId');

    // Determinar si es contexto de club
    const isClubContext = user.role === 'CLUB';

    const [loading, setLoading] = useState(false);
    const [eventos, setEventos] = useState([]);
    const [clubes, setClubes] = useState([]);
    const [atletasDisponibles, setAtletasDisponibles] = useState([]);
    const [atletasSeleccionados, setAtletasSeleccionados] = useState([]);

    const [formData, setFormData] = useState({
        idEvento: eventoIdFromUrl || '',
        idClub: isClubContext ? user.idClub : '',
        fechaInscripcion: new Date().toISOString().split('T')[0]
    });

    // Carga inicial de eventos y clubes
    useEffect(() => {
        loadEventos();

        if (!isClubContext) {
            // Solo cargar clubes si es contexto de federación
            loadClubes();
        }
    }, []);

    // Cuando cambia el club, recargar atletas del club
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

            // Ordenar por categoría (0 a 7)
            atletasParaMostrar.sort((a, b) => {
                const catA = a.categoria !== null ? a.categoria : 999;
                const catB = b.categoria !== null ? b.categoria : 999;
                return catA - catB;
            });

            setAtletasDisponibles(atletasParaMostrar);
        } catch (error) {
            console.error('Error cargando atletas:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Seleccionar atleta y crear campo editable de categoría
    const handleSelectAtleta = (atleta) => {
        if (!atletasSeleccionados.find(a => a.idPersona === atleta.idPersona)) {
            const atletaConCategoria = { ...atleta, categoriaSeleccionada: atleta.categoria || '' };
            setAtletasSeleccionados(prev => [...prev, atletaConCategoria]);
        }
    };

    // Cambiar categoría de un atleta seleccionado
    const handleCategoryChange = (idAtleta, nuevaCategoria) => {
        setAtletasSeleccionados(prev =>
            prev.map(a => (a.idPersona === idAtleta ? { ...a, categoriaSeleccionada: nuevaCategoria } : a))
        );
    };

    const handleRemoveAtleta = (idAtleta) => {
        setAtletasSeleccionados(prev => prev.filter(a => a.idPersona !== idAtleta));
    };

    const handleSelectAll = () => {
        // Al seleccionar todos, copiamos la categoría actual de cada atleta
        const todosConCategoria = atletasDisponibles.map(atleta => ({ ...atleta, categoriaSeleccionada: atleta.categoria || '' }));
        setAtletasSeleccionados(todosConCategoria);
    };

    const handleClearAll = () => {
        setAtletasSeleccionados([]);
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
        setLoading(true);
        try {
            const fechaISO = new Date(formData.fechaInscripcion + 'T00:00:00Z').toISOString();
            const promesas = atletasSeleccionados.map(atleta =>
                api.post('/Inscripcion', {
                    IdAtleta: atleta.idPersona,
                    IdEvento: parseInt(formData.idEvento),
                    FechaInscripcion: fechaISO,
                    Categoria: atleta.categoriaSeleccionada || null
                })
            );
            await Promise.all(promesas);
            alert(`${atletasSeleccionados.length} atleta(s) inscrito(s) exitosamente`);

            // Navegar según contexto
            if (isClubContext) {
                navigate('/club/eventos-disponibles');
            } else {
                navigate('/dashboard/inscripciones');
            }
        } catch (error) {
            console.error('Error guardando inscripciones:', error);
            alert('Error al guardar las inscripciones. Algunos atletas pueden ya estar inscritos.');
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

                {/* Tabla de atletas disponibles */}
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
                                                <td>{atleta.categoria !== null ? getCategoriaLabel(atleta.categoria) : '-'}</td>
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

                {/* Tabla de atletas seleccionados */}
                {atletasSeleccionados.length > 0 && (
                    <Card style={{ marginTop: '1.5rem' }}>
                        <h3 className="form-section-title">Atletas Seleccionados ({atletasSeleccionados.length})</h3>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Atleta</th>
                                        <th>Documento</th>
                                        <th>Categoria</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atletasSeleccionados.map(atleta => (
                                        <tr key={atleta.idPersona}>
                                            <td>{atleta.nombrePersona}</td>
                                            <td>{atleta.documento || '-'}</td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={atleta.categoriaSeleccionada}
                                                    onChange={e => handleCategoryChange(atleta.idPersona, e.target.value)}
                                                    className="form-input"
                                                    placeholder="Categoria"
                                                    style={{ width: '100%' }}
                                                />
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
