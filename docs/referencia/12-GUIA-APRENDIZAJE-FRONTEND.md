# Guía de Aprendizaje: Desarrollo Frontend (React)

¡Hola de nuevo! Ya vimos cómo funciona el cerebro y la memoria de nuestro sistema en el **Backend**. Ahora vamos a ver cómo funciona el **Frontend**, es decir, el cliente, las "caras" del sistema, las pantallas con las que interactúa el usuario.

---

## 1. ¿Cómo se conecta React al Backend? (Peticiones o "Requests")

El Frontend utiliza **JavaScript** para enviar peticiones en red hacia el Backend y decirle cosas como: _"Oye Backend, dame todos los usuarios"_ (GET) o _"Backend, guarda este atleta nuevo en la base de datos"_ (POST).

En tu proyecto, tienes todo esto muy bien automatizado en el archivo `src/services/api.js`.

### Peticiones y Respuestas: El Archivo `api.js`
Utilizamos la herramienta nativa del navegador llamada `fetch` para hacer esto. Vamos a analizar tu código de `api.js`:

```javascript
// Este es el objeto exportado que usamos en las pantallas
export const api = {
    // Para buscar (Leer/Read)
    get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),
    
    // Para enviar datos nuevos (Crear/Create)
    post: (endpoint, data, options = {}) => request(endpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), // Convertimos nuestro objeto de JS a Texto/JSON
        ...options 
    }),

    // Para  actualizar algo existente (Update)
    put: (endpoint, data, options = {}) => request(endpoint, { method: 'PUT', ... })
};
```

**¿Por qué necesitamos esto?**
- Porque centralizando el `fetch`, podemos automatizar cosas. Por ejemplo, en tu función `request()` (dentro de `api.js`), sacas el "Token de Seguridad" del `localStorage` (la "memoria de la web") y lo metes a la petición de forma automática:
  ```javascript
  const token = JSON.parse(localStorage.getItem('user'))?.token;
  if (token) {
      fetchOptions.headers = { ... , 'Authorization': `Bearer ${token}` };
  }
  ```
  De esta forma, no tienes que hacerlo a mano en cada nueva pantalla de tu aplicación. 

---

## 2. Peticiones HTTP del Frontend

Para cualquier operación **CRUD** (Crear, Leer, Actualizar, Borrar), el frontend manda la solicitud:

1. **GET (Leer):** No enviamos datos "secretos", solo pasamos la ruta deseada. `api.get('/usuarios')`.
2. **POST (Crear):** Se mandan datos nuevos desde un formulario para guardar. Se envía el objeto JSON entero en algo que se llama el `body` (cuerpo) del mensaje. `api.post('/usuarios', { username: "Eze", password: "123" })`.
3. **PUT (Actualizar):** Igual al POST, pero se utiliza para re-escribir o editar información. Normalemnte le decimos al backend el `id` para saber A QUIÉN estamos actualizando. `api.put('/usuarios/1', { username: "EzequielNuevo" })`.
4. **DELETE (Borrar):** Usualmente mandamos la ruta indicando un `id`. `api.delete('/usuarios/1')`.

---

## 3. Estado, Efectos y Pantallas en React

Las pantallas (componentes) en React utilizan sus propios "Mecanismos" para lidiar con el backend. Puesto que solicitar info al backend *tarda tiempo* (por la conexión de internet), necesitamos "Estados" (`useState`) para reflejar en pantalla lo que ocurre usando `useEffect`.

```javascript
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const ListaDeUsuarios = () => {
    // 1. Manejo del Estado (Variables que re-dibujan la pantalla al cambiar)
    const [usuarios, setUsuarios] = useState([]); // Array vacío al comienzo
    const [cargando, setCargando] = useState(true); // Está "pensando"
    const [error, setError] = useState(null); // No hay errores al comienzo
    
    // 2. El Efecto (Código que se ejecuta automáticament al abrir la pantalla)
    useEffect(() => {
        const cargarUsuarios = async () => {
            try {
                // Hacemos el pedido HTTP GET
                const data = await api.get('/Usuario');
                // Guardamos en estado los datos
                setUsuarios(data); 
            } catch (err) {
                // Manejo del error
                setError(err.message); 
            } finally {
                // Se haya roto o haya saludo bien, ya NO está cargando.
                setCargando(false);
            }
        };

        cargarUsuarios(); 
    }, []); // Los "[]" significan que esto se corre 1 sola vez cuando se monta en pantalla.

    // 3. Renderizado - ¿Qué mostramos al usuario?
    if (cargando) return <div>Cargando la lista de usuarios desde la DB...</div>;
    if (error) return <div>Lo sentimos, error: {error}</div>;

    // Si salió todo bien, mapeamos (dibujamos un bloque por cada usuario) el array
    return (
        <ul>
            {usuarios.map((usuario) => (
                // Las pantallas React necesitan una propiedad "key" al iterar listas
                <li key={usuario.idUsuario}> 
                    El usuario es: {usuario.nombrePersona} ({usuario.email})
                </li>
            ))}
        </ul>
    );
};
```

---

## 4. Manejo de Errores Global y Local

Cuando algo falla en el lado del servidor, el servidor va a retornar `500 Server Error` o un `400 Bad Request`.
Si observas en tu archivo `api.js`, tienes una función experta en manejar estos errores: `handleResponse`.

```javascript
const handleResponse = async (response, options = {}) => {
    // ...
    // Si da error 401 (Prohibido/No Autorizado), te borra las credenciales y te echa al login!!
    if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Su sesión ha expirado');
    }
    
    // Si la respuesta no es "ok" (código distinto de 200/201/204), saca un error!
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    //...
}
```
Esto es brillante porque hace que **cualquier error caiga automáticamente en el boque `catch(err)`** de las pantallas. ¿Ves el `catch(err)` en el paso 3 de arriba del "Efecto"? Funciona gracias a que tu `api.js` está disparando (`throw`) el error. 

## En Resumen (El Ciclo de Vida del CRUD)

1. En la web rellenamos un formulario de crear usuario.
2. React lanza `api.post(...)`. (Crea la petición POST y le inyecta el token).
3. Viaja la señal por internet y entra al **Middleware** del Backend C#. Este verifica la identidad y le da paso al `UsuarioController`.
4. El Controlador llama a `PostUsuario(...)` en el Servicio.
5. El Servicio hace toda la lógica (Encriptar, validar) y usa Entity Framework para añadir el usuario a Base de Datos.
6. El Backend retorna un JSON de éxito con código `201`.
7. React en `api.js` lo lee y como es `201`, resuelve la promesa retornando los datos al Componente.
8. El componente actualiza un "estado" (`setUsuarios(...)`), lo que provoca que la lista de la pantalla se re-dibuje, mostrando finalmente el nuevo usuario en el HTML al instante.

¡Y así es como Frontend y Backend bailan juntos para darnos una aplicación completa!
