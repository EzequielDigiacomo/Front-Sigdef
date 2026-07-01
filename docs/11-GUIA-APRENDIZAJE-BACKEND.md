# Guía de Aprendizaje: Desarrollo Backend (C# .NET)

¡Hola! Como estás aprendiendo a programar, esta guía está pensada paso a paso para que entiendas **qué** hace cada parte del código en el backend, **cómo** se conecta a la base de datos y **por qué** está organizado de esta manera. Usaremos ejemplos reales de tu código (`UsuarioController`, `UsuarioServices`, etc.).

---

## 1. ¿Qué es el Backend y la Base de Datos?

Imagina el **Backend** como el cerebro de tu aplicación. Es la parte que vive en el servidor, no en tu navegador. Su trabajo es recibir pedidos (peticiones) del Frontend (pantallas), verificar que la información esté bien, guardar o buscar datos en la **Base de Datos** y devolver una respuesta.

### ¿Cómo nos conectamos a la Base de Datos?
En tu proyecto, utilizamos algo llamado **Entity Framework Core (EF Core)**. Es un "traductor" (ORM) que nos permite escribir código en C# en lugar de escribir consultas SQL directas.
El archivo que representa la base de datos es el `SIGDeFContext` (o `ApplicationDbContext`).

---

## 2. DTOs (Data Transfer Objects) - ¿Qué son y por qué se usan?

Un **DTO** es simplemente un "paquete" de datos que usamos para pasar información entre el Frontend y el Backend.

**¿Por qué no usamos directamente nuestra Entidad (tabla de base de datos)?**
Por dos razones principales:
1. **Seguridad:** En la tabla `Usuarios` puedes tener campos como `PasswordHash` (la contraseña). ¡No queremos enviar nunca las contraseñas guardadas al Frontend!
2. **Practicidad:** A veces el Frontend necesita datos de múltiples tablas mezclados (por ejemplo, el nombre de la persona y si el usuario está activo).

**Ejemplo de código (`UsuarioDto`):**
```csharp
// Este DTO solo contiene los datos seguros que queremos enviar "hacia afuera"
public class UsuarioDto
{
    public int IdUsuario { get; set; }
    public string Username { get; set; }
    public bool EstaActivo { get; set; }
    public string NombrePersona { get; set; } // Viene de otra tabla (Personas)
    public string Email { get; set; }         // Viene de otra tabla (Personas)
}
```

---

## 3. Los Controladores (Controllers) - La puerta de entrada

Los Controladores son como los **recepcionistas** de un edificio. Cuando el Frontend hace una petición de red (ej. quiere registrarse), el controlador recibe ese mensaje y lo deriva a la persona adecuada.

**Características clave:**
- **No deben tener lógica pesada** (no se conectan a la base de datos directo). Solo reciben y devuelven respuestas HTTP.
- Usan "Decoradores" o "Atributos" como `[HttpGet]` o `[HttpPost]` para definir el tipo de petición.

**Ejemplo (`UsuarioController.cs`):**
```csharp
[ApiController] // Indica que esta clase es un controlador de API
[Route("api/[controller]")] // La URL para acceder será "api/usuario"
public class UsuarioController : ControllerBase
{
    // El controlador llama a los "Servicios" (que hacen el trabajo pesado)
    private readonly IUsuarioServices _services;

    public UsuarioController(IUsuarioServices services)
    {
        _services = services;
    }

    // Petición GET: "api/usuario" para buscar todos los usuarios
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioDto>>> Get()
    {
        return await _services.GetUsuarios();
    }

    // Petición POST: "api/usuario" para crear un usuario nuevo
    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> Post([FromBody] UsuarioCreateDto dto)
    {
        return await _services.PostUsuario(dto); // [FromBody] significa que los datos vienen en el "cuerpo" del mensaje
    }
}
```

---

## 4. Los Servicios (Services) - La fábrica (Business Logic)

