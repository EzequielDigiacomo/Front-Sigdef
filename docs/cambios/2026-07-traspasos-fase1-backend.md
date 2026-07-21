# Traspasos de atletas — Fase 1 (backend SIGDEF)

**Fecha:** 2026-07-21  
**Alcance:** API SIGDEF en `SportTrack-Sigdef`

## Resumen

Se implementó el workflow formal de traspasos de atletas entre clubes, reemplazando el cambio directo de `IdClub` por un flujo de tres actores: club destino → club origen → federación.

## Cambios

### Base de datos

- Migración `20260721120000_AddTraspasosAtletas`:
  - `federacion.PeriodosTraspaso`
  - `federacion.SolicitudesTraspaso`
- Enum `EstadoSolicitudTraspaso`: `PendienteOrigen`, `RechazadoOrigen`, `PendienteFederacion`, `Aprobado`, `RechazadoFederacion`, `Cancelado`, `Vencido`

### API — `TraspasoController` (`/api/Traspaso`)

| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/periodos` | Admin federación |
| GET | `/periodo-activo` | Todos autenticados |
| POST | `/periodos` | Admin federación |
| PUT | `/periodos/{id}` | Admin federación |
| GET | `/` | Club / Admin (scope por tenant) |
| GET | `/{id}` | Club / Admin |
| GET | `/{id}/validaciones` | Club / Admin |
| POST | `/` | Club destino |
| POST | `/{id}/aceptar-origen` | Club origen |
| POST | `/{id}/rechazar-origen` | Club origen |
| POST | `/{id}/aprobar?forzar=false` | Admin federación |
| POST | `/{id}/rechazar` | Admin federación |
| POST | `/{id}/cancelar` | Club destino |

### Lógica de negocio (`TraspasoService`)

- Creación solo con periodo activo y sin solicitud previa activa del atleta.
- Validaciones bloqueantes antes de aprobar: periodo, pagos club origen/destino, afiliación atleta, estado de pago SIGDEF, inscripciones impagas.
- Aprobación con `?forzar=true` solo para `SuperAdmin` / `soporte_tecnico`.
- Ejecución en transacción: actualiza `AtletasFederados.IdClub` y `Participantes.IdClub`; resetea `PagoAfiliacionAlDia` y `EstadoPago` a pendiente.
- Auditoría en creación de periodo/solicitud, aceptación origen y ejecución.

### Bloqueo traspaso informal

- `PUT /api/Atleta/{id}` con cambio de `IdClub` rechazado para rol **Club**.
- Admin puede cambiar club directo (override de emergencia) con sync de `Participante.IdClub` y auditoría `TRASPASO_ADMIN_DIRECTO`.

## Pendiente (fases siguientes)

- UI club y federación (`Front-Sigdef`)
- Notificaciones
- Estado `Vencido` por plazos (Fase 5)

## Verificación

```bash
dotnet build
dotnet ef database update --project SportTrack-Sigdef.AccesoDatos --startup-project SportTrack-Sigdef
```

Probar endpoints vía Swagger con tokens de club origen, club destino y admin federación.
