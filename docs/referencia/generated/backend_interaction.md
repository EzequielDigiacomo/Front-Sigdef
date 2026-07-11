# Interacción con el backend

Esta sección describe la estrategia general que el frontend usa para comunicarse con la API del backend.

## Librería de peticiones
- Se utiliza `fetch` nativo del navegador (alternativamente `axios` en algunos componentes). 
- Todas las peticiones incluyen el encabezado `Content-Type: application/json`.
- Cuando el usuario está autenticado, se agrega el token JWT en el encabezado `Authorization: Bearer <token>`.

## Manejo de respuestas
- Las respuestas se convierten a JSON con `await response.json()`.
- Se verifica `response.ok`; si es `false` se lanza un error y se muestra al usuario.
- Los códigos de error comunes (401, 403, 500) se manejan de forma centralizada en un helper `handleApiError` que actualiza el estado de error.

## Patrón de carga
- Cada componente que necesita datos realiza la petición en `useEffect` al montar.
- Se mantiene un estado local `{ loading: true, data: null, error: null }`.
- Mientras `loading` es `true` se muestra un spinner.
- En caso de error, el mensaje se muestra en un `Alert`.

## Ejemplo de helper
```js
export async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('jwt');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error de API');
  }
  return response.json();
}
```

## Uso en componentes
- `EventosList.jsx`: `apiRequest('/api/eventos?page=1&size=20')`.
- `RegisterClubForm.jsx`: `apiRequest('/api/club')` para obtener clubes y `apiRequest('/api/club', { method: 'POST', body: JSON.stringify(form) })` para crear.
- `RegisterPersonForm.jsx`: `apiRequest('/api/registro', { method: 'POST', body: JSON.stringify(form) })`.

## Resumen
- Todas las peticiones siguen el mismo flujo: **GET** para obtener datos de referencia, **POST/PUT** para crear o actualizar, manejo de errores centralizado, y token JWT incluido cuando corresponde.
