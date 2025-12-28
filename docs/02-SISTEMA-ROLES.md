# 🔐 Sistema de Roles y Permisos

## Roles Disponibles

### 1. FEDERACION (Administrador)
**Descripción**: Usuario con acceso completo al sistema. Representa a la federación deportiva que gestiona todos los clubes, eventos y atletas.

**Permisos**:
- ✅ Ver y gestionar todos los clubes
- ✅ Ver y gestionar todos los atletas
- ✅ Ver y gestionar todos los eventos
- ✅ Ver todas las inscripciones
- ✅ Gestionar entrenadores de selección
- ✅ Gestionar tutores
- ✅ Gestionar pagos
- ✅ Acceso a estadísticas globales
- ✅ Crear, editar y eliminar cualquier entidad

**Credenciales de Prueba**:
- Usuario: `admin`
- Contraseña: `admin`

### 2. CLUB (Gestor de Club)
**Descripción**: Usuario que representa a un club deportivo. Tiene acceso limitado solo a la gestión de su propio club.

**Permisos**:
- ✅ Ver y editar información de su club
- ✅ Gestionar atletas de su club
- ✅ Crear eventos para su club
- ✅ Ver eventos de otros clubes y la federación
- ✅ Inscribir sus atletas a eventos externos
- ✅ Ver estadísticas de su club
- ❌ No puede ver atletas de otros clubes
- ❌ No puede editar eventos de otros clubes
- ❌ No puede gestionar otros clubes

**Credenciales de Prueba**:
- Usuario: `club1`
- Contraseña: `club1`

## Matriz de Permisos

| Funcionalidad | FEDERACION | CLUB |
|--------------|------------|------|
| **Dashboard Global** | ✅ | ❌ |
| **Dashboard Club** | ❌ | ✅ |
| **Ver todos los clubes** | ✅ | ❌ |
| **Crear/Editar clubes** | ✅ | ❌ |
| **Ver info propio club** | ✅ | ✅ |
| **Editar propio club** | ❌ | ✅ |
| **Ver todos los atletas** | ✅ | ❌ |
| **Ver atletas del club** | ✅ | ✅ |
| **Crear atletas** | ✅ | ✅* |
| **Editar atletas** | ✅ | ✅* |
| **Eliminar atletas** | ✅ | ✅* |
| **Ver todos los eventos** | ✅ | ✅ |
| **Crear eventos** | ✅ | ✅ |
| **Editar eventos** | ✅ | ✅* |
| **Eliminar eventos** | ✅ | ✅* |
| **Ver inscripciones** | ✅ | ✅* |
| **Crear inscripciones** | ✅ | ✅ |
| **Gestionar tutores** | ✅ | ❌ |
| **Gestionar entrenadores** | ✅ | ❌ |
| **Gestionar pagos** | ✅ | ❌ |

\* Solo para entidades propias del club

## Rutas por Rol

### Rutas de FEDERACION

```javascript
// Rutas base: /
/                               // Dashboard principal
/atletas                        // Lista de todos los atletas
/atletas/nuevo                  // Crear atleta
/atletas/editar/:id             // Editar atleta
/clubes                         // Lista de clubes
/clubes/nuevo                   // Crear club
/clubes/editar/:id              // Editar club
/clubes/detalles/:id            // Ver detalles del club
/eventos                        // Lista de todos los eventos
/eventos/nuevo                  // Crear evento
/eventos/editar/:id             // Editar evento
/eventos/:id                    // Ver detalle del evento
/inscripciones                  // Lista de inscripciones
/inscripciones/new              // Crear inscripción
/tutores                        // Lista de tutores
/tutores/new                    // Crear tutor
/tutores/:id/edit               // Editar tutor
/entrenadores-seleccion         // Lista de entrenadores
/entrenadores-seleccion/nuevo   // Crear entrenador
/entrenadores-seleccion/editar/:id  // Editar entrenador
/pagos                          // Gestión de pagos
/federacion                     // Información de la federación
```

### Rutas de CLUB

```javascript
// Rutas base: /club
/club                           // Dashboard del club
/club/info                      // Información del club
/club/atletas                   // Lista de atletas del club
/club/atletas/nuevo             // Agregar atleta al club
/club/atletas/editar/:id        // Editar atleta del club
/club/eventos                   // Eventos creados por el club
/club/eventos/nuevo             // Crear evento del club
/club/eventos/editar/:id        // Editar evento del club
/club/eventos-disponibles       // Ver eventos de otros clubes
/club/inscripciones/nuevo       // Inscribir atletas a eventos
```

## Implementación Técnica

### AuthContext

```javascript
// Estructura del objeto user
{
  username: string,
  role: 'FEDERACION' | 'CLUB',
  nombre: string,
  email: string,
  clubId?: number  // Solo para usuarios CLUB
}
```

### PrivateRoute Component

```javascript
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // 1. Verificar si está cargando
  if (loading) return <div>Cargando...</div>;

  // 2. Verificar autenticación
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // 3. Verificar rol si se especifica
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === 'CLUB' ? '/club' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  // 4. Renderizar componente
  return children;
};
```

### Uso en App.jsx

