# Documentación FrontSigdef (SIGDEF)

**Única carpeta de documentación del frontend.** Todo lo demás (raíz del repo, `SIGDEF_Dev_Documentation/`, `.agent/`) debe apuntar aquí.

**Última actualización:** 2026-07-11

---

## Cómo está organizada

| Carpeta | Para qué sirve |
|---------|----------------|
| [guias-usuario/](./guias-usuario/) | Manuales y guías paso a paso (Federación, Club, Accesos) |
| [casos-de-uso/](./casos-de-uso/) | Casos de uso y flujos de negocio |
| [criterios/](./criterios/) | Criterios de aceptación / Definition of Done |
| [cambios/](./cambios/) | Registro de cambios guardados (changelogs por fecha) |
| [tecnico/](./tecnico/) | Arquitectura, roles, API, desarrollo |
| [referencia/](./referencia/) | Documentación histórica / legado numerado |

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
| Usuario Federación / Admin | [guias-usuario/manual-federacion.md](./guias-usuario/manual-federacion.md) |
| Usuario Club / Delegado | [guias-usuario/manual-club.md](./guias-usuario/manual-club.md) |
| Gestión de logins y claves | [guias-usuario/gestion-accesos-contrasenas.md](./guias-usuario/gestion-accesos-contrasenas.md) |
| Tutores y menores | [guias-usuario/tutores-paso-a-paso.md](./guias-usuario/tutores-paso-a-paso.md) |
| QA / aceptación | [criterios/criterios-aceptacion.md](./criterios/criterios-aceptacion.md) |
| Desarrollador | [tecnico/README.md](./tecnico/README.md) |
| Qué se guardó en jul-2026 | [cambios/2026-07-ui-tutores-accesos.md](./cambios/2026-07-ui-tutores-accesos.md) |

---

## Relación con el backend

El backend documentado vive en el repo **SportTrack-Sigdef** → carpeta `docs/`.
