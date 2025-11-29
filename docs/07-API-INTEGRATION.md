# 🔌 Guía de Integración con API

## Estado Actual de la Integración

### ✅ Componentes Conectados a la API

#### **Sistema de Autenticación**
- ✅ `AuthContext.jsx` - Login de clubes obtiene datos reales de `/Club`
- ✅ Login de federación sigue siendo mock (admin/admin)

#### **Páginas de Club**
- ✅ `ClubDashboard.jsx` - Obtiene estadísticas reales
- ✅ `ClubInfo.jsx` - Obtiene información del club
- ✅ `ClubAtletas.jsx` - CRUD completo de atletas
- ✅ `ClubEventos.jsx` - CRUD completo de eventos del club
- ✅ `EventosDisponibles.jsx` - Lista eventos de otros clubes

### ⏳ Componentes Pendientes de Integración

#### **Páginas de Federación**
- ⏳ `Dashboard.jsx` - Aún usa datos mock
- ⏳ `AtletasList.jsx` - Necesita integración
- ⏳ `EventosList.jsx` - Necesita integración
- ⏳ `ClubesList.jsx` - Necesita integración
- ⏳ Otros módulos de federación

## Endpoints Utilizados

### Clubes
```javascript
GET    /api/Club              // Obtener todos los clubes
GET    /api/Club/{id}         // Obtener club por ID
POST   /api/Club              // Crear club
PUT    /api/Club/{id}         // Actualizar club
DELETE /api/Club/{id}         // Eliminar club
```

### Atletas
```javascript
GET    /api/Atleta            // Obtener todos los atletas
GET    /api/Atleta/{id}       // Obtener atleta por ID
POST   /api/Atleta            // Crear atleta
PUT    /api/Atleta/{id}       // Actualizar atleta
DELETE /api/Atleta/{id}       // Eliminar atleta
```

### Eventos
```javascript
GET    /api/Evento            // Obtener todos los eventos
GET    /api/Evento/{id}       // Obtener evento por ID
POST   /api/Evento            // Crear evento
PUT    /api/Evento/{id}       // Actualizar evento
DELETE /api/Evento/{id}       // Eliminar evento
```

### Inscripciones
```javascript
GET    /api/Inscripcion       // Obtener todas las inscripciones
GET    /api/Inscripcion/{id}  // Obtener inscripción por ID
POST   /api/Inscripcion       // Crear inscripción
DELETE /api/Inscripcion/{id}  // Eliminar inscripción
```

## Configuración de la API

### URL Base
```javascript
// src/services/api.js
const API_URL = 'https://localhost:7112/api';
```

### Cliente HTTP
El proyecto usa `fetch` nativo con un wrapper personalizado en `src/services/api.js`:

```javascript
import { api } from '../services/api';

// GET
const data = await api.get('/Atleta');

// POST
const newAtleta = await api.post('/Atleta', atletaData);

// PUT
const updated = await api.put('/Atleta/1', atletaData);

// DELETE
await api.delete('/Atleta/1');
```

## Cómo Funciona el Login de Clubes

### Flujo de Autenticación

1. **Usuario ingresa nombre del club**:
```javascript
// Ejemplo: "Club Deportivo Central"
username: "Club Deportivo Central"
password: "cualquier_cosa"  // Por ahora no se valida
```

2. **Sistema busca el club en la base de datos**:
```javascript
const clubes = await api.get('/Club');
const club = clubes.find(c => 
    c.nombre.toLowerCase() === username.toLowerCase() ||
    c.email?.toLowerCase() === username.toLowerCase()
);
```

3. **Si encuentra el club, crea sesión**:
```javascript
const clubUser = {
    username: club.nombre,
    role: 'CLUB',
    nombre: club.nombre,
    email: club.email || '',
    clubId: club.id,
    clubData: {
        direccion: club.direccion,
        telefono: club.telefono,
        presidente: club.presidente,
        fechaFundacion: club.fechaFundacion
    }
};
```

4. **Guarda en localStorage y redirige**:
```javascript
localStorage.setItem('user', JSON.stringify(clubUser));
navigate('/club');
```

## Filtrado de Datos por Club

### En ClubDashboard
```javascript
// Obtener todos los atletas
const atletas = await api.get('/Atleta');

// Filtrar solo los del club actual
const atletasDelClub = atletas.filter(a => a.clubId === user.clubId);
```

### En ClubAtletas
```javascript
const todosAtletas = await api.get('/Atleta');
const atletasDelClub = todosAtletas.filter(a => a.clubId === user.clubId);
setAtletas(atletasDelClub);
```

### En ClubEventos
```javascript
const todosEventos = await api.get('/Evento');
const eventosDelClub = todosEventos.filter(e => e.clubId === user.clubId);
```

### En EventosDisponibles
```javascript
const todosEventos = await api.get('/Evento');
// Eventos que NO son del club actual
const eventosDisponibles = todosEventos.filter(e => 
    e.clubId !== user.clubId && 
    e.estado === 'PROGRAMADO'
);
```

