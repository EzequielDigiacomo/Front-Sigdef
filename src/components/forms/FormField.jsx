import React, { useState } from 'react';

const FormField = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    error,
    required = false,
    placeholder,
    disabled = false,
    helpText,
    icon: Icon,
    className = '',
    variant = 'default' // 'default' o 'dark-focused'
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const getInputStyles = () => {
        const baseStyles = {
            width: '100%',
            padding: '0.75rem 1rem',
            paddingLeft: Icon ? '2.75rem' : '1rem',
            background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
            border: '1px solid var(--input-border, rgba(255, 255, 255, 0.1))',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            fontFamily: 'inherit'
        };

        if (variant === 'dark-focused') {
            return {
                ...baseStyles,
                background: isFocused
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.4)',
                borderColor: isFocused
                    ? 'var(--primary)'
                    : 'rgba(255, 255, 255, 0.15)',
                boxShadow: isFocused
                    ? '0 0 0 3px rgba(var(--primary-rgb, 99, 102, 241), 0.3)'
                    : 'none'
            };
        }

        // Estilo por defecto (claro al hacer focus)
        return {
            ...baseStyles,
            background: isFocused
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.05)',
            borderColor: isFocused
                ? 'var(--primary)'
                : 'rgba(255, 255, 255, 0.1)',
            boxShadow: isFocused
                ? '0 0 0 2px rgba(var(--primary-rgb, 99, 102, 241), 0.2)'
                : 'none'
        };
    };

    const getIconColor = () => {
        if (variant === 'dark-focused') {
            return isFocused ? 'var(--primary)' : 'rgba(255, 255, 255, 0.7)';
        }
        return isFocused ? 'var(--primary)' : 'var(--text-secondary)';
    };

    return (
        <div className={`form-group ${className}`} style={{ width: '100%' }}>
            {label && (
                <label htmlFor={name}>
                    {label}
                    {required && <span className="text-danger"> *</span>}
                </label>
            )}
            <div style={{ position: 'relative', width: '100%' }}>
                {Icon && (
                    <Icon
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: getIconColor(),
                            pointerEvents: 'none',
                            zIndex: 10,
                            transition: 'color 0.3s ease'
                        }}
                    />
                )}
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`form-input ${error ? 'error' : ''}`}
                    style={getInputStyles()}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                        // Para manejar la tecla Escape
                        if (e.key === 'Escape') {
                            e.target.blur();
                        }
                    }}
                />
            </div>
            {helpText && <small className="text-muted">{helpText}</small>}
            {error && <span className="error-message">{error}</span>}
        </div>
    );
};

export default FormField;