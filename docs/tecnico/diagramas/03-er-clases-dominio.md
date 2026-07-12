# 03 — ER y clases de dominio

Schemas PostgreSQL: `seguridad`, `federacion`, `catalogos`, `regatas`, `comunicacion` (+ `Auditoria` sin schema).

---

## 1. ER — Auth / seguridad

```mermaid
erDiagram
    USUARIO ||--o| CLUB : "ClubId"
    USUARIO ||--o| FEDERACION : "FederacionId"
    USUARIO ||--o| PARTICIPANTE : "ParticipanteId"

    USUARIO {
        int IdUsuario PK
        string Username
        string PasswordHash
        string Email
        string RolFederacion
        bool EstaActivo
        int IntentosFallidos
    }

    AUDITORIA {
        int Id PK
        string Accion
        string Usuario
        string Modulo
        datetime Fecha
    }
```

---

## 2. ER — Federación / Club / SaaS

```mermaid
erDiagram
    FEDERACION ||--o{ CLUB : tiene
    FEDERACION }o--o| PLANSAAS : plan
    CLUB }o--o| PLANSAAS : plan
    FEDERACION ||--o{ USUARIO : usuarios
    CLUB ||--o{ USUARIO : usuarios

    FEDERACION {
        int Id PK
        string Nombre
        string Sigla
        string Cuit
    }
    CLUB {
        int IdClub PK
        string Nombre
        bool Activo
        string EstadoMatricula
    }
    PLANSAAS {
        int Id PK
        string Nombre
        decimal Precio
        int LimiteAtletas
    }
```

---

## 3. ER — Personas federadas

```mermaid
erDiagram
    PARTICIPANTE ||--o| ATLETA : "1:1"
    PARTICIPANTE ||--o| TUTOR : "1:1"
    PARTICIPANTE ||--o| ENTRENADOR : "1:1"
    PARTICIPANTE ||--o| DELEGADO : "1:1"
    PARTICIPANTE }o--|| SEXO : sexo
    PARTICIPANTE }o--o| CATEGORIA : categoria
    PARTICIPANTE }o--o| CLUB : club
    ATLETA }o--o| CLUB : club
    ATLETA }o--o| FEDERACION : fed
    ATLETA ||--o{ ATLETA_TUTOR : vinculos
    TUTOR ||--o{ ATLETA_TUTOR : vinculos
    PARTICIPANTE ||--o{ DOCUMENTACION : docs

    PARTICIPANTE {
        int IdParticipante PK
        string Nombre
        string Apellido
        date FechaNacimiento
        string Documento
    }
    ATLETA {
        int ParticipanteId PK
        string EstadoPago
        string Categoria
    }
    TUTOR {
        int ParticipanteId PK
        string TipoTutor
    }
    ATLETA_TUTOR {
        int ParticipanteId FK
        int IdTutor FK
        string Parentesco
    }
    ENTRENADOR {
        int ParticipanteId PK
        string Licencia
    }
    DELEGADO {
        int IdParticipante PK
        int ClubIdClub FK
    }
    DOCUMENTACION {
        int Id PK
        int PersonaId FK
        string TipoDocumento
        string UrlArchivo
        string PublicId
    }
```

---

## 4. ER — Eventos / timing / resultados