Los **Servicios** son donde ocurre la magia. Aquí conectamos a la base de datos, verificamos que no haya datos repetidos y guardamos la información.
Se dividen en **Interfaces (`IUsuarioServices.cs`)** y su **Implementación (`UsuarioServices.cs`)**. La interfaz es como un "contrato" o un menú que avisa qué funcionalidades existen, y la implementación es el "cómo se hacen".

### Ejemplo de CRUD (Create, Read, Update, Delete)
Veamos el ejemplo de cómo se **Crea (Create)** un Usuario y cómo se manejan los **Errores** (`try / catch`).

**Ejemplo (`UsuarioServices.cs`):**
```csharp
public async Task<ActionResult<UsuarioDto>> PostUsuario(UsuarioCreateDto usuarioCreateDto)
{
    try // INTENTA hacer este código
    {
        // 1. Verificación: ¿Ya existe el usuario o el username?
        var usernameExists = await _context.Usuarios.AnyAsync(u => u.Username == usuarioCreateDto.Username);
        if (usernameExists)
        {
            // Retorna un error 400 (Bad Request) si ya existe
            return new BadRequestResult();
        }

        // 2. Seguridad: Encriptar la contraseña
        var passwordHash = HashPassword(usuarioCreateDto.Password);

        // 3. Crear el objeto Usuario (Entidad real para la BD)
        var usuario = new Usuario
        {
            IdPersona = usuarioCreateDto.IdPersona,
            Username = usuarioCreateDto.Username,
            PasswordHash = passwordHash,
            EstaActivo = true,
            FechaCreacion = DateTime.UtcNow
        };

        // 4. Agregar y Guardar en la Base de Datos
        _context.Usuarios.Add(usuario); // Se agrega a memoria
        await _context.SaveChangesAsync(); // ¡Se dispara el comando INSERT a SQL!

        // 5. Armar el DTO para devolverle el usuario recién creado (¡sin contraseña!) al frontend
        var usuarioDto = new UsuarioDto { ... };

        // 6. Retorna 201 (Created)
        return new ObjectResult(usuarioDto) { StatusCode = 201 };
    }
    // SI ALGO FALLA en la base de datos (Ej: se cortó internet, error de integridad), cae aquí (catch)
    catch (Exception) 
    {
        // Retorna un error 500 (Internal Server Error) y no rompe la aplicación.
        return new StatusCodeResult(500);
    }
}
```

---

## 5. Respuestas y Manejo de Errores

En las APIs nos comunicamos mediante **Códigos de Estado HTTP**. Así el frontend sabe si todo salió bien o no.
- **200 (OK):** Todo salió bien. (`new OkObjectResult(datos)`).
- **201 (Created):** Se creó algo nuevo en base de datos.
- **204 (No Content):** Se actualizó o borró bien, pero no hay datos extra para devolver. (`new NoContentResult()`).
- **400 (Bad Request):** El frontend mandó datos asnos o inválidos. (`new BadRequestResult()`).
- **404 (Not Found):** Lo que buscabas en la base de datos no existe. (`new NotFoundResult()`).
- **500 (Internal Server Error):** Un error en nuestro código backend o en la base de datos. Cayó en el bloque `catch`.

---

## 6. Middlewares (Mención conceptual)

Un **Middleware** es como un guardia de seguridad o una aduana por donde pasan todas las peticiones *antes* de llegar a tu Controlador.
Se configuran en archivos como `Program.cs`. 
Ejemplos de Middlewares:
- **Middleware de Autenticación:** Verifica que el usuario tenga un Token válido. Si no lo tiene, lo rebota antes de que llegue a `UsuarioController`.
- **CORS (Cross-Origin Resource Sharing):** Permite o rechaza que una web distinta (como `localhost:5173`) haga peticiones a tu API (`localhost:5078`).
- **Logger:** Imprime en consola un texto cada vez que alguien hace una petición.

¡Espero que esto te sirva de base sólida para entender el Backend!
