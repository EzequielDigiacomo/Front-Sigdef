# Resumen de Componentes Reutilizables

Este documento describe los componentes compartidos disponibles en la aplicación para asegurar consistencia y reutilización de código.

## 🧩 Componentes Comunes (`src/components/common`)

### DataTable
- **Archivo**: `DataTable.jsx`
- **Descripción**: Tabla avanzada que soporta paginación, ordenamiento y renderizado personalizado de celdas.
- **Props principales**: `columns`, `data`, `pagination`, `onPageChange`.

### TableActions
- **Archivo**: `TableActions.jsx`
- **Descripción**: Conjunto de botones de acción (Editar, Eliminar, Ver) para usar dentro de las filas de una tabla.
- **Uso**: Se pasa comúnmente en la definición de columnas de `DataTable`.

### Modal
- **Archivo**: `Modal.jsx`
- **Descripción**: Contenedor para ventanas emergentes con fondo oscuro y animación de entrada.
- **Variantes**: `ConfirmationModal.jsx` es una especialización para diálogos de "Sí/No".

### Card
- **Archivo**: `Card.jsx`
- **Descripción**: Contenedor visual con sombra y bordes redondeados, usado para agrupar contenido en dashboards y formularios.

### Button
- **Archivo**: `Button.jsx`
- **Descripción**: Botón estandarizado con soporte para variantes (primary, secondary, danger) y estados de carga (`isLoading`).

## 📝 Componentes de Formulario (`src/components/forms`)

Estos componentes encapsulan la lógica de etiquetas, estilos y mensajes de error.

### FormField
- **Archivo**: `FormField.jsx`
- **Descripción**: Campo de entrada de texto (input) que incluye label y mensaje de error.
- **Uso**: `<FormField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} error={errors.nombre} />`

### FormSelect
- **Archivo**: `FormSelect.jsx`
- **Descripción**: Selector desplegable (select) estandarizado.
- **Props**: `options` (array de objetos `{value, label}`).

### FormCheckbox
- **Archivo**: `FormCheckbox.jsx`
- **Descripción**: Casilla de verificación (checkbox) con estilo personalizado.
