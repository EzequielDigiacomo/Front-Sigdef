# Changelog — 2026-07 — UI, tutores, accesos (FrontSigdef)

Trabajo **ya implementado y guardado** en el frontend SIGDEF.

## 1. Formularios compactos

- Estilos compartidos: `src/styles/CompactForm.css`.
- Aplicado a formularios Fed/Club: Clubes, Atletas, Entrenadores, Delegados, Tutores.
- Ajustes de densidad en `FederacionDetalles` y formularios asociados.

## 2. Tutores

| Cambio | Archivos / notas |
|--------|------------------|
| Ruta `tutores/nuevo` | `App.jsx` |
| Precarga `participante` (+ fallback Persona) | `TutoresForm`, `ClubTutoresForm`, atletas |
| Vínculos `ParticipanteId` (no `idAtleta`) | Listas, forms, `AssignTutorModal`, club atletas/tutores |
| Selector club + menores &lt; 18 | Form Fed |
| Columna Tutor ✅/❌/— | `TutorStatusCell.jsx` en Fed y Club |
| Club ve tutores de Fed | Listados / filtros |

## 3. Delegados de club

| Cambio | Archivos / notas |
|--------|------------------|
| Ocultar cuentas panel `club1fec`, `club1fec2` | `delegadoHelpers.js` → `isClubPanelAccessAccount` |
| Delete vía `/Usuario/{id}` + modales de error | `ClubDelegados.jsx` |
| No borrar sesión actual | Validación en confirmación |

## 4. Gestión de Accesos

| Cambio | Archivos / notas |
|--------|------------------|
| Confirm/alert nativos → `ConfirmationModal` | `UserTable.jsx` |
| Reset roto → **Editar contraseña** con `idUsuario` | `PUT /Auth/usuarios/{id}/password` |
| Modal portal + layout simétrico | `Modal.jsx`, `Modal.css`, `UserTable.css` |
| Eliminada pestaña Cambiar Contraseña | `UserManagement.jsx`; borrado `ChangePasswordForm.jsx` |
| Grilla sin scroll horizontal excesivo | `UserManagement.css` + `UserTable.css` |

## 5. Documentación

- Centralizada en esta carpeta `docs/` (ver [README](../README.md)).

## Dependencia de API

Para columna Tutor correcta en atletas de **club**, el backend debe devolver `FechaNacimiento` en el endpoint de atletas por club (cambio en SportTrack-Sigdef). Sin redeploy, el front mitiga con fallbacks.
