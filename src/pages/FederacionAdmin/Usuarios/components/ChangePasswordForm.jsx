import React, { useState } from 'react';
import Button from '../../../../components/common/Button';
import { api } from '../../../../services/api';

const ChangePasswordForm = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.newPassword !== formData.confirmNewPassword) {
            setMessage({ type: 'error', text: 'La nueva contraseña no coincide con la confirmación' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/Auth/cambiar-password', formData);
            setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al cambiar la contraseña' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h3 className="form-title">Cambiar Contraseña</h3>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="currentPassword">Contraseña Actual</label>
                <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="form-input"
                    required
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="newPassword">Nueva Contraseña</label>
                    <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</label>
                    <input
                        type="password"
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        value={formData.confirmNewPassword}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>
            </div>

            <Button type="submit" variant="primary" isLoading={loading}>
                Actualizar Contraseña
            </Button>
        </form>
    );
};

export default ChangePasswordForm;
