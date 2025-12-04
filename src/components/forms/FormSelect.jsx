import React from 'react';

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
