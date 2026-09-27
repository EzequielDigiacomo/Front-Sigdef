# Documentación FrontSigdef (SIGDEF)

**Única carpeta de documentación del frontend.** Todo lo demás (raíz del repo, `SIGDEF_Dev_Documentation/`, `.agent/`) debe apuntar aquí.

**Última actualización:** 2026-09-27

**Stack verificado:** React **19** + react-router-dom **7** + Vite **7** (CSS plano) · Backend **`.NET 10`** (`net10.0`) + PostgreSQL · API en Render (`https://sporttrack-sigdef.onrender.com/api`) · Android con Capacitor 8.

---

## 📦 Pack de Entrega

El **[Pack de Entrega](./Entrega/README.md)** es el conjunto documental oficial y consolidado del proyecto. Refleja el **código real** y reemplaza como referencia de entrega a la documentación histórica.

| Documento | Contenido |
|-----------|-----------|
| [README del pack](./Entrega/README.md) | Portada, ficha del proyecto, alcance y glosario |
| [01 — Requerimientos de Usuario](./Entrega/01-Requerimientos-Usuario.md) | RF, RNF (ISO 25010), HU en Gherkin, RN y matriz de trazabilidad |
| [02 — Casos de Uso](./Entrega/02-Casos-de-Uso.md) | Diagrama UML y CU-01 a CU-15 detallados |
| [03 — Diagramas de Flujo](./Entrega/03-Diagramas-de-Flujo.md) | Flujos, secuencias y máquinas de estado (Mermaid) |
| [04 — Manual de Usuario](./Entrega/04-Manual-de-Usuario.md) | Guía paso a paso por rol y FAQ |
| [05 — Manual Técnico](./Entrega/05-Manual-Tecnico.md) | Arquitectura, rutas, API, seguridad, deuda técnica |
| [06 — Instalación y Despliegue](./Entrega/06-Manual-Instalacion-Despliegue.md) | Requisitos, build, Vercel y Capacitor Android |

> 📄 **PDF consolidado:** [Entrega/Pack-Entrega-FrontSigdef.pdf](./Entrega/Pack-Entrega-FrontSigdef.pdf) — todo el pack en un único archivo (7 documentos, tablas y 13 diagramas, 93 páginas).

### Funcionalidades destacadas

- **Traspasos de atletas** con periodo activo obligatorio, validaciones de deuda, estados y **export CSV**.
- **Tutores obligatorios** para atletas menores de edad (vinculación `AtletaTutor`).
- **Pagos y recibos**: toggles de club/atleta/inscripción, registro y eliminación masiva.
- **Mensajería interna y masiva** aislada por `X-Client-App: sigdef`.
- **Backups de base** (`full` o por federación) e historial.
- **Planes editables** desde el SuperAdmin (precio mensual, descuento anual, `maxAtletas`).
- **SaaS multi-tenant**: federaciones, suscripciones, auditoría, estados de acceso y renovación.

---

## Cómo está organizada

| Carpeta | Para qué sirve |
|---------|----------------|
| **[Entrega/](./Entrega/)** | **Pack de Entrega oficial (vigente)** |
| [guias-usuario/](./guias-usuario/) | Manuales y guías paso a paso (Federación, Club, Accesos, Mensajes) |
| [casos-de-uso/](./casos-de-uso/) | Casos de uso y flujos de negocio |
| [criterios/](./criterios/) | Criterios de aceptación / Definition of Done |
| [cambios/](./cambios/) | Registro de cambios guardados (changelogs por fecha) |
| [tecnico/](./tecnico/) | Arquitectura, roles, API, desarrollo |
| [referencia/](./referencia/) | Documentación histórica / legado numerado |

> ⚠️ **[referencia/](./referencia/), [tecnico/](./tecnico/) y `SIGDEF_Dev_Documentation/` son material histórico.** Contradicen el código actual en varios puntos: mencionan **`.NET 8`** (real: **`.NET 10`**), React 18 + Router 6 + CSS Modules (real: React 19 + Router 7 + CSS plano), login mock `admin/admin` (real: JWT), rutas raíz `/atletas` y `/clubes` (real: `/dashboard`, `/club`, `/superadmin`), planes Enterprise/Premium/Básico (real: S/M/L IDs 1–9) y `localhost:7112`. Ante cualquier duda, la fuente de verdad es el código y el [Pack de Entrega](./Entrega/README.md).

