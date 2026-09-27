# 03 — Diagramas de Flujo

**Proyecto:** SIGDEF — Frontend de Gestión Deportiva Federativa (`FrontSigdef`)
**Última actualización: 2026-09-27**
**Notación:** Mermaid (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`)

---

## Índice

1. [Introducción](#1-introducción)
2. [(a) Login y resolución de rol/plan](#a-login-y-resolución-de-rolplan)
3. [(b) Alta de atleta con tutor](#b-alta-de-atleta-con-tutor)
4. [(c) Traspaso de atleta](#c-traspaso-de-atleta)
5. [(d) Control de pagos y recibos](#d-control-de-pagos-y-recibos)
6. [(e) Gestión de logins y accesos](#e-gestión-de-logins-y-accesos)
7. [(f) Mensajería con aislamiento X-Client-App](#f-mensajería-con-aislamiento-x-client-app)
8. [(g) Ciclo SaaS de una federación](#g-ciclo-saas-de-una-federación)
9. [(h) Backups y exportaciones](#h-backups-y-exportaciones)
10. [Pie del pack](#pie-del-pack)

---

## 1. Introducción

Los diagramas describen los flujos de la SPA y su interacción con la API `.NET 10`. Toda petición viaja por el wrapper `src/services/api.js`, que agrega `Authorization: Bearer <token>`, `X-Client-App: sigdef`, `credentials: include`, timeout de 45 s (90 s login) y hasta 2 reintentos ante `5xx`/timeout.

---

## (a) Login y resolución de rol/plan

```mermaid
flowchart TD
    A["Usuario abre /login"] --> B["POST /Auth/login (timeout 90s)"]
    B --> C{"¿HTTP 200?"}
    C -- No --> D{"¿401?"}
    D -- Sí --> E["Mostrar 'Usuario o contraseña incorrectos'"]
    D -- No --> F["Reintentar hasta 2 veces en 5xx/timeout"]
    F --> G["Mostrar error de conexión / cold start Render"]
    C -- Sí --> H["jwtDecode(token)"]
    H --> I{"Rol del claim"}
    I -- "SUPERADMIN / SuperAdmin" --> J["rol = SUPERADMIN"]
    I -- "Club" --> K["rol = CLUB"]
    I -- "Federacion / Admin" --> L["rol = FEDERACION"]
    I -- "otro / sin rol" --> L
    J --> M["Extraer plan y flags (planHelpers)"]
    K --> M
    L --> M
    M --> N{"¿Plan habilita accesoSigdef?"}
    N -- No --> O["Rechazar: se requiere plan SIGDEF o Pack Dúo"]
    N -- Sí --> P["Guardar usuario en localStorage.user"]
    P --> Q{"Rol"}
    Q -- SUPERADMIN --> R["Redirect /superadmin"]
    Q -- FEDERACION --> S["Redirect /dashboard"]
    Q -- CLUB --> T["Redirect /club"]
    R --> U["PrivateRoute: warmupApi()"]
    S --> U
    T --> U
    U --> V["Render según MainLayout correspondiente"]
```

**Flujo auxiliar — recuperar contraseña**

```mermaid
flowchart LR
    A["Login → '¿Olvidaste tu contraseña?'"] --> B["Modal: usuario + nota (opcional)"]
    B --> C["POST /Auth/solicitar-reset-password"]
    C --> D{"¿OK?"}
    D -- Sí --> E["Mensaje: solicitud enviada al administrador"]
    D -- No --> F["Mostrar error y permitir reintento"]
```

**Nota:** el login requiere que el plan incluya `accesoSigdef` (salvo SuperAdmin, ver RN-07). Cualquier `401` con sesión activa limpia `localStorage` y redirige a `/login` (RF-05).

---

## (b) Alta de atleta con tutor

```mermaid
sequenceDiagram
    autonumber
    actor U as Admin Federación
    participant F as AtletasForm React
    participant API as api.js wrapper fetch
    participant B as Backend .NET 10
    participant DB as PostgreSQL

    U->>F: Completa datos del atleta (nombre, DNI, nacimiento)
    F->>F: Calcular edad → ¿es menor?
    alt Es menor de edad
        F-->>U: Habilita sección Tutor (obligatoria)
        U->>F: Ingresa documento, nombre, apellido, parentesco
    else Es mayor
        F-->>U: Oculta sección Tutor
    end
    U->>F: Presiona Guardar
    F->>API: POST /Atleta/full (atleta + tutor + club + becas)
    API->>API: Agrega Bearer token + X-Client-App: sigdef
    API->>B: Solicitud HTTP
    B->>DB: INSERT Persona / Participante / AtletaTutor
    DB-->>B: OK (ids generados)
    B-->>API: 200 / 201 con atleta creado
    API-->>F: Datos del atleta
    F-->>U: Confirmación y vuelta al listado paginado
    F->>API: GET /Atleta/paged (refresh)
```

**Errores típicos:** `409` (documento/usuario duplicado) → "Ese DNI ya está registrado"; `400` (validación) → se muestran los campos.

---

## (c) Traspaso de atleta

### (c.1) Flujo general

```mermaid
flowchart TD
    A["Club destino: /club/traspasos/solicitar"] --> B["GET /Traspaso/periodo-activo"]
    B --> C{"¿Hay periodo activo?"}
    C -- No --> D["Bloquear: 'No hay periodo de traspaso activo'"]
    C -- Sí --> E["GET /Traspaso/buscar-atletas?q="]
    E --> F["Seleccionar atleta + motivo"]
    F --> G["POST /Traspaso"]
    G --> H["Estado: PendienteFederacion"]
    H --> I["Federación: GET /Traspaso/{id} y /validaciones"]
    I --> J{"¿puedeAprobar?"}
    J -- No --> K["Mostrar validaciones bloqueantes (p. ej. deuda)"]
    J -- Sí --> L["POST /Traspaso/{id}/aprobar"]
    L --> M["Estado: PendienteOrigen"]
    M --> N["Club origen: bandeja /club/traspasos/salientes"]
    N --> O{"Decisión del club origen"}
    O -- Aceptar --> P["POST /{id}/aceptar-origen → Aprobado"]
    O -- Rechazar --> Q["POST /{id}/rechazar-origen → RechazadoOrigen"]
    P --> R["Atleta cambia de club"]
    H --> S["Federación puede rechazar: /rechazar → RechazadoFederacion"]
    L --> T["SuperAdmin puede forzar: /aprobar?forzar=true"]
```

### (c.2) Máquina de estados

```mermaid
stateDiagram-v2
    [*] --> PendienteFederacion : POST /Traspaso
    PendienteFederacion --> PendienteOrigen : POST /{id}/aprobar
    PendienteFederacion --> RechazadoFederacion : POST /{id}/rechazar
    PendienteFederacion --> Cancelado : POST /{id}/cancelar
    PendienteOrigen --> Aprobado : POST /{id}/aceptar-origen
    PendienteOrigen --> RechazadoOrigen : POST /{id}/rechazar-origen
    PendienteOrigen --> Cancelado : POST /{id}/cancelar
    Aprobado --> [*] : Atleta transferido
    RechazadoFederacion --> [*]
    RechazadoOrigen --> [*]
    Cancelado --> [*]
```

| Estado | Significado | Quién actúa |
|--------|-------------|-------------|
| `PendienteFederacion` | Esperando verificación de la federación | Federación |
| `PendienteOrigen` | Habilitado; espera decisión del club origen | Club origen |
| `Aprobado` | Traspaso ejecutado | — |
| `RechazadoFederacion` | La federación rechazó | — |
| `RechazadoOrigen` | El club origen rechazó | — |

---

## (d) Control de pagos y recibos

```mermaid
flowchart TD
    subgraph Fed["Federación — /dashboard/pagos"]
        A1["Pestaña Clubes"] --> A2["PUT /pagos/clubes/{id}/toggle"]
        A3["Pestaña Atletas"] --> A4["PUT /pagos/atletas/{id}/toggle<br/>1=Al día · 2=Vencido · 3=Parcial"]
        A5["Registrar Recibo"] --> A6["POST /pagos/registrar"]
        A7["Pestaña Recibos"] --> A8["GET /pagos/historial"]
        A8 --> A9["DELETE /pagos/{id} o /pagos/bulk"]
    end
    subgraph Club["Club — /club/atletas"]
        B1["Marcar atleta pagado/pendiente"] --> B2["PUT /Atleta/{id}"]
        B3["Marcar todo el plantel"] --> B2
    end
    subgraph Insc["Inscripciones"]
        C1["Club: mis inscripciones"] --> C2["GET /inscripciones/mis-inscripciones"]
        C3["Federación: filtro + export CSV"] --> C4["DELETE /inscripciones/{id}"]
    end
    A2 --> D["Actualización optimista de UI"]
    A4 --> D
    B2 --> D
    D --> E{"¿Error de red?"}
    E -- Sí --> F["Revertir cambio e informar"]
    E -- No --> G["Estado de pago confirmado"]
```

**Estados de atleta:** `1` Al día · `2` Vencido · `3` Parcial. La cuota de club se controla por interruptor de afiliación.

---

## (e) Gestión de logins y accesos

```mermaid
flowchart TD
    A["Entrar a /dashboard/usuarios<br/>(o /superadmin/logins)"] --> B["GET /Auth/usuarios"]
    B --> C["Listado de credenciales"]
    C --> D{"Acción"}
    D -- Nueva credencial --> E["Elegir rol: Admin / Club / Juez"]
    E --> F{"¿Plan habilita el rol?"}
    F -- "Club sin accesoDashboardClub" --> G["Bloquear y sugerir upgrade"]
    F -- "Juez sin accesoControlesLive" --> G
    F -- Sí --> H["POST /Auth/register"]
    H --> I["Credencial creada"]
    D -- Cambiar contraseña --> J["PUT /Auth/usuarios/{id}/password"]
    D -- Editar perfil --> K["PUT /Auth/usuarios/{id}/perfil"]
    D -- Habilitar/Deshabilitar --> L["PATCH /Auth/usuarios/{id}/toggle-activo"]
    D -- Alta de club/persona --> M["POST /Clubes · POST /Persona"]
    J --> N["Confirmación al usuario"]
    K --> N
    L --> N
    M --> N
```

**Roles de juez** (operan en SportTrack-Front): `Largador`, `Cronometrista`, `JuezControl`, `ControlTecnico`. **Regla:** un delegado es un usuario de rol `Club` vinculado a un club.

---

## (f) Mensajería con aislamiento X-Client-App

```mermaid
sequenceDiagram
    autonumber
    actor SA as SuperAdmin
    participant M as MensajesPage
    participant API as api.js
    participant MS as messageService
    participant B as Backend .NET 10
    participant SG as DB SIGDEF aislada
    participant ST as DB SportTrack otra app

    SA->>M: Redacta comunicado masivo
    M->>MS: enviarMasivo(destinatarios, asunto, cuerpo)
    MS->>API: POST /mensajes/hilos/masivo
    API->>API: Header X-Client-App: sigdef
    API->>B: HTTP + Bearer token
    B->>SG: INSERT Hilo (1 por destinatario)
    Note over B,ST: El header X-Client-App discrimina el dominio<br/>Los hilos nunca cruzan a SportTrack
    SG-->>B: OK
    B-->>API: 201 creado
    API-->>M: Comunicado enviado
    M->>MS: getNoLeidosCount()
    MS->>API: GET /mensajes/no-leidos/count
    API-->>M: Contador actualizado (badge)
    M->>MS: getHilo(id)
    MS->>API: GET /mensajes/hilos/{id}
    M->>MS: marcarLeido(id)
    MS->>API: PATCH /mensajes/hilos/{id}/leer
```

**Aislamiento:** todos los endpoints de mensajería exigen el header `X-Client-App: sigdef`; un usuario de SIGDEF no ve hilos de SportTrack y viceversa. Modos de la vista: `super`, `admin`, `club`.

---

## (g) Ciclo SaaS de una federación

```mermaid
flowchart TD
    A["SuperAdmin: /superadmin/federaciones/nueva"] --> B["POST /saas/create-federacion<br/>(datos + adminUsername/adminEmail/adminPassword)"]
    B --> C["Federación creada con su administrador"]
    C --> D["Asignar plan: POST /SaaS/asignar-plan"]
    D --> E["Configurar frecuencia: Mensual o Anual"]
    E --> F["Calcular fecha de vencimiento"]
    F --> G["Evaluar estado de acceso"]
    G --> H{"Estado"}
    H -- "Dentro de plazo y pago OK" --> I["ACCESO PERMITIDO"]
    H -- "Suscripción vencida" --> J["VENCIDO"]
    H -- "Sin pago" --> K["BLOQUEADO POR PAGO"]
    H -- "Acción administrativa" --> L["SUSPENDIDO"]
    J --> M["Botón RENOVAR SUSCRIPCIÓN"]
    K --> M
    M --> N["PUT /Federaciones/{id}<br/>nueva fechaVencimientoPlan + bloqueadaPorFaltaDePago=false"]
    N --> I
    I --> O["PATCH /SaaS/clubes/{id}/toggle-activo<br/>(activar/suspender clubes)"]
    I --> P["Ingresar en MODO SUPERVISIÓN<br/>/superadmin/federacion/:fedId"]
    P --> Q["Subrutas: atletas, clubes, entrenadores,<br/>selecciones, delegados, tutores, pagos,<br/>inscripciones, traspasos, usuarios"]
```

**Plan e IDs:** SIGDEF 1–3 · SportTrack 4–6 · Pack Dúo 7–9. Flags: `accesoSigdef`, `accesoSportTrack`, `accesoControlesLive`, `accesoDashboardClub`, `permitirCargaImagenes`, `resultadosTiempoReal`, `exportacionPdf`, `maxAtletas`.

---

## (h) Backups y exportaciones

```mermaid
flowchart TD
    subgraph BK["Backups — /superadmin/backups"]
        A1["Elegir alcance"] --> A2{"¿Alcance?"}
        A2 -- "Base completa" --> A3["GET /backup/download?scope=full"]
        A2 -- "Por federación" --> A4["GET /backup/download?scope=federacion&id=…"]
        A4 --> A5{"¿Seleccionó federación?"}
        A5 -- No --> A6["Aviso: 'Seleccioná una federación'"]
        A5 -- Sí --> A3
        A3 --> A7["Descarga .sql (timeout extendido 300s)"]
        A7 --> A8["GET /backup/history"]
    end
    subgraph EX["Exportaciones de datos"]
        B1["Padrón de atletas → XLSX (xlsx)"]
        B2["Tutores → XLSX"]
        B3["Traspasos → CSV"]
        B4["Inscripciones → CSV"]
        B5["Recibos → PDF (jspdf + html2canvas)"]
        B6["QR de recibos/credenciales (qrcode.react)"]
    end
```

**Herramientas de exportación:** `xlsx ^0.18.5` (Excel), `jspdf ^3.0.4` + `html2canvas ^1.4.1` (PDF), `qrcode.react ^4.2.0` (QR).

---

## Pie del pack

| Documento anterior | Documento actual | Documento siguiente |
|--------------------|------------------|---------------------|
| [02 — Casos de Uso](./02-Casos-de-Uso.md) | **03 — Diagramas de Flujo** | [04 — Manual de Usuario →](./04-Manual-de-Usuario.md) |

[Índice del pack](./README.md#índice-del-pack) · [README](./README.md) · [01](./01-Requerimientos-Usuario.md) · [02](./02-Casos-de-Uso.md) · [04](./04-Manual-de-Usuario.md) · [05](./05-Manual-Tecnico.md) · [06](./06-Manual-Instalacion-Despliegue.md)
