# Relevamiento del Sistema - SIGDEF

## 1. Análisis de Repositorios

El ecosistema SIGDEF se divide en dos repositorios principales que conviven en el entorno de desarrollo:

### 1.1 Repositorio Backend (`SIGDEF2`)
Es una solución de Visual Studio (`SIGDEF.sln`) que contiene la lógica core.
- **Ubicación:** `c:\Users\EZEQU\source\repos\SIGDEF2\`
- **Proyectos Clave:**
  - `SIGDEF.Api`: Punto de entrada HTTP.
  - `SIGDEF.Entidades`: Definición de esquemas de datos.
  - `SIGDEF.Controlador`: Servicios de lógica de negocio e interfaces.

### 1.2 Repositorio Frontend (`FrontSigdef`)
Aplicación SPA moderna con capacidades móviles.
- **Ubicación:** `c:\Users\EZEQU\source\reposFront\FrontSigdef\`
- **Tecnología:** React + Vite.
- **Mobile:** Proyecto integrado de Capacitor con soporte de Android Studio.

## 2. Relevamiento de Base de Datos (Estructura Detectada)

A través del análisis de `SIGDeFContext` y las entidades, se identifican los siguientes dominios:

| Dominio | Entidades Relacionadas | Propósito |
|---------|-----------------------|-----------|
| **Identidad** | Persona, Usuario, Rol | Manejo de perfiles y seguridad |
| **Institucional** | Club, DelegadoClub | Estructura de federados |
| **Deportivo** | Atleta, Tutor, Entrenador | Gestión de participantes |
| **Competencia** | Evento, Prueba, Inscripcion | Operativa de regatas |
| **Financiero** | PagoTransaccion | Integración con pasarelas |
| **Documental** | Documentacion | Archivos multimedia y autorizaciones |

## 3. Integración de Servicios Externos

### 3.1 Cloudinary (Media Cloud)
Configurado mediante `CloudinarySettings` en `appsettings.json`.
- **Flujo:** El backend recibe el archivo → Sube a Cloudinary → Guarda la URL pública en la tabla `Documentacion`.
- **Soporte:** Imágenes de perfil, DNI (frente/dorso), Aptos Médicos.

### 3.2 Mercado Pago
Configurado en `MercadoPagoSettings`.
- **Método:** Preference API + Webhooks.
- **Estado:** Notificaciones automatizadas para actualizar `EstadoPago` en tiempo real.

## 4. Relevamiento Mobile (Android)

El sistema está configurado para ejecutarse como una aplicación nativa de Android:
- **Build Tool:** Gradle.
- **App ID:** `com.sigdef.app`.
- **Directorio Android:** `FrontSigdef/android/`.
- **Capacitor Plugins:** Se detectan configuraciones para Splash Screen y compatibilidad con Cordova plugins heredados.

## 5. Análisis de "Faltantes" y Deuda Técnica

Basado en la estructura de carpetas:
- Se observa una carpeta `Faltantes` en el repositorio backend, lo que sugiere módulos en planificación (posiblemente Rankings o Historiales detallados).
- La gestión de `Apto Medico` requiere una validación de fecha de vencimiento que se procesa en el frontend (`AtletasList.jsx`).

---
*Relevamiento realizado en Marzo 2026.*
