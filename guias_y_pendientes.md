# 🚀 Guía de Ejecución Local y Estado del Proyecto (SIGDEF)

Este documento te servirá de guía para levantar el entorno de desarrollo localmente y mantener el seguimiento de lo que queda por hacer.

---

## 📍 1. Puesta al Día: Estado del Proyecto

Actualmente, **SIGDEF** tiene estructurado su modelo Multi-Tenant en backend y una interfaz de usuario premium en frontend.

### 👑 Portal de Superadmin (Completado en UI)
1. **Dashboard Global (`SuperDashboard.jsx`):** Tarjetas KPI, gráficos dinámicos de evolución de atletas y desglose de federaciones activas.
2. **Gestión de Inquilinos (`FederacionesManagement.jsx` y `FederacionesForm.jsx`):** CRUD interactivo de Federaciones con fallback en `localStorage`.
3. **Auditoría e Historial (`Auditoria.jsx`):** Pantalla de monitoreo de accesos, seguridad y acciones del operador.
4. **Facturación (`Suscripciones.jsx`):** Control y estados de cobros de suscripciones SaaS.

### 🏢 Panel de Club (Completado en Integración)
* Conectado a la API para listar y eliminar atletas, ver información institucional del club, gestionar eventos organizados y consultar eventos disponibles de otros clubes.

---

## 📋 2. Tareas Pendientes (Próximos Pasos)

### 📝 Fase 1: Integración de Formularios de Alta/Edición
* [ ] **`AtletasForm.jsx`**: Conectar los flujos de creación (POST) y edición (PUT) con `/api/Atleta`.
* [ ] **`EventosForm.jsx`**: Conectar la creación (POST) y edición (PUT) con `/api/Evento`.
* [ ] **`InscripcionesForm.jsx`**: Registrar atletas a eventos disponibles (POST `/api/Inscripcion`).

### 🔌 Fase 2: Backend del Portal de Superadmin
* [ ] **Persistencia Real de Federaciones:** Asegurar que `FederacionController.cs` guarde los cambios en la DB Postgres de forma permanente.
* [ ] **Modelo de Auditoría:** Crear la entidad `AuditoriaLog` en backend y su controlador.
* [ ] **Módulo de Facturación:** Diseñar el modelo de cobro recurrente en el backend.

### 🔒 Fase 3: Seguridad y Aislamiento Multi-Tenant
* [ ] **Validación de Clubes:** Reemplazar el bypass de contraseñas de desarrollo por validación real en base de datos.
* [ ] **Filtros del lado del Servidor:** Modificar las consultas del backend para que filtren por `IdFederacion` o `IdClub` según los claims del token JWT, en lugar de traer todo al cliente.

---

## 💻 3. Guía de Ejecución Local Paso a Paso

Hemos configurado **`appsettings.Development.json`** en el backend para usar la base de datos local y **`api.js`** en el frontend para apuntar al servidor local (`http://localhost:5078/api`).

Sigue estos pasos para ejecutar todo:

### Paso 1: Levantar la Base de Datos PostgreSQL
Tienes dos alternativas según tu preferencia:

* **Opción A: Usando Docker (Recomendada)**
  Abre una terminal en la raíz del proyecto backend (`c:\Users\EZEQU\source\repos\SIGDEF-v7-Copia`) y ejecuta:
  ```bash
  docker-compose up -d db-dev
  ```
  *Esto levantará un contenedor de Postgres en el puerto `5432` con la base de datos `sigdef_db` (Usuario: `sigdef_user`, Contraseña: `Admin2508`).*

* **Opción B: Con PostgreSQL Nativo instalado en Windows**
  Asegúrate de que el servicio de Postgres esté corriendo localmente en el puerto `5432`.
  *Si usas esta opción, en [appsettings.Development.json](file:///c:/Users/EZEQU/source/repos/SIGDEF-v7-Copia/SIGDEF.Api/appsettings.Development.json) renombra el valor de `DefaultConnection_Native` a `DefaultConnection`.*

---

### Paso 2: Aplicar las Migraciones de Entity Framework
Para crear las tablas y las relaciones en tu base de datos local, abre una terminal en el backend (`c:\Users\EZEQU\source\repos\SIGDEF-v7-Copia`) y ejecuta:

```powershell
# Instalar herramienta dotnet-ef si no la tienes
dotnet tool install --global dotnet-ef

# Aplicar las migraciones a la DB
dotnet ef database update --project SIGDEF.AccesoDatos --startup-project SIGDEF.Api
```

---

### Paso 3: Ejecutar el Backend (API)
Dirígete a la carpeta del proyecto de la API (`c:\Users\EZEQU\source\repos\SIGDEF-v7-Copia\SIGDEF.Api`) y ejecuta:

```bash
dotnet run --launch-profile http
```
* **URL HTTP Local:** `http://localhost:5078`
* **Swagger (Documentación):** `http://localhost:5078/swagger`

---

### Paso 4: Ejecutar el Frontend (React + Vite)
Dirígete a la carpeta del frontend (`c:\Users\EZEQU\source\reposFront\FrontSigdef`) y ejecuta:

```bash
npm install
npm run dev
```
* **URL Local:** `http://localhost:5173`

---

### Paso 5: Poblar con Datos de Prueba (Seed)
Para no iniciar con la base de datos vacía:
1. Inicia sesión en la aplicación (puedes usar el usuario de pruebas en local).
2. Abre la consola de desarrollador del navegador (**F12 -> Console**).
3. Copia y pega el contenido del script [seed-database.js](file:///c:/Users/EZEQU/source/reposFront/FrontSigdef/seed-database.js).
4. Presiona Enter y ejecuta:
   ```javascript
   seedDatabase()
   ```
5. ¡Verás un reporte de la creación exitosa de clubes, atletas, entrenadores y eventos!
