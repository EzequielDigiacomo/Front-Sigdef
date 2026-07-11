# Flujo de datos de formularios

En esta sección se describe cómo cada formulario del frontend obtiene y envía datos al backend.

## RegisterClubForm.jsx
- **Obtención de clubes**: al montar el componente se ejecuta `fetch('/api/club')` (GET) para cargar la lista de clubes.
- **Estado**: los datos se guardan en `useState([])` y se pasan a un `<select>`.
- **Envío**: al enviar el formulario se hace `fetch('/api/club', { method: 'POST', body: JSON.stringify(formData) })`.

## RegisterPersonForm.jsx
- **Obtención de roles**: `fetch('/api/roles')` (GET) para poblar el selector de roles.
- **Envío**: `fetch('/api/registro', { method: 'POST', body: JSON.stringify(formData) })`.

## EventoDetalle.jsx
- **Carga de detalle**: `fetch('/api/eventos/' + idEvento)` (GET) al montar el componente.
- **Actualización**: si se permite edición, se envía `PUT /api/eventos/{id}` con los datos modificados.

## Otros formularios
- Cada formulario sigue el mismo patrón: **GET** para datos de referencia, **POST/PUT** para crear o actualizar, y manejo de errores mediante `try/catch` y actualización del estado de error.

### Manejo de errores y loading
- Se utiliza `useState({ loading: true, error: null })` antes de la petición.
- En caso de error se actualiza `error` y se muestra al usuario.
- Al finalizar la petición se establece `loading: false`.

Esta información ayuda a entender qué datos se solicitan al backend y cómo se procesan en el cliente.
