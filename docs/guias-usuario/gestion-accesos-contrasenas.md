# Guía — Gestión de Accesos y contraseñas

## Dónde está

**Federación (Admin)** → menú **Gestión de Accesos** (`/dashboard/usuarios`).

## Pestañas

| Pestaña | Uso |
|---------|-----|
| Registrar Club | Alta de usuario con rol Club ligado a un club |
| Registrar Usuario | Alta de usuario persona (otros roles) |

La pestaña **Cambiar Contraseña** (formulario propio del admin logueado) **se eliminó**: ya no aplica. Las claves de terceros se editan desde la grilla.

## Grilla “Usuarios registrados”

Columnas: usuario, contraseña enmascarada, rol, club, estado, fecha.

### Acciones por fila

| Icono | Acción |
|-------|--------|
| Lápiz | Editar usuario (username / activo) |
| Llave | **Editar contraseña** (modal) |

## Paso a paso — editar contraseña de un login

1. Entrá como **Admin**.
2. Abrí **Gestión de Accesos**.
3. En la grilla, localizá el usuario (ej. `club1fec`, `cronometrista1fec`).
4. Clic en el ícono de **llave**.
5. Se abre el modal **Editar contraseña** (centrado, sin alert nativo del navegador).
6. Ingresá **nueva contraseña** (≥ 6) y **confirmación**.
7. **Guardar**.
8. Modal de éxito del sistema → **Entendido**.

### API usada

```http
PUT /api/Auth/usuarios/{idUsuario}/password
Body: "<nuevaContraseña>"   // string JSON
```

- El id es **`idUsuario`** (no `idPersona`).
- No usar `/Usuario/{id}/reset-password` (no expuesto / id incorrecto generaba `.../undefined/reset-password`).

## Criterios

- No usar `window.confirm` / `alert` en este flujo.
- El modal debe verse completo (márgenes laterales iguales, sin cortarse arriba).
- Tras guardar, el usuario puede loguearse con la nueva clave.
