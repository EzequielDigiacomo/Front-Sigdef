# Manual de Usuario - Perfil Federación

Este documento detalla las funcionalidades disponibles para los usuarios con perfil **Federación** (Administrador) en el sistema SIGDEF.

## 1. Gestión de Eventos

La Federación tiene control total sobre el calendario de eventos.

### Funcionalidades:
- **Listado Global**: Visualiza todos los eventos del sistema, tanto los creados por la Federación como por los Clubes.
- **Crear Evento Oficial**:
    1. Accede a **Gestión de Eventos**.
    2. Haz clic en **"Nuevo Evento"**.
    3. Define los detalles del torneo o competencia.
    4. Estos eventos serán visibles para **todos los clubes** en su sección de "Eventos Disponibles".
- **Supervisión**:
    - Puedes editar o eliminar cualquier evento si es necesario (por ejemplo, por errores de carga o cancelaciones).
    - Controla el estado de los eventos (Programado, Finalizado, Cancelado).

## 2. Gestión de Clubes

(Funcionalidad sujeta a implementación final)
- **Alta de Clubes**: Registrar nuevas instituciones en el sistema.
- **Gestión de Usuarios**: Crear credenciales para los administradores de cada club.

## 3. Gestión de Atletas y Categorías

- **Padrón General**: Acceso a la lista completa de atletas federados.
- **Validaciones**: (Futuro) Validar aptos médicos o seguros.

## 4. Dashboard Administrativo

El panel principal ofrece métricas globales del sistema:
- **Total de Atletas Federados**.
- **Clubes Activos**.
- **Eventos del Mes**.
- **Estado de Pagos/Deudas** (Resumen general).

## 5. Gestión de Tutores

El sistema permite la administración completa de los tutores legales de los atletas menores de edad.

### Funcionalidades:
- **Listado de Tutores**: Visualiza todos los tutores registrados, sus datos de contacto y los atletas que representan.
- **Vincular Atletas**: 
    - Puedes vincular múltiples atletas a un mismo tutor.
    - **Herencia de Datos**: Al vincular un atleta menor que no tenga datos de contacto (email/teléfono), estos se copiarán automáticamente del tutor.
- **Agregar Tutor Existente**: Posibilidad de buscar personas ya registradas en el sistema (mayores de edad) y promoverlas a rol de Tutor, seleccionando el parentesco.
- **Gestión Documental**: Subida y visualización de documentos asociados al tutor (DNI, Poder, etc.).
- **Eliminación Segura**: El sistema verifica y limpia automáticamente las vinculaciones con atletas antes de eliminar un tutor, evitando errores de consistencia en la base de datos.

