# Plan de Implementación: Sistema de Comunicación Interna (Notificaciones)

Este documento detalla la guía técnica para implementar un sistema de mensajería interna entre la Federación y los Clubes dentro de SIGDEF. El objetivo es eliminar la dependencia de emails externos para comunicaciones operativas y centralizar la información dentro de la plataforma.

## 1. Visión General

El sistema funcionará como una bandeja de entrada simplificada dentro de la aplicación.
- **Federación**: Puede enviar mensajes globales a todos los clubes o mensajes privados a un club específico (ej. "Rechazo de documentación").
- **Clubes**: Reciben notificaciones y pueden contestar o enviar consultas a la Federación.
- **Alertas**: El sistema podrá generar notificaciones automáticas (ej. "Vencimiento de Apto Médico").

---

## 2. Requerimientos de Backend (.NET)

Para que el Frontend pueda consumir este sistema, el Backend debe proveer la estructura de datos y los endpoints necesarios.

### A. Base de Datos (Nuevas Entidades)

Se requiere una nueva tabla, por ejemplo: `Mensajes` o `Notificaciones`.

**Propuesta de Campos:**
- `Id` (PK, int)
- `FechaCreacion` (DateTime, Default: Now)
- `Asunto` (string, Max 100)
- `Cuerpo` (string, Max 2000 - Puede soportar HTML básico o texto plano)
- `Leido` (bool, Default: false)
- `Tipo` (Enum/int): 
    - 0: Informativo (General)
    - 1: Alerta (Sistema)
    - 2: Documentación (Requerimiento de acción)
- **Remitente:**
    - `RemitenteRol` (string: "Federacion", "Club")
    - `RemitenteId` (int? - Null si es Federación, IdClub si es un club)
- **Destinatario:**
    - `DestinatarioRol` (string: "Federacion", "Club", "Todos")
    - `DestinatarioId` (int? - Null si es para la Federación o para "Todos", IdClub específico si es para un club)

### B. DTOs Sugeridos

**`NotificacionDto`** (Para listar):
```csharp
public class NotificacionDto {
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public string Asunto { get; set; }
    public string CuerpoResumen { get; set; } // Primeros 50 chars
    public bool Leido { get; set; }
    public string Tipo { get; set; }
    public string RemitenteNombre { get; set; } // "Federación" o Nombre del Club
}
```

**`CreateNotificacionDto`** (Para enviar):
```csharp
public class CreateNotificacionDto {
    public string Asunto { get; set; }
    public string Cuerpo { get; set; }
    public int? DestinatarioClubId { get; set; } // Null = Federación (si envía Club) o Todos (si envía Fed)
    public int Tipo { get; set; }
}
```

### C. Endpoints API (`NotificacionesController`)

El backend debe manejar la seguridad para que un Club solo vea sus propios mensajes.

1.  **`GET /api/Notificaciones`**
    *   *Filtros:* Devolverá solo las notificaciones donde el usuario actual sea el destinatario (o sean mensajes globales).
    *   *Orden:* Descendente por fecha.
2.  **`GET /api/Notificaciones/no-leidas`**
    *   Retorna un entero (`int`). Usado para el contador "globito" rojo en la barra de navegación.
3.  **`POST /api/Notificaciones`**
    *   Crea un mensaje nuevo.
    *   Backend valida quien es el `CurrentUser` y setea el Remitente automáticamente.
4.  **`PUT /api/Notificaciones/{id}/leer`**
    *   Marca el mensaje como `Leido = true`.
5.  **`DELETE /api/Notificaciones/{id}`** (Opcional)
    *   Soft delete o archivado.

---

## 3. Implementación en Frontend (React)

Una vez listo el backend, el trabajo en el frontend se divide en componentes visuales y lógica de estado.

### A. Servicio (`src/services/notificacionesService.js`)
Crear un archivo dedicado para consumir los nuevos endpoints, separado de la lógica principal pero usando la misma instancia de `api`.

### B. Componentes UI

1.  **Indicador en Navbar (`Badge`)**
    *   En `src/components/layout/Navbar.jsx`.
    *   Agregar un icono de campana (🔔).
    *   Hacer un `polling` (consultar cada 60seg) o consultar al montar la app al endpoint `/no-leidas` para mostrar el número rojo si hay novedades.

2.  **Panel de Notificaciones (`src/pages/Common/Notificaciones/NotificacionesList.jsx`)**
    *   Una vista nueva accesible para ambos roles.
    *   Una tabla o lista de tarjetas con los mensajes.
    *   Diferenciación visual entre mensajes leídos y no leídos (ej. negrita o fondo gris).
    *   Filtros: "Todo", "Sin leer", "Enviados".

3.  **Modal/Vista de Detalle**
    *   Al hacer clic en un mensaje, abrir un Modal o expandir la fila para ver el `Cuerpo` completo.
    *   **Acción automática**: Al abrir, llamar a `PUT .../leer` para actualizar el estado y bajar el contador de no leídos.

4.  **Formulario de Nuevo Mensaje**
    *   Si el usuario es **Federación**: Un dropdown para elegir "Todos los Clubes" o buscar un Club específico.
    *   Si el usuario es **Club**: El destinatario es fijo ("Federación").
    *   Campos: Asunto, Cuerpo.

### C. Flujo de Usuario Propuesto

1.  El usuario inicia sesión.
2.  En el Navbar ve una campana con un `(1)` rojo.
3.  Hace clic y va a la pantalla de "Mensajes".
4.  Ve que la Federación le pide rectificar un DNI.
5.  Abre el mensaje (se marca como leído).
6.  Va al módulo de Atletas, corrige el dato.
7.  Vuelve a Mensajes, crea uno nuevo para Federación: "DNI corregido".
