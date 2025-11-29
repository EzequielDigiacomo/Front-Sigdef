# SIGDEF - Sistema de Gestión Deportiva Federativa

## Descripción del Sistema

SIGDEF es un sistema completo de gestión deportiva que maneja dos tipos de usuarios con diferentes niveles de acceso:

### 1. **Usuario Federación (Administrador)**
- Acceso completo a todas las funcionalidades del sistema
- Gestión de clubes, atletas, eventos, entrenadores y tutores
- Visualización de todas las inscripciones y pagos
- Dashboard con estadísticas globales

### 2. **Usuario Club**
- Gestión de atletas propios del club
- Creación y gestión de eventos del club
- Visualización de eventos disponibles de otros clubes y la federación
- Inscripción de atletas propios a eventos externos
- Dashboard con estadísticas del club

## Credenciales de Prueba

### Federación (Administrador)
- **Usuario:** admin
- **Contraseña:** admin
- **Acceso:** Dashboard completo de administración

### Club
- **Usuario:** club1
- **Contraseña:** club1
- **Acceso:** Dashboard de gestión del club

## Estructura del Proyecto

### Rutas de Federación (Administrador)
```
/                           - Dashboard principal
/atletas                    - Lista de todos los atletas
/atletas/nuevo              - Crear nuevo atleta
/atletas/editar/:id         - Editar atleta
/clubes                     - Lista de clubes
/clubes/nuevo               - Crear nuevo club
/clubes/editar/:id          - Editar club
/clubes/detalles/:id        - Detalles del club
/eventos                    - Lista de eventos
/eventos/nuevo              - Crear nuevo evento
/eventos/editar/:id         - Editar evento
/eventos/:id                - Detalle del evento
/tutores                    - Lista de tutores
/inscripciones              - Lista de inscripciones
/entrenadores-seleccion     - Lista de entrenadores
/pagos                      - Gestión de pagos
```

### Rutas de Club
```
/club                       - Dashboard del club
/club/info                  - Información del club
/club/atletas               - Atletas del club
/club/atletas/nuevo         - Agregar atleta al club
/club/atletas/editar/:id    - Editar atleta del club
/club/eventos               - Eventos creados por el club
/club/eventos/nuevo         - Crear nuevo evento
/club/eventos/editar/:id    - Editar evento del club
/club/eventos-disponibles   - Eventos de otros clubes/federación
/club/inscripciones/nuevo   - Inscribir atletas a eventos
```

## Funcionalidades Principales

### Para Clubes

#### 1. Gestión de Atletas
- Ver lista de atletas del club
- Agregar nuevos atletas
- Editar información de atletas
- Eliminar atletas

#### 2. Gestión de Eventos
- Crear eventos propios del club
- Editar eventos creados
- Eliminar eventos
- Ver estadísticas de inscripciones

#### 3. Eventos Disponibles
- Ver eventos de otros clubes y la federación
- Ver cupos disponibles
- Inscribir atletas del club a eventos externos
- Filtrar eventos por nombre, ubicación u organizador

#### 4. Dashboard del Club
- Estadísticas del club (atletas, eventos, inscripciones)
- Actividad reciente
- Próximos eventos

### Para Federación

#### 1. Gestión Completa
- Acceso a todos los clubes, atletas y eventos
- Creación y modificación de cualquier entidad
- Visualización de todas las inscripciones
- Gestión de entrenadores de selección

#### 2. Dashboard Global
- Estadísticas generales del sistema
- Eventos próximos
- Actividad reciente de todos los clubes

## Flujo de Trabajo

### Flujo para Clubes

1. **Inicio de Sesión**
   - El club inicia sesión con sus credenciales
   - Es redirigido automáticamente a `/club`

2. **Gestión de Atletas**
   - Agregar atletas del club
   - Los atletas quedan asociados al club

3. **Creación de Eventos**
   - El club crea un evento
   - El evento aparece en "Mis Eventos"
   - El evento se sincroniza con el dashboard de la federación

4. **Inscripción a Eventos Externos**
   - Ver eventos disponibles de otros clubes/federación
   - Seleccionar evento
   - Inscribir atletas del club al evento

### Flujo para Federación

1. **Inicio de Sesión**
   - El administrador inicia sesión
   - Accede al dashboard principal

2. **Visualización Global**
   - Ver todos los eventos (propios y de clubes)
   - Ver todos los atletas registrados
   - Gestionar inscripciones

3. **Gestión de Clubes**
   - Crear y editar clubes
   - Ver detalles y estadísticas de cada club

## Tecnologías Utilizadas

- **React** - Framework principal
- **React Router** - Navegación y rutas
- **Lucide React** - Iconos
- **CSS Modules** - Estilos

## Próximas Funcionalidades

- [ ] Integración con API backend
- [ ] Sistema de pagos completo
- [ ] Notificaciones en tiempo real
- [ ] Exportación de reportes
- [ ] Sistema de mensajería entre clubes y federación
- [ ] Gestión de resultados y rankings

## Notas de Desarrollo

### Autenticación
El sistema utiliza `AuthContext` para manejar la autenticación y los roles de usuario. Los roles disponibles son:
- `FEDERACION` - Acceso completo
- `CLUB` - Acceso limitado a funcionalidades del club

### Protección de Rutas
Las rutas están protegidas mediante el componente `PrivateRoute` que verifica:
1. Si el usuario está autenticado
2. Si el usuario tiene el rol adecuado para acceder a la ruta
3. Redirige automáticamente según el rol si intenta acceder a rutas no permitidas

### Layouts
- `MainLayout` - Para usuarios de federación
- `MainLayoutClub` - Para usuarios de club

Cada layout tiene su propio sidebar con las opciones correspondientes.
