import React from 'react';
import './DataTable.css';

/**
 * DataTable - Componente de tabla genérico y reutilizable
 * 
 * @param {Array} columns - Definición de columnas: [{ key, label, render?, className? }]
 * @param {Array} data - Array de objetos con los datos
 * @param {Function} onRowClick - Callback opcional cuando se hace click en una fila
 * @param {Boolean} loading - Estado de carga
 * @param {String} emptyMessage - Mensaje cuando no hay datos
 * @param {ReactNode} actions - Componente de acciones para cada fila
 * @param {String} keyField - Campo a usar como key (default: 'id')
 */
const DataTable = ({
    columns = [],
    data = [],
    onRowClick,
    loading = false,
    emptyMessage = 'No hay datos disponibles',
    actions,
    keyField = 'id',
    className = ''
}) => {
    const handleRowClick = (row) => {
        if (onRowClick) {
            onRowClick(row);
        }
    };

    const renderCell = (row, column) => {
        
        if (column.render) {
            return column.render(row[column.key], row);
        }

        return row[column.key] ?? '-';
    };

    return (
        <div className="table-responsive">
            <table className={`data-table ${className}`}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={column.headerClassName || ''}
                            >
                                {column.label}
                            </th>
                        ))}
                        {actions && <th>Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center">
                                Cargando...
                            </td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, index) => (
                            <tr
                                key={row[keyField] || index}
                                onClick={() => handleRowClick(row)}
                                className={onRowClick ? 'clickable-row' : ''}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={column.cellClassName || ''}
                                    >
                                        {renderCell(row, column)}
                                    </td>
                                ))}
                                {actions && (
                                    <td onClick={(e) => e.stopPropagation()}>
                                        {typeof actions === 'function' ? actions(row) : actions}
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
