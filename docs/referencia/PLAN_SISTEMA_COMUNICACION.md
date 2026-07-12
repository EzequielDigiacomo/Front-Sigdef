# [OBSOLETO] Plan de Implementación: Sistema de Comunicación Interna

> **Estado:** archivado (2026-07-12).  
> Este documento describe un diseño temprano de “notificaciones” que **no** se implementó.  
> La mensajería real vive en la API compartida (`/api/mensajes/...`) con hilos 1:1, campañas masivas y **aislamiento por producto** (`SistemaOrigen` / header `X-Client-App`).

## Documentación vigente

| Qué | Dónde |
|-----|--------|
| Guía de uso (Fed / Club / Super) | [../guias-usuario/mensajes.md](../guias-usuario/mensajes.md) |
| Matriz QA / aislamiento | [../criterios/mensajeria-aislamiento.md](../criterios/mensajeria-aislamiento.md) |
| Changelog front | [../cambios/2026-07-mensajeria-sigdef.md](../cambios/2026-07-mensajeria-sigdef.md) |
| API (aislamiento) | Repo SportTrack-Sigdef → `docs/guias/mensajeria-aislamiento.md` |

## Qué se implementó (resumen)

- **Misma API/BD** para SportTrack y SIGDEF; bandejas **separadas** por `SistemaOrigen` (`sporttrack` | `sigdef`).
- Front SIGDEF: `MensajesPage` en rutas admin / club / superadmin; badge de no leídos.
- 1:1 + comunicados masivos (Admin → clubes; Super → admins de federación). Club solo recibe/responde.
- Fuera de alcance: adjuntos, SMTP, SignalR en mensajería, búsqueda server-side, export.

El contenido histórico original se conserva debajo solo como referencia.

---

# Plan original (histórico, no usar)

Este documento detalla la guía técnica para implementar un sistema de mensajería interna entre la Federación y los Clubes dentro de SIGDEF. El objetivo es eliminar la dependencia de emails externos para comunicaciones operativas y centralizar la información dentro de la plataforma.

## 1. Visión General

El sistema funcionará como una bandeja de entrada simplificada dentro de la aplicación.
- **Federación**: Puede enviar mensajes globales a todos los clubes o mensajes privados a un club específico (ej. "Rechazo de documentación").
- **Clubes**: Reciben notificaciones y pueden contestar o enviar consultas a la Federación.
- **Alertas**: El sistema podrá generar notificaciones automáticas (ej. "Vencimiento de Apto Médico").

> El resto del plan original (entidades tipo Notificacion, endpoints inventados, etc.) quedó reemplazado por el módulo `Mensajes` existente en SportTrack-Sigdef. No implementar desde este archivo.
