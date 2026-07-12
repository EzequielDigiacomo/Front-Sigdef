# Manual de usuario — Federación (Admin)

## Alcance

Usuario con rol **Admin** / federación: padrón federativo, clubes, atletas, entrenadores, selecciones, delegados, tutores, pagos y **Gestión de Accesos**.

## Menú principal (resumen)

| Sección | Qué hace |
|---------|----------|
| Dashboard | Resumen |
| Clubes | Alta / edición de clubes |
| Atletas | Padrón federativo; columna Tutor (✅ / ❌ / —) |
| Entrenadores / Selecciones | Staff y categorías |
| Delegados Club | Personas delegado (no confundir con login de club) |
| Tutores | Alta y vínculo con menores vía club |
| Pagos | Afiliaciones / cobros |
| Federación | Datos de la federación |
| Gestión de Accesos | Logins (club / usuario) y contraseñas |
| Mensajes | Chat 1:1 y comunicados masivos a clubes (solo SIGDEF) |

## Mensajes

Ver guía: [mensajes.md](./mensajes.md). Podés escribir a SuperAdmin o a clubes de tu federación, y enviar **comunicados masivos** (un hilo privado por club). No se mezcla con la bandeja de SportTrack.

## Formularios

Los formularios de entidades (clubes, atletas, entrenadores, delegados, tutores) usan layout **compacto** (`compact-form`): labels densos, grilla de dos columnas cuando aplica.

## Atletas — indicador de tutor

En la grilla:

| Icono | Significado |
|-------|-------------|
| ✅ | Menor con tutor vinculado |
| ❌ | Menor **sin** tutor |
| — | Mayor de edad o N/A |

La edad se calcula con `FechaNacimiento`. Fechas inválidas (`0001-01-01`) se ignoran; hay fallback por categoría infantil si falta fecha.

## Tutores (Federación)

1. Ir a **Tutores** → **Nuevo** (ruta `/tutores/nuevo`).
2. Completar datos de persona.
3. Elegir **club** para listar menores de ese club.
4. Seleccionar menor(es) y parentesco.
5. Guardar: se crea/actualiza tutor y vínculos `AtletaTutor` (`ParticipanteId` = atleta, `IdTutor` = tutor).

El tutor **no tiene `ClubId`**: el club se infiere por los atletas vinculados.

## Gestión de Accesos

Ver guía dedicada: [gestion-accesos-contrasenas.md](./gestion-accesos-contrasenas.md).

## Modales del sistema

Confirmaciones y alertas usan `ConfirmationModal` / `Modal` del sistema (no `window.alert` / `window.confirm` en flujos de accesos).
