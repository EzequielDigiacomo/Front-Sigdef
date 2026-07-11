# 📁 Estructura del Proyecto

## Árbol de Directorios

```
FrontSigdef/
├── docs/                           # 📚 Documentación completa
│   ├── README.md
│   ├── 01-ARQUITECTURA.md
│   ├── 02-SISTEMA-ROLES.md
│   ├── 03-ESTRUCTURA-PROYECTO.md
│   ├── 04-COMPONENTES.md
│   ├── 05-RUTAS.md
│   ├── 06-ESTILOS.md
│   ├── 07-API-INTEGRATION.md
│   ├── 08-GUIA-DESARROLLO.md
│   └── 09-DEPLOYMENT.md
│
├── public/                         # 🌐 Archivos públicos estáticos
│   └── vite.svg
│
├── src/                            # 💻 Código fuente
│   ├── assets/                     # 🎨 Recursos (imágenes, fuentes, etc.)
│   │   └── react.svg
│   │
│   ├── components/                 # 🧩 Componentes reutilizables
│   │   ├── common/                 # Componentes comunes
│   │   │   ├── Button.jsx
│   │   │   ├── Button.css
│   │   │   ├── Card.jsx
│   │   │   └── Card.css
│   │   │
│   │   └── layout/                 # Componentes de layout
│   │       ├── MainLayout.jsx      # Layout para Federación
│   │       ├── MainLayout.css
│   │       ├── MainLayoutClub.jsx  # Layout para Club
│   │       ├── Navbar.jsx          # Barra de navegación
│   │       ├── Navbar.css
│   │       ├── Sidebar.jsx         # Sidebar para Federación
│   │       ├── Sidebar.css
│   │       ├── SidebarClub.jsx     # Sidebar para Club
│   │       └── Footer.jsx
│   │
│   ├── context/                    # 🔄 Context API
│   │   └── AuthContext.jsx         # Contexto de autenticación
│   │
│   ├── hooks/                      # 🪝 Custom Hooks
│   │   └── (vacío por ahora)
│   │
│   ├── pages/                      # 📄 Páginas de la aplicación
│   │   │
│   │   ├── Login.jsx               # Página de login
│   │   ├── Login.css
│   │   │
│   │   ├── Dashboard.jsx           # Dashboard de Federación
│   │   ├── Dashboard.css
│   │   │
│   │   ├── Atletas/                # 🏃 Módulo de Atletas
│   │   │   ├── AtletasList.jsx
│   │   │   ├── AtletasList.css
│   │   │   ├── AtletasForm.jsx
│   │   │   └── AtletasForm.css
│   │   │
│   │   ├── Clubes/                 # 🏛️ Módulo de Clubes
│   │   │   ├── ClubesList.jsx
│   │   │   ├── ClubesList.css
│   │   │   ├── ClubesForm.jsx
│   │   │   ├── ClubesForm.css
│   │   │   ├── ClubDetalles.jsx
│   │   │   └── ClubDetalles.css
│   │   │
│   │   ├── Eventos/                # 📅 Módulo de Eventos
│   │   │   ├── EventosList.jsx
│   │   │   ├── EventosList.css
│   │   │   ├── EventosForm.jsx
│   │   │   ├── EventosForm.css
│   │   │   ├── EventoDetalle.jsx
│   │   │   └── EventoDetalle.css
│   │   │
│   │   ├── Inscripciones/          # 📝 Módulo de Inscripciones
│   │   │   ├── InscripcionesList.jsx
│   │   │   ├── InscripcionesList.css
│   │   │   ├── InscripcionesForm.jsx
│   │   │   └── InscripcionesForm.css
│   │   │
│   │   ├── Tutores/                # 👨‍👩‍👧 Módulo de Tutores
│   │   │   ├── TutoresList.jsx
│   │   │   ├── TutoresList.css
│   │   │   ├── TutoresForm.jsx
│   │   │   └── TutoresForm.css
│   │   │
│   │   ├── EntrenadorSeleccion/    # 🏆 Módulo de Entrenadores
│   │   │   ├── EntrenadorSeleccionList.jsx
│   │   │   ├── EntrenadorSeleccionList.css
│   │   │   ├── EntrenadorSeleccionForm.jsx
│   │   │   └── EntrenadorSeleccionForm.css
│   │   │
│   │   └── Club/                   # 🎯 Módulo de Club (NUEVO)
│   │       ├── ClubDashboard.jsx   # Dashboard del club
│   │       ├── ClubDashboard.css
│   │       ├── ClubInfo.jsx        # Información del club
│   │       ├── ClubInfo.css
│   │       ├── ClubAtletas.jsx     # Atletas del club
│   │       ├── ClubAtletas.css
│   │       ├── ClubEventos.jsx     # Eventos del club
│   │       ├── ClubEventos.css
│   │       ├── EventosDisponibles.jsx  # Eventos disponibles
│   │       └── EventosDisponibles.css
│   │
│   ├── services/                   # 🔌 Servicios para API
│   │   └── api.js                  # Cliente API (futuro)
│   │
│   ├── utils/                      # 🛠️ Utilidades
│   │   └── helpers.js              # Funciones helper
│   │
│   ├── App.jsx                     # 🚀 Componente principal
│   ├── App.css                     # Estilos de App
│   ├── main.jsx                    # Punto de entrada
│   └── index.css                   # Estilos globales
│
├── .gitignore                      # Git ignore
├── eslint.config.js                # Configuración ESLint
├── index.html                      # HTML principal
├── package.json                    # Dependencias
├── package-lock.json               # Lock de dependencias
├── vite.config.js                  # Configuración Vite
├── README.md                       # README principal
└── SISTEMA_ROLES.md                # Documentación de roles
```

