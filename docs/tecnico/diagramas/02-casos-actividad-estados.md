# 02 — Casos de uso, actividad y estados

## 1. Casos de uso

### Vista global por actor

```mermaid
flowchart TB
    SA((SuperAdmin))
    AF((Admin Fed))
    CL((Club))
    LG((Largador/Cronometrista))
    PU((Público))

    SA --> S1[Gestionar federaciones]
    SA --> S2[Planes y suscripciones SaaS]
    SA --> S3[Auditoría]
    SA --> S4[Mensajes a admins]

    AF --> A1[ABM clubes]
    AF --> A2[ABM atletas / tutores / entrenadores / delegados]
    AF --> A3[Gestión de accesos y contraseñas]
    AF --> A4[Eventos e inscripciones]
    AF --> A5[Pagos afiliación]
    AF --> A6[Mensaje 1:1 y comunicado masivo]
    AF --> A7[Documentación personas]

    CL --> C1[Gestionar atletas / tutores del club]
    CL --> C2[Eventos propios y disponibles]
    CL --> C3[Leer y responder mensajes]
    CL --> C4[Delegados del club]

    LG --> L1[Timing de fases / resultados]
    PU --> P1[Ver Live de carreras]
```

### Casos de uso — Mensajería (detalle)

```mermaid
flowchart LR
    AF((Admin))
    SA((Super))
    CL((Club))

    AF --> M1[Enviar 1:1]
    AF --> M2[Enviar masivo a clubes]
    AF --> M3[Ver comunicados enviados]
    SA --> M4[Enviar masivo a admins]
    CL --> M5[Recibir y responder]
    CL -.->|no| M2
```

---

## 2. Actividad

### Login

```mermaid
flowchart TD
    A[Abrir /login] --> B[Enviar credenciales]
    B --> C{¿Válidas?}
    C -->|No| D[Incrementar intentos / error]
    D --> A
    C -->|Sí| E{¿Activo / no bloqueado pago?}
    E -->|No| F[Rechazo con motivo]
    E -->|Sí| G[Emitir JWT]
    G --> H{Rol}
    H -->|SUPERADMIN| I[/superadmin]
    H -->|ADMIN/FED| J[/dashboard]
    H -->|CLUB| K[/club]
```

### Alta tutor con vínculo a menor (Fed)

```mermaid
flowchart TD
    A[Nuevo Tutor] --> B[Completar datos persona]
    B --> C[Elegir club]
    C --> D[Listar menores del club]
    D --> E{¿Hay menores?}
    E -->|No| F[Mensaje lista vacía]
    E -->|Sí| G[Seleccionar menor + parentesco]
    G --> H[POST Tutor + AtletaTutor]
    H --> I[Club ve tutor en listado]
```

### Comunicado masivo SIGDEF

```mermaid
flowchart TD
    A[Nuevo mensaje] --> B[Modo Comunicado masivo]
    B --> C[Seleccionar N destinatarios]
    C --> D{¿Al menos 1?}
    D -->|No| E[Validación UI]
    D -->|Sí| F[POST /mensajes/hilos/masivo]
    F --> G[API setea SistemaOrigen=sigdef]
    G --> H[Crea 1 Campaña + N Hilos + N Mensajes]
    H --> I[Tab Comunicados + detalle]
    I --> J[Cada destinatario responde en su hilo]
```

### Inscripción a evento (resumen)

```mermaid
flowchart TD
    A[Elegir EventoPrueba] --> B[Crear Inscripcion]
    B --> C[Agregar Tripulantes]
    C --> D{¿Requiere pago?}
    D -->|Sí| E[Registrar pago / flag Pagado]
    D -->|No| F[Inscripcion confirmada]
    E --> F
    F --> G[Aparece en fases de timing]
```

### Timing Live (carrera)

```mermaid
flowchart TD
    A[Juez conecta TimingHub] --> B[JoinRaceGroup fase]
    B --> C[RequestStartRace]
    C --> D[Broadcast a grupo]
    D --> E[SendTime / resultado]
    E --> F[Persistir Resultado]
    F --> G[Público recibe update Live]
```

---

## 3. Estados

### Usuario acceso

```mermaid
stateDiagram-v2
    [*] --> Activo: alta / activar
    Activo --> Inactivo: toggle-activo / lock intentos
    Inactivo --> Activo: reactivar
    Activo --> BloqueadoPago: falta pago afiliación (flag aparte)
    BloqueadoPago --> Activo: regularizar pago
```

### Mensaje en hilo

```mermaid
stateDiagram-v2
    [*] --> Enviado
    Enviado --> Leido: abrir hilo / PATCH leer
    Leido --> ConRespuesta: responder
    ConRespuesta --> Leido: contraparte lee
```

### Campaña

```mermaid
stateDiagram-v2
    [*] --> Enviada: POST masivo
    Enviada --> ParcialmenteLeida: algún hilo leído
    ParcialmenteLeida --> CompletamenteLeida: todos leídos
    Enviada --> ConRespuestas: algún respondido
```

### Fase de regata

```mermaid
stateDiagram-v2
    [*] --> Programada
    Programada --> EnCurso: start
    EnCurso --> Finalizada: cierre / resultados
    Finalizada --> [*]
```

### Inscripción

```mermaid
stateDiagram-v2
    [*] --> Pendiente
    Pendiente --> Confirmada
    Confirmada --> Pagada: Pagado=true
    Confirmada --> Anulada
    Pagada --> Anulada
```

### Matrícula / afiliación club (resumen)

```mermaid
stateDiagram-v2
    [*] --> AlDia
    AlDia --> Impago: vencimiento / falta pago
    Impago --> AlDia: pago registrado
    Impago --> BloqueoAcceso: BloqueadoPorFaltaDePago
    BloqueoAcceso --> AlDia: regularización
```

### Documentación persona

```mermaid
stateDiagram-v2
    [*] --> SinDoc
    SinDoc --> Cargada: upload Cloudinary/local
    Cargada --> Reemplazada: nuevo upload
    Cargada --> Eliminada: DELETE
    Eliminada --> [*]
```
