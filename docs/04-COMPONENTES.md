# 🧩 Documentación de Componentes

## Componentes Comunes

### Button

**Ubicación**: `src/components/common/Button.jsx`

**Descripción**: Botón reutilizable con múltiples variantes y estados.

**Props**:
```javascript
{
  variant: 'primary' | 'secondary' | 'danger' | 'success',  // Estilo del botón
  size: 'sm' | 'md' | 'lg',                                 // Tamaño
  icon: LucideIcon,                                         // Icono (opcional)
  isLoading: boolean,                                       // Estado de carga
  disabled: boolean,                                        // Deshabilitado
  onClick: () => void,                                      // Handler de click
  type: 'button' | 'submit' | 'reset',                     // Tipo HTML
  children: ReactNode,                                      // Contenido
  style: CSSProperties                                      // Estilos inline
}
```

**Ejemplo de uso**:
```javascript
import Button from '../../components/common/Button';
import { Plus } from 'lucide-react';

<Button 
  variant="primary" 
  size="lg" 
  icon={Plus}
  onClick={handleClick}
>
  Agregar Atleta
</Button>
```

**Variantes**:
- `primary`: Botón principal (azul)
- `secondary`: Botón secundario (gris)
- `danger`: Botón de peligro (rojo)
- `success`: Botón de éxito (verde)

---

### Card

**Ubicación**: `src/components/common/Card.jsx`

**Descripción**: Tarjeta con efecto glass-morphism.

**Props**:
```javascript
{
  children: ReactNode,      // Contenido de la tarjeta
  className: string,        // Clases CSS adicionales
  onClick: () => void       // Handler de click (opcional)
}
```

**Ejemplo de uso**:
```javascript
import Card from '../../components/common/Card';

<Card className="athlete-card">
  <h3>Juan Pérez</h3>
  <p>DNI: 12345678</p>
</Card>
```

---

## Componentes de Layout

### MainLayout

**Ubicación**: `src/components/layout/MainLayout.jsx`

**Descripción**: Layout principal para usuarios de tipo FEDERACION.

**Características**:
- Sidebar colapsable automáticamente después de 10 segundos
- Navbar superior
- Área de contenido principal
- Footer

**Estructura**:
```javascript
<div className="app-container">
  <Sidebar />
  <div className="main-content">
    <Navbar />
    <main className="page-content">
      <Outlet /> {/* Renderiza las páginas hijas */}
    </main>
    <Footer />
  </div>
</div>
```

**Estado**:
```javascript
{
  sidebarOpen: boolean,        // Sidebar abierto en mobile
  sidebarCollapsed: boolean,   // Sidebar colapsado
  isHovering: boolean          // Mouse sobre sidebar
}
```

---

### MainLayoutClub

**Ubicación**: `src/components/layout/MainLayoutClub.jsx`

**Descripción**: Layout para usuarios de tipo CLUB. Idéntico a MainLayout pero usa SidebarClub.

**Diferencias con MainLayout**:
- Usa `SidebarClub` en lugar de `Sidebar`
- Mismo comportamiento de colapsado automático

---

### Sidebar

**Ubicación**: `src/components/layout/Sidebar.jsx`

**Descripción**: Menú lateral para usuarios FEDERACION.

**Props**:
```javascript
{
  isOpen: boolean,              // Abierto en mobile
  isCollapsed: boolean,         // Colapsado
  closeMobile: () => void,      // Cerrar en mobile
  toggleSidebar: () => void     // Toggle colapsar/expandir
}
```

**Items de navegación**:
```javascript
[
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Shield, label: 'Clubes', path: '/clubes' },
  { icon: Users, label: 'Atletas', path: '/atletas' },
  { icon: Award, label: 'Entrenadores de Selección', path: '/entrenadores-seleccion' },
  { icon: Calendar, label: 'Eventos', path: '/eventos' },
  { icon: ClipboardList, label: 'Inscripciones', path: '/inscripciones' },
  { icon: UserCheck, label: 'Tutores', path: '/tutores' },
  { icon: DollarSign, label: 'Pagos', path: '/pagos' },
  { icon: Trophy, label: 'Federación', path: '/federacion' }
]
```

**Características**:
- Navegación con `NavLink` de React Router
- Clase `active` automática en ruta actual
- Tooltips cuando está colapsado
- Botón de toggle para colapsar/expandir

---

### SidebarClub

**Ubicación**: `src/components/layout/SidebarClub.jsx`

**Descripción**: Menú lateral para usuarios CLUB.

**Props**: Idénticas a Sidebar