## Descripción de Carpetas

### 📚 `/docs`
Contiene toda la documentación del proyecto:
- Arquitectura del sistema
- Sistema de roles y permisos
- Guías de desarrollo
- Documentación de componentes
- Guías de integración con API

### 🌐 `/public`
Archivos estáticos que se sirven directamente:
- Favicon
- Imágenes públicas
- Archivos de configuración (manifest.json, robots.txt)

### 💻 `/src`
Código fuente principal de la aplicación.

#### 🎨 `/src/assets`
Recursos de la aplicación:
- Imágenes
- Fuentes
- Iconos personalizados
- Logos

#### 🧩 `/src/components`
Componentes reutilizables organizados por tipo:

**`/common`**: Componentes genéricos reutilizables
- Button: Botón personalizado con variantes
- Card: Tarjeta con glass-morphism
- Modal: Modal reutilizable
- Input: Inputs personalizados

**`/layout`**: Componentes de estructura
- MainLayout: Layout principal para Federación
- MainLayoutClub: Layout para Club
- Navbar: Barra de navegación superior
- Sidebar: Menú lateral para Federación
- SidebarClub: Menú lateral para Club

#### 🔄 `/src/context`
Contextos de React para estado global:
- **AuthContext**: Manejo de autenticación y usuario actual

#### 🪝 `/src/hooks`
Custom hooks reutilizables:
- useAuth: Hook para acceder al contexto de autenticación
- useApi: Hook para llamadas a API (futuro)
- useForm: Hook para manejo de formularios (futuro)

#### 📄 `/src/pages`
Páginas de la aplicación organizadas por módulo:

**Páginas Generales**:
- Login: Página de inicio de sesión
- Dashboard: Dashboard principal de Federación

**Módulos de Federación**:
- Atletas: Gestión de atletas
- Clubes: Gestión de clubes
- Eventos: Gestión de eventos
- Inscripciones: Gestión de inscripciones
- Tutores: Gestión de tutores
- EntrenadorSeleccion: Gestión de entrenadores

**Módulo de Club**:
- ClubDashboard: Dashboard del club
- ClubInfo: Información del club
- ClubAtletas: Atletas del club
- ClubEventos: Eventos del club
- EventosDisponibles: Eventos para inscribir atletas

#### 🔌 `/src/services`
Servicios para comunicación con backend:
- api.js: Cliente HTTP configurado
- Servicios específicos por módulo (futuro)

#### 🛠️ `/src/utils`
Funciones utilitarias:
- helpers.js: Funciones helper generales
- validators.js: Validaciones (futuro)
- formatters.js: Formateadores de datos (futuro)

## Convenciones de Nombres

### Archivos
- **Componentes**: PascalCase (ej: `Button.jsx`, `MainLayout.jsx`)
- **Estilos**: PascalCase coincidiendo con el componente (ej: `Button.css`)
- **Utilidades**: camelCase (ej: `helpers.js`, `validators.js`)
- **Contextos**: PascalCase + Context (ej: `AuthContext.jsx`)

### Carpetas
- **Módulos**: PascalCase (ej: `Atletas/`, `Clubes/`)
- **Utilidades**: camelCase (ej: `utils/`, `services/`)
- **Componentes**: camelCase (ej: `common/`, `layout/`)

