import React from 'react';

/**
 * FormSelect - Select reutilizable
 * 
 * @param {String} label - Etiqueta del campo
 * @param {String} name - Nombre del campo
 * @param {String|Number} value - Valor actual
 * @param {Function} onChange - Callback de cambio
 * @param {Array} options - Array de opciones: [{ value, label }]
 * @param {String} error - Mensaje de error
 * @param {Boolean} required - Si es requerido
 * @param {String} placeholder - Placeholder (primera opción)
 * @param {Boolean} disabled - Si está deshabilitado
 * @param {String} helpText - Texto de ayuda
 */
const FormSelect = ({
    label,
    name,
    value,
    onChange,
    options = [],
    error,
    required = false,
    placeholder = 'Seleccione una opción',
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
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className={`form-input ${error ? 'error' : ''}`}
                required={required}
                disabled={disabled}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {helpText && <small className="text-muted">{helpText}</small>}
            {error && <span className="error-message">{error}</span>}
        </div>
    );
};

export default FormSelect;
