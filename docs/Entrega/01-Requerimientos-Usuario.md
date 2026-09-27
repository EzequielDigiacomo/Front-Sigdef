# 01 — Requerimientos de Usuario

**Proyecto:** SIGDEF — Frontend de Gestión Deportiva Federativa (`FrontSigdef`)
**Última actualización: 2026-09-27**
**Norma de referencia:** ISO/IEC/IEEE 29148 (ingeniería de requerimientos) · ISO/IEC 25010 (calidad de producto)

---

## Índice

1. [Introducción y alcance](#1-introducción-y-alcance)
2. [Actores y roles](#2-actores-y-roles)
3. [Requerimientos Funcionales](#3-requerimientos-funcionales)
4. [Requerimientos No Funcionales (ISO 25010)](#4-requerimientos-no-funcionales-iso-25010)
5. [Historias de Usuario (Gherkin)](#5-historias-de-usuario-gherkin)
6. [Reglas de Negocio](#6-reglas-de-negocio)
7. [Matriz de trazabilidad](#7-matriz-de-trazabilidad)
8. [Pie del pack](#pie-del-pack)

---

## 1. Introducción y alcance

### 1.1 Objetivo del documento

Definir los requerimientos **funcionales y no funcionales** del frontend **SIGDEF**, verificado contra el código fuente del repositorio `FrontSigdef`, de modo que sirva como base contractual de la entrega y como referencia de trazabilidad hacia casos de uso, diagramas y módulos de implementación.

### 1.2 Alcance del sistema

El sistema cubre la administración federativa de un deporte (canotaje):

1. **Padrón**: clubes, atletas (palistas), tutores de menores, entrenadores y delegados.
2. **Circulación de atletas**: traspasos entre clubes con verificación de deuda por la federación.
3. **Economía interna**: control de cuotas de afiliación (clubes y atletas) y recibos.
4. **Comunicación**: mensajería interna y comunicados masivos.
5. **Gobierno SaaS**: federaciones inquilinas, planes, suscripciones, auditoría y backups.

### 1.3 Alcance de este documento

- **Incluye:** requerimientos del frontend web (Vercel) y de la app Android (Capacitor).
- **Excluye:** la implementación del backend (repo `SportTrack-Sigdef`) y los módulos de competencia (`SportTrack-Front`).
- Todo requerimiento no verificable en el código fue **omitido**. Lo que existe pero está desactivado se marca como **FUERA DE ALCANCE ACTUAL** (por ejemplo, eventos, distancias e inscripciones del frontend federativo, cuyas rutas están comentadas en `src/App.jsx`).

### 1.4 Convenciones de identificadores

| Prefijo | Significado | Ejemplo |
|---------|-------------|---------|
| `RF-##` | Requerimiento Funcional | `RF-05` |
| `RNF-##` | Requerimiento No Funcional | `RNF-03` |
| `HU-##` | Historia de Usuario | `HU-07` |
| `RN-##` | Regla de Negocio | `RN-02` |
| `CU-##` | Caso de Uso (documento 02) | `CU-04` |

---

## 2. Actores y roles

### 2.1 Actores del sistema

| Actor | Autenticación | Descripción |
|-------|---------------|-------------|
| **Público general** | No requiere | Consulta la landing pública (`/`) con secciones y planes. |
| **Usuario de Club** | Requerida (rol `CLUB`) | Administra el padrón de su club: atletas, tutores, entrenadores, delegados, traspasos, mensajes e inscripciones. |
| **Delegado** | Requerida (rol `CLUB`) | Representante del club; **comparte el rol `Club`** y por lo tanto opera el panel del club. |
| **Administrador de Federación** | Requerida (rol `FEDERACION`) | Administra la federación completa: clubes, atletas, delegados, tutores, entrenadores, pagos, traspasos, logins y mensajería. |
| **SuperAdmin Global** | Requerida (rol `SUPERADMIN`) | Administración SaaS multi-tenant: federaciones, planes, suscripciones, auditoría, backups, mensajería global y modo supervisión. |

> **FUERA DE ALCANCE ACTUAL.** No existe ruta ni pantalla para **Delegado** ni para **Entrenador** como roles independientes: el delegado usa el panel `Club` y el entrenador es una ficha de datos, no un rol de login. Tampoco existen rutas para jueces (`Largador`, `Cronometrista`, `JuezControl`, `ControlTecnico`): esos roles se ofrecen al crear credenciales pero **operan en SportTrack-Front**.

### 2.2 Roles técnicos y mapeo de código

| Rol (UI) | Valor en JWT / API | Ruta de aterrizaje | Layout |
|----------|--------------------|--------------------|--------|
| SuperAdmin | `SUPERADMIN` / `SuperAdmin` | `/superadmin` | `MainLayoutSuper` |
| Federación | `Federacion` / `Admin` | `/dashboard` | `MainLayout` |
| Club / Delegado | `Club` | `/club` | `MainLayoutClub` |
| Usuario genérico | `Usuario` (con `idClub`) → `CLUB`; sin club → `FEDERACION` | `/club` o `/dashboard` | según mapeo |
| *(default)* | cualquier otro valor | `FEDERACION` | `MainLayout` |

`AuthContext` (`src/context/AuthContext.jsx`) decodifica el JWT con `jwt-decode` y aplica este mapeo:

```text
SUPERADMIN | SuperAdmin                          → SUPERADMIN
Club                                             → CLUB
Federacion | Admin                               → FEDERACION
Usuario + (idClub|clubId)                        → CLUB
Usuario (sin club)                               → FEDERACION
(default)                                        → FEDERACION
```

---

## 3. Requerimientos Funcionales

### 3.1 Autenticación y sesión

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-01 | El sistema debe autenticar por usuario y contraseña contra `POST /Auth/login` y almacenar el JWT en `localStorage.user.token`. | Alta |
| RF-02 | El sistema debe decodificar el JWT, resolver el rol efectivo y redirigir al layout correspondiente (`/superadmin`, `/dashboard` o `/club`). | Alta |
| RF-03 | El sistema debe validar que el plan del usuario incluya acceso a SIGDEF (`accesoSigdef`) antes de renderizar las rutas internas; el `SuperAdmin` queda exento (`PlanGuard`). | Alta |
| RF-04 | El sistema debe permitir **solicitar el restablecimiento de contraseña** (`POST /Auth/solicitar-reset-password`), notificando al administrador de la federación. | Media |
| RF-05 | El sistema debe manejar la expiración de sesión (`401`) limpiando el almacenamiento local y redirigiendo a `/login`. | Alta |
| RF-06 | El sistema debe permitir cerrar sesión desde la barra de navegación. | Alta |

### 3.2 Padrón de atletas (palistas)

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-07 | El sistema debe listar atletas de forma paginada (`GET /Atleta/paged`) con búsqueda por nombre, documento y club. | Alta |
| RF-08 | El sistema debe crear un atleta con datos personales y deportivos (`POST /Atleta/full`). | Alta |
| RF-09 | El sistema debe editar un atleta existente (`PUT /Atleta/{id}`). | Alta |
| RF-10 | El sistema debe permitir asignar un atleta a un club o dejarlo como **Agente Libre**. | Alta |
| RF-11 | El sistema debe gestionar el **estado de pago** del atleta (`0 Pendiente`, `1 Pagado`, `2 Vencido`, `3 Parcial`). | Alta |
| RF-12 | El sistema debe registrar categoría por edad, pertenencia a selección, becas (ENARD/SDN) y apto médico. | Media |
| RF-13 | El sistema debe permitir adjuntar y consultar **documentación** (DNI, pasaporte, apto médico, foto, autorización de menor). | Media |
| RF-14 | El sistema debe exportar el padrón a **Excel** (`.xlsx`). | Media |
| RF-15 | El sistema debe permitir **actualización masiva de pago por club**. | Media |
| RF-16 | El club debe poder listar su plantel (`GET /Atleta/club/{id}`), marcar pagado/pendiente y **liberar** un atleta (`POST /Atleta/{id}/liberar`). | Alta |

### 3.3 Clubes

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-17 | El sistema debe listar, crear, editar y eliminar clubes (`GET/POST/PUT/DELETE /Clubes`). | Alta |
| RF-18 | El sistema debe mostrar el detalle de un club con su **plantel de atletas** y sus **delegados**. | Media |
| RF-19 | El sistema debe normalizar la sigla del club (`sigla` → `siglas`) y su identificador (`id` → `idClub`). | Media |

### 3.4 Delegados

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-20 | El sistema debe crear un delegado como combinación de **Persona** + **login de rol `Club`** (`POST /Auth/register`) + **ficha `DelegadoClub`** (`POST /DelegadoClub`). | Alta |
| RF-21 | El sistema debe reutilizar una persona existente detectada por DNI (puede ser también entrenador). | Media |
| RF-22 | El sistema debe permitir delegados sin club, mostrándolos como **Agente Libre**. | Baja |
| RF-23 | El sistema debe exigir un club al crear el login del delegado. | Alta |

### 3.5 Tutores

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-24 | El sistema debe listar, crear, editar y eliminar tutores (`/Tutor`). | Alta |
| RF-25 | El sistema debe vincular tutor y atleta menor mediante la relación `AtletaTutor`. | Alta |
| RF-26 | El sistema debe indicar en el padrón si un atleta **menor** tiene tutor asignado. | Alta |
| RF-27 | El sistema debe exportar la nómina de tutores a **Excel**. | Baja |

### 3.6 Entrenadores y selecciones

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-28 | El sistema debe listar, crear, editar y eliminar entrenadores, unificando entrenadores de **club** y de **selección** (`/Entrenador`). | Alta |
| RF-29 | El sistema debe permitir marcar a un entrenador como perteneciente a **Selección** y asignarle una **categoría (1–9)**. | Media |
| RF-30 | El sistema debe mostrar las selecciones agrupadas por categoría (`/selecciones`, `/selecciones/categoria/:categoryId`). | Media |

### 3.7 Traspasos de atletas

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-31 | La federación debe administrar **periodos de traspaso** (`/Traspaso/periodos`, `periodo-activo`). | Alta |
| RF-32 | El club debe poder **solicitar** el traspaso de un atleta (`POST /Traspaso`), buscándolo por nombre o documento. | Alta |
| RF-33 | La federación debe **verificar la deuda** del atleta antes de habilitar el traspaso (`GET /Traspaso/{id}/validaciones`). | Alta |
| RF-34 | La federación debe poder **habilitar** o **rechazar** una solicitud (`/aprobar`, `/rechazar`). | Alta |
| RF-35 | El **club origen** debe poder **aceptar** (`/aceptar-origen`) o **rechazar** (`/rechazar-origen`) la salida. | Alta |
| RF-36 | El club solicitante debe poder **cancelar** una solicitud pendiente (`/cancelar`). | Media |
| RF-37 | El SuperAdmin debe poder **forzar** la habilitación cuando existan validaciones bloqueantes (`/aprobar?forzar=true`). | Media |
| RF-38 | El sistema debe registrar la **auditoría** de traspasos y permitir **exportar a CSV**. | Media |

### 3.8 Pagos y recibos

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-39 | El sistema debe permitir alternar el estado de afiliación de un club (`PUT /pagos/clubes/{id}/toggle`). | Alta |
| RF-40 | El sistema debe permitir alternar el estado de pago de un atleta (`PUT /pagos/atletas/{id}/toggle`). | Alta |
| RF-41 | El sistema debe registrar un recibo (`POST /pagos/registrar`) con monto, referencia y notas. | Alta |
| RF-42 | El sistema debe listar el historial de recibos (`GET /pagos/historial`). | Alta |
| RF-43 | El sistema debe permitir eliminar recibos (`DELETE /pagos/{id}` y `DELETE /pagos/bulk`). | Media |
| RF-44 | El sistema debe mostrar totales por club, atleta y vista filtrada. | Media |

### 3.9 Mensajería interna

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-45 | El sistema debe listar hilos y su detalle (`GET /mensajes/hilos`, `/hilos/{id}`). | Alta |
| RF-46 | El sistema debe permitir crear un hilo individual (`POST /mensajes/hilos`). | Alta |
| RF-47 | El sistema debe permitir enviar un **comunicado masivo** (`POST /mensajes/hilos/masivo`) generando un hilo privado por destinatario. | Alta |
| RF-48 | El sistema debe permitir responder un hilo y **marcarlo como leído** (`/responder`, `PATCH /hilos/{id}/leer`). | Alta |
| RF-49 | El sistema debe mostrar un **badge de no leídos** (`GET /mensajes/no-leidos/count`) con sondeo periódico. | Media |
| RF-50 | El sistema debe listar los comunicados enviados y su desglose de lecturas/respuestas (`/mensajes/campanas`). | Media |
| RF-51 | El sistema debe **aislar** los mensajes de SIGDEF mediante el header `X-Client-App: sigdef`. | Alta |

### 3.10 Inscripciones (consulta)

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-52 | El sistema debe consultar el registro de inscripciones por evento, prueba y club (`GET /inscripciones/registro`). | Media |
| RF-53 | La federación debe poder **exportar a CSV** y **eliminar** una inscripción (`DELETE /inscripciones/{id}`). | Media |

> **FUERA DE ALCANCE ACTUAL.** El alta de inscripciones y la gestión de eventos/distancias del frontend federativo están comentadas en `src/App.jsx`; el registro de inscripciones se limita a **consulta** de datos generados desde SportTrack.

### 3.11 Gestión de logins y accesos

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-54 | El sistema debe listar los usuarios registrados (`GET /Auth/usuarios`). | Alta |
| RF-55 | El sistema debe crear credenciales con rol (`Admin`, `Club` o jueces) validando el plan (`canAccessDashboardClub`, `canAccessControlesLive`). | Alta |
| RF-56 | El sistema debe permitir cambiar contraseña (`PUT /Auth/usuarios/{id}/password`). | Alta |
| RF-57 | El sistema debe permitir editar el perfil (`PUT /Auth/usuarios/{id}/perfil`). | Media |
| RF-58 | El sistema debe permitir **habilitar/deshabilitar** cuentas (`PATCH /Auth/usuarios/{id}/toggle-activo`). | Alta |
| RF-59 | El SuperAdmin debe poder **filtrar logins por federación**. | Media |

### 3.12 SuperAdmin / SaaS

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-60 | El panel SuperAdmin debe mostrar KPIs globales: federaciones, clubes, atletas, ingresos mensuales, federaciones facturando y % de crecimiento. | Alta |
| RF-61 | El sistema debe permitir dar de alta una federación con su administrador principal (`POST /saas/create-federacion`). | Alta |
| RF-62 | El sistema debe permitir editar y eliminar federaciones (`PUT/DELETE /Federaciones/{id}`). | Alta |
| RF-63 | El sistema debe permitir asignar plan (`POST /SaaS/asignar-plan`) y suspender/habilitar el acceso (`PATCH /SaaS/clubes/{id}/toggle-activo`). | Alta |
| RF-64 | El sistema debe permitir **renovar la suscripción** calculando el nuevo vencimiento según frecuencia (`Mensual`/`Anual`). | Alta |
| RF-65 | El sistema debe permitir editar el **catálogo de planes**: precio mensual, `%` de descuento anual y máximo de atletas (`-1` = ilimitado) (`PUT /saas/planes/{id}`). | Alta |
| RF-66 | El sistema debe mostrar la facturación por federación con totales cobrado/pendiente y efectividad (`/saas/clubes-status`, `/saas/global-metrics`). | Media |
| RF-67 | El SuperAdmin debe poder **ingresar en modo supervisión** a una federación (`/superadmin/federacion/:fedId`). | Alta |
| RF-68 | El sistema debe mostrar una **grilla de precios de referencia** para los 9 planes. | Baja |

### 3.13 Auditoría

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-69 | El sistema debe mostrar la bitácora global de auditoría (`GET /support/logs?limit=100`). | Alta |
| RF-70 | La federación debe mostrar su actividad reciente (`GET /Auditoria?limit=200`). | Media |
| RF-71 | El sistema debe clasificar los eventos de auditoría por tipo (Acceso, Seguridad, Configuración). | Baja |

### 3.14 Backups

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-72 | El SuperAdmin debe poder descargar un backup completo (`GET /backup/download?scope=full`). | Alta |
| RF-73 | El SuperAdmin debe poder descargar un backup acotado a una federación (`scope=federacion&idFederacion=…`). | Media |
| RF-74 | El sistema debe mostrar el historial de backups (`GET /backup/history`). | Media |

### 3.15 Landing y planes públicos

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RF-75 | El sistema debe ofrecer una **landing pública** (`/`) con hero, planes, app nativa, contacto y footer. | Media |
| RF-76 | El sistema debe mostrar los **planes** (SIGDEF, SportTrack, Pack Dúo; tiers S/M/L) con precios y features de referencia. | Media |

---

## 4. Requerimientos No Funcionales (ISO 25010)

| ID | Característica (ISO 25010) | Requerimiento | Verificación en código |
|----|----------------------------|---------------|------------------------|
| RNF-01 | **Adecuación funcional** | Toda operación debe reflejar exactamente las reglas de negocio del backend; la UI no debe inventar estados. | Uso de enums centralizados en `utils/enums.js` y `utils/traspasoUtils.js`. |
| RNF-02 | **Eficiencia de desempeño** | Las llamadas HTTP deben tener *timeout* (45 s general, 90 s login) y hasta 2 reintentos ante `5xx`/timeout. | `services/api.js`: `DEFAULT_TIMEOUT`, `LOGIN_TIMEOUT`, `MAX_RETRIES`. |
| RNF-03 | **Eficiencia de desempeño** | El arranque del API (Render cold start) debe “despertarse” sin bloquear la UI. | `warmupApi()` en `services/api.js`. |
| RNF-04 | **Compatibilidad** | El listado de atletas debe responder con paginación del servidor y *fallback* a paginación local si `/Atleta/paged` no está disponible. | `AtletasList.jsx` intenta `paged` y cae a `/Atleta`. |
| RNF-05 | **Compatibilidad** | El cliente debe identificarse ante la API con `X-Client-App: sigdef` y enviar `credentials: include`. | `services/api.js`. |
| RNF-06 | **Usabilidad** | La interfaz debe estar en **español (Argentina)** y mostrar mensajes de error **amigables**, nunca técnicos. | `utils/friendlyError.js`. |
| RNF-07 | **Usabilidad** | La app debe ser **responsiva**, con componente móvil y detección de dispositivo nativo. | `hooks/useDevice.js`, `MobileCard`, `MobileNavBar`. |
| RNF-08 | **Usabilidad** | Debe existir tema claro/oscuro con persistencia. | `context/ThemeContext.jsx`, `ThemeToggle`. |
| RNF-09 | **Fiabilidad** | Ante errores de red o API dormida, la UI debe informar y no romperse. | `api.js` (mensaje de `Failed to fetch`), `warmupApi`, `silentErrors`. |
| RNF-10 | **Fiabilidad** | Los contadores (no leídos, traspasos pendientes) deben refrescarse por sondeo y por eventos de ventana. | `useUnreadMessages`, `usePendingTraspasos` (poll 90 s + `focus` + eventos). |
| RNF-11 | **Seguridad** | La sesión debe validarse por expiración del JWT y persistirse en `localStorage`. | `AuthContext.isTokenValid`, `api.getAuthToken`. |
| RNF-12 | **Seguridad** | Los roles deben restringirse por ruta y por plan. | `PrivateRoute` (allowedRoles) + `PlanGuard` (`requiereSigdef`). |
| RNF-13 | **Seguridad** | No deben registrarse en UI detalles técnicos (EF/SQL/stack). | `friendlyError.js` filtra `technicalBits`. |
| RNF-14 | **Mantenibilidad** | Código modular por capas: `services`, `utils`, `components/common`, `pages/*`. | Estructura `src/`. |
| RNF-15 | **Mantenibilidad** | Deben existir *helpers* de normalización que toleren `camelCase` y `PascalCase`. | `utils/apiHelpers.pick`, normalizadores en cada página. |
| RNF-16 | **Portabilidad** | La app debe poder empaquetarse como APK Android sin cambios de código. | `capacitor.config.json`, scripts `mobile:*`. |
| RNF-17 | **Portabilidad** | La configuración de la API debe resolverse por variable de entorno. | `VITE_API_URL` (`.env`, `.env.example`). |

---

## 5. Historias de Usuario (Gherkin)

> Formato: **Como** \<rol\> **quiero** \<objetivo\> **para** \<beneficio\>. Cada historia incluye criterios de aceptación en Gherkin.

### HU-01 — Alta de atleta menor con tutor

**Como** administrador de federación **quiero** dar de alta a un atleta menor junto con su tutor **para** cumplir con la obligación de tutoría legal.

```gherkin
Escenario: Alta exitosa de un atleta con tutor
  Dado que estoy autenticado como FEDERACION
  Y completo los datos personales del atleta (nombre, apellido, documento, fecha de nacimiento)
  Y marco que es menor de edad
  Cuando cargo los datos del tutor (documento, nombre, apellido y parentesco)
  Y confirmo el alta
  Entonces el sistema crea la persona y el participante
  Y crea la relación AtletaTutor
  Y el atleta aparece en el padrón con el indicador de tutor asignado

Escenario: Atleta menor sin tutor
  Dado que cargo un atleta menor sin datos de tutor
  Cuando intento guardar
  Entonces el sistema rechaza el alta indicando que el tutor es obligatorio
```

### HU-02 — Alta de delegado de club

**Como** administrador de federación **quiero** crear un delegado **para** que el club tenga un acceso propio al panel.

```gherkin
Escenario: Delegado creado correctamente
  Dado que estoy autenticado como FEDERACION
  Y cargo el DNI del delegado
  Cuando busco por DNI y no existe la persona
  Y completo nombre, apellido y selecciono un club
  Y confirmo el alta
  Entonces el sistema crea la persona
  Y crea un login con rol Club vinculado al club
  Y crea la ficha DelegadoClub

Escenario: Delegado sin club
  Dado que no selecciono un club
  Cuando intento guardar
  Entonces el sistema rechaza la operación indicando que el club es obligatorio
```

### HU-03 — Solicitud de traspaso de atleta

**Como** usuario de club **quiero** solicitar el traspaso de un atleta **para** incorporarlo a mi plantel.

```gherkin
Escenario: Solicitud habilitada por periodo activo
  Dado que existe un periodo de traspaso vigente
  Y estoy autenticado como CLUB
  Cuando busco un atleta de otro club por nombre o documento
  Y confirmo la solicitud agregando un motivo
  Entonces el sistema crea la solicitud en estado PendienteFederacion
  Y la federación verá la solicitud en su bandeja

Escenario: Periodo cerrado
  Dado que no hay periodo de traspaso activo
  Cuando ingreso a la pantalla de solicitud
  Entonces el sistema muestra un aviso de periodo cerrado
  Y no permite enviar solicitudes
```

### HU-04 — Verificación de deuda y habilitación de traspaso

**Como** administrador de federación **quiero** verificar la deuda del atleta **para** autorizar (o no) el traspaso.

```gherkin
Escenario: Atleta sin deuda
  Dado que existe una solicitud en estado PendienteFederacion
  Y el atleta no registra deuda
  Cuando presiono "Habilitar traspaso"
  Entonces la solicitud pasa a PendienteOrigen
  Y el club origen puede aceptar o rechazar

Escenario: Atleta con deuda
  Dado que las validaciones devuelven items bloqueantes
  Cuando presiono "Habilitar traspaso"
  Entonces la acción está deshabilitada
  Y veo el detalle de las validaciones que impiden aprobar

Escenario: SuperAdmin fuerza la habilitación
  Dado que hay validaciones bloqueantes
  Y estoy autenticado como SUPERADMIN
  Cuando presiono "Forzar habilitación"
  Entonces el traspaso avanza pese a la deuda
```

### HU-05 — Aceptación del club origen

**Como** usuario de club **quiero** aceptar o rechazar una salida habilitada **para** controlar las bajas de mi plantel.

```gherkin
Escenario: Aceptar la salida
  Dado que hay una solicitud en estado PendienteOrigen de mi club
  Cuando presiono "Aceptar"
  Entonces la solicitud pasa a Aprobado
  Y el atleta queda perteneciendo al club destino
  Y el atleta desaparece de mi plantel

Escenario: Rechazar la salida
  Dado que hay una solicitud en estado PendienteOrigen de mi club
  Cuando presiono "Rechazar" e ingreso un motivo
  Entonces la solicitud pasa a RechazadoOrigen
  Y el atleta permanece en mi club
```

### HU-06 — Control de cuota de atleta

**Como** administrador de federación **quiero** marcar a un atleta al día o deudor **para** llevar el control de afiliaciones.

```gherkin
Escenario: Marcar atleta al día
  Dado que estoy en la pestaña "Atletas" de Pagos
  Y el atleta figura con deuda
  Cuando activo el interruptor de pago
  Entonces el sistema envía PUT /pagos/atletas/{id}/toggle
  Y el atleta pasa a estado "Pagado"

Escenario: Marcar atleta como deudor
  Dado que el atleta figura al día
  Cuando desactivo el interruptor de pago
  Entonces el atleta pasa a estado "Pendiente"
```

### HU-07 — Registro de recibo

**Como** administrador de federación **quiero** registrar un recibo de pago **para** dejar constancia del cobro.

```gherkin
Escenario: Recibo de afiliación de club
  Dado que estoy en la pestaña "Clubes" de Pagos
  Cuando presiono "Registrar Recibo" en un club
  Y completo monto, referencia y notas
  Y confirmo
  Entonces el sistema registra el recibo como ClubAfiliacion
  Y el recibo aparece en el historial con su monto

Escenario: Eliminar un recibo
  Dado que existe un recibo en el historial
  Cuando presiono el ícono de borrar y confirmo
  Entonces el sistema elimina el recibo del historial
```

### HU-08 — Comunicado masivo

**Como** administrador de federación **quiero** enviar un comunicado a todos los clubes **para** difundir una circular.

```gherkin
Escenario: Envío masivo exitoso
  Dado que estoy en Mensajes
  Cuando elijo la opción "Comunicado masivo"
  Y selecciono uno o más clubes de mi federación
  Y completo asunto y mensaje
  Y envío
  Entonces el sistema crea un hilo privado por cada destinatario
  Y el comunicado aparece en "Comunicados enviados" con lecturas y respuestas
```

### HU-09 — Renovación de suscripción de una federación

**Como** SuperAdmin **quiero** renovar la suscripción de una federación **para** restablecer su acceso.

```gherkin
Escenario: Renovar por falta de pago
  Dado que una federación figura como "ACCESO BLOQUEADO POR PAGO"
  Y su frecuencia es Mensual
  Cuando presiono "RENOVAR SUSCRIPCIÓN" y confirmo
  Entonces el sistema actualiza la federación con el nuevo vencimiento (+1 mes)
  Y el estado de acceso pasa a "ACCESO PERMITIDO"
```

### HU-10 — Backup de la base de datos

**Como** SuperAdmin **quiero** descargar un backup **para** resguardar la información.

```gherkin
Escenario: Backup completo
  Dado que estoy en Backups
  Cuando selecciono "Base completa" y presiono "Descargar .sql"
  Entonces el sistema descarga un archivo .sql
  Y registra la operación en el historial de backups

Escenario: Backup por federación sin seleccionar federación
  Dado que selecciono "Por federación"
  Y no elijo una federación
  Cuando presiono descargar
  Entonces el sistema indica que debo seleccionar una federación
```

### HU-11 — Alta de entrenador de selección

**Como** administrador de federación **quiero** registrar un entrenador de selección **para** asignarlo a una categoría.

```gherkin
Escenario: Entrenador con selección
  Dado que completo los datos del entrenador
  Y marco "Pertenece a Selección"
  Y elijo una categoría (1–9)
  Y guardo
  Entonces el entrenador queda asociado a la selección de esa categoría
  Y aparece en la vista de Selecciones
```

### HU-12 — Alta de federación contratante

**Como** SuperAdmin **quiero** dar de alta una federación con su administrador **para** incorporar un nuevo inquilino.

```gherkin
Escenario: Alta exitosa
  Dado que completo nombre, sigla, email institucional
  Y cargo usuario, email y contraseña del administrador (mínimo 6 caracteres, coincidentes)
  Cuando guardo
  Entonces el sistema crea la federación y su cuenta de administrador
  Y la federación aparece en la gestión de federaciones

Escenario: Contraseñas no coinciden
  Dado que la contraseña y su confirmación difieren
  Cuando intento guardar
  Entonces el sistema muestra el error "Las contraseñas no coinciden"
```

---

## 6. Reglas de Negocio

| ID | Regla | Verificación en código |
|----|-------|------------------------|
| RN-01 | **Traspaso requiere periodo activo.** Sin periodo vigente el club no puede iniciar solicitudes. | `TraspasosSolicitar.jsx` (`periodoActivo = periodo?.esVigente`). |
| RN-02 | **La federación verifica la deuda antes de habilitar** el traspaso; las validaciones bloqueantes impiden aprobar (salvo forzar como SuperAdmin). | `TraspasoDetalle.jsx` (`validaciones.puedeAprobar`, botón "Forzar habilitación"). |
| RN-03 | **Los atletas menores requieren tutor.** La relación `AtletaTutor` habilita el indicador de tutor en el padrón. | `TutorStatusCell`, `AssignTutorModal`, `AtletasList.jsx`. |
| RN-04 | **Un delegado es un usuario de rol `Club`.** El alta crea Persona + login `Club` + `DelegadoClub`; el club es obligatorio. | `DelegadosForm.jsx` (`rol: 'Club'`, validación `idClub`). |
| RN-05 | **Una persona puede ser entrenador y delegado a la vez** (se reutiliza la misma ficha `Persona` por DNI). | `DelegadosForm.applyPersona` (fallback por `/Entrenador`). |
| RN-06 | **Los planes determinan las capacidades.** `accesoSigdef` habilita SIGDEF; `accesoDashboardClub` habilita el panel/login Club; `accesoControlesLive` habilita jueces. | `utils/planHelpers.js`. |
| RN-07 | **El login requiere plan con `accesoSigdef`**, salvo SuperAdmin. | `AuthContext.login` y `restoreSession`. |
| RN-08 | **El SuperAdmin siempre pasa el `PlanGuard`.** Los demás roles se envuelven con `requiereSigdef`. | `src/App.jsx` (`PrivateRoute`) y `PlanGuard.jsx`. |
| RN-09 | **`maxAtletas = -1` significa ilimitado** en el catálogo de planes. | `PlanesCatalogEditor.jsx` (`ilimitado`). |
| RN-10 | **Precio anual = mensual × 12 × (1 − descuento/100)**, siempre `0 ≤ descuento ≤ 100`. | `PlanesCatalogEditor.calcPrecioAnual`. |
| RN-11 | **Estados de acceso de una federación:** `ACCESO PERMITIDO`, `ACCESO SUSPENDIDO (manual)`, `ACCESO BLOQUEADO POR PAGO`, `ACCESO SUSPENDIDO (suscripción vencida)`. | `FederacionesManagement.getAccessState`. |
| RN-12 | **Estados de un traspaso:** `PendienteOrigen`, `PendienteFederacion`, `Aprobado`, `RechazadoOrigen`, `RechazadoFederacion`, `Cancelado`, `Vencido`. | `utils/traspasoUtils.js` (`ESTADOS_TRASPASO`). |
| RN-13 | **Estados de pago:** `0 Pendiente`, `1 Pagado`, `2 Vencido`, `3 Parcial`. | `utils/enums.js` (`ESTADO_PAGO_MAP`). |
| RN-14 | **Unicidad de persona/usuario:** el alta reutiliza la persona por DNI y el usuario por DNI/username ya existentes en lugar de duplicarlos. | `DelegadosForm.ensurePersona`, `AuthService.register`. |
| RN-15 | **Aislamiento de mensajería.** Los mensajes de SIGDEF se separan del resto por `X-Client-App: sigdef`. | `services/api.js`, `messageService.js`, `criterios/mensajeria-aislamiento.md`. |
| RN-16 | **Liberar a un atleta lo deja Agente Libre** y habilita que otro club lo solicite; la federación verifica deudas al aprobar. | `ClubAtletas.handleConfirmLiberar` (`POST /Atleta/{id}/liberar`). |
| RN-17 | **Las categorías de selección son 1–9** (Preinfantil … Master A). | `utils/enums.js` (`CATEGORIA_MAP`), `utils/categoryConfig.js`. |
| RN-18 | **El club destino no puede solicitar un atleta que ya pertenece a su plantel** (no aparece en la búsqueda). | `TraspasosSolicitar.jsx` (texto de la búsqueda). |
| RN-19 | **Un rechazo previo no bloquea una nueva solicitud.** | `TraspasosSolicitar.jsx`. |
| RN-20 | **La renovación de suscripción** suma 1 mes (Mensual) o 1 año (Anual) a partir del vencimiento vigente o de hoy. | `FederacionesManagement.handleRenovarPlan`. |

---

## 7. Matriz de trazabilidad

| RF | Módulo / pantalla | Servicio / endpoint | CU | HU |
|----|-------------------|---------------------|----|----|
| RF-01…RF-06 | `Login`, `AuthContext` | `POST /Auth/login`, `POST /Auth/solicitar-reset-password` | CU-01 | — |
| RF-07…RF-16 | `FederacionAdmin/Atletas/*`, `ClubAdmin/Atletas/*` | `/Atleta*`, `/Atleta/paged`, `/Atleta/full`, `/Atleta/{id}/liberar`, `/AtletaTutor`, `/Documentacion` | CU-02, CU-15 | HU-01, HU-06 |
| RF-17…RF-19 | `FederacionAdmin/Clubes/*` | `/Clubes*` | CU-04 | — |
| RF-20…RF-23 | `FederacionAdmin/Delegados/*` | `/Persona`, `/Auth/register`, `/DelegadoClub` | CU-03 | HU-02 |
| RF-24…RF-27 | `FederacionAdmin/Tutores/*`, `ClubAdmin/Tutores/*` | `/Tutor*`, `/AtletaTutor*` | CU-15 | HU-01 |
| RF-28…RF-30 | `FederacionAdmin/Entrenadores/*`, `EntrenadorSeleccion/*` | `/Entrenador*` | CU-14 | HU-11 |
| RF-31…RF-38 | `Traspasos*` (fed y club) | `traspasoService` (`/Traspaso*`) | CU-05, CU-06 | HU-03, HU-04, HU-05 |
| RF-39…RF-44 | `FederacionAdmin/Pagos/*` | `pagoService` (`/pagos*`) | CU-07 | HU-06, HU-07 |
| RF-45…RF-51 | `Shared/MensajesPage` | `messageService` (`/mensajes*`) | CU-08 | HU-08 |
| RF-52…RF-53 | `Shared/RegistroInscripciones` | `/eventos`, `/inscripciones/registro`, `/inscripciones/{id}` | CU-07 | — |
| RF-54…RF-59 | `Usuarios/GestionLoginsSection` | `AuthService` (`/Auth/*`) | CU-09 | — |
| RF-60…RF-68 | `SuperAdmin/*` | `saasService` (`/saas/*`, `/Federaciones`, `/support/logs`) | CU-10, CU-11 | HU-09, HU-12 |
| RF-69…RF-71 | `SuperAdmin/Auditoria`, `Dashboard` | `/support/logs`, `/Auditoria` | CU-13 | — |
| RF-72…RF-74 | `SuperAdmin/BackupsManagement` | `backupService` (`/backup/*`) | CU-12 | HU-10 |
| RF-75…RF-76 | `HomePage/*` | `plansData.js` (fallback local) | CU-01 | — |

---

## Pie del pack

| Documento anterior | Documento actual | Documento siguiente |
|--------------------|------------------|---------------------|
| [README](./README.md) | **01 — Requerimientos de Usuario** | [02 — Casos de Uso →](./02-Casos-de-Uso.md) |

[Índice del pack](./README.md#índice-del-pack) · [README](./README.md) · [02](./02-Casos-de-Uso.md) · [03](./03-Diagramas-de-Flujo.md) · [04](./04-Manual-de-Usuario.md) · [05](./05-Manual-Tecnico.md) · [06](./06-Manual-Instalacion-Despliegue.md)
