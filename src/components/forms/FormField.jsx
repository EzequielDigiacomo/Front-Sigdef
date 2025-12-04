import React from 'react';

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
    className = ''
}) => {
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
                            color: 'var(--text-secondary)',
                            pointerEvents: 'none',
                            zIndex: 10
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
                    style={{
                        width: '100%',
                        paddingLeft: Icon ? '2.75rem' : '1rem'
                    }}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                />
            </div>
            {helpText && <small className="text-muted">{helpText}</small>}
            {error && <span className="error-message">{error}</span>}
        </div>
    );
};

export default FormField;
