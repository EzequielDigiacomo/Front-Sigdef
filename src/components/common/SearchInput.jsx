import React from 'react';
import { Search } from 'lucide-react';
import './SearchInput.css';

/**
 * SearchInput - Componente de búsqueda reutilizable
 * 
 * @param {string} value - Valor actual del input
 * @param {function} onChange - Callback cuando cambia el valor
 * @param {string} placeholder - Texto placeholder
 * @param {string} className - Clases CSS adicionales
 */
const SearchInput = ({
    value = '',
    onChange,
    placeholder = 'Buscar...',
    className = ''
}) => {
    return (
        <div className={`search-input-wrapper ${className}`}>
            <Search size={18} className="search-icon" />
            <input
                type="text"
                placeholder={placeholder}
                className="search-input"
                value={value}
                onChange={onChange}
            />
        </div>
    );
};

export default SearchInput;