```mermaid
erDiagram
    EVENTO ||--o{ EVENTO_PRUEBA : incluye
    PRUEBA ||--o{ EVENTO_PRUEBA : instancia
    PRUEBA }o--|| BOTE : bote
    PRUEBA }o--|| CATEGORIA : cat
    PRUEBA }o--|| DISTANCIA : dist
    PRUEBA }o--|| SEXO : sexo
    EVENTO_PRUEBA ||--o{ INSCRIPCION : insc
    INSCRIPCION ||--o{ TRIPULANTE : crew
    EVENTO_PRUEBA ||--o{ ETAPA : etapas
    ETAPA ||--o{ FASE : fases
    FASE ||--o{ RESULTADO : resultados
    RESULTADO ||--o{ PENALIZACION : penas
    INSCRIPCION ||--o{ RESULTADO : corre
    EVENTO_PRUEBA ||--o{ REGLA_PROG : progresion

    EVENTO {
        int IdEvento PK
        string Nombre
        datetime FechaInicio
    }
    EVENTO_PRUEBA {
        int Id PK
        datetime FechaHora
        string Estado
    }
    INSCRIPCION {
        int Id PK
        int NumeroCompetidor
        bool Pagado
    }
    ETAPA {
        int Id PK
        string Tipo
        int Orden
    }
    FASE {
        int Id PK
        string NombreFase
        string Estado
    }
    RESULTADO {
        int Id PK
        string TiempoOficial
        int Posicion
    }
```

---

## 5. ER — Mensajería

```mermaid
erDiagram
    CAMPANA ||--o{ HILO : genera
    HILO ||--|{ MENSAJE : contiene
    USUARIO ||--o{ MENSAJE : remite
    USUARIO ||--o{ MENSAJE : recibe
    USUARIO ||--o{ CAMPANA : envia

    CAMPANA {
        int IdCampana PK
        string SistemaOrigen
        string Asunto
        int CantidadDestinatarios
    }
    HILO {
        int IdHilo PK
        string SistemaOrigen
        string Asunto
        int IdCampana FK
    }
    MENSAJE {
        int IdMensaje PK
        int IdHilo FK
        int RemitenteId FK
        int DestinatarioId FK
        datetime LeidoEn
    }
```

---

## 6. ER — Pagos

```mermaid
erDiagram
    PAGO }o--o| CLUB : club
    PAGO }o--o| PARTICIPANTE : persona
    PAGO }o--o| INSCRIPCION : insc
    PAGO_TX }o--|| PARTICIPANTE : persona
    PAGO_TX }o--|| CLUB : club

    PAGO {
        int Id PK
        string TipoPago
        decimal Monto
    }
    PAGO_TX {
        int Id PK
        string Concepto
        string Estado
        string IdMercadoPago
    }
```

---

## 7. Clases de dominio — Auth

```mermaid
classDiagram
    class Usuario {
        +int IdUsuario
        +string Username
        +string PasswordHash
        +string RolFederacion
        +bool EstaActivo
        +int? ClubId
        +int? FederacionId
        +int? ParticipanteId
    }
    class Auditoria {
        +string Accion
        +string Usuario
        +string Modulo
        +DateTime Fecha
    }
    Usuario --> Club
    Usuario --> Federacion
    Usuario --> Participante
```

---

## 8. Clases de dominio — Federación / Club

```mermaid
classDiagram
    class Federacion {
        +int Id
        +string Nombre
        +string Sigla
        +int? PlanSaaSId
    }
    class Club {
        +int IdClub
        +string Nombre
        +bool Activo
        +int? FederacionId
        +int? PlanSaaSId
        +string EstadoMatricula
    }
    class PlanSaaS {
        +int Id
        +string Nombre
        +decimal Precio
        +int LimiteAtletas
    }
    Federacion "1" --> "*" Club
    Federacion --> PlanSaaS
    Club --> PlanSaaS
```

---

## 9. Clases de dominio — Personas

```mermaid
classDiagram
    class Participante {
        +int IdParticipante
        +string Nombre
        +string Apellido
        +DateTime? FechaNacimiento
        +string Documento
        +int? ClubId
    }
    class AtletaFederacion {
        +int ParticipanteId
        +string EstadoPago
        +string Categoria
    }
    class TutorFederacion {
        +int ParticipanteId
        +string TipoTutor
    }
    class AtletaFederacionTutor {
        +int ParticipanteId
        +int IdTutor
        +string Parentesco
    }
    class EntrenadorFederacion {
        +int ParticipanteId
        +string Licencia
    }
    class DelegadoFederacionClub {
        +int IdParticipante
        +int ClubIdClub
    }
    class DocumentacionFederacionPersona {
        +int Id
        +int PersonaId
        +string TipoDocumento
        +string UrlArchivo
    }
    Participante "1" --> "0..1" AtletaFederacion
    Participante "1" --> "0..1" TutorFederacion
    Participante "1" --> "0..1" EntrenadorFederacion
    Participante "1" --> "0..1" DelegadoFederacionClub
    AtletaFederacion "*" --> "*" TutorFederacion : AtletaFederacionTutor
    Participante "1" --> "*" DocumentacionFederacionPersona
```

