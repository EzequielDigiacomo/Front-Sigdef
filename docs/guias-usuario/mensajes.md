# Mensajes internos (SIGDEF)

Comunicación privada dentro de la plataforma. **No** se mezcla con la bandeja de SportTrack: cada producto tiene su propio hilo aunque usen la misma API.

## Quién puede qué

| Rol | Bandeja 1:1 | Comunicados masivos | Destinatarios típicos |
|-----|-------------|---------------------|------------------------|
| SuperAdmin | Sí | Sí → admins de federación | Admins agrupados por federación |
| Admin (Fed) | Sí | Sí → clubes de su federación | SuperAdmin y clubes de la fed |
| Club | Sí | No | Solo el admin de su federación |

## Cómo usarlo

### Abrir la bandeja

- Federación: menú **Mensajes** (`/dashboard/mensajes`).
- Club: menú **Mensajes** (`/club/mensajes`).
- SuperAdmin: **Mensajes** en el layout super (`/superadmin/mensajes`).

El badge del menú muestra mensajes **sin leer** de SIGDEF.

### Mensaje individual

1. **Nuevo mensaje**.
2. Elegir destinatario → asunto → cuerpo → **Enviar**.
3. Abrir el hilo para responder; al abrirlo se marca como leído.

### Comunicado masivo (solo Admin / Super)

1. **Nuevo mensaje** → modo **Comunicado masivo**.
2. Seleccionar uno o varios destinatarios (botones Todos / Ninguno por grupo).
3. Enviar: se crea un **hilo privado por destinatario** (no es un chat grupal).
4. Tab **Comunicados enviados**: ver desglose (leído / respondió) y abrir cada hilo.

## Importante

- Un mensaje creado en SIGDEF **no aparece** en SportTrack, y al revés.
- El club **no** crea campañas; solo lee y responde.
- Sin adjuntos ni correo externo en este módulo.