**Items de navegación**:
```javascript
[
  { icon: LayoutDashboard, label: 'Dashboard', path: '/club' },
  { icon: Info, label: 'Mi Club', path: '/club/info' },
  { icon: Users, label: 'Mis Atletas', path: '/club/atletas' },
  { icon: Calendar, label: 'Mis Eventos', path: '/club/eventos' },
  { icon: Trophy, label: 'Eventos Disponibles', path: '/club/eventos-disponibles' }
]
```

---

### Navbar

**Ubicación**: `src/components/layout/Navbar.jsx`

**Descripción**: Barra de navegación superior.

**Props**:
```javascript
{
  toggleSidebar: () => void,      // Abrir sidebar en mobile
  toggleCollapse: () => void,     // Toggle colapsar sidebar
  isCollapsed: boolean            // Estado colapsado
}
```

**Características**:
- Muestra nombre del usuario actual
- Botón de logout
- Botón de menú hamburguesa en mobile
- Botón de toggle sidebar en desktop

---

## Páginas - Federación

### Dashboard

**Ubicación**: `src/pages/Dashboard.jsx`

**Descripción**: Dashboard principal con estadísticas globales.

**Estado**:
```javascript
{
  stats: {
    totalAtletas: number,
    totalClubes: number,
    eventosActivos: number,
    inscripcionesRecientes: number
  },
  loading: boolean
}
```

**Secciones**:
1. Tarjetas de estadísticas
2. Gráficos de actividad
3. Lista de eventos próximos
4. Actividad reciente

---

### AtletasList

**Ubicación**: `src/pages/Atletas/AtletasList.jsx`

**Descripción**: Lista de todos los atletas del sistema.

**Características**:
- Búsqueda por nombre, DNI o club
- Filtros por categoría y sexo
- Paginación
- Botones de editar y eliminar
- Botón para agregar nuevo atleta

**Estado**:
```javascript
{
  atletas: Array<Atleta>,
  loading: boolean,
  searchTerm: string,
  filters: {
    categoria: string,
    sexo: string,
    clubId: number
  }
}
```

---

### AtletasForm

**Ubicación**: `src/pages/Atletas/AtletasForm.jsx`

**Descripción**: Formulario para crear/editar atletas.

**Modo**: Detecta automáticamente si es creación o edición según la presencia de `:id` en la URL.

**Campos**:
```javascript
{
  nombre: string,
  apellido: string,
  dni: string,
  fechaNacimiento: date,
  sexo: 'MASCULINO' | 'FEMENINO',
  categoria: enum,
  clubId: number,
  tutorId: number,
  direccion: string,
  telefono: string,
  email: string
}
```

**Validaciones**:
- Todos los campos requeridos
- DNI único
- Fecha de nacimiento válida
- Email válido

---

### EventosList

**Ubicación**: `src/pages/Eventos/EventosList.jsx`

**Descripción**: Lista de todos los eventos.

**Características**:
- Vista de tarjetas
- Filtros por estado y fecha
- Búsqueda por nombre
- Indicador de eventos finalizados (opacidad reducida)
- Botón de eliminar

**Estados de evento**:
- `PROGRAMADO`: Evento futuro
- `EN_CURSO`: Evento en progreso
- `FINALIZADO`: Evento terminado

---

### EventoDetalle

**Ubicación**: `src/pages/Eventos/EventoDetalle.jsx`

**Descripción**: Vista detallada de un evento con lista de inscritos.

**Secciones**:
1. Información del evento
2. Tabla de atletas inscritos
3. Estadísticas de inscripciones
4. Botones de acción (editar, eliminar)

---

## Páginas - Club

### ClubDashboard

**Ubicación**: `src/pages/Club/ClubDashboard.jsx`

**Descripción**: Dashboard del club con estadísticas propias.

**Estado**:
```javascript
{
  stats: {
    totalAtletas: number,
    eventosCreados: number,
    inscripcionesActivas: number,
    proximosEventos: number
  },
  loading: boolean
}
```

**Secciones**:
1. Tarjetas de estadísticas del club
2. Actividad reciente del club
3. Próximos eventos

**Datos mostrados**:
- Solo atletas del club
- Solo eventos creados por el club
- Solo inscripciones de atletas del club

---

### ClubInfo

**Ubicación**: `src/pages/Club/ClubInfo.jsx`

**Descripción**: Información detallada del club.

**Secciones**:
1. **Datos Principales**:
   - Nombre del club
   - Dirección
   - Teléfono
   - Email
   - Fecha de fundación
   - Presidente

2. **Estadísticas**:
   - Total de atletas activos
   - Total de entrenadores

3. **Logros y Reconocimientos**:
   - Lista de logros del club

