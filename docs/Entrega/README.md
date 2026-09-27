# Pack de Entrega — Frontend SIGDEF (FrontSigdef)

**Última actualización: 2026-09-27**

Portada del paquete documental de entrega del **frontend** del **Sistema de Gestión Deportiva Federativa (SIGDEF)**. Este pack describe, en calidad de entrega formal, los requerimientos, casos de uso, flujos, manuales de usuario y la documentación técnica y de despliegue de la SPA React que consume la API unificada **SportTrack / SIGDEF**.

> **Nota de alcance.** Este pack documenta **exclusivamente el frontend `FrontSigdef`**. La API, la base de datos y el frontend de competencias SportTrack (`SportTrack-Front`) tienen sus propios packs de entrega en sus respectivos repositorios.

> 📄 **PDF consolidado del pack:** [`Pack-Entrega-FrontSigdef.pdf`](./Pack-Entrega-FrontSigdef.pdf)
> Contiene los 7 documentos en orden, con todas las tablas y los **13 diagramas renderizados**. A4, 93 páginas, con índice navegable y marcadores (bookmarks) por sección.

---

## Índice del pack

| # | Documento | Contenido |
|---|-----------|-----------|
| — | **README.md** (este archivo) | Portada, ficha del proyecto, alcance, glosario y documentos históricos |
| 1 | [01 — Requerimientos de Usuario](./01-Requerimientos-Usuario.md) | Actores, RF, RNF (ISO 25010), Historias de Usuario (Gherkin), Reglas de Negocio y matriz de trazabilidad |
| 2 | [02 — Casos de Uso](./02-Casos-de-Uso.md) | Diagrama UML de casos de uso y especificación detallada de CU-01…CU-15 |
| 3 | [03 — Diagramas de Flujo](./03-Diagramas-de-Flujo.md) | Diagramas Mermaid: login/rol/plan, alta de atleta con tutor, traspasos (estados), pagos/recibos, logins, mensajería, ciclo SaaS y backups |
| 4 | [04 — Manual de Usuario](./04-Manual-de-Usuario.md) | Guía paso a paso por rol, tablas de campos, notas y FAQ / troubleshooting |
| 5 | [05 — Manual Técnico](./05-Manual-Tecnico.md) | Arquitectura, stack real, estructura del código, rutas y guards, contratos de API, seguridad, build, despliegue y deuda técnica |
| 6 | [06 — Manual de Instalación y Despliegue](./06-Manual-Instalacion-Despliegue.md) | Requisitos, instalación, entorno, ejecución local, build, Vercel y Android/Capacitor |

---

## Ficha del proyecto

| Atributo | Valor |
|----------|-------|
| **Nombre** | SIGDEF — Frontend de Gestión Deportiva Federativa |
| **Repositorio** | `FrontSigdef` (`c:\Users\EZEQU\source\reposFront\FrontSigdef`) |
| **Tipo** | SPA (Single Page Application) web + app Android (Capacitor) |
| **Dominio** | Administración federativa de canotaje: padrón de clubes y atletas (palistas), delegados, tutores, entrenadores, traspasos, cuotas/recibos, mensajería y SaaS multi-tenant |
| **Versión** | `0.0.0` (`package.json`) |
| **Fecha del documento** | 2026-09-27 |
| **Framework** | React `^19.2.0` + React DOM `^19.2.0` |
| **Ruteo** | react-router-dom `^7.9.6` |
| **Bundler** | Vite `^7.2.4` (puerto `5173`, `host: true`, `strictPort: true`) |
| **Linter** | ESLint `^9.39.1` (`@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`) |
| **HTTP** | `fetch` nativo con wrapper propio [`src/services/api.js`](../../src/services/api.js) (**no** usa axios) |
| **Auth** | JWT (`jwt-decode ^4.0.0`) en `localStorage.user.token` |
| **UI / íconos** | lucide-react `^0.554.0`, CSS plano propio |
| **Excel** | xlsx `^0.18.5` |
| **PDF / captura** | jspdf `^3.0.4` + html2canvas `^1.4.1` |
| **QR** | qrcode.react `^4.2.0` |
| **Móvil** | `@capacitor/core` · `@capacitor/cli` · `@capacitor/android` `^8.2.0` (`appId com.sigdef.app`) |
| **Backend consumido** | API unificada **SportTrack / SIGDEF** (ASP.NET Core, **.NET 10**) con PostgreSQL |
| **API (producción)** | `https://sporttrack-sigdef.onrender.com/api` |
| **API (default dev)** | `http://localhost:5029/api` |
| **Deploy web** | Vercel |
| **Deploy móvil** | Android (APK vía Capacitor) |

