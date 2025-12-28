import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { api } from '../../../../services/api';

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
    const [formData, setFormData] = useState({
        username: '',
        estaActivo: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                estaActivo: user.estaActivo
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            
            const payload = {
                username: formData.username,
                estaActivo: formData.estaActivo
            };

            await api.put(`/Usuario/${user.idUsuario}`, payload);
            onUserUpdated();
            onClose();
        } catch (err) {
            console.error('Error actualizando usuario:', err);
            setError('Error al actualizar el usuario. Verifique los datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Usuario"
            footer={
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} isLoading={loading}>Guardar Cambios</Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="form-container" style={{ padding: 0, boxShadow: 'none' }}>
                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-group">
                    <label htmlFor="edit-username">Nombre de Usuario</label>
                    <input
                        type="text"
                        id="edit-username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
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
            </form>
        </Modal>
    );
};

export default EditUserModal;
