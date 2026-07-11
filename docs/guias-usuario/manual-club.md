# Manual de usuario — Club

## Alcance

Usuario con rol **Club** (delegado/acceso al panel del club): atletas, entrenadores, tutores, delegados del club, eventos e info del club.

## Menú típico

| Sección | Qué hace |
|---------|----------|
| Info / Dashboard | Resumen del club |
| Atletas | Atletas del club; columna Tutor |
| Entrenadores | Staff del club |
| Tutores | Tutores vinculados a atletas del club (incluye los dados de alta por Federación) |
| Delegados | Personas delegado del club (**no** la cuenta de login institucional) |
| Eventos | Eventos propios y disponibles |

## Atletas

1. **Mis Atletas** → listar / nuevo / editar.
2. Si el atleta es **menor de 18**, conviene asignar tutor (modal o alta desde Tutores).
3. Columna **Tutor**: ✅ con tutor · ❌ menor sin tutor · — mayor.

## Tutores

1. **Mis Tutores** → listar (incluye vínculos hechos desde Federación).
2. **Nuevo tutor**: datos + opcional vínculo a atleta (`?atletaId=` precarga desde atletas).
3. El vínculo se guarda en `AtletaTutor` con `ParticipanteId` (atleta) e `IdTutor`.

## Delegados del club

- La lista muestra **delegados persona** del club.
- **No** deben aparecer cuentas de acceso al panel (`club1fec`, `club1fec2`, etc.): son logins institucionales, no delegados.
- Alta de delegado: formulario de club; no borrar la cuenta con la que estás logueado.

Si ves un “delegado” que es solo un username tipo `club1fec2`, es una cuenta de panel filtrada en código reciente; recargar la pantalla.

## Contraseñas

El club **no** edita contraseñas de otros usuarios desde esta pantalla. La federación lo hace en **Gestión de Accesos** → ícono de llave.
