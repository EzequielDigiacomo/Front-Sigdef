import React, { useMemo } from 'react';
import './DataTable.css';
import { useSort } from '../../hooks/useSort';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * DataTable - Componente de tabla genérico y reutilizable
 * 
 * @param {Array} columns - Definición de columnas: [{ key, label, render?, className?, sortable? }]
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
    const { items: sortedData, requestSort, sortConfig } = useSort(data);

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

    const renderSortIcon = (column) => {
        if (column.sortable === false) return null;
        
        if (sortConfig.key !== column.key) {
            return <ChevronsUpDown size={14} className="sort-icon-placeholder" />;
        }

        return sortConfig.direction === 'asc' 
            ? <ChevronUp size={14} className="sort-icon active" /> 
            : <ChevronDown size={14} className="sort-icon active" />;
    };

    return (
        <div className="table-responsive">
            <table className={`data-table ${className}`}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`${column.headerClassName || ''} ${column.sortable !== false ? 'sortable-header' : ''}`}
                                style={column.align ? { textAlign: column.align } : {}}
                                onClick={() => column.sortable !== false && requestSort(column.key)}
                            >
                                <div 
                                    className="header-content"
                                    style={column.align ? { justifyContent: column.align === 'center' ? 'center' : (column.align === 'right' ? 'flex-end' : 'flex-start') } : {}}
                                >
                                    {column.label}
                                    {renderSortIcon(column)}
                                </div>
                            </th>
                        ))}
                        {actions && <th style={{ textAlign: 'center' }}><div className="header-content" style={{ justifyContent: 'center' }}>Acciones</div></th>}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center">
                                Cargando...
                            </td>
                        </tr>
                    ) : sortedData.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        sortedData.map((row, index) => (
                            <tr
                                key={row[keyField] || index}
                                onClick={() => handleRowClick(row)}
                                className={onRowClick ? 'clickable-row' : ''}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={column.cellClassName || ''}
                                        style={column.align ? { textAlign: column.align } : {}}
                                    >
                                        {renderCell(row, column)}
                                    </td>
                                ))}
                                {actions && (
                                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
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