```javascript
// Ruta protegida solo para FEDERACION
<Route path="/" element={
  <PrivateRoute allowedRoles={['FEDERACION']}>
    <MainLayout />
  </PrivateRoute>
}>
  {/* Rutas hijas */}
</Route>

// Ruta protegida solo para CLUB
<Route path="/club" element={
  <PrivateRoute allowedRoles={['CLUB']}>
    <MainLayoutClub />
  </PrivateRoute>
}>
  {/* Rutas hijas */}
</Route>
```

## Flujos de Usuario

### Flujo de Login - FEDERACION

```
1. Usuario ingresa admin/admin
2. AuthContext valida credenciales
3. Se crea objeto user con role: 'FEDERACION'
4. Se guarda en localStorage
5. Se redirige a /
6. MainLayout se renderiza
7. Sidebar muestra todas las opciones
8. Dashboard muestra estadísticas globales
```

### Flujo de Login - CLUB

```
1. Usuario ingresa club1/club1
2. AuthContext valida credenciales
3. Se crea objeto user con role: 'CLUB' y clubId: 1
4. Se guarda en localStorage
5. Se redirige a /club
6. MainLayoutClub se renderiza
7. SidebarClub muestra opciones del club
8. ClubDashboard muestra estadísticas del club
```

### Flujo de Protección de Rutas

```
Escenario 1: Club intenta acceder a /atletas
1. PrivateRoute verifica autenticación ✅
2. PrivateRoute verifica rol
3. allowedRoles = ['FEDERACION']
4. user.role = 'CLUB' ❌
5. Redirige a /club

Escenario 2: Federación intenta acceder a /club
1. PrivateRoute verifica autenticación ✅
2. PrivateRoute verifica rol
3. allowedRoles = ['CLUB']
4. user.role = 'FEDERACION' ❌
5. Redirige a /

Escenario 3: Usuario no autenticado
1. PrivateRoute verifica autenticación ❌
2. Redirige a /login
```

## Gestión de Sesión

### Persistencia

```javascript
// Al hacer login
localStorage.setItem('user', JSON.stringify(mockUser));

// Al cargar la aplicación
const storedUser = localStorage.getItem('user');
if (storedUser) {
  setUser(JSON.parse(storedUser));
}

// Al hacer logout
localStorage.removeItem('user');
```

### Verificación de Sesión

```javascript
useEffect(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }
  setLoading(false);
}, []);
```

## Extensibilidad

### Agregar Nuevo Rol

Para agregar un nuevo rol (ej: ENTRENADOR):

1. **Actualizar AuthContext**:
```javascript
if (username === 'entrenador1' && password === 'entrenador1') {
  const mockUser = { 
    username, 
    role: 'ENTRENADOR',
    nombre: 'Entrenador Principal',
    email: 'entrenador@example.com'
  };
  // ...
}
```

2. **Crear Layout específico**:
```javascript
// MainLayoutEntrenador.jsx
// SidebarEntrenador.jsx
```

3. **Crear páginas específicas**:
```javascript
// pages/Entrenador/EntrenadorDashboard.jsx
// pages/Entrenador/EntrenadorAtletas.jsx
// etc.
```

4. **Agregar rutas en App.jsx**:
```javascript
<Route path="/entrenador" element={
  <PrivateRoute allowedRoles={['ENTRENADOR']}>
    <MainLayoutEntrenador />
  </PrivateRoute>
}>
  {/* Rutas del entrenador */}
</Route>
```

## Seguridad

### Frontend (Implementado)
- ✅ Validación de autenticación en cada ruta
- ✅ Validación de rol en rutas protegidas
- ✅ Redirección automática para accesos no autorizados
- ✅ Persistencia segura en localStorage

### Backend (Pendiente)
- [ ] JWT tokens con expiración
- [ ] Refresh tokens
- [ ] Validación de permisos en cada endpoint
- [ ] Rate limiting por usuario
- [ ] Logs de acceso y auditoría
- [ ] Encriptación de datos sensibles

## Mejores Prácticas

### 1. Siempre verificar rol en el backend
El frontend solo es una capa de UX. La seguridad real debe estar en el backend.

### 2. No confiar en localStorage
localStorage puede ser modificado. Siempre validar tokens en el servidor.

### 3. Implementar timeout de sesión
```javascript
// Ejemplo futuro
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
```

### 4. Logging de acciones
```javascript
// Ejemplo futuro
logAction(user.id, 'CREATE_ATHLETE', athleteData);
```

### 5. Validación de permisos granular
```javascript
// Ejemplo futuro
const canEditAthlete = (user, athlete) => {
  if (user.role === 'FEDERACION') return true;
  if (user.role === 'CLUB') return athlete.clubId === user.clubId;
  return false;
};
```

## Testing de Roles

### Casos de Prueba

1. **Login como Federación**
   - ✅ Accede a /
   - ✅ Ve todas las opciones en sidebar
   - ✅ Puede acceder a /clubes
   - ❌ No puede acceder a /club

2. **Login como Club**
   - ✅ Accede a /club
   - ✅ Ve opciones limitadas en sidebar
   - ✅ Puede acceder a /club/atletas
   - ❌ No puede acceder a /

3. **Sin autenticación**
   - ❌ No puede acceder a /
   - ❌ No puede acceder a /club
   - ✅ Redirige a /login

---

**Próxima lectura recomendada:** [03-ESTRUCTURA-PROYECTO.md](./03-ESTRUCTURA-PROYECTO.md)
