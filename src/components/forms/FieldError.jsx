import React from 'react';

/** Mensaje de error bajo un input/select. */
const FieldError = ({ message, id }) => {
    if (!message) return null;
    return (
        <span className="error-message" id={id} role="alert">
            {message}
        </span>
    );
};

export default FieldError;
