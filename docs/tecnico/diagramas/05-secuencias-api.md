# 05 — Secuencias y vista de red / API

## Red / API {#red-api}

### Mapa de fronteras HTTP

```mermaid
flowchart LR
    FS[FrontSigdef] -->|Bearer + X-Client-App:sigdef| API
    ST[SportTrack-Front] -->|Bearer + X-Client-App:sporttrack| API
    LIVE[Browser Live] -->|AllowAnonymous GETs + SignalR| API
    API --> PG[(PostgreSQL)]
```

### Grupos de endpoints

| Prefijo | Uso |
|---------|-----|
| `/api/Auth` | Login, usuarios, password, toggle-activo |
| `/api/Atleta`, `/Tutor`, `/Club`, `/Usuario`, … | CRUD SIGDEF |
| `/api/mensajes` | Hilos, campañas, unread |
| `/api/Eventos`, `/Fases`, `/Resultados`, … | Regatas / timing |
| `/api/Pagos`, `/SaaS`, … | Cobros y planes |
| `/api/Documentacion` | Upload Cloudinary |
| `/hubs/timing` | SignalR Live |

---

## 1. Login

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Login.jsx
    participant API as AuthController
    participant S as AuthService
    participant DB as Usuarios

    U->>FE: username/password
    FE->>API: POST /Auth/login (+ X-Client-App)
    API->>S: Validar
    S->>DB: Buscar usuario
    alt inválido / bloqueado
        S-->>FE: 401 + motivo
    else ok
        S-->>FE: JWT + perfil + rol
        FE->>FE: AuthContext + redirect por rol
    end
```

---

## 2. Cambio de contraseña (Admin)

```mermaid
sequenceDiagram
    participant UI as UserTable
    participant API as AuthController
    participant DB as Usuarios
    UI->>API: PUT /Auth/usuarios/{idUsuario}/password
    API->>DB: Update PasswordHash BCrypt
    API-->>UI: 200
    UI-->>UI: ConfirmationModal éxito
```

---

## 3. Mensaje 1:1 SIGDEF

```mermaid
sequenceDiagram
    actor A as Remitente
    participant UI as MensajesPage
    participant api as api.js
    participant C as MensajesController
    participant S as MensajeService
    participant DB as comunicacion.*

    A->>UI: Enviar
    UI->>api: POST /mensajes/hilos
    Note over api: X-Client-App: sigdef
    api->>C: JWT + header
    C->>S: CrearHilo(origen=sigdef)
    S->>DB: INSERT Hilo + Mensaje
    S-->>UI: detalle
```

---

## 4. Comunicado masivo

```mermaid
sequenceDiagram
    participant UI as MensajesPage
    participant C as MensajesController
    participant S as MensajeService
    participant DB as DB

    UI->>C: POST /mensajes/hilos/masivo
    C->>S: EnviarMasivo(ids[], origen)
    S->>DB: INSERT CampanaEnvio
    loop cada destinatario
        S->>DB: INSERT Hilo + Mensaje
    end
    S-->>UI: campanaId + cantidad
    UI->>C: GET /mensajes/campanas/{id}
```

---

## 5. Aislamiento cruzado

```mermaid
sequenceDiagram
    participant SF as FrontSigdef
    participant ST as SportTrack-Front
    participant API as API
    participant DB as Hilos

    SF->>API: GET /hilos (sigdef)
    API->>DB: SistemaOrigen=sigdef
    DB-->>SF: set A

    ST->>API: GET /hilos (sporttrack)
    API->>DB: SistemaOrigen=sporttrack
    DB-->>ST: set B (A ∩ B = ∅)
```

---

## 6. Unread badge

```mermaid
sequenceDiagram
    participant Nav as Sidebar
    participant H as useUnreadMessages
    participant API as GET /mensajes/no-leidos/count
    Nav->>H: mount / poll / notify
    H->>API: count (sigdef)
    API-->>H: n
    H-->>Nav: badge
```

---

## 7. Alta tutor + vínculo

```mermaid
sequenceDiagram
    participant UI as TutoresForm
    participant API as Tutor / AtletaTutor
    participant DB as federacion.*

    UI->>API: POST Tutor (persona)
    API->>DB: Participante + TutorFederacion
    UI->>API: POST AtletaTutor (ParticipanteId, IdTutor, Parentesco)
    API->>DB: AtletasTutores
    API-->>UI: ok
```

---

## 8. Upload documentación

```mermaid
sequenceDiagram
    participant UI as DocumentUploadModal
    participant API as DocumentacionController
    participant DOC as DocumentacionService
    participant CLD as Cloudinary
    participant DB as DocumentacionPersonas

    UI->>API: POST /Documentacion/upload (multipart)
    API->>DOC: Upload
    alt Cloudinary configurado
        DOC->>CLD: upload
        CLD-->>DOC: url + publicId
    else fallback
        DOC->>DOC: data URL local
    end
    DOC->>DB: INSERT
    DOC-->>UI: metadata
```

---

## 9. Pago / bloqueo (resumen)

```mermaid
sequenceDiagram
    participant Admin as Admin Fed
    participant API as Pagos / Auth
    participant DB as Club / Usuario

    Admin->>API: Registrar pago afiliación
    API->>DB: Actualizar flags pago
    Note over DB: BloqueadoPorFaltaDePago independiente de EstaActivo
    participant Club as Login Club
    Club->>API: login
    API->>DB: chequear flags
    API-->>Club: ok o rechazo por pago
```

---

## 10. Timing Live

```mermaid
sequenceDiagram
    participant Juez as SportTrack juez
    participant Hub as TimingHub
    participant Fas as IFaseService
    participant DB as Resultados
    participant Pub as Público Live

    Juez->>Hub: JoinRaceGroup(faseId)
    Pub->>Hub: JoinRaceGroup(faseId)
    Juez->>Hub: RequestStartRace
    Hub-->>Pub: broadcast start
    Juez->>Hub: SendTime
    Hub->>Fas: persistir
    Fas->>DB: Resultado
    Hub-->>Pub: update tiempo
```

---

## 11. Inscripción a EventoPrueba

```mermaid
sequenceDiagram
    participant UI as Inscripciones UI
    participant API as InscripcionesController
    participant DB as regatas.*

    UI->>API: POST Inscripcion
    API->>DB: Inscripcion
    UI->>API: POST Tripulantes
    API->>DB: InscripcionTripulantes
    API-->>UI: confirmación
```

---

## 12. SuperAdmin — métricas SaaS

```mermaid
sequenceDiagram
    participant UI as SuperDashboard
    participant S as saasService
    participant API as SaaSController
    UI->>S: get métricas / federaciones / planes
    S->>API: GET autenticado SuperAdmin
    API-->>UI: datos agregados
```

---

## 13. Error path mensajería (suave)

```mermaid
sequenceDiagram
    participant UI as MensajesPage
    participant API as API
    UI->>UI: validar destinatario/asunto/cuerpo
    alt inválido
        UI-->>UI: toast warning (sin request)
    else API error
        UI->>API: POST
        API-->>UI: 4xx/5xx
        UI-->>UI: toast error + loading off
    end
```
