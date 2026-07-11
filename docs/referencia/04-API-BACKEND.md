# 📡 Documentación de API Backend (SIGDEF)

Esta documentación describe la arquitectura técnica, los endpoints y los flujos de integración del backend de SIGDEF, desarrollado en **ASP.NET Core 8**.

## Arquitectura Técnica

El backend sigue un patrón de diseño **Controller-Service-Repository**, facilitando la separación de responsabilidades y la mantenibilidad del código.

- **Framework**: .NET 8 (LTS)
- **Base de Datos**: PostgreSQL (via Npgsql)
- **ORM**: Entity Framework Core 8
- **Seguridad**: JWT Bearer Authentication

## Autenticación y Seguridad

### Flujo JWT (JSON Web Token)
1. **Login**: Petición `POST /api/auth/login` con credenciales.
2. **Validación**: El servidor valida el usuario y genera un token firmado.
3. **Respuesta**: Se devuelve el token JWT con los claims de rol y `idPersona`.
4. **Consumo**: El cliente incluye el token en todas las peticiones protegidas:
   `Authorization: Bearer <token>`

### Roles Soportados
- `FEDERACION` (Administrador): Acceso total.
- `CLUB`: Acceso filtrado a los atletas e inscripciones de su propio club.

---

## Controladores y Endpoints

El sistema cuenta con más de 15 controladores. A continuación, se resumen los más críticos:

### 1. Gestión de Atletas (`AtletaController`)
Gestiona el ciclo de vida de los deportistas.
- `GET /api/atletas`: Lista de todos los atletas (Federación).
- `GET /api/atletas/paginados`: Listado con soporte para paginación y filtros.
- `POST /api/atletas/full`: Registro atómico de atleta y tutor (para menores).

### 2. Gestión de Clubes (`ClubController`)
Gestión de instituciones deportivas.
- `GET /api/clubes`: Todos los clubes registrados.
- `GET /api/clubes/{id}/atletas`: Atletas asociados a un club específico.
- `POST /api/clubes`: Registro de un nuevo club.

### 3. Eventos e Inscripciones (`EventoController` e `InscripcionController`)
Manejo del calendario deportivo y registro de competidores.
- `GET /api/eventos/activos`: Lista de torneos vigentes.
- `POST /api/inscripciones`: Registro de un atleta en una prueba de un evento.

### 4. Pagos y Transacciones (`PagoTransaccionController`)
Gestión financiera y conexión con pasarelas.
- `POST /api/pagos/preferencia`: Generación de preferencia de pago para MercadoPago.
- `GET /api/pagos/status/{idPersona}`: Consulta del estado de pagos de un atleta.

---

## Integraciones Externas

### Cloudinary (Documentación)
- **Uso**: Almacenamiento de fotos de perfil y aptos médicos (PDF/Imagen).
- **Proceso**: El servidor recibe el archivo, lo sube a Cloudinary y guarda la URL pública en la tabla `DocumentacionPersona`.

### MercadoPago (Pagos) - *Próxima Implementación*
- **Estado**: La lógica de integración está preparada en el backend (`Pagos` library), pero el flujo de usuario actual se maneja de forma **manual** por parte de la Federación para simplificar la puesta en marcha inicial.
- **Webhook**: El endpoint (`NotificacionPagoController`) sigue disponible para futuras pruebas de integración.

## Estructura de Proyecto (Backend)

1. **SIGDEF.Api**: Capa de entrada (Controllers, Program.cs, Middleware).
2. **SIGDEF.Controlador**: Capa de Negocio (Services e Interfaces).
3. **SIGDEF.Entidades**: Modelos de datos y DTOs compartidos.
4. **SIGDeF.AccesoDatos**: Contexto de EF Core y configuración de base de datos.
5. **Pagos**: Librería dedicada a la lógica de integración financiera.

---

**Próxima lectura recomendada:** [05-BASE-DE-DATOS.md](./05-BASE-DE-DATOS.md)
