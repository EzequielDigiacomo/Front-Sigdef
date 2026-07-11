# Guía paso a paso — Tutores y menores

## Conceptos

| Concepto | Detalle |
|----------|---------|
| Tutor | Persona (`Participante`) con rol tutor; **sin** `ClubId` propio |
| Vínculo | Tabla/API `AtletaTutor`: `ParticipanteId` = atleta, `IdTutor` = tutor |
| Menor | Edad &lt; 18 (por fecha de nacimiento; ignorar `0001-01-01`) |

## Federación — alta de tutor con menores

1. **Tutores** → **Nuevo** (debe ir a `/tutores/nuevo`, no a una ruta inexistente).
2. Completar datos del tutor.
3. Seleccionar **club**.
4. Buscar/seleccionar menores del club (solo &lt; 18).
5. Indicar parentesco.
6. Guardar.

### Edición

Al editar, los datos de persona vienen en `participante` (no solo `persona`). Si falta, el front puede enriquecer con `/Persona/{id}`.

## Club — ver y asignar

1. **Mis Tutores**: deben listarse también los asignados desde Federación.
2. Desde **Atletas**, asignar tutor (modal) usando `ParticipanteId` correcto en el POST.
3. Columna Tutor en atletas: ✅ / ❌ / —.

## Errores frecuentes (ya corregidos en código)

| Síntoma | Causa típica |
|---------|----------------|
| Botón Nuevo Tutor vuelve al Dashboard | Ruta `nuevo` vs `new` |
| Formulario vacío en edición | Front leía `persona` y API manda `participante` |
| Vínculo no se guarda / grilla vacía | Payload con `idAtleta` en vez de `ParticipanteId` |
| Columna Tutor todo “—” | API club sin `FechaNacimiento` o fecha inválida |

## Backend relacionado

Ver en SportTrack-Sigdef: `docs/cambios/` y endpoint `GET /Club/...` atletas con fecha de nacimiento.
