# Traspasos de atletas — Fase 4 (Notificaciones e integración)

**Fecha:** 2026-07-21  
**Alcance:** `SportTrack-Sigdef` + `Front-Sigdef`

## Resumen

Notificaciones automáticas vía módulo Mensajes al cambiar estado de una solicitud, export CSV para administración federativa e historial de auditoría visible en la bandeja.

## Backend (`SportTrack-Sigdef`)

### Mensajería extendida
- `MensajeRepository`: consultas de usuarios activos por club y admins por federación; emisor de notificaciones federativas.
- `MensajeService.EnviarNotificacionAutomaticaAsync`: envío sin permisos de usuario, remitente = admin federación o SuperAdmin.

### TraspasoNotificacionService
Eventos y destinatarios:
- `SolicitudCreada` → club origen
- `OrigenAcepto` / `OrigenRechazo` → club destino + admins federación
- `FederacionAprobo` / `FederacionRechazo` → ambos clubes
- `Cancelado` → club origen + admins federación

Integrado en `TraspasoService` en crear, aceptar/rechazar origen, aprobar/rechazar federación y cancelar.

### Nuevos endpoints
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/Traspaso/auditoria?limit=` | Historial del módulo Traspasos |
| GET | `/api/Traspaso/export/csv?periodoId=&estado=` | CSV UTF-8 con BOM |

### DI
- `ITraspasoNotificacionService` → `TraspasoNotificacionService` en `Program.cs`

## Frontend (`Front-Sigdef`)

### traspasoService.js
- `getAuditoria(limit)`
- `exportCsv({ periodoId, estado })` — descarga blob autenticada

### traspasoUtils.js
- `normalizeAuditoria`
- `notifyMensajesChanged()` — refresca badge de Mensajes

### TraspasosBandeja (federación)
- Selector de periodo + botón **Exportar CSV**
- Sección **Historial de auditoría**

### Acciones de traspaso
- Tras crear, aceptar, rechazar, aprobar, cancelar: `notifyMensajesChanged()` además de `notifyTraspasosChanged()`

## Documentación
- Guía usuario: [traspasos-paso-a-paso.md](../guias-usuario/traspasos-paso-a-paso.md)

## No incluido (opcional Fase 4)
- Email a delegados — pendiente de requerimiento explícito

## Verificación
- `dotnet build` — OK (0 errores)
- Flujo manual sugerido: crear solicitud → verificar mensaje en club origen → aceptar → aprobar → export CSV y revisar auditoría
