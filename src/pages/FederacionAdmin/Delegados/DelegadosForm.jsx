import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { ArrowLeft, Save } from 'lucide-react';

const DelegadosForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [personas, setPersonas] = useState([]);
    const [clubes, setClubes] = useState([]);

    const [formData, setFormData] = useState({
        idPersona: '',
        idRol: 3, // Delegado Club (predeterminado)
        idClub: '',
        idFederacion: 1 // Predeterminado
    });

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        shouldNavigate: false
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [personasData, clubesData] = await Promise.all([
                api.get('/Persona'),
                api.get('/Club')
            ]);

            // Filtrar solo personas mayores de edad (18 años o más)
            const today = new Date();
            const personasMayores = personasData.filter(persona => {
                if (!persona.fechaNacimiento) return false;
                const birthDate = new Date(persona.fechaNacimiento);
                const age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();

                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    return age - 1 >= 18;
                }
                return age >= 18;
            });

            setPersonas(personasMayores);
            setClubes(clubesData);
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Error al cargar los datos necesarios.',
                type: 'danger',
                shouldNavigate: true
            });
        }
    };

    const handleModalClose = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        if (modalConfig.shouldNavigate) {
            navigate('/dashboard/delegados');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                idPersona: parseInt(formData.idPersona),
                idRol: parseInt(formData.idRol),
                idFederacion: 1, // Siempre 1 para federación
                idClub: parseInt(formData.idClub)
            };

            await api.post('/DelegadoClub', payload);

            setModalConfig({
                isOpen: true,
                title: 'Éxito',
                message: 'Delegado asignado exitosamente!',
                type: 'success',
                shouldNavigate: true
            });
        } catch (error) {
            console.error('Error guardando delegado:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: error.message || 'Error al asignar el delegado. Verifica que la persona no esté ya asignada como delegado.',
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
                    <Button variant="ghost" onClick={() => navigate('/dashboard/delegados')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="page-title">Asignar Delegado Club</h2>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <h3 className="form-section-title">Información del Delegado</h3>

                        <div className="form-group">
                            <label>Persona (Mayor de edad) *</label>
                            <select
                                name="idPersona"
                                value={formData.idPersona}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                <option value="">Seleccione una persona</option>
                                {personas.map((persona) => (
                                    <option key={persona.idPersona} value={persona.idPersona}>
                                        {persona.nombre} {persona.apellido} - DNI: {persona.documento}
                                    </option>
                                ))}
                            </select>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                Solo se muestran personas mayores de 18 años
                            </small>
                        </div>

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
                                {clubes.map((club) => (
                                    <option key={club.idClub} value={club.idClub}>
                                        {club.nombre} ({club.siglas})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{
                            padding: '1rem',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'block' }}>
                                <strong>Rol:</strong> Delegado Club (asignado automáticamente)
                            </small>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'block', marginTop: '0.5rem' }}>
                                <strong>Federación:</strong> Federación Principal (asignada automáticamente)
                            </small>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/delegados')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            <Save size={18} /> Asignar Delegado
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