### Scripts de `package.json`

| Script | Acción |
|--------|--------|
| `npm run dev` | Levanta Vite con `--host` (accesible en la red local) |
| `npm run build` | Build de producción en `dist/` |
| `npm run lint` | ESLint sobre todo el proyecto |
| `npm run preview` | Sirve el build de producción |
| `npm run mobile:sync` | `build` + `npx cap sync android` |
| `npm run mobile:open` | `build` + `npx cap sync android` + `npx cap open android` |

### Repositorios relacionados

| Repo | Rol | Deploy |
|------|-----|--------|
| **FrontSigdef** (este) | Frontend federativo SIGDEF: atletas, clubes, delegados, tutores, traspasos, pagos, mensajería y SaaS SuperAdmin | Vercel |
| **SportTrack-Sigdef** | Backend unificado (regatas + SIGDEF + SaaS), API REST + SignalR, PostgreSQL, ASP.NET Core .NET 10 | Render |
| **SportTrack-Front** | Frontend de competencias: eventos, inscripciones, fases, jueces, cronometraje, live | Vercel |
| **WebSPA-SIGDEF** | SPA pública/administrativa SIGDEF | Vercel |

---

## Propósito y propuesta de valor

SIGDEF digitaliza la gestión administrativa de una federación de canotaje y de sus clubes afiliados:

- **Padrón federativo**: legajo digital de clubes y atletas (palistas), categorización por edad, selección, becas y apto médico.
- **Personas vinculadas**: delegados (con cuenta de acceso al panel del club), tutores de atletas menores y entrenadores (de club y de selección).
- **Traspasos de atletas**: circuito reglado con periodo de traspaso, verificación de deuda por la federación y aceptación del club origen.
- **Cuotas y recibos**: control de afiliación de clubes y atletas, con registro y borrado de recibos.
- **Mensajería interna**: comunicación entre SuperAdmin ↔ federación ↔ clubes, con comunicados masivos (campañas) y conteo de no leídos.
- **SaaS multi-tenant**: jerarquía SuperAdmin Global → Federación (inquilino) → Club → Atleta/Entrenador/Delegado, con planes, suscripciones, auditoría y backups.

**Diferenciador central:** un único backend multi-tenant que sirve a tres frontends (SIGDEF, SportTrack, WebSPA) y que aísla el universo SIGDEF del universo de competencias mediante el header **`X-Client-App`**.

---

## Alcance del pack

**Dentro del alcance:**
- Requerimientos funcionales y no funcionales del frontend web y móvil SIGDEF.
- Casos de uso y flujos de los módulos implementados y **activos** en `main` a la fecha.
- Manuales de usuario por rol, técnico y de instalación/despliegue.
- Trazabilidad requerimiento ↔ caso de uso ↔ módulo de código.

**Fuera del alcance (documentado como referencia):**
- Implementación interna de la API, esquema de base de datos y migraciones (ver repo `SportTrack-Sigdef`).
- Módulos de competencia SportTrack (eventos, cronometraje, resultados en vivo) — ver `SportTrack-Front`.
- Rutas y módulos **comentados en el código** (eventos, distancias, inscripciones del frontend federativo), marcados en los documentos como **FUERA DE ALCANCE ACTUAL**.

---

## Glosario

