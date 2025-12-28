import React from 'react';

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