**Estado**:
```javascript
{
  clubData: {
    id: number,
    nombre: string,
    direccion: string,
    telefono: string,
    email: string,
    fechaFundacion: date,
    presidente: string,
    totalAtletas: number,
    totalEntrenadores: number,
    logros: Array<string>
  },
  loading: boolean
}
```

---

### ClubAtletas

**Ubicación**: `src/pages/Club/ClubAtletas.jsx`

**Descripción**: Gestión de atletas del club.

**Características**:
- Vista de tarjetas
- Búsqueda por nombre o DNI
- Botones de editar y eliminar
- Botón para agregar nuevo atleta
- Muestra categoría y edad de cada atleta

**Filtrado**:
- Solo muestra atletas del club actual (filtrado por `clubId`)

**Acciones**:
- Agregar atleta → Navega a `/club/atletas/nuevo`
- Editar atleta → Navega a `/club/atletas/editar/:id`
- Eliminar atleta → Confirmación y eliminación

---

### ClubEventos

**Ubicación**: `src/pages/Club/ClubEventos.jsx`

**Descripción**: Eventos creados por el club.

**Características**:
- Vista de tarjetas
- Badges de estado (PROGRAMADO, EN_CURSO, FINALIZADO)
- Información de inscritos
- Botones de editar y eliminar

**Filtrado**:
- Solo muestra eventos creados por el club actual

**Acciones**:
- Crear evento → Navega a `/club/eventos/nuevo`
- Editar evento → Navega a `/club/eventos/editar/:id`
- Eliminar evento → Confirmación y eliminación

---

### EventosDisponibles

**Ubicación**: `src/pages/Club/EventosDisponibles.jsx`

**Descripción**: Eventos de otros clubes y la federación disponibles para inscripción.

**Características**:
- Vista de tarjetas
- Búsqueda por nombre, ubicación u organizador
- Barra de progreso de cupos
- Indicador de cupos limitados
- Botón de inscribir atletas

**Información mostrada**:
- Nombre del evento
- Organizador (club o federación)
- Fecha y ubicación
- Cupos disponibles / total
- Porcentaje de ocupación

**Filtrado**:
- Excluye eventos del club actual
- Muestra solo eventos con estado PROGRAMADO

**Acciones**:
- Inscribir atletas → Navega a `/club/inscripciones/nuevo?eventoId={id}`

**Cálculos**:
```javascript
const cuposDisponibles = cupoMaximo - inscritosTotal;
const porcentajeOcupacion = (inscritosTotal / cupoMaximo) * 100;
const cuposLimitados = cuposDisponibles < 10;
```

---

## Componentes Reutilizables - Patrones

### Loading State

```javascript
if (loading) {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Cargando...</p>
    </div>
  );
}
```

### Empty State

```javascript
{data.length === 0 ? (
  <div className="empty-state glass-panel">
    <Icon size={48} color="var(--text-secondary)" />
    <h3>No hay datos</h3>
    <p>Descripción del estado vacío</p>
    <Button onClick={handleAction}>
      Acción sugerida
    </Button>
  </div>
) : (
  // Renderizar datos
)}
```

### Search Box

```javascript
<div className="search-box">
  <Search size={20} />
  <input
    type="text"
    placeholder="Buscar..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="search-input"
  />
</div>
```

### Stat Card

```javascript
<div className="stat-card glass-panel">
  <div className="stat-icon" style={{ backgroundColor: bgColor }}>
    <Icon size={24} color={color} />
  </div>
  <div className="stat-content">
    <h3 className="stat-title">{title}</h3>
    <p className="stat-value">{value}</p>
  </div>
</div>
```

---

## Hooks Personalizados

### useAuth

**Ubicación**: `src/context/AuthContext.jsx`

**Descripción**: Hook para acceder al contexto de autenticación.

**Retorna**:
```javascript
{
  user: {
    username: string,
    role: 'FEDERACION' | 'CLUB',
    nombre: string,
    email: string,
    clubId?: number
  },
  login: (username: string, password: string) => Promise<boolean>,
  logout: () => void,
  isAuthenticated: boolean,
  loading: boolean
}
```

**Ejemplo de uso**:
```javascript
import { useAuth } from '../../context/AuthContext';

const Component = () => {
  const { user, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return (
    <div>
      <p>Bienvenido, {user.nombre}</p>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
};
```

---

## Estilos Comunes

### Glass Panel

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Text Gradient

```css
.text-gradient {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Hover Effects

```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}
```

---

**Próxima lectura recomendada:** [05-RUTAS.md](./05-RUTAS.md)
