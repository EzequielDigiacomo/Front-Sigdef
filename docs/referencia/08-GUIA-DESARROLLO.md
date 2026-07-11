# 👨‍💻 Guía para Desarrolladores (SIGDEF)

Esta guía detalla el flujo de trabajo para configurar, desarrollar y desplegar el sistema SIGDEF.

---

## 🛠 Requisitos Previos

Asegúrate de tener instalados los siguientes componentes:
- **Node.js** (v18+)
- **.NET SDK 8.0**
- **PostgreSQL 15+**
- **Docker** (opcional, para base de datos local)

---

## 🏗️ Configuración del Entorno

### 1. Backend (.NET 8)
Navega a la carpeta del servidor y configura el archivo `appsettings.json` o variables de entorno:
- `ConnectionStrings:DefaultConnection`: URL de PostgreSQL.
- `Jwt:Key`: Clave secreta para firmar tokens.
- `CloudinarySettings`: Credenciales de API de Cloudinary.
- `MercadoPagoSettings`: Access Token de prueba/producción.

Ejecutar migraciones iniciales:
```bash
dotnet ef database update --project SIGDeF.AccesoDatos
```

Iniciar servidor:
```bash
dotnet run --project SIGDEF.Api
```

### 2. Frontend (React)
Navega a la carpeta del frontend y crea un archivo `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
```

Instalar dependencias e iniciar:
```bash
npm install
npm run dev
```

---

## 🚀 Flujo de Despliegue (Render)

### Backend
1. Sincronizar con el repositorio de GitHub.
2. Configurar **Web Service** en Render.
3. Definir variable de entorno `ConnectionStrings` con la URL de la base de datos externa.
4. Render ejecutará `dotnet publish` automáticamente.

### Frontend
1. Configurar **Static Site** en Render.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Configurar redirección de rutas (`/* -> index.html`) para evitar errores 404 en React Router.

---

## 📑 Glosario Técnico

- **SPA**: Single Page Application (React).
- **JWT**: JSON Web Token, usado para autenticación sin estado.
- **EF Core**: Entity Framework Core, el ORM para mapeo de objetos a base de datos.
- **DTO**: Data Transfer Object, objetos simples para enviar datos entre API y Cliente.
- **Webhook**: Endpoint que recibe notificaciones de servicios externos (MercadoPago).

---

**¡Gracias por contribuir a SIGDEF!** Si encuentras errores, abre un issue o envía un pull request.
