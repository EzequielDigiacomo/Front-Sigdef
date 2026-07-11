# FrontSigdef (SIGDEF Frontend)

Frontend React del **Sistema de Gestión Deportiva Federativa**.

## Documentación

➡️ **Toda la documentación está centralizada en [`docs/`](./docs/README.md)**

- Guías de usuario (Federación, Club, Accesos, Tutores)
- Casos de uso y criterios de aceptación
- Changelogs de lo guardado
- Índice técnico + referencia histórica

## Inicio rápido

```bash
npm install
npm run dev
```

App: `http://localhost:5173`

## Backend

API: repo **SportTrack-Sigdef** → [`docs/`](../SportTrack-Sigdef/docs/README.md) (ruta local típica: `repos/SportTrack-Sigdef/docs`).

## Estructura de código (resumen)

```
src/
  components/   # UI común, modales, layout, forms
  pages/        # FederaciónAdmin, ClubAdmin, SuperAdmin, …
  services/     # api.js
  styles/       # CompactForm.css, …
  utils/        # delegadoHelpers, planHelpers, …
```
