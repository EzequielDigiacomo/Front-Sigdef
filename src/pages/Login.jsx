import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { Shield, Eye, EyeOff, Smartphone, HelpCircle } from 'lucide-react';
import { useDevice } from '../hooks/useDevice';
import Modal from '../components/common/Modal';
import './Login.css';

const Login = () => {
    const { isNative } = useDevice();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

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
                    <h2 className="text-gradient-green">{isNative ? 'SIGDEF Mobile' : 'Bienvenido a SIGDEF'}</h2>
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
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ingrese su contraseña"
                                required
                                className="form-input"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle-btn"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%' }}>
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

                    <div className="login-info">
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
                            <strong>Credenciales de prueba:</strong><br />
                            <strong>Superadmin:</strong> superadmin / admin123<br />
                            <strong>Federación:</strong> admin / admin123
                        </p>
                    </div>
                </form>
            </div>

            {showForgotModal && (
                <Modal
                    isOpen={showForgotModal}
                    onClose={() => setShowForgotModal(false)}
                    title="Recuperación de Acceso"
                    footer={
                        <Button variant="primary" onClick={() => setShowForgotModal(false)}>
                            Entendido
                        </Button>
                    }
                >
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ 
                            backgroundColor: 'rgba(var(--primary-rgb), 0.1)', 
                            width: '60px', 
                            height: '60px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            color: 'var(--primary)'
                        }}>
                            <HelpCircle size={32} />
                        </div>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Reseteo de Contraseña</h4>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Por razones de seguridad, el reseteo de contraseñas es gestionado manualmente por el <strong>Administrador de su Club</strong> o la <strong>Federación</strong>.
                        </p>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.9rem' }}>
                            Por favor, póngase en contacto con ellos de forma externa para solicitar la generación de una clave temporal.
                        </p>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Login;
