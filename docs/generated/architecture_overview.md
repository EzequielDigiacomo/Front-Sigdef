# Arquitectura y Estado Global

Este documento describe cómo se maneja el estado global de la aplicación y las utilidades comunes.

## 🌐 Contextos (Global State)

La aplicación utiliza React Context API para manejar estados que necesitan ser accesibles desde múltiples componentes.

### AuthContext (`src/context/AuthContext.jsx`)
Maneja la autenticación y la sesión del usuario.
- **Estado**: `user` (objeto con datos del usuario y token), `loading`.
- **Funciones**:
  - `login(username, password)`: Realiza la petición al backend, decodifica el token JWT y establece la sesión.
  - `logout()`: Limpia el estado y el localStorage.
  - `isTokenValid(token)`: Verifica la expiración del JWT.
- **Persistencia**: Al recargar la página, intenta restaurar la sesión desde `localStorage` si el token es válido.

### ThemeContext (`src/context/ThemeContext.jsx`)
Controla el tema visual de la aplicación (Claro/Oscuro).
- **Estado**: `theme` ('light' | 'dark').
- **Funciones**: `toggleTheme()`.
- **Persistencia**: Guarda la preferencia en `localStorage`.

## 🛠️ Utilidades (`src/utils`)

### Enums y Mapeos (`src/utils/enums.js`)
Centraliza las constantes y mapeos de valores numéricos (IDs) a textos legibles, utilizados en toda la aplicación para mantener consistencia.

- **Mapas**:
  - `CATEGORIA_MAP`: Categorías de atletas (Infantil, Cadete, etc.).
  - `ESTADO_PAGO_MAP`: Estados de deuda (Pendiente, Pagado, Vencido).
  - `ROL_TIPO_MAP`: Roles de usuario (Administrador, Entrenador, etc.).
- **Helpers**:
  - `getCategoriaLabel(value)`
  - `getEstadoPagoColor(value)`: Retorna el color (success, danger, warning) asociado al estado de pago para usar en badges/etiquetas.

## 📂 Estructura de Directorios Clave

- `src/pages`: Vistas principales de la aplicación.
- `src/components`: Componentes reutilizables (UI kit).
- `src/services`: Lógica de comunicación con la API (`api.js`).
- `src/context`: Proveedores de estado global.
- `src/utils`: Funciones auxiliares y constantes.
