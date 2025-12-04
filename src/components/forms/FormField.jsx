import React from 'react';

/**
 * FormField - Campo de formulario reutilizable
 * 
 * @param {String} label - Etiqueta del campo
 * @param {String} type - Tipo de input (text, email, password, number, date, etc.)
 * @param {String} name - Nombre del campo
 * @param {String|Number} value - Valor actual
 * @param {Function} onChange - Callback de cambio
 * @param {String} error - Mensaje de error
 * @param {Boolean} required - Si es requerido
 * @param {String} placeholder - Placeholder
 * @param {Boolean} disabled - Si está deshabilitado
 * @param {String} helpText - Texto de ayuda
 */
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
    className = ''
}) => {
    return (
        <div className={`form-group ${className}`}>
            {label && (
                <label htmlFor={name}>
                    {label}
                    {required && <span className="text-danger"> *</span>}
                </label>
            )}
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className={`form-input ${error ? 'error' : ''}`}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
            />
            {helpText && <small className="text-muted">{helpText}</small>}
            {error && <span className="error-message">{error}</span>}
        </div>
    );
};

export default FormField;
