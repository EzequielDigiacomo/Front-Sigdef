# Resumen de Páginas y Funcionalidad

Este documento describe las principales vistas (páginas) de la aplicación y su propósito.

## 🔐 Autenticación

### Login
- **Archivo**: `src/pages/Login.jsx`
- **Ruta**: `/login`
- **Descripción**: Pantalla de acceso al sistema.
- **Funcionalidad**:
  - Autenticación de usuarios (Admin, Club, etc.).
  - Manejo de tokens JWT.
  - Redirección basada en el rol del usuario.

## 📊 Dashboard (Federación)

### Panel Principal
- **Archivo**: `src/pages/Dashboard.jsx`
- **Ruta**: `/` (para administradores)
- **Descripción**: Vista general del estado de la federación.
- **Funcionalidad**:
  - Tarjetas de estadísticas: Total Atletas, Clubes Registrados, Atletas con Deuda, Próximos Eventos.
  - Tabla de eventos recientes con estado (Confirmado, Finalizado, Pendiente).
  - Navegación rápida a secciones principales.

## 👥 Gestión de Usuarios

### Administración de Usuarios
- **Archivo**: `src/pages/Usuarios/UserManagement.jsx`
- **Ruta**: `/usuarios`
- **Descripción**: Centro de control para la gestión de cuentas y accesos.
- **Funcionalidad**:
  - **Registrar Club**: Formulario para dar de alta nuevos clubes.
  - **Registrar Usuario**: Alta de personas (Admin, Entrenador, Atleta, etc.).
  - **Cambiar Contraseña**: Gestión de credenciales.
  - **Tabla de Usuarios**: Listado de todos los usuarios con filtros y acciones.

## 🏃‍♂️ Módulo de Atletas

### Lista de Atletas
- **Archivo**: `src/pages/Atletas/AtletasList.jsx`
- **Ruta**: `/dashboard/atletas`
- **Descripción**: Listado completo de atletas federados.
- **Funcionalidad**: Búsqueda, filtrado, paginación y exportación de datos.

### Formulario de Atleta
- **Archivo**: `src/pages/Atletas/AtletasForm.jsx`
- **Ruta**: `/dashboard/atletas/nuevo` o `/dashboard/atletas/editar/:id`
- **Descripción**: Formulario para crear o editar perfil de atleta.

## 🛡️ Módulo de Clubes (Admin)

### Lista de Clubes
- **Archivo**: `src/pages/Clubes/ClubesList.jsx`
- **Ruta**: `/dashboard/clubes`
- **Descripción**: Gestión de las entidades deportivas (clubes).

### Detalle de Club
- **Archivo**: `src/pages/Clubes/ClubDetalles.jsx`
- **Ruta**: `/dashboard/clubes/:id`
- **Descripción**: Vista detallada de un club específico, sus atletas y staff.

## 📅 Módulo de Eventos

### Lista de Eventos
- **Archivo**: `src/pages/Eventos/EventosList.jsx`
- **Ruta**: `/dashboard/eventos`
- **Descripción**: Calendario y gestión de competencias.

### Detalle de Evento
- **Archivo**: `src/pages/Eventos/EventoDetalle.jsx`
- **Ruta**: `/dashboard/eventos/:id`
- **Descripción**: Información completa del evento, inscripciones y resultados.

## 🏠 Portal de Club (Vista para Clubes)

Este módulo es visible solo para usuarios con rol de **Club**.

### Dashboard de Club
- **Archivo**: `src/pages/Club/ClubDashboard.jsx`
- **Ruta**: `/club`
- **Descripción**: Resumen específico para el club logueado.

### Información del Club
- **Archivo**: `src/pages/Club/ClubInfo.jsx`
- **Ruta**: `/club/info`
- **Descripción**: Perfil del club, datos de contacto y configuración.

### Gestión de Personal y Atletas
- **Atletas**: `src/pages/Club/ClubAtletas.jsx` - Gestión de plantilla.
- **Entrenadores**: `src/pages/Club/ClubEntrenadores.jsx` - Staff técnico.
- **Delegados**: `src/pages/Club/ClubDelegados.jsx` - Representantes.
- **Tutores**: `src/pages/Club/ClubTutores.jsx` - Responsables de menores.

### Gestión de Eventos (Club)
- **Eventos del Club**: `src/pages/Club/ClubEventos.jsx` - Eventos donde participa.
- **Inscripciones**: `src/pages/Club/EventosDisponibles.jsx` - Inscripción a nuevos torneos.
