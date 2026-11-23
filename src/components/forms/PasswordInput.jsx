import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './PasswordInput.css';

/**
 * Input de contraseña con ojito para mostrar/ocultar.
 * Usar en altas, logins y cambios de clave de todo el sistema.
 */
const PasswordInput = forwardRef(function PasswordInput(
    {
        className = 'form-input',
        wrapperClassName = '',
        disabled = false,
        ...props
    },
    ref
) {
    const [visible, setVisible] = useState(false);

    return (
        <div className={`password-input-wrap ${wrapperClassName}`.trim()}>
            <input
                ref={ref}
                {...props}
                disabled={disabled}
                type={visible ? 'text' : 'password'}
                className={className}
            />
            <button
                type="button"
                className="password-input-toggle"
                onClick={() => setVisible((v) => !v)}
                disabled={disabled}
                tabIndex={-1}
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
});

export default PasswordInput;
