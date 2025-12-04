# SIGDEF Frontend - README

## 📁 Estructura del Proyecto

```
SIGDEF-Front/
├── src/
│   ├── components/
│   │   ├── common/              # Componentes UI básicos
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── DataTable.jsx    ✨ Tabla genérica reutilizable
│   │   │   └── TableActions.jsx ✨ Acciones de tabla
│   │   ├── forms/               ✨ Componentes de formulario
│   │   │   ├── FormField.jsx
│   │   │   ├── FormSelect.jsx
│   │   │   └── FormCheckbox.jsx
│   │   ├── modals/              ✨ Modales específicos
│   │   │   ├── EditUserModal.jsx
│   │   │   └── ConfirmationModal.jsx
│   │   └── layout/              # Componentes de layout
│   │       ├── Navbar.jsx
│   │       └── Sidebar.jsx
│   ├── pages/                   # Páginas de la aplicación
│   │   ├── Atletas/
│   │   ├── Club/
│   │   ├── Eventos/
│   │   └── Usuarios/
│   ├── services/                # Servicios y API
│   │   └── api.js
│   └── utils/                   # Utilidades
│       └── enums.js
└── .gemini/                     # Documentación del proyecto
    └── antigravity/
        └── brain/
            └── [session-id]/
                ├── walkthrough.md          # Documentación completa
                ├── task.md                 # Lista de tareas
                └── implementation_plan.md  # Plan de implementación
```

## 🚀 Inicio Rápido

### Instalación
```bash
npm install
```

### Desarrollo
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 📚 Componentes Reutilizables

### DataTable
Tabla genérica para mostrar datos tabulares.

```javascript
import DataTable from '../../../components/common/DataTable';

const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'email', label: 'Email' }
];

<DataTable
    columns={columns}
    data={items}
    keyField="id"
    actions={(row) => <TableActions row={row} onEdit={handleEdit} />}
/>
```

### TableActions
Botones de acción estándar para tablas.

```javascript
import TableActions from '../../../components/common/TableActions';

<TableActions
    row={item}
    onEdit={handleEdit}
    onDelete={handleDelete}
/>
```

### FormField
Campo de formulario reutilizable.

```javascript
import FormField from '../../../components/forms/FormField';

<FormField
    label="Nombre"
    name="nombre"
    value={formData.nombre}
    onChange={handleChange}
    required
/>
```

### FormSelect
Select dropdown reutilizable.

```javascript
import FormSelect from '../../../components/forms/FormSelect';

<FormSelect
    label="Categoría"
    name="categoria"
    value={formData.categoria}
    onChange={handleChange}
    options={[
        { value: '1', label: 'Opción 1' },
        { value: '2', label: 'Opción 2' }
    ]}
/>
```

### FormCheckbox
Checkbox reutilizable.

```javascript
import FormCheckbox from '../../../components/forms/FormCheckbox';

<FormCheckbox
    label="Activo"
    name="activo"
    checked={formData.activo}
    onChange={handleChange}
/>
```

## 🔧 API

### Configuración
El archivo `src/services/api.js` maneja todas las llamadas a la API.

**Base URL**: `https://localhost:7112/api`

### Métodos Disponibles
- `api.get(endpoint)` - GET request
- `api.post(endpoint, data)` - POST request
- `api.put(endpoint, data)` - PUT request
- `api.delete(endpoint)` - DELETE request

### Ejemplo
```javascript
import { api } from '../../services/api';

// GET
const users = await api.get('/Usuario');

// POST
await api.post('/Usuario', { username: 'test', password: '123' });

// PUT
await api.put('/Usuario/1', { username: 'updated' });

// DELETE
await api.delete('/Usuario/1');
```

## 📖 Documentación

### Documentos Principales
- **walkthrough.md**: Documentación completa de la sesión de trabajo
- **task.md**: Lista de tareas completadas y pendientes
- **implementation_plan.md**: Plan de implementación de refactorización

### Ubicación
Todos los documentos están en:
```
.gemini/antigravity/brain/[session-id]/
```

## 🎨 Estilos

### Variables CSS
El proyecto usa variables CSS para temas:
- `--primary`: Color primario
- `--success`: Color de éxito
- `--danger`: Color de peligro
- `--text-primary`: Color de texto principal
- `--text-secondary`: Color de texto secundario
- `--bg-card`: Fondo de tarjetas
- `--border-color`: Color de bordes

### Clases Comunes
- `.data-table`: Tabla estándar
- `.badge`: Badge/etiqueta
- `.badge-primary`: Badge primario
- `.badge-success`: Badge de éxito
- `.badge-danger`: Badge de peligro
- `.form-input`: Input de formulario
- `.form-group`: Grupo de formulario

## 🐛 Problemas Conocidos

### Backend
- **Eliminación de Eventos**: Error 500 por columna `Ciudad` faltante en BD
  - Endpoint: `DELETE /api/Evento/{id}`
  - Error: `42703: no existe la columna e.Ciudad`
  - **Solución**: Requiere fix en backend

### Frontend
- Ningún problema conocido actualmente

## 🔄 Próximos Pasos

1. Migrar más tablas a `DataTable`
2. Refactorizar formularios con componentes reutilizables
3. Agregar tests unitarios
4. Implementar lazy loading
5. Crear Storybook para componentes

## 👥 Contribución

### Convenciones de Código
- Usar componentes funcionales con hooks
- Preferir componentes reutilizables sobre código duplicado
- Mantener componentes pequeños y enfocados
- Documentar props con JSDoc

### Estructura de Componentes
```javascript
/**
 * ComponentName - Descripción breve
 * 
 * @param {Type} propName - Descripción del prop
 */
const ComponentName = ({ propName }) => {
    // Hooks
    const [state, setState] = useState();
    
    // Handlers
    const handleAction = () => {};
    
    // Render
    return <div>...</div>;
};

export default ComponentName;
```

## 📞 Soporte

Para preguntas o problemas:
1. Revisar documentación en `.gemini/antigravity/brain/`
2. Consultar código de ejemplo en componentes existentes
3. Revisar este README

---

**Última actualización**: 4 de Diciembre, 2025
