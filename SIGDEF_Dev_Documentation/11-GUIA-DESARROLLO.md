# Guía de Desarrollo - SIGDEF

## 1. Configuración del Entorno local

### 1.1 Prerrequisitos
- **Runtime**: Node.js (v18+) y .NET 8.0 SDK.
- **Base de Datos**: PostgreSQL 15+.
- **IDE Recomendado**: VS Code o Visual Studio 2022.
- **Mobile**: Android Studio (Flamingo o superior) para el despliegue nativo.

### 1.2 Clonación y Setup
```bash
# Frontend
cd FrontSigdef
npm install

# Backend
cd SIGDEF2
dotnet restore
```

## 2. Ejecución en Modo Desarrollo

### 2.1 Backend API
Ejecutar desde Visual Studio o mediante CLI:
```bash
dotnet run --project SIGDEF.Api
# URL Base: https://localhost:7112/
```

### 2.2 Frontend Web
```bash
npm run dev
# URL Base: http://localhost:5173/
```

## 3. Flujo de Trabajo Mobile (Android Studio)

SIGDEF utiliza **Capacitor** para convertir la SPA en una App nativa.

### 3.1 Sincronización
Cada vez que realices cambios en el código de React que quieras ver en el celular:
```bash
# 1. Generar build de producción del web
npm run build 

# 2. Sincronizar con el proyecto Android
npx cap sync
```

### 3.2 Debugging en Android Studio
1. Abre Android Studio.
2. Abre la carpeta `FrontSigdef/android`.
3. Conecta un dispositivo físico o inicia un Emulador.
4. Presiona **Run** (Triángulo verde).
5. Usa el **Logcat** para ver los `console.log` del frontend filtrando por "Capacitor/Console".

## 4. Estándares de Código

### 4.1 Frontend (React)
- **Hooks**: Usar siempre Functional Components.
- **Naming**: PascalCase para componentes, camelCase para funciones y variables.
- **Estilos**: Mantener el uso de variables CSS globales definidas en `index.css` para consistencia visual.

### 4.2 Backend (.NET)
- **Async/Await**: Todas las llamadas a DB o servicios externos deben ser asíncronas.
- **Inyección de Dependencias**: No instanciar servicios manualmente; usarlos a través del constructor.
- **DTOs**: No exponer entidades de base de datos directamente en los controladores.

## 5. Comandos Útiles

| Comando | Propósito |
|---------|-----------|
| `npx cap open android` | Abre el proyecto directamente en Android Studio |
| `dotnet ef database update` | Aplica migraciones a la base de datos local |
| `npm run lint` | Ejecuta el check de errores de sintaxis |

---
*Manual para desarrolladores internos de SIGDEF.*
