# API Overview

Esta sección lista los endpoints que el frontend consume, el método HTTP, los parámetros esperados y una breve descripción del propósito.

| Endpoint | Método | Parámetros | Descripción |
|----------|--------|------------|-------------|
| `/api/eventos` | GET | `page`, `size` | Obtiene la lista paginada de eventos. |
| `/api/eventos/{id}` | GET | `id` | Detalle de un evento específico. |
| `/api/club` | GET | — | Lista los clubes disponibles (usado en el formulario de registro de club). |
| `/api/club` | POST | `nombre`, `direccion`, ... | Crea un nuevo club. |
| `/api/registro` | POST | datos del formulario de registro de usuario | Registra un nuevo usuario (Club, Entrenador, Atleta, etc.). |
| `/api/login` | POST | `email`, `password` | Autentica al usuario y devuelve un JWT. |

**Uso en componentes**
- `EventosList.jsx` llama a `/api/eventos` para cargar la tabla.
- `RegisterClubForm.jsx` usa `/api/club` (GET) para poblar el selector de clubes.
- `RegisterPersonForm.jsx` envía los datos a `/api/registro`.

Esta información sirve como referencia rápida para entender qué datos se solicitan y dónde se consumen.
