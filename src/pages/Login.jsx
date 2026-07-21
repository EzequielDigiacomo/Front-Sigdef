import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { Eye, EyeOff, HelpCircle, Send } from 'lucide-react';
import { useDevice } from '../hooks/useDevice';
import Modal from '../components/common/Modal';
import { api } from '../services/api';
import './Login.css';

const Login = () => {
    const { isNative } = useDevice();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotUsername, setForgotUsername] = useState('');
    const [forgotNota, setForgotNota] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (showForgotModal) {
            setForgotUsername(username.trim());
            setForgotNota('');
            setForgotError('');
            setForgotSuccess('');
        }
    }, [showForgotModal, username]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await login(username, password);
            if (success) {
                navigate('/', { replace: true });
            }
        } catch (err) {
            setError(err.message || 'Ocurrió un error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotSuccess('');

        const user = forgotUsername.trim();
        if (!user) {
            setForgotError('Indicá el usuario con el que intentás ingresar.');
            return;
        }

        setForgotLoading(true);
        try {
            const res = await api.post('/Auth/solicitar-reset-password', {
                username: user,
                nota: forgotNota.trim() || null,
            });
            setForgotSuccess(
                res?.message ||
                    'Se envió un mensaje al administrador de tu federación para restablecer la contraseña.'
            );
        } catch (err) {
            setForgotError(err.message || 'No se pudo enviar la solicitud. Intentá de nuevo.');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className={`login-container ${isNative ? 'is-native' : ''}`}>
            <div className={`login-card glass-panel ${isNative ? 'mobile-card' : ''}`}>
                <div className="login-header">
                    <div className="login-logo">
                        <img
                            src="/logo_icon.png"
                            alt="Logo"
                            className="web-logo-img"
                            style={{ height: '50px', width: 'auto' }}
                        />
                    </div>
                    <h2 className="text-gradient-green">
                        {isNative ? 'SIGDEF Mobile' : 'Bienvenido a SIGDEF'}
                    </h2>
                    <p className="login-subtitle">
                        {isNative ? 'Tu deporte, en tu bolsillo' : 'Sistema de Gestión Deportiva'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Usuario</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ingrese su usuario"
                            required
                            className="form-input"
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ingrese su contraseña"
                                required
                                className="form-input"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle-btn"
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        isLoading={isLoading}
                        style={{ width: '100%' }}
                    >
                        Iniciar Sesión
                    </Button>

                    <div className="forgot-password-container">
                        <button
                            type="button"
                            className="forgot-password-link"
                            onClick={() => setShowForgotModal(true)}
                        >
                            ¿Olvidó su contraseña?
                        </button>
                    </div>
                </form>
            </div>

            {showForgotModal && (
                <Modal
                    isOpen={showForgotModal}
                    onClose={() => !forgotLoading && setShowForgotModal(false)}
                    title="Recuperar contraseña"
                    footer={
                        forgotSuccess ? (
                            <Button variant="primary" onClick={() => setShowForgotModal(false)}>
                                Cerrar
                            </Button>
                        ) : (
                            <div className="forgot-modal-footer">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowForgotModal(false)}
                                    disabled={forgotLoading}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    icon={Send}
                                    isLoading={forgotLoading}
                                    onClick={handleForgotSubmit}
                                >
                                    Enviar solicitud
                                </Button>
                            </div>
                        )
                    }
                >
                    <div className="forgot-modal-body">
                        <div className="forgot-modal-icon">
                            <HelpCircle size={28} />
                        </div>
                        {forgotSuccess ? (
                            <p className="forgot-success">{forgotSuccess}</p>
                        ) : (
                            <>
                                <p className="forgot-modal-text">
                                    Se enviará un mensaje interno al <strong>administrador de tu federación</strong>{' '}
                                    (por ejemplo, si tu usuario es de un club de esa federación, le llega a su admin)
                                    para que te restablezca la contraseña.
                                </p>
                                <form className="forgot-form" onSubmit={handleForgotSubmit}>
                                    <label className="forgot-field">
                                        <span>Usuario</span>
                                        <input
                                            type="text"
                                            value={forgotUsername}
                                            onChange={(e) => setForgotUsername(e.target.value)}
                                            placeholder="Ej. club1fec"
                                            required
                                            autoFocus
                                            className="form-input"
                                        />
                                    </label>
                                    <label className="forgot-field">
                                        <span>Nota (opcional)</span>
                                        <textarea
                                            value={forgotNota}
                                            onChange={(e) => setForgotNota(e.target.value)}
                                            placeholder="Datos de contacto u otra información útil..."
                                            rows={3}
                                            className="form-input"
                                        />
                                    </label>
                                    {forgotError && <div className="error-message">{forgotError}</div>}
                                </form>
                            </>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Login;
