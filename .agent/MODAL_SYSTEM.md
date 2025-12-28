# Sistema de Modales - SIGDEF Front

## Descripción General

El sistema de modales ahora soporta **variantes** y **tamaños** para adaptarse a diferentes tipos de contenido.

## Componente Base: `Modal.jsx`

### Props

- **`isOpen`**: Boolean - Controla si el modal está visible
- **`onClose`**: Function - Callback al cerrar el modal
- **`title`**: String - Título del modal
- **`children`**: ReactNode - Contenido del modal
- **`footer`**: ReactNode - Contenido del footer (opcional)
- **`size`**: String - Tamaño del modal (default: 'medium')
  - `'small'`: 400px max-width
  - `'medium'`: 600px max-width
  - `'large'`: 900px max-width
  - `'xlarge'`: 1200px max-width
- **`variant`**: String - Variante de estilo (default: 'default')
  - `'default'`: Estilo estándar
  - `'document'`: Optimizado para visualización de documentos
  - `'form'`: Optimizado para formularios

## Variantes de Modales

### 1. Variant: `document`
**Uso**: Para visualizar documentación, imágenes, PDFs

**Características**:
- Header con gradiente azul
- Título en blanco
- Contenido sin padding (para aprovechar todo el espacio)
- Background primario en el contenido

**Ejemplo**:
```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Documentos de Juan Pérez"
  size="xlarge"
  variant="document"
>
  {/* Contenido de documentos */}
</Modal>
```

**Usado en**:
- `DocumentViewerModal.jsx` (lista de documentos)
- `DocumentViewerModal.jsx` (preview de documentos)

---

### 2. Variant: `form`
**Uso**: Para formularios y entrada de datos

**Características**:
- Header con borde inferior azul
- Contenido con padding de 2rem
- Footer con background terciario

**Ejemplo**:
```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Subir Documentación"
  size="medium"
  variant="form"
  footer={<Button>Guardar</Button>}
>
  {/* Formulario */}
</Modal>
```

**Usado en**:
- `DocumentUploadModal.jsx`

---

### 3. Variant: `default`
**Uso**: Para contenido general

**Características**:
- Header estándar
- Contenido con padding de 1.5rem
- Estilo neutral

**Ejemplo**:
```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Información"
  size="medium"
  variant="default"
>
  {/* Contenido general */}
</Modal>
```

---

## Modal Independiente: `ConfirmationModal`

**Nota**: Este modal NO usa el componente `Modal.jsx` base. Tiene su propio sistema de estilos.

**Uso**: Para confirmaciones rápidas, alertas, información breve

**Props**:
- `isOpen`, `onClose`, `onConfirm`
- `title`, `message`
- `confirmText`, `cancelText`
- `type`: 'danger' | 'success' | 'info'
- `isLoading`, `showCancel`

**Características**:
- Diseño compacto (max-width: 400px)
- Iconos visuales según tipo
- Centrado y con efecto glassmorphism
- Botones de acción centrados

**Ejemplo**:
```jsx
<ConfirmationModal
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleDelete}
  title="¿Eliminar atleta?"
  message="Esta acción no se puede deshacer"
  type="danger"
  confirmText="Eliminar"
  cancelText="Cancelar"
/>
```

---

## Guía de Uso

### ¿Cuándo usar cada variante?

| Contenido | Variante | Tamaño Recomendado |
|-----------|----------|-------------------|
| Visualizar documentos/imágenes | `document` | `large` o `xlarge` |
| Formularios de entrada | `form` | `medium` |
| Información general | `default` | `small` o `medium` |
| Confirmaciones/Alertas | `ConfirmationModal` | - (fijo) |

### Personalización Adicional

Si necesitas estilos específicos adicionales, puedes:

1. **Agregar una nueva variante** en `Modal.css`
2. **Usar classNames personalizados** en el contenido del modal
3. **Crear un modal independiente** como `ConfirmationModal` si la funcionalidad es muy específica

---

## Archivos Relacionados

- `src/components/common/Modal.jsx` - Componente base
- `src/components/common/Modal.css` - Estilos base y variantes
- `src/components/common/DocumentViewerModal.jsx` - Usa variant="document"
- `src/components/common/DocumentUploadModal.jsx` - Usa variant="form"
- `src/components/common/ConfirmationModal.jsx` - Modal independiente
- `src/components/common/ConfirmationModal.css` - Estilos independientes
