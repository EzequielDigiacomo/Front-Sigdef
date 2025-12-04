import React from 'react';
import Button from './Button';
import { Edit, Trash2 } from 'lucide-react';

/**
 * TableActions - Componente de acciones estándar para tablas
 * 
 * @param {Function} onEdit - Callback para editar
 * @param {Function} onDelete - Callback para eliminar
 * @param {Array} customActions - Acciones personalizadas adicionales
 * @param {Object} row - Datos de la fila actual
 */
const TableActions = ({
    onEdit,
    onDelete,
    customActions = [],
    row
}) => {
    return (
        <div className="actions-cell">
            {onEdit && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(row)}
                    title="Editar"
                >
                    <Edit size={18} />
                </Button>
            )}

            {onDelete && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    onClick={() => onDelete(row)}
                    title="Eliminar"
                >
                    <Trash2 size={18} />
                </Button>
            )}

            {customActions.map((action, index) => (
                <Button
                    key={index}
                    variant={action.variant || "ghost"}
                    size={action.size || "sm"}
                    className={action.className || ''}
                    onClick={() => action.onClick(row)}
                    title={action.title || ''}
                >
                    {action.icon}
                </Button>
            ))}
        </div>
    );
};

export default TableActions;
