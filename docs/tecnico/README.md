# Técnico (frontend)

Índice de documentación técnica vigente. Los archivos numerados históricos viven en [../referencia/](../referencia/).

| Tema | Documento |
|------|-----------|
| Arquitectura | [../referencia/01-ARQUITECTURA.md](../referencia/01-ARQUITECTURA.md) |
| Roles | [../referencia/02-SISTEMA-ROLES.md](../referencia/02-SISTEMA-ROLES.md) |
| Estructura de carpetas | [../referencia/03-ESTRUCTURA-PROYECTO.md](../referencia/03-ESTRUCTURA-PROYECTO.md) |
| API backend (visión front) | [../referencia/04-API-BACKEND.md](../referencia/04-API-BACKEND.md) |
| Integración API | [../referencia/07-API-INTEGRATION.md](../referencia/07-API-INTEGRATION.md) |
| Guía desarrollo | [../referencia/08-GUIA-DESARROLLO.md](../referencia/08-GUIA-DESARROLLO.md) |
| SaaS / Superadmin | [../referencia/13-SaaS-MultiTenant-Superadmin.md](../referencia/13-SaaS-MultiTenant-Superadmin.md) |
| Control de acceso por plan | [../referencia/CONTROL_ACCESO_PLAN.md](../referencia/CONTROL_ACCESO_PLAN.md) |
| Helpers delegados / cuentas club | Código: `src/utils/delegadoHelpers.js` |
| Modales | `src/components/common/Modal.jsx`, `ConfirmationModal.jsx` |

## Convenciones recientes

- Preferir modales del sistema a `alert`/`confirm`.
- IDs de usuario de acceso: `idUsuario`.
- Vínculos tutor–atleta: `ParticipanteId` + `IdTutor`.
- Formularios de entidad: clase `compact-form` / `compact-form-card`.
