import React, { useState, useEffect } from 'react';
import Button from '../../../components/common/Button';
import { api } from '../../../services/api';

const RegisterPersonForm = () => {
    const [formData, setFormData] = useState({
        idPersona: 0,
        idClub: 0,
        username: '',
        password: '',
        confirmPassword: '',
        estaActivo: true,
        rol: ''
    });
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Roles disponibles para registro desde Federación
    const roles = [
        { value: 'Admin', label: 'Administrador' },
        { value: 'Entrenador', label: 'Entrenador' },
        { value: 'Atleta', label: 'Atleta' },
        { value: 'Usuario', label: 'Usuario' }
    ];

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const data = await api.get('/Club');
                if (data) {
                    setClubs(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Error fetching clubs:', error);
            }
        };
        fetchClubs();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        if (!formData.rol) {
            setMessage({ type: 'error', text: 'Debe seleccionar un rol' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/Auth/registrar', formData);
            setMessage({ type: 'success', text: 'Usuario registrado exitosamente' });
            setFormData({
                idPersona: 0,
                idClub: 0,
                username: '',
                password: '',
                confirmPassword: '',
                estaActivo: true,
                rol: ''
            });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al registrar el usuario' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h3 className="form-title">Registrar Nueva Persona</h3>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="username">Nombre de Usuario</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="form-input"
                    required
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="rol">Rol</label>
                    <select
                        id="rol"
                        name="rol"
                        value={formData.rol}
                        onChange={handleChange}
                        className="form-input"
                        required
                    >
                        <option value="">Seleccione un rol</option>
                        {roles.map(role => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="idClub">Club Asociado (Opcional)</label>
                    <select
                        id="idClub"
                        name="idClub"
                        value={formData.idClub}
                        onChange={handleChange}
                        className="form-input"
                    >
                        <option value="0">Ninguno (Federación)</option>
                        {clubs.map(club => (
                            <option key={club.idClub} value={club.idClub}>
                                {club.nombre || `Club ${club.idClub}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        type="text"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                    <input
                        type="text"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>
            </div>

            <div className="form-group checkbox-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        name="estaActivo"
                        checked={formData.estaActivo}
                        onChange={handleChange}
                    />
                    <span>Cuenta Activa</span>
                </label>
            </div>

            <Button type="submit" variant="primary" isLoading={loading}>
                Registrar Usuario
            </Button>
        </form>
    );
};

export default RegisterPersonForm;
