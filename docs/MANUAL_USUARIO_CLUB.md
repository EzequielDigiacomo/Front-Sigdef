# Manual de Usuario - Perfil Club

Este documento detalla las funcionalidades disponibles para los usuarios con perfil **Club** en el sistema SIGDEF.

## 1. Gestión de Atletas

En la sección **Mis Atletas**, puedes administrar el padrón de deportistas de tu club.

### Funcionalidades:
- **Listar Atletas**: Visualiza todos los atletas registrados bajo tu club.
- **Crear Atleta**:
    1. Haz clic en el botón **"Nuevo Atleta"**.
    2. Completa los datos personales (Nombre, Apellido, DNI, Fecha Nacimiento).
    3. Si el atleta es **menor de 18 años**, el sistema te pedirá obligatoriamente los datos de un **Tutor**.
        - Puedes buscar un tutor existente por DNI.
        - Si no existe, puedes crearlo en el mismo formulario.
    4. Completa los datos deportivos (Categoría, Becas, Apto Médico).
    5. Haz clic en **Guardar**.
- **Editar Atleta**: Modifica los datos de un atleta existente.
- **Ver Detalles**: Consulta la ficha completa del atleta.

## 2. Gestión de Tutores

En la sección **Mis Tutores**, puedes gestionar a los responsables de los atletas menores.

### Funcionalidades:
- **Listar Tutores**: Visualiza todos los tutores vinculados a tu club.
- **Crear Tutor**:
    1. Haz clic en **"Nuevo Tutor"**.
    2. Ingresa los datos personales y de contacto.
    3. **Asignar Atleta (Opcional)**: Puedes vincular un atleta existente al tutor directamente desde este formulario. Busca al atleta por nombre y selecciónalo.
    4. Haz clic en **Guardar**.
- **Vincular Atleta a Tutor**:
    - Desde el formulario de **Atleta** (si es menor).
    - Desde el formulario de **Tutor** (usando la sección "Asignar Atleta").

## 3. Gestión de Eventos

### Mis Eventos
Aquí gestionas los eventos organizados por tu propio club.

- **Crear Evento**:
    1. Haz clic en **"Nuevo Evento"**.
    2. Completa: Nombre, Fechas (Inicio y Fin), Ubicación.
    3. El evento se creará con estado "PROGRAMADO" por defecto.
- **Editar/Eliminar**: Puedes modificar o cancelar tus eventos.

### Eventos Disponibles
Aquí visualizas los eventos organizados por **otros clubes** o la **Federación**.

- **Visualización**: Tabla con detalles del evento (Organizador, Fecha, Ubicación, Cupos).
- **Inscripción**:
    1. Busca el evento en el que deseas participar.
    2. Haz clic en el botón **"Inscribir"**.
    3. Serás redirigido al formulario de inscripción donde podrás seleccionar a tus atletas.
    4. El sistema validará los cupos disponibles.

## 4. Dashboard
El panel principal te ofrece un resumen rápido:
- Cantidad de Atletas.
- Próximos Eventos.
- Estado de Deudas (si aplica).
