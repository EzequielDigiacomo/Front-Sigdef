# 🏗️ Arquitectura del Sistema SIGDEF

## Visión General

SIGDEF es una aplicación web de gestión deportiva construida con React que implementa un sistema de roles para diferenciar entre usuarios de tipo **Federación** (administradores) y **Club** (gestores de clubes deportivos).

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                      SIGDEF Frontend                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Login      │────────▶│ AuthContext  │                 │
│  └──────────────┘         └──────┬───────┘                 │
│                                   │                          │
│                    ┌──────────────┴──────────────┐          │
│                    │                              │          │
│            ┌───────▼────────┐          ┌─────────▼────────┐ │
│            │  FEDERACION    │          │      CLUB        │ │
│            │   (Admin)      │          │   (Gestor)       │ │
│            └───────┬────────┘          └─────────┬────────┘ │
│                    │                              │          │
│         ┌──────────▼──────────┐       ┌──────────▼────────┐ │
│         │   MainLayout        │       │  MainLayoutClub   │ │
│         │   + Sidebar         │       │  + SidebarClub    │ │
│         └──────────┬──────────┘       └──────────┬────────┘ │
│                    │                              │          │
│         ┌──────────▼──────────┐       ┌──────────▼────────┐ │
│         │  Páginas Federación │       │  Páginas Club     │ │
│         │  - Dashboard        │       │  - ClubDashboard  │ │
│         │  - Atletas (todos)  │       │  - ClubAtletas    │ │
│         │  - Clubes           │       │  - ClubEventos    │ │
│         │  - Eventos (todos)  │       │  - ClubInfo       │ │
│         │  - Inscripciones    │       │  - Eventos Disp.  │ │
│         │  - Tutores          │       │                   │ │
│         │  - Entrenadores     │       │                   │ │
│         │  - Pagos            │       │                   │ │
│         └─────────────────────┘       └───────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Backend API   │
                    │   (Futuro)      │
                    └─────────────────┘
```

## Capas de la Aplicación

### 1. **Capa de Presentación (UI)**
- **Componentes de Layout**: MainLayout, MainLayoutClub, Navbar, Sidebar, SidebarClub
- **Páginas**: Componentes de página específicos para cada funcionalidad
- **Componentes Comunes**: Button, Card, Modal, etc.

### 2. **Capa de Lógica de Negocio**
- **Context API**: AuthContext para manejo de autenticación y roles
- **Custom Hooks**: Hooks reutilizables para lógica compartida
- **Servicios**: Funciones para comunicación con API (futuro)

### 3. **Capa de Enrutamiento**
- **React Router**: Manejo de navegación
- **PrivateRoute**: Componente de protección de rutas
- **Role-based routing**: Rutas específicas por rol

### 4. **Capa de Estado**
- **Context API**: Estado global de autenticación
- **Local State**: Estado local en componentes con useState
- **Session Storage**: Persistencia de sesión de usuario

## Patrones de Diseño Implementados

### 1. **Higher-Order Component (HOC)**
```javascript
// PrivateRoute - Envuelve componentes para proteger rutas
const PrivateRoute = ({ children, allowedRoles }) => {
  // Lógica de autenticación y autorización
  return isAuthenticated ? children : <Navigate to="/login" />;
};
```

### 2. **Context Pattern**
```javascript
// AuthContext - Proveedor de estado global de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Lógica de autenticación
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 3. **Compound Components**
```javascript
// Layout + Sidebar - Componentes que trabajan juntos
<MainLayout>
  <Sidebar />
  <Outlet />
</MainLayout>
```

### 4. **Render Props / Children Pattern**
```javascript
// Outlet de React Router
<Route path="/" element={<MainLayout />}>
  <Route index element={<Dashboard />} />
</Route>
```

## Flujo de Datos

### Autenticación
```
Usuario ingresa credenciales
        ↓
Login.jsx llama a login(username, password)
        ↓
AuthContext valida credenciales
        ↓
AuthContext guarda user en estado y localStorage
        ↓
App.jsx detecta cambio de autenticación
        ↓
Redirige según rol del usuario
        ↓
Usuario accede a dashboard correspondiente
```

