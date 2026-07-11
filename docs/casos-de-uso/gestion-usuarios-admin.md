# CU — Gestión de usuarios y contraseñas (Admin)

## CU-A01 — Registrar acceso de club

**Actor:** Admin  
**Flujo:** Gestión de Accesos → Registrar Club → elegir club, username, password → Registrar.  
**Postcondición:** Usuario rol `Club` con `idClub`.

## CU-A02 — Editar contraseña de un usuario desde la grilla

**Actor:** Admin  
**Precondición:** Usuario existente en `/Usuario`.  
**Flujo:**

1. Clic en llave.
2. Modal de confirmación/edición del sistema (no alert del browser).
3. Nueva clave + confirmación.
4. `PUT /Auth/usuarios/{idUsuario}/password`.

**Postcondición:** Login con la clave nueva funciona.  
**Fallos a evitar:** `idPersona` undefined → 404; endpoint `reset-password` inexistente.

## CU-A03 — No hay pestaña “Cambiar Contraseña” del admin

El cambio de la propia clave del admin (formulario con contraseña actual) se retiró de esta pantalla. El flujo oficial para terceros es el modal de la grilla.
