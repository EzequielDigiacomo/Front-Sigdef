import React from 'react';
import { AlertCircle } from 'lucide-react';

/** Banner superior con el listado de errores de validación. */
const FormErrorsBanner = ({ errors = {}, labels = {}, title = 'Revisá los campos marcados' }) => {
    const entries = Object.entries(errors || {}).filter(([, msg]) => msg);
    if (!entries.length) return null;

    const seen = new Set();
    const lines = [];
    entries.forEach(([key, msg]) => {
        const norm = String(msg).toLowerCase();
        if (seen.has(norm)) return;
        seen.add(norm);
        const label = labels[key];
        lines.push(label ? `${label}: ${msg}` : msg);
    });

    if (!lines.length) return null;

    return (
        <div className="form-errors-banner" role="alert">
            <AlertCircle size={16} aria-hidden />
            <div>
                <strong>{title}</strong>
                <ul>
                    {lines.map((line) => (
                        <li key={line}>{line}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default FormErrorsBanner;
