# Changelog — 2026-07 — Mensajería interna SIGDEF

Módulo de mensajes en FrontSigdef, aislado de SportTrack vía `X-Client-App: sigdef`.

## Backend (SportTrack-Sigdef) — Fase 0

- Columna `SistemaOrigen` en `Hilos` y `CampanasEnvio`.
- Migración `AddSistemaOrigenMensajeria` + backfill → `sporttrack`.
- Create/list/detail/unread/campañas filtran y setean origen desde el header.
- Sin header válido (`sporttrack` \| `sigdef`) → error.

## Frontend (FrontSigdef) — Fases 1–3

| Pieza | Ubicación |
|-------|-----------|
| Cliente HTTP con `X-Client-App: sigdef` | `src/services/api.js` |
| `MessageService` | `src/services/messageService.js` |
| Badge no leídos | `src/hooks/useUnreadMessages.js` + nav |
| Página bandeja / campañas | `src/pages/Shared/MensajesPage.jsx` |
| Multi-select destinatarios | `DestinatariosMultiSelect.jsx` |
| Detalle campaña | `CampanaDetalle.jsx` |
| Rutas | `/dashboard/mensajes`, `/club/mensajes`, `/superadmin/mensajes` |

## Docs — Fase 4

- Guía: [../guias-usuario/mensajes.md](../guias-usuario/mensajes.md)
- QA: [../criterios/mensajeria-aislamiento.md](../criterios/mensajeria-aislamiento.md)
- Plan legado archivado: [../referencia/PLAN_SISTEMA_COMUNICACION.md](../referencia/PLAN_SISTEMA_COMUNICACION.md)

## Fuera de alcance

Adjuntos, SMTP, SignalR en mensajería, búsqueda server-side, export formal.