### Variables y Funciones
```javascript
// Variables: camelCase
const userName = 'John';
const isAuthenticated = true;

// Funciones: camelCase
function handleSubmit() {}
const fetchData = async () => {};

// Componentes: PascalCase
const Button = () => {};
const MainLayout = () => {};

// Constantes: UPPER_SNAKE_CASE
const API_URL = 'https://api.example.com';
const MAX_RETRIES = 3;
```

## Organización de Código

### Estructura de un Componente

```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import './ComponentName.css';

// 2. Componente
const ComponentName = () => {
    // 2.1. Hooks
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // 2.2. Estado
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // 2.3. Efectos
    useEffect(() => {
        fetchData();
    }, []);
    
    // 2.4. Funciones
    const fetchData = async () => {
        // Lógica
    };
    
    const handleSubmit = (e) => {
        // Lógica
    };
    
    // 2.5. Renderizado condicional
    if (loading) return <div>Loading...</div>;
    
    // 2.6. Render principal
    return (
        <div className="component-name">
            {/* JSX */}
        </div>
    );
};

// 3. Export
export default ComponentName;
```

### Estructura de una Página

```javascript
// Páginas siguen la misma estructura pero con:
// - Más lógica de negocio
// - Llamadas a API
// - Composición de múltiples componentes
// - Manejo de estado más complejo
```

## Patrones de Importación

### Orden de Imports
```javascript
// 1. React y librerías externas
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// 2. Contextos y hooks personalizados
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';

// 3. Componentes
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

// 4. Utilidades y servicios
import { formatDate } from '../../utils/helpers';
import { fetchAtletas } from '../../services/api';

// 5. Estilos
import './ComponentName.css';
```

### Rutas Relativas vs Absolutas
```javascript
// Relativas (preferido para archivos cercanos)
import Button from '../../components/common/Button';

// Absolutas (configurar en vite.config.js para rutas largas)
import Button from '@/components/common/Button';
```

## Gestión de Estilos

### Estructura de un archivo CSS

```css
/* 1. Variables locales (si las hay) */
.component-name {
    --local-color: #fff;
}

/* 2. Contenedor principal */
.component-name {
    padding: 1rem;
}

/* 3. Elementos hijos */
.component-name .header {
    margin-bottom: 1rem;
}

.component-name .content {
    /* ... */
}

/* 4. Estados y variantes */
.component-name.active {
    /* ... */
}

.component-name:hover {
    /* ... */
}

/* 5. Media queries */
@media (max-width: 768px) {
    .component-name {
        padding: 0.5rem;
    }
}
```

### Variables CSS Globales
Definidas en `src/index.css`:
```css
:root {
    --primary: #6366f1;
    --secondary: #8b5cf6;
    --success: #22c55e;
    --warning: #fb923c;
    --danger: #ef4444;
    --info: #3b82f6;
    
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
}
```

## Flujo de Datos

### De Padre a Hijo (Props)
```javascript
// Padre
<Button variant="primary" onClick={handleClick}>
    Click me
</Button>

// Hijo
const Button = ({ variant, onClick, children }) => {
    return <button className={variant} onClick={onClick}>{children}</button>;
};
```

### De Hijo a Padre (Callbacks)
```javascript
// Padre
const handleDataChange = (newData) => {
    setData(newData);
};

<Form onSubmit={handleDataChange} />

// Hijo
const Form = ({ onSubmit }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };
};
```

### Estado Global (Context)
```javascript
// Proveedor
<AuthProvider>
    <App />
</AuthProvider>

// Consumidor
const { user, login, logout } = useAuth();
```

## Mejores Prácticas

### 1. Un componente por archivo
```javascript
// ✅ Correcto
// Button.jsx
export default Button;

// ❌ Incorrecto
// Components.jsx
export const Button = () => {};
export const Input = () => {};
```

### 2. Colocar estilos junto al componente
```
components/
├── Button.jsx
└── Button.css
```

### 3. Agrupar por funcionalidad, no por tipo
```
// ✅ Correcto
pages/
├── Atletas/
│   ├── AtletasList.jsx
│   └── AtletasForm.jsx

// ❌ Incorrecto
pages/
├── Lists/
│   └── AtletasList.jsx
└── Forms/
    └── AtletasForm.jsx
```

### 4. Usar index.js para exports limpios
```javascript
// components/common/index.js
export { default as Button } from './Button';
export { default as Card } from './Card';

// Uso
import { Button, Card } from '../../components/common';
```

---

**Próxima lectura recomendada:** [04-COMPONENTES.md](./04-COMPONENTES.md)
