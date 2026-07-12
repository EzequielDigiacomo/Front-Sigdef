# Criterios QA — Mensajería y aislamiento SIGDEF / SportTrack

**Fecha:** 2026-07-12  
**Alcance:** FrontSigdef + API SportTrack-Sigdef (`SistemaOrigen` / `X-Client-App`).

## Principio

Misma API y BD; bandejas **separadas** por header:

| Front | Header | Origen en BD |
|-------|--------|--------------|
| FrontSigdef | `X-Client-App: sigdef` | `sigdef` |
| SportTrack-Front | `X-Client-App: sporttrack` | `sporttrack` |

Datos previos a la migración se backfillearon a `sporttrack`.

---

## Matriz de prueba

### A. Aislamiento cruzado

| # | Caso | Resultado esperado |
|---|------|--------------------|
| A1 | Enviar hilo 1:1 desde SIGDEF (Admin ↔ Club) | Aparece en bandeja SIGDEF de ambos |
| A2 | Mismos usuarios abren Mensajes en SportTrack | **No** ven el hilo de A1 |
| A3 | Enviar hilo desde SportTrack | No aparece en SIGDEF |
| A4 | Contador no leídos en nav SIGDEF | Solo cuenta hilos `sigdef` |
| A5 | Contador no leídos en SportTrack | Solo cuenta hilos `sporttrack` |
| A6 | Abrir por ID un hilo del otro sistema (URL/API) | 404 / acceso denegado (filtro por origen) |
| A7 | Campaña masiva desde SIGDEF | Listado campañas SportTrack no la muestra |

### B. Permisos por rol (SIGDEF)

| # | Caso | Resultado esperado |
|---|------|--------------------|
| B1 | Club → Nuevo mensaje | Solo destinatarios Admin de su fed; sin tab Comunicados |
| B2 | Club intenta `POST .../masivo` | Rechazado por API (rol) |
| B3 | Admin → masivo | Solo clubes de su federación |
| B4 | Super → masivo | Admins agrupados por federación |
| B5 | Admin responde a Super y a un club | Ambos hilos en bandeja |

### C. Bandeja y unread

| # | Caso | Resultado esperado |
|---|------|--------------------|
| C1 | Destinatario recibe mensaje | Badge incrementa |
| C2 | Abre el hilo | Se marca leído; badge baja |
| C3 | Responde | Remitente original ve no leído / preview actualizado |
| C4 | Búsqueda local por asunto/nombre | Filtra lista sin romper selección |

### D. Campañas

| # | Caso | Resultado esperado |
|---|------|--------------------|
| D1 | Admin envía a N clubes | N hilos + 1 campaña en tab Comunicados |
| D2 | Detalle campaña | Muestra leídos / respondidos / Ver hilo |
| D3 | Un club responde | Su hilo refleja respuesta; otros no se mezclan |
| D4 | `SistemaOrigen` de campaña e hilos | Todos `sigdef` |

### E. Errores suaves

| # | Caso | Resultado esperado |
|---|------|--------------------|
| E1 | Enviar sin destinatario / asunto / cuerpo | Toast de validación; no llama API |
| E2 | API caída / 500 | Toast de error; UI no queda en loading eterno |
| E3 | Request sin `X-Client-App` válido | API rechaza (ArgumentException / 400) |

### F. Smoke SportTrack (opcional post-migración)

| # | Caso | Resultado esperado |
|---|------|--------------------|
| F1 | Abrir bandeja SportTrack con datos viejos | Siguen visibles (backfill `sporttrack`) |
| F2 | Crear mensaje nuevo en SportTrack | Origen `sporttrack`; unread OK |
| F3 | Campañas SportTrack existentes | Siguen listándose |

---

## DoD Fase 4

1. Plan legado archivado (`PLAN_SISTEMA_COMUNICACION.md`).
2. Guía de usuario publicada.
3. Esta matriz disponible para QA manual.
4. Changelog front + nota de aislamiento en docs de API.
