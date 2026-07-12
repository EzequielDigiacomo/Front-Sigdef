# 01 — Diagramas globales (arquitectura)

## 1. Contexto

```mermaid
flowchart TB
    subgraph Actores
        SA[SuperAdmin]
        AF[Admin Federación]
        CL[Usuario Club]
        LG[Largador / Cronometrista]
        PU[Público Live]
    end

    subgraph Plataforma
        FS[FrontSigdef]
        ST[SportTrack-Front]
        API[SportTrack-Sigdef API]
    end

    subgraph Externos
        PG[(PostgreSQL)]
        CLOUD[Cloudinary]
        MP[MercadoPago]
    end

    SA --> FS
    AF --> FS
    CL --> FS
    AF --> ST
    LG --> ST
    PU --> API
    FS -->|REST JWT X-Client-App:sigdef| API
    ST -->|REST JWT X-Client-App:sporttrack| API
    PU -->|SignalR /hubs/timing + GETs públicos| API
    API --> PG
    API --> CLOUD
    API --> MP
```

---

## 2. Contenedores

```mermaid
flowchart TB
    subgraph Clientes
        FS[FrontSigdef<br/>React 18 + Vite]
        ST[SportTrack-Front<br/>React + Vite]
        BR[Browser Live]
    end

    subgraph APIBox["SportTrack-Sigdef (.NET 8)"]
        REST[Controllers REST]
        HUB[TimingHub SignalR]
        SVC[Services + Repositories]
        EF[EF Core DbContext]
    end

    subgraph Datos
        DB[(PostgreSQL<br/>schemas: seguridad federacion<br/>catalogos regatas comunicacion)]
    end

    subgraph Ext
        CLD[Cloudinary]
        MPG[MercadoPago]
    end

    FS --> REST
    ST --> REST
    BR --> HUB
    BR --> REST
    REST --> SVC
    HUB --> SVC
    SVC --> EF --> DB
    SVC --> CLD
    SVC --> MPG
```

---

## 3. Capas

```mermaid
flowchart TB
    subgraph Presentacion
        PAGE[Pages / Layouts]
        CTX[AuthContext / ThemeContext]
        HOOK[Hooks]
        SVCJS[Services JS]
    end

    subgraph Aplicacion
        CTRL[Controllers / Hub]
        APP[Application Services]
        REPO[Repositories]
    end

    subgraph Dominio
        ENT[Entidades]
    end

    subgraph Infra
        EF[DbContext / Npgsql]
        EXT[Cloudinary / MP clients]
    end

    PAGE --> CTX
    PAGE --> HOOK
    PAGE --> SVCJS
    SVCJS -->|HTTPS JSON| CTRL
    CTRL --> APP --> REPO --> ENT
    REPO --> EF
    APP --> EXT
```

---

## 4. Despliegue

```mermaid
flowchart LR
    U[Usuario] --> CDN[Hosting front<br/>estático / Vite]
    CDN -->|VITE_API_URL| RENDER[API Kestrel<br/>Render / servidor]
    RENDER --> PG[(PostgreSQL)]
    RENDER --> CLD[Cloudinary]
    RENDER --> MP[MercadoPago]
    U -->|WebSocket| RENDER
```

---

## 5. Despliegue detallado (opcional)

```mermaid
flowchart TB
    subgraph Dev["Ambiente local"]
        FEDEV[localhost:5173 FrontSigdef]
        STDEV[localhost:xxxx SportTrack-Front]
        APIDEV[localhost:5029 API + Swagger]
        PGDEV[(PostgreSQL local / remoto)]
    end

    subgraph Prod["Ambiente compartido"]
        FEPROD[Front hosting]
        STPROD[SportTrack hosting]
        APIPROD[API Render]
        PGPROD[(PostgreSQL managed)]
    end

    FEDEV --> APIDEV
    STDEV --> APIDEV
    APIDEV --> PGDEV
    FEPROD --> APIPROD
    STPROD --> APIPROD
    APIPROD --> PGPROD
```

**Notas ops**

- Migraciones EF al arrancar (`MigrateAsync`).
- Secrets: JWT, connection string, `CLOUDINARY_*`, MercadoPago.
- Header `X-Client-App` obligatorio en mensajería.

---

## 6. Paquetes / módulos

```mermaid
flowchart TB
    subgraph FrontSigdef
        SA[pages/SuperAdmin]
        FA[pages/FederacionAdmin]
        CA[pages/ClubAdmin]
        SH[pages/Shared Mensajes]
        SV[services]
        LY[layouts]
    end

    subgraph SportTrackFront
        STM[Mensajes / Timing UI]
        STE[Eventos / Fases]
    end

    subgraph API
        AUTH[Auth]
        SIG[SIGDEF CRUD]
        MSG[Mensajes]
        REG[Eventos Timing Resultados]
        PAY[Pagos SaaS]
        DOC[Documentacion]
        AUD[Auditoria]
    end

    SA --> SV
    FA --> SV
    CA --> SV
    SH --> SV
    SV --> AUTH
    SV --> SIG
    SV --> MSG
    SV --> PAY
    SV --> DOC
    STM --> MSG
    STM --> REG
    STE --> REG
```

---

## 7. Componentes (C4 L3) — API

```mermaid
flowchart LR
    subgraph Controllers
        AuthC[AuthController]
        UsuC[UsuarioController]
        AtlC[Atleta/Tutor/…]
        EvC[Eventos/Fases/Resultados]
        MsgC[MensajesController]
        PayC[Pagos/SaaS]
        DocC[Documentacion]
    end

    subgraph Services
        AuthS[AuthService TokenService]
        AtlS[Atleta Tutor Services]
        MsgS[MensajeService]
        FasS[FaseService]
        PayS[PagoService SaaSService]
        DocS[DocumentacionService]
    end

    AuthC --> AuthS
    UsuC --> AuthS
    AtlC --> AtlS
    EvC --> FasS
    MsgC --> MsgS
    PayC --> PayS
    DocC --> DocS
```

### Componentes — FrontSigdef

```mermaid
flowchart TB
    App[App.jsx rutas] --> ML[MainLayout / Club / Super]
    ML --> SB[Sidebar + badge unread]
    ML --> PG[Pages módulo]
    PG --> CMP[FormField Button Modal Tables]
    PG --> SVC[api / messageService / pagoService / saasService]
    SB --> HOOK[useUnreadMessages]
    HOOK --> SVC
```
