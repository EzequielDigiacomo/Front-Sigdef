import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { PARENTESCO_MAP } from '../../../utils/enums';

const TutoresForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [atletasMenores, setAtletasMenores] = useState([]);
    const [relacionesExistentes, setRelacionesExistentes] = useState([]);

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        direccion: ''
    });

    const [linkData, setLinkData] = useState({
        idAtleta: '',
        idParentesco: '0'
    });

    useEffect(() => {
        loadInitialData();
        if (id) loadTutor();
    }, [id]);

    const loadInitialData = async () => {
        try {
            const [atletasRes, relacionesRes, clubesRes] = await Promise.all([
                api.get('/Atleta'),
                api.get('/AtletaTutor'),
                api.get('/Club')
            ]);

            const clubesMap = new Map((clubesRes || []).map(c => [c.idClub || c.IdClub, c]));

            // Filtrar y enriquecer atletas menores de 18 años
            const menores = (atletasRes || []).filter(atleta => {
                const persona = atleta.persona || atleta.Persona || {};
                const fechaNac = atleta.fechaNacimiento || persona.fechaNacimiento || persona.FechaNacimiento;

                if (!fechaNac) return false;

                const hoy = new Date();
                const nacimiento = new Date(fechaNac);
                let edad = hoy.getFullYear() - nacimiento.getFullYear();
                const mes = hoy.getMonth() - nacimiento.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
                return edad < 18;
            }).map(atleta => {
                const persona = atleta.persona || atleta.Persona || {};
                const club = clubesMap.get(atleta.idClub || atleta.IdClub);

                // Asegurar que tenemos nombre y documento
                const nombre = atleta.nombrePersona || atleta.NombrePersona ||
                    (persona.nombre && persona.apellido ? `${persona.nombre} ${persona.apellido}` : null) ||
                    persona.NombreCompleto || 'Atleta';

                const documento = atleta.documento || atleta.Documento || persona.documento || persona.Documento || '-';

                return {
                    ...atleta,
                    displayNombre: nombre,
                    displayDocumento: documento,
                    nombreClub: club ? (club.nombre || club.Nombre) : 'Agente Libre'
                };
            });

            setAtletasMenores(menores);
            setRelacionesExistentes(relacionesRes);
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
        }
    };

    const loadTutor = async () => {
        try {
            const data = await api.get(`/Tutor/${id}`);
            setFormData({
                nombre: data.persona?.nombre || '',
                apellido: data.persona?.apellido || '',
                documento: data.persona?.documento || '',
                fechaNacimiento: data.persona?.fechaNacimiento ? data.persona.fechaNacimiento.split('T')[0] : '',
                email: data.persona?.email || '',
                telefono: data.persona?.telefono || '',
                direccion: data.persona?.direccion || ''
            });

            // Si es edición, buscar si ya tiene un atleta vinculado
            const rel = relacionesExistentes.find(r => (r.idTutor || r.IdTutor) === parseInt(id));
            if (rel) {
                setLinkData({
                    idAtleta: rel.idAtleta || rel.IdAtleta || '',
                    idParentesco: (rel.idParentesco || rel.IdParentesco || 0).toString()
                });
            }
        } catch (error) {
            console.error('Error cargando tutor:', error);
        }
    };

    // Actualizar linkData cuando relacionesExistentes se carguen y estemos en modo edición
    useEffect(() => {
        if (id && relacionesExistentes.length > 0) {
            const rel = relacionesExistentes.find(r => (r.idTutor || r.IdTutor) === parseInt(id));
            if (rel) {
                setLinkData({
                    idAtleta: rel.idAtleta || rel.IdAtleta || '',
                    idParentesco: (rel.idParentesco || rel.IdParentesco || 0).toString()
                });
            }
        }
    }, [relacionesExistentes, id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLinkChange = (e) => {
        const { name, value } = e.target;
        setLinkData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let idPersonaFinal = id;

            // Preparar payload de Persona (estandarizado con AtletasForm)
            const personaPayload = {
                Nombre: formData.nombre,
                Apellido: formData.apellido,
                Documento: formData.documento.replace(/[\s.]/g, ''),
                Sexo: 1, // Por defecto masculino para tutores si no se pide
                FechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : new Date().toISOString(),
                Email: formData.email.trim() === '' ? null : formData.email,
                Telefono: formData.telefono.trim() === '' ? null : formData.telefono,
                Direccion: formData.direccion || ''
            };

            if (id) {
                // Actualizar Persona
                await api.put(`/Persona/${id}`, personaPayload);
            } else {
                // Crear Persona
                const personaResponse = await api.post('/Persona', personaPayload);

                idPersonaFinal = personaResponse.IdPersona || personaResponse.idPersona;

                // Crear Tutor
                await api.post('/Tutor', {
                    IdPersona: idPersonaFinal,
                    TipoTutor: PARENTESCO_MAP[linkData.idParentesco] || 'Otro'
                });
            }

            // --- PROCESAR VÍNCULO CON ATLETA ---
            if (linkData.idAtleta) {
                const idAtletaInt = parseInt(linkData.idAtleta);

                // 1. Desvincular si el atleta ya tiene otro tutor (requisito del usuario)
                const existingRelAtleta = relacionesExistentes.find(r => (r.idAtleta || r.IdAtleta) === idAtletaInt);
                if (existingRelAtleta && (existingRelAtleta.idTutor || existingRelAtleta.IdTutor) !== idPersonaFinal) {
                    const idRel = existingRelAtleta.idAtletaTutor || existingRelAtleta.IdAtletaTutor || existingRelAtleta.id;
                    if (idRel) await api.delete(`/AtletaTutor/${idRel}`);
                }

                // 2. Desvincular si el tutor ya tiene otro atleta (limpieza de relación previa si existe)
                const existingRelTutor = relacionesExistentes.find(r => (r.idTutor || r.IdTutor) === idPersonaFinal);
                if (existingRelTutor) {
                    const idRel = existingRelTutor.idAtletaTutor || existingRelTutor.IdAtletaTutor || existingRelTutor.id;
                    if (idRel) await api.delete(`/AtletaTutor/${idRel}`);
                }

                // 3. Crear nuevo vínculo
                await api.post('/AtletaTutor', {
                    IdAtleta: idAtletaInt,
                    IdTutor: idPersonaFinal,
                    IdParentesco: parseInt(linkData.idParentesco)
                });
            }

            navigate('/dashboard/tutores');
        } catch (error) {
            console.error('Error guardando:', error);
            alert('Error al guardar el tutor. Verifica los datos e intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/dashboard/tutores')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">{id ? 'Editar Tutor' : 'Nuevo Tutor'}</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <h3 className="form-section-title" style={{ gridColumn: '1 / -1' }}>Datos Personales</h3>
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
                            <label>Fecha de Nacimiento *</label>
                            <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Dirección</label>
                            <input name="direccion" value={formData.direccion} onChange={handleChange} className="form-input" />
                        </div>

                        <h3 className="form-section-title" style={{ gridColumn: '1 / -1', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserPlus size={20} /> Vincular Atleta Menor (Opcional)
                        </h3>
                        <div className="form-group">
                            <label>Atleta Menor</label>
                            <select
                                name="idAtleta"
                                value={linkData.idAtleta}
                                onChange={handleLinkChange}
                                className="form-input"
                            >
                                <option value="">Ninguno / Sin vincular</option>
                                {atletasMenores.map(atleta => (
                                    <option key={atleta.idPersona} value={atleta.idPersona}>
                                        {atleta.displayNombre} - DNI: {atleta.displayDocumento} (Club: {atleta.nombreClub})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Parentesco</label>
                            <select
                                name="idParentesco"
                                value={linkData.idParentesco}
                                onChange={handleLinkChange}
                                className="form-input"
                                disabled={!linkData.idAtleta}
                            >
                                {Object.entries(PARENTESCO_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/tutores')}>Cancelar</Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> Guardar Tutor
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default TutoresForm;
