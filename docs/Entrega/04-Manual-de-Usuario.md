# 04 — Manual de Usuario

**Proyecto:** SIGDEF — Frontend de Gestión Deportiva Federativa (`FrontSigdef`)
**Última actualización: 2026-09-27**
**Dirigido a:** Administradores de Federación, Usuarios de Club y SuperAdmin Global

---

## Índice

1. [Cómo usar este manual](#1-cómo-usar-este-manual)
2. [Acceso al sistema](#2-acceso-al-sistema)
3. [Manual — Administrador de Federación](#3-manual--administrador-de-federación)
   - 3.1 [Dashboard](#31-dashboard)
   - 3.2 [Atletas](#32-atletas)
   - 3.3 [Clubes](#33-clubes)
   - 3.4 [Delegados](#34-delegados)
   - 3.5 [Tutores](#35-tutores)
   - 3.6 [Entrenadores y selecciones](#36-entrenadores-y-selecciones)
   - 3.7 [Pagos y recibos](#37-pagos-y-recibos)
   - 3.8 [Traspasos](#38-traspasos)
   - 3.9 [Mensajes](#39-mensajes)
   - 3.10 [Usuarios y accesos](#310-usuarios-y-accesos)
   - 3.11 [Federación](#311-federación)
   - 3.12 [Registro de inscripciones](#312-registro-de-inscripciones)
4. [Manual — Usuario de Club](#4-manual--usuario-de-club)
5. [Manual — SuperAdmin Global](#5-manual--superadmin-global)
6. [Preguntas frecuentes y resolución de problemas](#6-preguntas-frecuentes-y-resolución-de-problemas)
7. [Pie del pack](#pie-del-pack)

---

## 1. Cómo usar este manual

El manual está organizado **por rol**. Buscá tu rol en el índice y seguí los pasos. Cada sección indica la **ruta** en la barra de direcciones, los **campos** de cada formulario y las **acciones** disponibles.

| Símbolo | Significado |
|---------|-------------|
| **Ruta** | Ubicación en la aplicación (dirección del navegador). |
| **Pasos** | Secuencia numerada de acciones. |
| **Nota** | Información útil o advertencia. |

---

## 2. Acceso al sistema

### 2.1 Iniciar sesión

1. Abrí el navegador en la URL de la aplicación.
2. En la pantalla de acceso, ingresá **usuario** y **contraseña**.
3. Presioná **Iniciar sesión**.

El sistema te redirige automáticamente según tu rol:

| Rol | Destino |
|-----|---------|
| SuperAdmin Global | `/superadmin` |
| Administrador de Federación | `/dashboard` |
| Usuario de Club / Delegado | `/club` |

### 2.2 Recuperar contraseña

1. En el login, presioná **¿Olvidaste tu contraseña?**
2. Ingresá tu **usuario** y, opcionalmente, una **nota**.
3. Presioná **Enviar solicitud**.

**Nota:** la solicitud llega al administrador de tu federación, que deberá cambiar la contraseña desde **Usuarios y accesos**. No se envía un correo automático.

### 2.3 Cerrar sesión

Presioná el botón de **salir** en la barra superior. La sesión se elimina del navegador.

### 2.4 Cambiar de tema

Usá el botón de **tema** (claro/oscuro) en la barra superior. La preferencia queda guardada.

---

## 3. Manual — Administrador de Federación

Ruta base: `/dashboard`. La barra lateral ofrece: Dashboard, Atletas, Clubes, Delegados, Tutores, Entrenadores, Selecciones, Pagos, Registro de Inscripciones, Federación, Usuarios, Mensajes y Traspasos.

### 3.1 Dashboard

**Ruta:** `/dashboard`

Muestra los indicadores de la federación:

| Indicador | Origen |
|-----------|--------|
| Total de atletas | `GET /Atleta` |
| Total de clubes | `GET /Club` / `/Clubes` |
| Actividad reciente | `GET /Auditoria?limit=200` |

**Pasos**
1. Ingresá a **Dashboard** desde la barra lateral.
2. Revisá los contadores y la actividad reciente.

### 3.2 Atletas

**Ruta:** `/dashboard/atletas`

#### Ver y buscar atletas

1. Ingresá a **Atletas**.
2. Usá el buscador (nombre o documento), los filtros y la paginación.
3. Presioná **Exportar** para descargar la lista en Excel (`.xlsx`).

#### Dar de alta un atleta

1. Presioná **Nuevo atleta**.
2. Completá los campos:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre | Sí | Nombre del palista. |
| Apellido | Sí | Apellido del palista. |
| Documento | Sí | DNI. Debe ser único. |
| Fecha de nacimiento | Sí | Determina si es menor. |
| Sexo | Sí | — |
| Club | No | Club al que pertenece. |
| Categoría | No | Se sugiere según la edad. |
| Estado de pago | No | Al día / Vencido / Parcial. |
| Apto médico | No | Carga del documento. |

3. Si el atleta es **menor de edad**, se habilita la sección **Tutor** (obligatoria):

| Campo del tutor | Obligatorio |
|-----------------|-------------|
| Documento | Sí |
| Nombre y apellido | Sí |
| Parentesco | Sí |
| Teléfono / email | No |

4. Presioná **Guardar**.

**Nota:** si el DNI ya existe, el sistema muestra "Ese DNI ya está registrado". Usá **Editar** sobre el atleta existente.

#### Editar un atleta

1. En el listado, presioná el ícono de **editar** (o entrá al detalle).
2. Modificá los campos y guardá.

#### Documentación

Desde el atleta podés abrir el **visor de documentos** y subir/reemplazar DNI, apto médico y otras imágenes (si el plan permite `permitirCargaImagenes`).

### 3.3 Clubes

**Ruta:** `/dashboard/clubes`

#### Dar de alta un club

1. Presioná **Nuevo club**.
2. Completá:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre | Sí | Nombre del club. |
| Sigla | No | Abreviatura. |
| Contacto | No | Teléfono / email. |
| Dirección | No | — |

3. Presioná **Guardar**.

#### Ver el detalle de un club

1. En el listado, presioná **Ver detalles**.
2. Se muestra el **plantel** de atletas y los **delegados** del club.

**Nota:** no podés eliminar un club con atletas vinculados.

### 3.4 Delegados

**Ruta:** `/dashboard/delegados`

Un **delegado** es la persona que representa a un club. Al crearlo, el sistema además **crea su usuario con rol Club** (con usuario y contraseña iguales al DNI), para que pueda ingresar al sistema.

#### Dar de alta un delegado

1. Presioná **Nuevo delegado**.
2. Ingresá el **DNI**. Si la persona ya existe, se autocompletan sus datos.
3. Completá los datos personales.
4. **Seleccioná un club** (obligatorio).
5. Presioná **Guardar**.

**Notas**
- Si no seleccionás club, el sistema bloquea el guardado: "Para crear el login de delegado tenés que seleccionar un club".
- Si tu plan no incluye `accesoDashboardClub`, el alta queda bloqueada; solicitá una actualización de plan al SuperAdmin.
- Un delegado sin club aparece como **Agente Libre**.

#### Restablecer accesos de un delegado

Si el delegado olvidó su contraseña, usá **Usuarios y accesos** → **Cambiar contraseña**.

### 3.5 Tutores

**Ruta:** `/dashboard/tutores`

Los tutores son responsables de los atletas **menores de edad**.

#### Alta y vinculación

1. Presioná **Nuevo tutor**.
2. Completá los campos:

| Campo | Obligatorio |
|-------|-------------|
| Documento | Sí |
| Nombre y apellido | Sí |
| Teléfono | No |
| Email | No |
| Dirección | No |

3. Guardá y luego **vinculá el tutor a un atleta menor** indicando el **parentesco**.

#### Desvincular

En el atleta, quitá el tutor correspondiente. El atleta queda sin tutor (solo válido para mayores de edad).

#### Exportar

Presioná **Exportar** para descargar el listado de tutores (`.xlsx`).

### 3.6 Entrenadores y selecciones

**Rutas:** `/dashboard/entrenadores` · `/dashboard/selecciones`

1. Entrá a **Entrenadores** y presioná **Nuevo entrenador**.
2. Completá los datos personales y la licencia.
3. Opcionalmente:
   - Asigná un **club** (entrenador de club), o
   - Marcá **Pertenece a Selección** y elegí la **categoría** (1 a 9).
4. Guardá.

**Selecciones:** agrupa a los entrenadores por categoría para armar los cuerpos técnicos de las selecciones.

### 3.7 Pagos y recibos

**Ruta:** `/dashboard/pagos`

La pantalla se organiza en tres pestañas.

#### Pestaña Clubes

1. Localizá el club.
2. Alterná el interruptor de **afiliación/pago**.
3. El estado se guarda automáticamente.

#### Pestaña Atletas

1. Buscá al atleta.
2. Alterná su estado de pago. Los estados posibles son: **Al día**, **Vencido** y **Parcial**.

#### Pestaña Recibos

1. Presioná **Registrar recibo**.
2. Completá:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Monto | Sí | Importe del recibo. |
| Referencia | No | Número o comprobante. |
| Notas | No | Observaciones. |

3. Guardá. El recibo aparece en la lista con los totales.
4. Para eliminar, usá el ícono de **borrar** (individual) o seleccioná varios y usá **Eliminar seleccionados**.

**Nota:** las exportaciones a PDF usan `jspdf`.

### 3.8 Traspasos

**Ruta:** `/dashboard/traspasos`

Un **traspaso** es el cambio de club de un atleta. Solo puede solicitarse dentro de un **periodo de traspaso activo**.

#### Periodos de traspaso

**Ruta:** `/dashboard/traspasos/periodos`

1. Presioná **Nuevo periodo**.
2. Definí **fecha de inicio** y **fecha de fin**.
3. Activá el periodo. Solo puede haber **uno activo** a la vez.

#### Revisar y resolver solicitudes

1. Entrá a **Traspasos** y elegí el estado a filtrar.
2. Abrí una solicitud (**Pendiente de federación**).
3. El sistema muestra las **validaciones** (deudas, documentación, etc.).
4. Si todo está en orden, presioná **Habilitar traspaso**. La solicitud pasa a **Pendiente del club origen**.
5. Si hay un problema, presioná **Rechazar** e ingresá el motivo.

**Cuadro de estados**

| Estado | Significado |
|--------|-------------|
| Pendiente de federación | Esperando verificación de la federación. |
| Pendiente del club origen | Habilitado; esperando decisión del club de origen. |
| Aprobado | Traspaso ejecutado. |
| Rechazado por federación | La federación lo rechazó. |
| Rechazado por origen | El club de origen lo rechazó. |

#### Exportar

Presioná **Exportar CSV** para descargar el listado filtrado.

### 3.9 Mensajes

**Ruta:** `/dashboard/mensajes`

#### Enviar un mensaje individual

1. Presioná **Nuevo mensaje**.
2. Elegí el **destinatario**, escribí el **asunto** y el **cuerpo**.
3. Enviá.

#### Comunicado masivo

1. Presioná **Comunicado masivo**.
2. Seleccioná los destinatarios (clubes de tu federación, agrupados).
3. Escribí asunto y cuerpo y enviá.
4. Revisá **Comunicados enviados** para ver leídos y respuestas.

#### Leer y responder

1. Abrí un hilo de la bandeja.
2. Al abrirlo se marca como **leído**.
3. Escribí tu respuesta y enviá.

El **contador de no leídos** aparece junto al ícono de mensajes.

### 3.10 Usuarios y accesos

**Ruta:** `/dashboard/usuarios`

#### Crear una credencial

1. Presioná **Nueva credencial**.
2. Elegí el **rol**: `Admin`, `Club` o un rol de juez.
3. Completá usuario, email y contraseña.
4. Guardá.

**Restricciones por plan**

| Rol | Requiere el flag |
|-----|------------------|
| Club | `accesoDashboardClub` |
| Largador, Cronometrista, Juez de Control, Control Técnico | `accesoControlesLive` |

Si el plan no lo habilita, el rol aparece bloqueado.

#### Otras acciones

| Acción | Descripción |
|--------|-------------|
| Cambiar contraseña | Restablece el acceso de un usuario. |
| Editar perfil | Actualiza datos de contacto. |
| Habilitar / Deshabilitar | Activa o bloquea la cuenta. |
| Alta de club / persona | Crea un club con su administrador, o una persona. |

**Nota:** los roles de juez operan en la aplicación **SportTrack-Front**, no en SIGDEF.

### 3.11 Federación

**Ruta:** `/dashboard/federacion`

Editá los datos institucionales: CUIT, banco, cuenta bancaria, email de cobro y contacto. Estos datos se usan en recibos y documentación.

### 3.12 Registro de inscripciones

**Ruta:** `/dashboard/registro-inscripciones`

1. Revisá las inscripciones registradas (filtrables por club).
2. Presioná **Exportar CSV** para descargar el listado.
3. Eliminá inscripciones con el ícono de borrado.

---

## 4. Manual — Usuario de Club

Ruta base: `/club`. Menú: Mi Club, Atletas, Tutores, Entrenadores, Delegados, Registro de Inscripciones, Mensajes y Traspasos.

### 4.1 Mi Club

**Ruta:** `/club`

Muestra la información del club: nombre, sigla, contacto y datos institucionales.

### 4.2 Plantel de atletas

**Ruta:** `/club/atletas`

#### Alta y edición

1. Presioná **Nuevo atleta**.
2. Completá los datos. Si es menor, cargá el **tutor** (obligatorio).
3. Guardá.

#### Documentos

Subí DNI y apto médico desde el atleta (si el plan permite imágenes).

#### Control de pago

1. Alterná el estado del atleta entre **Pagado** y **Pendiente**.
2. Podés marcar **todo el plantel** como pagado con un solo botón.

#### Liberar atleta

1. En el atleta, presioná **Liberar atleta**.
2. Confirmá la acción.

**Resultado:** el atleta queda como **Agente Libre** (sin club) y puede ser solicitado por otro club. **Esta acción no se puede deshacer fácilmente.**

### 4.3 Tutores

**Ruta:** `/club/tutores`

1. Presioná **Nuevo tutor** y cargá los datos.
2. Vinculalo al atleta menor con el **parentesco**.
3. Para desvincular, eliminá la relación.

### 4.4 Entrenadores

**Ruta:** `/club/entrenadores`

Cargá y editá los entrenadores de tu club.

### 4.5 Delegados

**Ruta:** `/club/delegados`

Consultá y gestioná los delegados del club.

### 4.6 Traspasos

**Rutas:** `/club/traspasos/solicitar` · `/club/traspasos/entrantes` · `/club/traspasos/salientes`

#### Solicitar el ingreso de un atleta

1. Verificá que exista un **periodo de traspaso activo**.
2. Presioná **Solicitar traspaso**.
3. Buscá el atleta por nombre o documento.
4. Seleccionalo, agregá el **motivo** y confirmá.

**Nota:** si no hay periodo activo, la solicitud queda bloqueada. La federación verificará primero que el atleta no tenga deuda.

#### Solicitudes salientes (atletas que se van)

1. Entrá a **Salientes**.
2. Abrí la solicitud habilitada por la federación.
3. Presioná **Aceptar** (el atleta se va) o **Rechazar** e indicá el motivo.

### 4.7 Mensajes

1. Entrá a **Mensajes**.
2. Creá un mensaje, elegí destinatario, asunto y cuerpo.
3. Leé y respondé los mensajes recibidos.

### 4.8 Mis inscripciones

1. Entrá a **Registro de Inscripciones**.
2. Consultá las inscripciones de tu club en eventos y competiciones.

---

## 5. Manual — SuperAdmin Global

Ruta base: `/superadmin`. Menú: Dashboard, Federaciones, Suscripciones, Auditoría, Backups, Planes, Módulos, Mensajes y Logins.

### 5.1 Dashboard global

**Ruta:** `/superadmin`

Muestra los KPIs del SaaS:

| Indicador | Descripción |
|-----------|-------------|
| Total de federaciones | Inquilinos activos. |
| Total de clubes | Clubes de todas las federaciones. |
| Total de atletas | Palistas de todo el sistema. |
| Ingresos mensuales | Facturación recurrente estimada. |
| Federaciones facturando | Cantidad con pago vigente. |
| Crecimiento | Porcentaje de crecimiento. |

Además: gráfico de evolución, distribución por plan y actividad reciente.

### 5.2 Federaciones

**Ruta:** `/superadmin/federaciones`

#### Alta de federación

1. Presioná **Nueva federación**.
2. Completá los datos institucionales y de contacto.
3. Cargá el **administrador principal**: usuario, email y contraseña (mínimo 6 caracteres).
4. Guardá.

El sistema crea la federación y su administrador en un solo paso.

#### Configuración SaaS

Sobre cada federación podés:
- Ver/editar el **plan**.
- Definir la **frecuencia** de facturación (Mensual / Anual).
- Ver la **fecha de alta** y de **vencimiento**.
- Consultar el **estado de pago** y el **estado de acceso**: Acceso permitido / Suspendido / Bloqueado por pago / Vencido.
- Presionar **Renovar suscripción** (ver 5.4).
- Suspender o reactivar **clubes** individualmente.
- **Ingresar en modo supervisión** (ver 5.7).

### 5.3 Planes

**Ruta:** `/superadmin/planes`

1. Elegí un plan y editá:
   - **Precio mensual**
   - **Porcentaje de descuento anual**
   - **Precio anual** (calculado como mensual × 12 × (1 − descuento))
   - **Máximo de atletas** (ingresá `-1` para ilimitado)
2. Guardá los cambios.

**Nota:** el editor incluye un **simulador de precios** que sugiere valores según los costos de infraestructura (Render).

### 5.4 Suscripciones

**Ruta:** `/superadmin/suscripciones`

Muestra la facturación por federación: facturas emitidas, total cobrado, pendiente y **efectividad** de cobro.

**Renovar suscripción**

1. Abrí la federación vencida o bloqueada.
2. Presioná **Renovar suscripción**.
3. El sistema calcula el nuevo vencimiento según la frecuencia y restablece el acceso.

### 5.5 Auditoría

**Ruta:** `/superadmin/auditoria`

Lista los últimos 100 eventos del sistema (accesos, seguridad, configuración). Podés filtrar y buscar. Los eventos de ruido de autenticación se filtran automáticamente.

### 5.6 Backups

**Ruta:** `/superadmin/backups`

1. Elegí el **alcance**: **Base completa** o **Por federación**.
2. Si elegís por federación, seleccioná cuál.
3. Presioná **Descargar .sql**.

**Nota:** la descarga puede demorar (timeout extendido de 300 s). El **historial** lista las operaciones realizadas.

### 5.7 Modo supervisión

**Ruta:** `/superadmin/federacion/:fedId`

Permite operar dentro de una federación como si fueras su administrador: atletas, clubes, entrenadores, selecciones, delegados, tutores, pagos, inscripciones, traspasos y usuarios. Es útil para soporte. Además, en Traspasos aparece la opción **Forzar habilitación**.

### 5.8 Mensajes y Logins

- **Mensajes** (`/superadmin/mensajes`): bandeja global y comunicados masivos a administradores de federación.
- **Logins** (`/superadmin/logins`): consulta y gestión de credenciales de todas las federaciones.

---

## 6. Preguntas frecuentes y resolución de problemas

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| "Usuario o contraseña incorrectos" | Credenciales erróneas o cuenta bloqueada. | Verificá los datos; si persiste, pedí a tu federación el restablecimiento. |
| La primera carga tarda mucho | El backend en Render entra en reposo (*cold start*). | Esperá unos segundos; el sistema reintenta automáticamente. |
| "No tengo acceso a SIGDEF" | Tu plan no incluye `accesoSigdef`. | Solicitá un plan SIGDEF o Pack Dúo. |
| No puedo crear un delegado | Falta seleccionar el club o el plan no incluye `accesoDashboardClub`. | Seleccioná un club / actualizá el plan. |
| No puedo crear un rol de juez | El plan no incluye `accesoControlesLive`. | Solicitá actualización de plan. |
| No puedo solicitar un traspaso | No hay periodo de traspaso activo. | Pedí a la federación que abra un periodo. |
| El traspaso no se puede habilitar | Hay validaciones pendientes (p. ej. deuda del atleta). | Regularizá la deuda y reintentá. |
| Falta cargar el tutor de un menor | El tutor es obligatorio para menores. | Cargá y vinculá el tutor. |
| "El DNI ya está registrado" | La persona ya existe en el padrón. | Buscala y editala en lugar de crear una nueva. |
| Un atleta quedó sin club | Se usó **Liberar atleta** (Agente Libre). | Otro club debe solicitar su traspaso. |
| Se cerró la sesión sola | Token expirado o respuesta `401`. | Volvé a iniciar sesión. |
| La descarga de backup falla | Timeout del dump. | Reintentá; usá alcance "Por federación" si es grande. |
| No veo un mensaje que me enviaron | Puede pertenecer a la otra aplicación (SportTrack). | La mensajería está aislada por `X-Client-App`. |
| Los valores de pago quedaron mal | Error de red al alternar el interruptor. | Recargá la pantalla y volvé a alternar. |

---

## Pie del pack

| Documento anterior | Documento actual | Documento siguiente |
|--------------------|------------------|---------------------|
| [03 — Diagramas de Flujo](./03-Diagramas-de-Flujo.md) | **04 — Manual de Usuario** | [05 — Manual Técnico →](./05-Manual-Tecnico.md) |

[Índice del pack](./README.md#índice-del-pack) · [README](./README.md) · [01](./01-Requerimientos-Usuario.md) · [02](./02-Casos-de-Uso.md) · [03](./03-Diagramas-de-Flujo.md) · [05](./05-Manual-Tecnico.md) · [06](./06-Manual-Instalacion-Despliegue.md)
