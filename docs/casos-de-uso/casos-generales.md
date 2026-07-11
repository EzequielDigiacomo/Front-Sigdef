# Casos de uso generales (resumen)

Casos transversales del producto SIGDEF en el frontend. Detalle ampliado en los otros archivos de esta carpeta y en `referencia/` (legado).

| ID | Nombre | Actor | Resultado |
|----|--------|-------|-----------|
| CU-G01 | Login por rol | Cualquiera | Entra a layout Fed / Club / Super |
| CU-G02 | ABM Club | Admin | Club en padrón |
| CU-G03 | ABM Atleta | Admin / Club | Atleta con club y categoría |
| CU-G04 | ABM Entrenador | Admin / Club | Entrenador ligado a club |
| CU-G05 | Inscripción a evento | Club | Atletas inscritos en distancias |
| CU-G06 | Tutor de menor | Admin / Club | Ver [tutores-atletas.md](./tutores-atletas.md) |
| CU-G07 | Accesos y claves | Admin | Ver [gestion-usuarios-admin.md](./gestion-usuarios-admin.md) |
| CU-G08 | Delegados club | Club | Ver [delegados-y-cuentas-club.md](./delegados-y-cuentas-club.md) |

## Criterios transversales de UI

- Formularios de entidad: estilo compacto compartido.
- Errores/confirmaciones críticas: modales propios (`ConfirmationModal` / `Modal`), no `alert`/`confirm` nativos en flujos tocados.
- Modales portaleados a `document.body`, visibles y con márgenes simétricos.
