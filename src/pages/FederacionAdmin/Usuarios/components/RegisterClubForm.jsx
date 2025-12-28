import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import Button from '../../../../components/common/Button';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';
import { api } from '../../../../services/api';

const RegisterClubForm = ({ onUserCreated }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        idClub: '',
        username: '',
        password: '',
        confirmPassword: '',
        estaActivo: true,
        rol: 'Club'
    });

    const isFormValid = formData.idClub &&
        formData.username.length >= 4 &&
        formData.password.length >= 6 &&
        formData.password === formData.confirmPassword;
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [resultModal, setResultModal] = useState({
        open: false,
        type: 'success',
        title: '',
        message: ''
    });

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const data = await api.get('/Club');
                if (data) {
                    setClubs(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Error fetching clubs:', error);
                setResultModal({
                    open: true,
                    type: 'danger',
                    title: 'Error',
                    message: 'Error al cargar la lista de clubes'
                });
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

        if (!formData.idClub) {
            setResultModal({
                open: true,
                type: 'danger',
                title: 'Validación',
                message: 'Debe seleccionar un club'
            });
            return;
        }

        if (formData.username.length <= 4) {
            setResultModal({
                open: true,
                type: 'danger',
                title: 'Validación',
                message: 'El nombre de usuario debe tener más de 4 caracteres'
            });
            return;
        }

        if (formData.password.length < 6) {
            setResultModal({
                open: true,
                type: 'danger',
                title: 'Validación',
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setResultModal({
                open: true,
                type: 'danger',
                title: 'Validación',
                message: 'Las contraseñas no coinciden'
            });
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

            setResultModal({
                open: true,
                type: 'success',
                title: '¡Éxito!',
                message: 'Club registrado exitosamente'
            });

            setFormData({
                idClub: '',
                username: '',
                password: '',
                confirmPassword: '',
                estaActivo: true,
                rol: 'Club'
            });

            if (onUserCreated) onUserCreated();
        } catch (error) {
            setResultModal({
                open: true,
                type: 'danger',
                title: 'Error de Registro',
                message: error.message || 'Error al registrar el club'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="form-container">
                <h3 className="form-title">Registrar Nuevo Club</h3>

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
                    <div className="form-group" style={{ marginBottom: '1rem' }}    >
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

                <div className="form-group checkbox-group ">
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

                <Button
                    type="submit"
                    variant={isFormValid ? "primary" : "secondary"}
                    isLoading={loading}
                    className="mt-6 w-full"
                >
                    Registrar Club
                </Button>
            </form>

            <ConfirmationModal
                isOpen={resultModal.open}
                onClose={() => setResultModal(prev => ({ ...prev, open: false }))}
                onConfirm={() => setResultModal(prev => ({ ...prev, open: false }))}
                title={resultModal.title}
                message={resultModal.message}
                type={resultModal.type}
                confirmText="Entendido"
                showCancel={false}
            />
        </>
    );
};

export default RegisterClubForm;