---

## 10. Clases de dominio — Eventos / timing

```mermaid
classDiagram
    class Evento {
        +int IdEvento
        +string Nombre
        +DateTime FechaInicio
    }
    class Prueba {
        +int IdPrueba
        +string Nombre
    }
    class EventoPrueba {
        +int Id
        +DateTime FechaHora
        +string Estado
    }
    class Inscripcion {
        +int Id
        +int NumeroCompetidor
        +bool Pagado
    }
    class InscripcionTripulante {
        +int PosicionEnBote
    }
    class Etapa {
        +int Id
        +string Tipo
        +int Orden
    }
    class Fase {
        +int Id
        +string NombreFase
        +string Estado
    }
    class Resultado {
        +int Id
        +string TiempoOficial
        +int? Posicion
    }
    class Penalizacion {
        +int Id
        +string Tipo
    }
    class ReglaProgresion {
        +int Id
    }
    Evento "1" --> "*" EventoPrueba
    Prueba "1" --> "*" EventoPrueba
    EventoPrueba "1" --> "*" Inscripcion
    Inscripcion "1" --> "*" InscripcionTripulante
    EventoPrueba "1" --> "*" Etapa
    Etapa "1" --> "*" Fase
    Fase "1" --> "*" Resultado
    Inscripcion "1" --> "*" Resultado
    Resultado "1" --> "*" Penalizacion
    EventoPrueba "1" --> "*" ReglaProgresion
```

---

## 11. Clases de dominio — Mensajería

```mermaid
classDiagram
    class MensajeriaSistemaOrigen {
        <<static>>
        +SportTrack
        +Sigdef
        +Normalizar(clientApp)$ string
    }
    class Hilo {
        +int IdHilo
        +string Asunto
        +string SistemaOrigen
        +int? IdCampana
    }
    class Mensaje {
        +int IdMensaje
        +int IdHilo
        +int RemitenteId
        +int DestinatarioId
        +string Cuerpo
        +DateTime? LeidoEn
    }
    class CampanaEnvio {
        +int IdCampana
        +int RemitenteId
        +string SistemaOrigen
        +string Asunto
        +string Cuerpo
    }
    CampanaEnvio "1" --> "*" Hilo
    Hilo "1" --> "*" Mensaje
    Hilo ..> MensajeriaSistemaOrigen
    CampanaEnvio ..> MensajeriaSistemaOrigen
```

---

## 12. Clases de dominio — Pagos

```mermaid
classDiagram
    class Pago {
        +int Id
        +string TipoPago
        +decimal Monto
        +int? ClubId
        +int? ParticipanteId
        +int? InscripcionId
    }
    class PagoFederacionTransaccion {
        +int Id
        +string Concepto
        +string Estado
        +string IdMercadoPago
        +int ParticipanteId
        +int ClubId
    }
    Pago --> Club
    Pago --> Participante
    Pago --> Inscripcion
    PagoFederacionTransaccion --> Participante
    PagoFederacionTransaccion --> Club
```

---

## 13. Mapa de schemas (vista de datos)

```mermaid
flowchart LR
    seguridad[seguridad.Usuarios]
    federacion[federacion.*]
    catalogos[catalogos.*]
    regatas[regatas.*]
    comunicacion[comunicacion.*]
    aud[Auditoria]

    seguridad --> federacion
    seguridad --> catalogos
    federacion --> catalogos
    federacion --> regatas
    regatas --> catalogos
    comunicacion --> seguridad
```
