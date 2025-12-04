import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/common/Button';
import { api } from '../../../services/api';

const RegisterClubForm = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        idClub: '',
        username: '',
        password: '',
        confirmPassword: '',
        estaActivo: true,
        rol: 'Club'
    });
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const data = await api.get('/Club');
                if (data) {
                    setClubs(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Error fetching clubs:', error);
                setMessage({ type: 'error', text: 'Error al cargar la lista de clubes' });
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

        if (!formData.idClub) {
            setMessage({ type: 'error', text: 'Debe seleccionar un club' });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        setLoading(true);
        try {
            
            const payload = {
                ...formData,
                idClub: Number(formData.idClub),
                rol: 'Club', 
                Role: 'Club' 
            };

            await api.post('/Auth/registrar-club', payload);
            setMessage({ type: 'success', text: 'Club registrado exitosamente' });
            setFormData({
                idClub: '',
                username: '',
                password: '',
                confirmPassword: '',
                estaActivo: true,
                rol: 'Club'
            });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al registrar el club' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h3 className="form-title">Registrar Nuevo Club</h3>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="idClub">Seleccionar Club</label>
                <select
                    id="idClub"
                    name="idClub"
                    value={formData.idClub}
                    onChange={handleChange}
                    className="form-input"
                    required
                >
                    <option value="">Seleccione un club...</option>
                    {clubs.map(club => (
                        <option key={club.idClub} value={club.idClub}>
                            {club.nombre || `Club ${club.idClub}`}
                        </option>
                    ))}
                </select>
                <small className="text-muted">Seleccione el club para crear sus credenciales de acceso</small>
            </div>

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
                Registrar Club
            </Button>
        </form>
    );
};

export default RegisterClubForm;