## Manejo de Errores

### En el Cliente API
```javascript
// src/services/api.js
const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
        } catch (jsonError) {
            try {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage = `Error ${response.status}: ${errorText.substring(0, 200)}`;
                }
            } catch (textError) {
                console.error('No se pudo obtener el mensaje de error:', textError);
            }
        }
        
        throw new Error(errorMessage);
    }
    
    return await response.json();
};
```

### En los Componentes
```javascript
try {
    const data = await api.get('/Atleta');
    setAtletas(data);
} catch (error) {
    console.error('Error al cargar atletas:', error);
    // Mostrar mensaje al usuario
    alert('Error al cargar los datos. Por favor, intenta nuevamente.');
} finally {
    setLoading(false);
}
```

## Estructura de Datos Esperada

### Club
```javascript
{
    id: number,
    nombre: string,
    direccion: string,
    telefono: string,
    email: string,
    presidente: string,
    fechaFundacion: string (ISO 8601),
    // Campos opcionales
    logros?: string[]
}
```

### Atleta
```javascript
{
    id: number,
    nombre: string,
    apellido: string,
    dni: string,
    fechaNacimiento: string (ISO 8601),
    sexo: 'MASCULINO' | 'FEMENINO',
    categoria: string,
    clubId: number,
    tutorId?: number,
    direccion?: string,
    telefono?: string,
    email?: string
}
```

### Evento
```javascript
{
    id: number,
    nombre: string,
    fecha: string (ISO 8601),
    ubicacion: string,
    estado: 'PROGRAMADO' | 'EN_CURSO' | 'FINALIZADO',
    clubId: number | null,  // null si es de la federación
    cupoMaximo?: number,
    descripcion?: string
}
```

### Inscripción
```javascript
{
    id: number,
    atletaId: number,
    eventoId: number,
    fechaInscripcion: string (ISO 8601),
    estado?: string
}
```

## Cómo Probar la Integración

### 1. Verificar que el Backend esté corriendo
```bash
# El backend debe estar en https://localhost:7112
```

### 2. Crear un club en la base de datos
```sql
INSERT INTO Clubes (Nombre, Direccion, Telefono, Email, Presidente, FechaFundacion)
VALUES ('Club Deportivo Central', 'Av. Principal 123', '123456789', 'club@example.com', 'Juan Pérez', '2010-01-01');
```

### 3. Iniciar sesión con el nombre del club
```
Usuario: Club Deportivo Central
Contraseña: cualquier_cosa
```

### 4. Verificar que se carguen los datos
- Dashboard debe mostrar estadísticas reales
- Atletas debe mostrar solo atletas del club
- Eventos debe mostrar solo eventos del club

## Próximos Pasos

### 1. Implementar Autenticación Real
```javascript
// Agregar endpoint de login en el backend
POST /api/Auth/login
{
    "username": "club_username",
    "password": "hashed_password"
}

// Respuesta
{
    "token": "jwt_token",
    "user": {
        "id": 1,
        "role": "CLUB",
        "clubId": 1,
        // ...
    }
}
```

### 2. Agregar Tokens JWT
```javascript
// Guardar token en localStorage
localStorage.setItem('token', response.token);

// Incluir en headers
headers['Authorization'] = `Bearer ${token}`;
```

### 3. Implementar Refresh Tokens
```javascript
// Renovar token antes de que expire
const refreshToken = async () => {
    const response = await api.post('/Auth/refresh', { refreshToken });
    localStorage.setItem('token', response.token);
};
```

### 4. Agregar Validación de Permisos en Backend
```csharp
[Authorize(Roles = "CLUB")]
[HttpGet("club/{clubId}/atletas")]
public async Task<IActionResult> GetAtletasByClub(int clubId)
{
    // Verificar que el usuario solo acceda a su propio club
    var userClubId = User.FindFirst("ClubId")?.Value;
    if (userClubId != clubId.ToString())
    {
        return Forbid();
    }
    
    // ...
}
```

## Troubleshooting

### Error: CORS
```javascript
// El backend debe permitir CORS
// En Program.cs o Startup.cs:
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        builder => builder
            .WithOrigins("http://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader());
});
```

### Error: SSL Certificate
```javascript
// Si tienes problemas con el certificado SSL en desarrollo
// Asegúrate de confiar en el certificado de desarrollo de .NET
```

### Error: 404 Not Found
```javascript
// Verifica que la URL base sea correcta
const API_URL = 'https://localhost:7112/api';

// Verifica que el endpoint exista en el backend
```

### Error: 401 Unauthorized
```javascript
// Verifica que el token esté siendo enviado
const token = JSON.parse(localStorage.getItem('user'))?.token;
headers['Authorization'] = `Bearer ${token}`;
```

---

**Última actualización:** 25 de Noviembre, 2025
