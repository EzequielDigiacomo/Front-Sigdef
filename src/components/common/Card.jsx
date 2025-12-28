import React from 'react';

const Card = ({ children, className = '', title, actions, onClick }) => {
    return (
        <div
            className={`glass-panel ${className}`}
            style={{
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                cursor: onClick ? 'pointer' : 'default'
            }}
            onClick={onClick}
        >
            {(title || actions) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    {title && <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>}
                    {actions && <div>{actions}</div>}
                </div>
            )}
            {children}
        </div>
    );
};

export default Card;