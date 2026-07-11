# Resumen Técnico de la Aplicación SIGDEF

## Descripción General
SIGDEF (Sistema de Gestión Deportiva Federada) es una aplicación web diseñada para administrar la información de federaciones deportivas, clubes, atletas y eventos. Permite la interacción entre distintos roles (Federación, Clubes, Atletas) para digitalizar procesos como inscripciones, gestión de padrones y control de cuotas.

## Arquitectura

### Frontend
- **Tecnología**: React.js (Vite).
- **Estilos**: CSS Modules / Vanilla CSS con variables globales (`index.css`).
- **Enrutamiento**: `react-router-dom`.
- **Estado**: `useState`, `useEffect`, `Context API` (AuthContext).
- **HTTP Client**: `fetch` wrapper personalizado (`api.js`).

### Backend (Referencia)
- **Tecnología**: .NET Core API (C#).
- **Base de Datos**: SQL Server.
- **Autenticación**: JWT (JSON Web Tokens).

## Módulos Principales

### 1. Autenticación y Seguridad
- Login con roles diferenciados (Admin/Federación, Club, Atleta).
- Protección de rutas mediante `PrivateRoute` y `RoleRoute`.
- Contexto de autenticación (`AuthContext`) para manejar el estado del usuario globalmente.

### 2. Módulo de Clubes
- **Gestión de Atletas**: CRUD completo. Lógica para menores de edad (Tutor obligatorio).
- **Gestión de Tutores**: Vinculación con atletas (relación N:M mediante tabla intermedia `AtletaTutor`).
- **Gestión de Eventos**: Creación de eventos propios y visualización de eventos de terceros.

### 3. Módulo de Eventos
- **Modelo de Datos**:
    - `Evento`: Entidad principal (Nombre, Fechas, Ubicación, Club Organizador).
    - `Inscripcion`: Relación entre Atleta y Evento.
- **Flujos**:
    - **Creación**: Los clubes y la federación pueden crear eventos.
    - **Visualización**: Listados filtrados por rol (Mis Eventos vs Eventos Disponibles).
    - **Inscripción**: Proceso para anotar atletas en eventos activos.

## Estructura de Directorios (Frontend)
- `/src`
    - `/components`: Componentes reutilizables (Botones, Cards, Layouts).
    - `/pages`: Vistas principales agrupadas por módulo (Club, Eventos, Atletas).
    - `/services`: Lógica de conexión con la API.
    - `/context`: Manejo de estado global.
    - `/utils`: Constantes, enums y funciones auxiliares.

## Consideraciones de Desarrollo
- **Manejo de IDs**: Se estandarizó el uso de `id` (o `idEvento`, `idClub` según corresponda) para mantener consistencia con la API.
- **Comparación de Tipos**: Se utiliza comparación laxa (`==`) en filtros críticos de IDs para evitar problemas entre `string` y `number` provenientes de la API/Formularios.
