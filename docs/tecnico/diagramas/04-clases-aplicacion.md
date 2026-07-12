# 04 — Clases de aplicación (opcional)

Vista de **código de aplicación** (no dominio). Útil para onboarding de desarrolladores.

---

## 1. API — Mensajería

```mermaid
classDiagram
    class MensajesController {
        +GetHilos()
        +GetHilo(id)
        +CrearHilo(dto)
        +EnviarMasivo(dto)
        +Responder(id, dto)
        +MarcarLeido(id)
        +GetNoLeidosCount()
        +GetCampanas()
        +GetCampana(id)
        -ResolveSistemaOrigen()
    }
    class IMensajeService
    class MensajeService {
        +CrearHilo(..., sistemaOrigen)
        +EnviarMasivo(..., sistemaOrigen)
        +ListarHilos(userId, sistemaOrigen)
    }
    class IMensajeRepository
    class MensajeRepository {
        +QueryBySistemaOrigen()
    }
    MensajesController --> IMensajeService
    MensajeService ..|> IMensajeService
    MensajeService --> IMensajeRepository
    MensajeRepository ..|> IMensajeRepository
```

---

## 2. API — Auth / usuarios

```mermaid
classDiagram
    class AuthController {
        +Login()
        +Usuarios CRUD
        +ToggleActivo(id)
        +ChangePassword(id)
    }
    class IAuthService
    class AuthService
    class ITokenService
    class TokenService {
        +GenerateJwt()
    }
    class IUsuarioServices
    class UsuarioServices
    AuthController --> IAuthService
    AuthController --> ITokenService
    AuthService --> ITokenService
    AuthController --> IUsuarioServices
```

---

## 3. API — Personas SIGDEF (patrón típico)

```mermaid
classDiagram
    class AtletaController
    class TutorController
    class AtletaTutorController
    class EntrenadorController
    class DelegadoClubController
    class PersonaController
    class ClubController

    class IAtletaServices
    class ITutorServices
    class IAtletaTutorServices
    class IEntrenadorServices
    class IDelegadoClubServices
    class IPersonaServices
    class IClubServices

    AtletaController --> IAtletaServices
    TutorController --> ITutorServices
    AtletaTutorController --> IAtletaTutorServices
    EntrenadorController --> IEntrenadorServices
    DelegadoClubController --> IDelegadoClubServices
    PersonaController --> IPersonaServices
    ClubController --> IClubServices
```

---

## 4. API — Eventos / timing

```mermaid
classDiagram
    class EventosController
    class InscripcionesController
    class FasesController
    class ResultadosController
    class TimingHub {
        +JoinRaceGroup()
        +JoinEventGroup()
        +RequestStartRace()
        +SendTime()
        +GetServerTime()
    }
    class IEventoService
    class IFaseService
    class IInscripcionService
    class IResultadoRepository

    EventosController --> IEventoService
    FasesController --> IFaseService
    TimingHub --> IFaseService
    InscripcionesController --> IInscripcionService
    ResultadosController --> IResultadoRepository
```

---

## 5. API — Pagos / SaaS / Docs

```mermaid
classDiagram
    class PagosController
    class SaaSController
    class PagoTransaccionController
    class DocumentacionController
    class IPagoService
    class ISaaSService
    class IDocumentacionService
    PagosController --> IPagoService
    SaaSController --> ISaaSService
    DocumentacionController --> IDocumentacionService
```

---

## 6. FrontSigdef — shell y mensajería

```mermaid
classDiagram
    class App
    class AuthContext {
        +user
        +login()
        +logout()
    }
    class MainLayout
    class MainLayoutClub
    class MainLayoutSuper
    class Sidebar
    class SidebarClub
    class useUnreadMessages {
        +count
        +refresh()
    }
    class MessageService {
        +getHilos()
        +crearHilo()
        +enviarMasivo()
        +getCampanas()
    }
    class MensajesPage
    class DestinatariosMultiSelect
    class CampanaDetalle
    class api {
        +CLIENT_APP sigdef
        +get/post/patch/delete
    }

    App --> AuthContext
    App --> MainLayout
    App --> MainLayoutClub
    App --> MainLayoutSuper
    MainLayout --> Sidebar
    Sidebar --> useUnreadMessages
    useUnreadMessages --> MessageService
    MensajesPage --> MessageService
    MensajesPage --> DestinatariosMultiSelect
    MensajesPage --> CampanaDetalle
    MessageService --> api
```

---

## 7. FrontSigdef — módulos Fed / Club (vista)

```mermaid
classDiagram
    class UserManagement
    class UserTable
    class ClubesList
    class AtletasList
    class TutoresForm
    class ClubTutoresForm
    class ClubAtletas
    class PagosClubes
    class pagoService
    class saasService

    UserManagement --> UserTable
    TutoresForm --> api
    ClubTutoresForm --> api
    ClubAtletas --> api
    PagosClubes --> pagoService
    pagoService --> api
    saasService --> api
```

---

## 8. DI (Program.cs) — registro conceptual

```mermaid
flowchart TB
    Program[Program.cs] --> Auth[AuthService TokenService]
    Program --> Msg[MensajeService MensajeRepository]
    Program --> Sig[Atleta Tutor Club Usuario Services…]
    Program --> Reg[Evento Fase Inscripcion Repos]
    Program --> Pay[PagoService SaaSService]
    Program --> Doc[DocumentacionService]
    Program --> Hub[MapHub TimingHub]
    Program --> Db[DbContext + MigrateAsync]
```
