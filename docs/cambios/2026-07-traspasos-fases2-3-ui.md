# Traspasos de atletas — Fases 2 y 3 (UI SIGDEF)

**Fecha:** 2026-07-21  
**Alcance:** `Front-Sigdef` + endpoint auxiliar en API SIGDEF

## Resumen

Se implementó la interfaz de traspasos para federación y clubes, conectada al workflow backend de la Fase 1.

## Fase 2 — UI Federación

### Pantallas
- `/dashboard/traspasos` — Bandeja con filtros por estado
- `/dashboard/traspasos/periodos` — CRUD de periodos de traspaso
- `/dashboard/traspasos/:id` — Detalle con checklist de validaciones + Aprobar/Rechazar

### Rutas SuperAdmin
- `/superadmin/federacion/:fedId/traspasos` (+ periodos y detalle)

### Sidebar
- Item **Traspasos** con badge de pendientes (`PendienteFederacion`)

### ClubDetalles
- Traspaso instantáneo bloqueado: redirige al módulo formal
- Agregar agente libre (sin club) se mantiene

## Fase 3 — UI Club

### Pantallas
- `/club/traspasos/solicitar` — Buscar atleta de otro club y crear solicitud
- `/club/traspasos/entrantes` — Historial de solicitudes enviadas (cancelar si pendiente)
- `/club/traspasos/salientes` — Aceptar/rechazar salidas de atletas del club

### Sidebar club
- Item **Traspasos** con badge de salidas pendientes (`PendienteOrigen` como club origen)

### Bloqueo sin periodo
- Si no hay periodo activo, la pantalla de solicitud muestra aviso y bloquea la acción

## Archivos nuevos

| Archivo | Rol |
|---------|-----|
| `src/services/traspasoService.js` | Cliente API |
| `src/utils/traspasoUtils.js` | Normalización y helpers |
| `src/hooks/usePendingTraspasos.js` | Badge sidebar |
| `src/pages/FederacionAdmin/Traspasos/*` | UI federación |
| `src/pages/ClubAdmin/Traspasos/*` | UI club |
| `src/pages/Shared/Traspasos/Traspasos.css` | Estilos compartidos |

## Backend adicional

- `GET /api/Traspaso/buscar-atletas?term=` — Búsqueda de atletas de otros clubes (rol Club)

## Verificación

1. Admin: crear periodo vigente
2. Club destino: buscar atleta → solicitar traspaso
3. Club origen: aceptar en Salidas pendientes
4. Admin: revisar validaciones → aprobar
5. Confirmar cambio de club en ficha del atleta