### Navegación Protegida
```
Usuario intenta acceder a ruta
        ↓
PrivateRoute verifica autenticación
        ↓
¿Autenticado? → No → Redirige a /login
        ↓ Sí
PrivateRoute verifica rol
        ↓
¿Rol permitido? → No → Redirige a dashboard correspondiente
        ↓ Sí
Renderiza componente solicitado
```

## Tecnologías y Librerías

### Core
- **React 18** - Librería principal
- **React Router DOM 6** - Enrutamiento
- **Vite** - Build tool y dev server

### UI/UX
- **Lucide React** - Iconos
- **CSS Modules** - Estilos con scope local
- **CSS Variables** - Theming y diseño consistente

### Utilidades
- **localStorage** - Persistencia de sesión
- **Context API** - Estado global

## Principios de Arquitectura

### 1. **Separación de Responsabilidades**
- Cada componente tiene una única responsabilidad
- Lógica de negocio separada de la presentación
- Servicios separados para comunicación con API

### 2. **Reutilización de Código**
- Componentes comunes compartidos
- Hooks personalizados para lógica reutilizable
- Estilos globales y variables CSS

### 3. **Escalabilidad**
- Estructura de carpetas organizada por funcionalidad
- Componentes modulares y desacoplados
- Fácil adición de nuevos roles o funcionalidades

### 4. **Seguridad**
- Rutas protegidas por autenticación
- Validación de roles en cada ruta
- Redirección automática para accesos no autorizados

### 5. **Mantenibilidad**
- Código limpio y bien documentado
- Nombres descriptivos y consistentes
- Estructura predecible y convencional

## Decisiones de Arquitectura

### ¿Por qué Context API en lugar de Redux?
- **Simplicidad**: Para el alcance actual, Context API es suficiente
- **Menos boilerplate**: Menos código para mantener
- **Nativo de React**: No requiere dependencias adicionales
- **Escalable**: Fácil migrar a Redux si crece la complejidad

### ¿Por qué dos Layouts separados?
- **Separación clara**: Cada rol tiene su propia experiencia
- **Mantenibilidad**: Cambios en un layout no afectan al otro
- **Flexibilidad**: Fácil personalizar cada experiencia
- **Rendimiento**: Solo se carga el layout necesario

### ¿Por qué React Router en lugar de otras alternativas?
- **Estándar de la industria**: Ampliamente adoptado
- **Documentación completa**: Fácil de aprender y usar
- **Características robustas**: Nested routes, lazy loading, etc.
- **Integración perfecta**: Diseñado específicamente para React

## Flujo de Renderizado

```
1. App.jsx se monta
   ↓
2. AuthProvider inicializa
   ↓
3. Verifica localStorage para sesión existente
   ↓
4. Router determina ruta actual
   ↓
5. PrivateRoute valida acceso
   ↓
6. Layout correspondiente se renderiza
   ↓
7. Sidebar se renderiza con opciones del rol
   ↓
8. Outlet renderiza página específica
   ↓
9. Página carga datos (API en futuro)
   ↓
10. UI se actualiza con datos
```

## Consideraciones de Rendimiento

### Optimizaciones Implementadas
- **Code Splitting**: Rutas lazy-loaded (futuro)
- **Memoization**: Componentes optimizados con React.memo (donde necesario)
- **Event Delegation**: Listeners eficientes en listas

### Optimizaciones Futuras
- [ ] Lazy loading de rutas
- [ ] Virtual scrolling para listas largas
- [ ] Caché de datos con React Query
- [ ] Service Workers para offline support
- [ ] Image optimization y lazy loading

## Seguridad

### Implementado
- ✅ Protección de rutas por autenticación
- ✅ Protección de rutas por rol
- ✅ Validación en frontend

### Pendiente (Backend)
- [ ] JWT tokens
- [ ] Refresh tokens
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] XSS protection
- [ ] Input sanitization

## Escalabilidad

### Horizontal
- Fácil agregar nuevos roles (ej: ENTRENADOR, ARBITRO)
- Fácil agregar nuevas páginas y funcionalidades
- Estructura modular permite crecimiento

### Vertical
- Optimizaciones de rendimiento cuando sea necesario
- Migración a estado global más robusto si es necesario
- Integración con backend escalable

---

**Próxima lectura recomendada:** [02-SISTEMA-ROLES.md](./02-SISTEMA-ROLES.md)
