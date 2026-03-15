# Documentación de API - SIGDEF

## 1. Información General

- **Protocolo**: HTTPS
- **Base URL**: `https://localhost:7112/api`
- **Formato**: JSON (UTF-8)

## 2. Autenticación (JWT)

La mayoría de los endpoints requieren un token de portador (Bearer Token).

### 2.1 Login
- **Endpoint**: `POST /auth/login`
- **Body**:
```json
{
  "username": "admin",
  "password": "password"
}
```
- **Respuesta**: Devuelve un objeto con el `token` y los datos del perfil (nombre, rol, club).

## 3. Recursos Principales

### 3.1 Gestión de Atletas
- `GET /Atleta`: Listado de todos los atletas (solo Federación).
- `GET /Atleta/{id}`: Detalle completo de un atleta.
- `POST /Atleta`: Registro de nuevo atleta.
- `PUT /Atleta/{id}`: Actualización de datos deportivos.

### 3.2 Clubes
- `GET /Club`: Lista de clubes registrados.
- `GET /Club/{id}/atletas`: Obtiene los atletas asociados a un club específico.

### 3.3 Eventos e Inscripciones
- `GET /Evento`: Todos los eventos activos.
- `POST /Inscripcion`: Realiza la inscripción de uno o varios atletas a una prueba.
- `GET /Inscripcion/Evento/{id}`: Lista de inscriptos para un evento.

### 3.4 Documentación
- `POST /Documentacion/upload`: Sube archivos a Cloudinary y vincula con la entidad.
- `GET /Documentacion/persona/{id}`: Recupera los enlaces a los documentos de una persona.

## 4. Códigos de Estado

| Código | Significado |
|--------|-------------|
| **200 OK** | Operación exitosa. |
| **201 Created** | Recurso creado correctamente. |
| **400 Bad Request** | Error de validación o parámetros incorrectos. |
| **401 Unauthorized** | Token faltante o expirado. |
| **403 Forbidden** | El usuario no tiene el rol necesario. |
| **500 Server Error** | Error no controlado en el servidor. |

## 5. Ejemplo de Integración (Javascript)

```javascript
const response = await fetch('https://localhost:7112/api/Atleta', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
const data = await response.json();
```

---
*Nota: Para ver el detalle técnico completo y probar los endpoints, acceda a la UI de Swagger en local.*
