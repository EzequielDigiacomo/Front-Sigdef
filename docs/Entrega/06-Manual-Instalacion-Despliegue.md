# 06 — Manual de Instalación y Despliegue

**Proyecto:** SIGDEF — Frontend de Gestión Deportiva Federativa (`FrontSigdef`)
**Última actualización: 2026-09-27**
**Dirigido a:** Desarrolladores y responsables de despliegue

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Clonado del repositorio](#2-clonado-del-repositorio)
3. [Instalación de dependencias](#3-instalación-de-dependencias)
4. [Configuración de variables de entorno](#4-configuración-de-variables-de-entorno)
5. [Ejecución en desarrollo](#5-ejecución-en-desarrollo)
6. [Verificación de la calidad del código](#6-verificación-de-la-calidad-del-código)
7. [Build de producción](#7-build-de-producción)
8. [Despliegue en Vercel](#8-despliegue-en-vercel)
9. [Despliegue Android con Capacitor](#9-despliegue-android-con-capacitor)
10. [Verificación y checklist final](#10-verificación-y-checklist-final)
11. [Resolución de problemas de instalación](#11-resolución-de-problemas-de-instalación)
12. [Pie del pack](#pie-del-pack)

---

## 1. Requisitos previos

### 1.1 Desarrollo web

| Requisito | Versión mínima | Notas |
|-----------|----------------|-------|
| Node.js | 20 LTS o superior | Vite 7 requiere Node ≥ 20.19. |
| npm | 10 o superior | Incluido con Node. |
| Git | 2.30+ | Control de versiones. |
| Navegador | Chrome / Edge / Firefox reciente | Consola para diagnóstico. |
| Editor | VS Code / Cursor | Recomendado con ESLint. |

### 1.2 Android (opcional)

| Requisito | Notas |
|-----------|-------|
| Android Studio | Última versión estable. |
| JDK | 17 o superior. |
| SDK de Android | API 34+ con herramientas de plataforma. |
| Dispositivo o emulador | Para pruebas en vivo. |

### 1.3 Backend

El frontend requiere la API de SIGDEF. Por defecto apunta a la instancia de Render:

```
https://sporttrack-sigdef.onrender.com/api
```

Para desarrollo local contra un backend propio, apuntar a `http://localhost:5029/api`.

---

## 2. Clonado del repositorio

```bash
git clone <URL-del-repositorio-FrontSigdef> FrontSigdef
cd FrontSigdef
```

---

## 3. Instalación de dependencias

```bash
npm install
```

Esto instala React 19, react-router-dom 7, Vite 7, Capacitor 8, las librerías de exportación (`xlsx`, `jspdf`, `html2canvas`, `qrcode.react`) y `jwt-decode`.

> Si hay conflictos de dependencias, no usar `--force` sin revisar; preferir eliminar `node_modules` y `package-lock.json` y reinstalar.

---

## 4. Configuración de variables de entorno

### 4.1 Archivos

El proyecto usa variables de Vite (prefijo `VITE_`).

| Archivo | Uso |
|---------|-----|
| `.env` | Desarrollo local. |
| `.env.production` | Build de producción (Vercel). |
| `.env.example` | Plantilla, sí se versiona. |

> Los archivos `.env*` reales **no deben subirse** al repositorio (están en `.gitignore`).

### 4.2 Crear los archivos

**PowerShell**

```powershell
Copy-Item .env.example .env
Copy-Item .env.example .env.production
```

**Bash**

```bash
cp .env.example .env
cp .env.example .env.production
```

### 4.3 Variables

| Variable | Descripción | Valor de ejemplo |
|----------|-------------|------------------|
| `VITE_API_URL` | URL base de la API (incluye `/api`) | `http://localhost:5029/api` |

Valores reales del proyecto:

- `.env` y `.env.production` → `https://sporttrack-sigdef.onrender.com/api`
- `.env.example` → `http://localhost:5029/api`

**Nota:** Vite solo expone variables con el prefijo `VITE_`. Reiniciá el servidor tras cambiar el entorno.

---

## 5. Ejecución en desarrollo

```bash
npm run dev
```

- El script es `vite --host`, con puerto fijo **5173** (`strictPort: true`).
- Acceso local: `http://localhost:5173`
- Acceso desde la red (móvil en la misma Wi-Fi): `http://<IP-de-la-máquina>:5173`

**Pasos de validación**

1. Abrí `http://localhost:5173` → debe verse la landing (`HomePage`).
2. Entrá a `/login` e iniciá sesión con un usuario válido.
3. Verificá la redirección según el rol (`/dashboard`, `/club` o `/superadmin`).
4. Si el backend está dormido (Render), la primera petición puede demorar unos segundos.

---

## 6. Verificación de la calidad del código

```bash
npm run lint
```

Debe finalizar sin errores. Corregí los avisos antes de commitear.

---

## 7. Build de producción

```bash
npm run build
```

- Genera la carpeta `dist/` con los assets optimizados.
- Para previsualizar localmente:

```bash
npm run preview
```

**Verificación rápida**

1. Confirmá que `dist/index.html` existe.
2. Serví `dist/` con `npm run preview` y repetí el login.

---

## 8. Despliegue en Vercel

### 8.1 Preparación

1. Asegurate de que el build local (`npm run build`) funciona.
2. Tené a mano la URL de la API.

### 8.2 Pasos en Vercel

1. Ingresá a [vercel.com](https://vercel.com) e iniciá sesión.
2. **Add New → Project** e importá el repositorio `FrontSigdef`.
3. Configuración del proyecto:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. En **Settings → Environment Variables**, agregá:

| Key | Value | Entornos |
|-----|-------|----------|
| `VITE_API_URL` | `https://sporttrack-sigdef.onrender.com/api` | Production, Preview, Development |

5. Presioná **Deploy**.
6. Cuando termine, Vercel asigna un dominio del tipo `https://<proyecto>.vercel.app`.

### 8.3 SPA y rutas profundas

La SPA usa `react-router-dom`. Si al recargar una ruta como `/dashboard/atletas` aparece un 404, agregá un `vercel.json` con *rewrites*:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 8.4 Actualizaciones

Cada push a la rama de producción dispara un nuevo deploy automático.

---

## 9. Despliegue Android con Capacitor

### 9.1 Configuración existente

`capacitor.config.json`:

```json
{
  "appId": "com.sigdef.app",
  "appName": "SIGDEF",
  "webDir": "dist",
  "server": { "androidScheme": "http" }
}
```

### 9.2 Sincronizar el proyecto Android

```bash
npm run mobile:sync
```

> El script ejecuta `npm run build` y luego `npx cap sync android`: compila la web y copia `dist/` al proyecto nativo.

### 9.3 Abrir en Android Studio

```bash
npm run mobile:open
```

> El script ejecuta `npm run build`, `npx cap sync android` y `npx cap open android`.

### 9.4 Compilar el APK/AAB

1. En Android Studio, esperá la sincronización de Gradle.
2. Para probar: **Build → Build Bundle(s)/APK(s) → Build APK(s)**.
3. Para publicar: **Build → Generate Signed Bundle/APK**, elegí **Android App Bundle** y firmá con tu keystore.

### 9.5 Consideraciones

- Con `androidScheme: http`, las llamadas al API viajan por HTTPS (la API es HTTPS).
- La app consume las mismas rutas SPA de la versión web.
- Cambios en la web requieren re-ejecutar `mobile:sync`.

---

## 10. Verificación y checklist final

### 10.1 Checklist de instalación

- [ ] Node.js ≥ 20 instalado (`node -v`).
- [ ] Repositorio clonado.
- [ ] `npm install` ejecutado sin errores.
- [ ] `.env` y `.env.production` creados con `VITE_API_URL`.
- [ ] `npm run dev` levanta en el puerto 5173.
- [ ] `npm run lint` sin errores.
- [ ] `npm run build` genera `dist/`.

### 10.2 Checklist funcional

- [ ] La landing carga en `/`.
- [ ] Login con rol Federación redirige a `/dashboard`.
- [ ] Login con rol Club redirige a `/club`.
- [ ] Login con SuperAdmin redirige a `/superadmin`.
- [ ] El modo oscuro/claro conmuta y persiste.
- [ ] Alta de atleta con tutor (menor) funciona.
- [ ] Alta de delegado crea el usuario de club.
- [ ] Traspaso: solicitar → habilitar → aceptar.
- [ ] Pago: alternar estado y registrar recibo.
- [ ] Mensajería: crear hilo, responder y ver el contador.
- [ ] SuperAdmin: crear federación y asignar plan.
- [ ] Renovar suscripción actualiza el vencimiento.
- [ ] Descargar backup `.sql`.
- [ ] Exportar Excel/CSV/PDF.
- [ ] Recuperar contraseña envía la solicitud.

### 10.3 Checklist de despliegue

- [ ] Proyecto importado en Vercel con preset Vite.
- [ ] `VITE_API_URL` definida en Vercel.
- [ ] Deploy exitoso y dominio accesible.
- [ ] Navegación SPA en rutas profundas (con `vercel.json` si hace falta).
- [ ] CORS del backend permite el dominio de Vercel.
- [ ] Android: `mobile:sync` ejecutado y APK firmado (si aplica).

---

## 11. Resolución de problemas de instalación

| Problema | Causa | Solución |
|----------|-------|----------|
| `npm install` falla por dependencias | Caché o `package-lock` desactualizado | Borrar `node_modules` y `package-lock.json` y reinstalar. |
| El puerto 5173 está ocupado | Otro proceso lo usa | Cerrar el proceso o ajustar el puerto (respetar `strictPort`). |
| Página en blanco en producción | `VITE_API_URL` mal definida | Revisar la variable y redeployar. |
| 404 al recargar una ruta | Falta el rewrite SPA | Agregar `vercel.json`. |
| Errores de CORS | Origen no permitido | Configurar CORS en el backend. |
| Login lento | Cold start de Render | Esperar; el cliente reintenta. |
| Cambios de `.env` no se aplican | Vite no reiniciado | Detener y volver a ejecutar `npm run dev`. |
| Android no refleja cambios | Build no sincronizado | Re-ejecutar `npm run mobile:sync`. |
| Gradle falla | JDK/SDK desactualizado | Actualizar Android Studio y el JDK a 17+. |

---

## Pie del pack

| Documento anterior | Documento actual | Documento siguiente |
|--------------------|------------------|---------------------|
| [05 — Manual Técnico](./05-Manual-Tecnico.md) | **06 — Manual de Instalación y Despliegue** | Fin del pack |

[Índice del pack](./README.md#índice-del-pack) · [README](./README.md) · [01](./01-Requerimientos-Usuario.md) · [02](./02-Casos-de-Uso.md) · [03](./03-Diagramas-de-Flujo.md) · [04](./04-Manual-de-Usuario.md) · [05](./05-Manual-Tecnico.md)