**Plan activo:** [referencia/PLAN_TRASPASOS_ATLETAS.md](./referencia/PLAN_TRASPASOS_ATLETAS.md) — traspasos de atletas (SIGDEF, 5 fases).  
**Flujo vigente:** [casos-de-uso/traspasos-atletas-flujo.md](./casos-de-uso/traspasos-atletas-flujo.md) — federación verifica deuda → club origen acepta/ejecuta.

---

## Inicio rápido (dev)

```bash
npm install
npm run dev
```

App local: `http://localhost:5173`

API típica: `https://sporttrack-sigdef.onrender.com/api` (o la de `.env`).

---

## Lectura recomendada según rol

| Quién sos | Empezá por |
|-----------|------------|
| **Entrega / auditoría del proyecto** | **[Pack de Entrega](./Entrega/README.md)** — fuente de verdad |
| Usuario Federación / Admin | [guias-usuario/manual-federacion.md](./guias-usuario/manual-federacion.md) · [Entrega/04](./Entrega/04-Manual-de-Usuario.md) |
| Usuario Club / Delegado | [guias-usuario/manual-club.md](./guias-usuario/manual-club.md) · [Entrega/04](./Entrega/04-Manual-de-Usuario.md) |
| Traspasos de atletas | [casos-de-uso/traspasos-atletas-flujo.md](./casos-de-uso/traspasos-atletas-flujo.md) · [guía paso a paso](./guias-usuario/traspasos-paso-a-paso.md) · [Entrega/03](./Entrega/03-Diagramas-de-Flujo.md) |
| Gestión de logins y claves | [guias-usuario/gestion-accesos-contrasenas.md](./guias-usuario/gestion-accesos-contrasenas.md) |
| Tutores y menores | [guias-usuario/tutores-paso-a-paso.md](./guias-usuario/tutores-paso-a-paso.md) |
| Mensajes internos | [guias-usuario/mensajes.md](./guias-usuario/mensajes.md) |
| QA / aceptación | [criterios/criterios-aceptacion.md](./criterios/criterios-aceptacion.md) · [Entrega/01](./Entrega/01-Requerimientos-Usuario.md) |
| QA mensajería / aislamiento | [criterios/mensajeria-aislamiento.md](./criterios/mensajeria-aislamiento.md) |
| Desarrollador | [tecnico/README.md](./tecnico/README.md) · [Entrega/05](./Entrega/05-Manual-Tecnico.md) |
| Diagramas (UML / arquitectura) | [tecnico/diagramas-sistema.md](./tecnico/diagramas-sistema.md) · [Entrega/03](./Entrega/03-Diagramas-de-Flujo.md) |
| Instalación / despliegue | [Entrega/06](./Entrega/06-Manual-Instalacion-Despliegue.md) |
| Qué se guardó en jul-2026 (UI) | [cambios/2026-07-ui-tutores-accesos.md](./cambios/2026-07-ui-tutores-accesos.md) |
| Mensajería jul-2026 | [cambios/2026-07-mensajeria-sigdef.md](./cambios/2026-07-mensajeria-sigdef.md) |

---

## Relación con el backend

El backend es una API REST en **`.NET 10`** (`net10.0`) con **PostgreSQL**, alojada en Render:

```
https://sporttrack-sigdef.onrender.com/api
```

El repositorio del backend es **SportTrack-Sigdef** → carpeta `docs/` (diagramas canónicos en `docs/tecnico/diagramas/`).

> ℹ️ Los documentos históricos que mencionan **`.NET 8`** o `localhost:7112` están desactualizados. El *target framework* real es **`.NET 10`**; ver [Entrega/05 — Manual Técnico](./Entrega/05-Manual-Tecnico.md).

SportTrack (competencias/Live): repo **SportTrack-Front** → `docs/tecnico/diagramas/`.
