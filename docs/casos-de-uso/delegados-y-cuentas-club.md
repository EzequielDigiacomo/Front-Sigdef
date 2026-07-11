# CU — Delegados vs cuentas de acceso del club

## Contexto

Hay dos conceptos distintos:

| Tipo | Qué es | Ejemplo |
|------|--------|---------|
| Cuenta de panel (login Club) | Usuario para entrar al sistema | `club1fec`, `club1fec2` |
| Delegado persona | Persona con datos, rol delegado | Juan Pérez |

El alta de acceso a club suele hacerse con `Auth/register` y rol **`Club`**. Por eso la lista de “delegados” no puede filtrar solo quitando el rol `Club` sin cuidado.

## CU-D01 — Club lista solo delegados persona

**Actor:** Club  
**Flujo:** Abrir Delegados.  
**Regla:** Excluir cuentas de panel (`isClubPanelAccessAccount`: patrón `clubNfecc`, username = nombre normalizado del club + dígitos).  
**Postcondición:** No aparece `club1fec2` como “delegado”.

## CU-D02 — Intento de borrar cuenta de panel desde Delegados

**Actor:** Club  
**Flujo:** Si aún apareciera, eliminar no debe usar `DELETE /Auth/usuarios/{id}` (no existe).  
**Esperado:** Feedback claro; no borrar la sesión actual. Endpoint canónico de usuario: `DELETE /Usuario/{id}` (con cuidado).

## CU-D03 — Origen de `club1fec2`

Cuentas creadas por scripts de prueba/seed (`scripts/fix-club-usernames*.js`). No son errores de datos de un delegado humano.