| Término | Definición |
|---------|------------|
| **Federación** | Inquilino (tenant) del SaaS. Unidad organizativa superior dentro de SIGDEF; agrupa clubes. |
| **Club** | Institución afiliada a una federación. Padrón propio de atletas, tutores, entrenadores y delegados. |
| **Atleta / Palista** | Persona federada que practica canotaje. En SIGDEF se lo modela como *participante* + *persona*. |
| **Delegado** | Representante de un club. En SIGDEF es una **persona** con **usuario de rol `Club`** y una ficha `DelegadoClub`. |
| **Tutor** | Adulto responsable de un atleta menor. Se vincula mediante la relación `AtletaTutor`. |
| **Entrenador** | Técnico de club o de selección. En SIGDEF el alta de club y de selección está unificada. |
| **Traspaso** | Cambio de club de un atleta, reglado y auditable, con verificación previa de deuda por la federación. |
| **Agente Libre** | Atleta sin club (`idClub = null`). Puede ser solicitado por cualquier club de su federación. |
| **Periodo de traspaso** | Ventana de fechas habilitada por la federación. Sin periodo activo no se pueden iniciar traspasos. |
| **Recibo** | Comprobante interno de un pago registrado (afiliación de club o de atleta). |
| **Campaña / Comunicado** | Mensaje masivo que genera un hilo privado por destinatario. |
| **Plan SaaS** | Nivel comercial por módulo y tier (SIGDEF S/M/L = IDs 1–3; SportTrack S/M/L = 4–6; Pack Dúo S/M/L = 7–9). |
| **Flag de plan** | Booleano derivado del plan: `accesoSigdef`, `accesoSportTrack`, `accesoControlesLive`, `accesoDashboardClub`, `permitirCargaImagenes`, `resultadosTiempoReal`, `exportacionPdf`, `maxAtletas`. |
| **Guard** | Componente de ruteo que protege acceso por rol (`PrivateRoute`) o por plan (`PlanGuard`). |
| **Modo Supervisión** | Vista de solo-consulta/gestión del SuperAdmin dentro de una federación ajena (`/superadmin/federacion/:fedId`). |
| **X-Client-App** | Header `sigdef` inyectado por `api.js` para identificar el cliente SIGDEF ante la API. |

---

## Documentos históricos

La carpeta [`../referencia/`](../referencia/) contiene la **documentación numerada `00`–`13`**, redactada para versiones anteriores del sistema. **Se conserva como material histórico** y **no describe el estado actual del código**. Se recomienda leer el presente pack (y las carpetas `guias-usuario/`, `casos-de-uso/`, `criterios/`, `cambios/` y `tecnico/`) antes que el legado.

| Documento histórico | Motivo de la marca histórica |
|---------------------|------------------------------|
| `referencia/00`–`13` | Describen rutas raíz (`/atletas`, `/clubes`), login mock y roles reducidos, que **ya no existen** |
| `referencia/07-API-INTEGRATION.md` | Usa `https://localhost:7112/api` y `axios` (real: `fetch`, API Render) |
| `referencia/CONTROL_ACCESO_PLAN.md` | Menciona `exportacionExcel` (real: `exportacionPdf`) |
| `referencia/contexto-proyecto.md` | Describe `.env` legacy, login mock `admin/admin` y backend `.NET 8` |
| `referencia/*` (varios) | React 18 + React Router 6 + CSS Modules (real: React 19 + Router 7 + CSS plano) y planes `Enterprise/Premium/Básico` (real: planes `S/M/L` con IDs 1–9) |
| `SIGDEF_Dev_Documentation/` | Material histórico de desarrollo; no es documentación de entrega |

> ⚠️ **Corrección de inconsistencias conocidas.** La documentación previa referencia el backend como **.NET 8** (real: **.NET 10**), describe un **login mock** `admin/admin` (real: **JWT real** sin mocks), indica rutas **raíz** `/atletas` y `/clubes` (real: `/dashboard`, `/club`, `/superadmin`) y un único rol `FEDERACION/CLUB` (real: `SUPERADMIN`, `FEDERACION`, `CLUB` + roles de juez usados por SportTrack). El presente pack refleja el estado real **verificado contra el código**.

---

## Pie del pack

| Documento anterior | Documento actual | Documento siguiente |
|--------------------|------------------|---------------------|
| — | **README.md** | [01 — Requerimientos de Usuario →](./01-Requerimientos-Usuario.md) |

[Índice del pack](#índice-del-pack) · [01](./01-Requerimientos-Usuario.md) · [02](./02-Casos-de-Uso.md) · [03](./03-Diagramas-de-Flujo.md) · [04](./04-Manual-de-Usuario.md) · [05](./05-Manual-Tecnico.md) · [06](./06-Manual-Instalacion-Despliegue.md)
