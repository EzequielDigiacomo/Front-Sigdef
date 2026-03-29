# 📋 Casos de Uso y Procesos de Negocio (SIGDEF)

Esta documentación describe los flujos funcionales clave del sistema SIGDEF, detallando la interacción entre los diferentes roles (Federación y Club).

---

## 🚀 Procesos Críticos

### 1. Registro Integral de Atleta (Full Registration)
**Actor**: Club o Federación.
**Escenario**: Un nuevo deportista se une al club y debe ser registrado en el sistema.

- **Flujo Principal**:
  1. El usuario completa los datos personales (`Persona`).
  2. Si el atleta es **menor de edad**, el sistema exige los datos de un `Tutor`.
  3. Se asocia al atleta con el `idClub` correspondiente.
  4. Se asigna una **Categoría** según la edad calculada automáticamente.
- **Resultado Técnico**: Petición `POST /api/atleta/full` que crea registros en `Persona`, `Atleta`, `Tutor` (opcional) y `AtletaTutor` de forma atómica.

### 2. Inscripción a Eventos Deportivos
**Actor**: Club.
**Escenario**: Un club inscribe a sus atletas en un torneo organizado por la Federación u otro club.

- **Flujo Principal**:
  1. El Club consulta los eventos disponibles.
  2. Selecciona un evento y visualiza las pruebas asociadas.
  3. Selecciona a los atletas aptos para la competencia.
  4. El sistema valida que el atleta tenga el **Apto Médico** vigente.
  5. Se confirma la inscripción.
- **Resultado Técnico**: Creación de registros en la tabla `Inscripcion` vinculando `Atleta` con `EventoPrueba`.

### 3. Gestión Manual de Matrículas y Pagos
**Actor**: Federación.
**Escenario**: Registro manual de la situación financiera del deportista o la institución.

- **Flujo Principal**:
  1. La Federación identifica los atletas o clubes con pagos pendientes.
  2. Tras recibir el comprobante de pago físico o transferencia, el administrador accede al formulario de edición.
  3. Cambia el campo **Estado de Pago** (en Atletas) o **Estado de Matrícula** (en Clubes) a "Abonado" o "Activa".
  4. El sistema guarda el cambio y habilita al atleta/club para participar en el sistema.
- **Resultado Técnico**: Petición `PUT` a los endpoints de Atleta o Club actualizando el estado correspondiente.

---

## 🛠 Casos de Uso Técnicos

### CU-01: Gestión de Documentación en la Nube
- **Propósito**: Permitir que los clubes carguen fotos y certificados médicos sin saturar el servidor principal.
- **Acción**: Subida a **Cloudinary** y almacenamiento de URLs.

### CU-02: Control de Acceso por Roles (RBAC)
- **Propósito**: Garantizar que los clubes solo vean información de sus propios atletas.
- **Acción**: Middleware de autenticación y lógica de filtrado en la capa de servicios del backend.

### CU-03: Auditoría de Vencimientos
- **Propósito**: Identificar automáticamente instituciones con matrículas vencidas.
- **Acción**: Tarea programada o lógica de consulta que compara `FechaAptoMedico` con la fecha actual.

---

**Próxima lectura recomendada:** [07-MANUAL-USUARIO.md](./07-MANUAL-USUARIO.md)
