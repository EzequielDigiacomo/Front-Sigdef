import React from 'react';

/**
 * FormCheckbox - Checkbox reutilizable
 * 
 * @param {String} label - Etiqueta del checkbox
 * @param {String} name - Nombre del campo
 * @param {Boolean} checked - Si está marcado
 * @param {Function} onChange - Callback de cambio
 * @param {Boolean} disabled - Si está deshabilitado
 * @param {String} helpText - Texto de ayuda
 */
const FormCheckbox = ({
    label,
    name,
    checked,
    onChange,
    disabled = false,
    helpText,
    className = ''
}) => {
    return (
        <div className={`form-group checkbox-group ${className}`}>
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    name={name}
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                />
                <span>{label}</span>
            </label>
            {helpText && <small className="text-muted">{helpText}</small>}
        </div>
    );
};

export default FormCheckbox;
