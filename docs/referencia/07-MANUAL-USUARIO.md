# 📖 Manual de Usuario (SIGDEF)

Este manual guía a los usuarios de la Federación y los Clubes a través de las funcionalidades principales del sistema SIGDEF.

---

## 🏢 Perfil: FEDERACIÓN (Administrador)

### 1. Tablero de Control (Dashboard)
Desde el inicio, verás estadísticas globales del sistema:
- Cantidad total de atletas, clubes y entrenadores federados.
- Últimos atletas registrados.
- Estado general de pagos y deudas.

### 2. Gestión de Clubes
- **Visualización**: Podrás ver una lista completa de todos los clubes del país.
- **Registro**: Botón `Nuevo Club` para dar de alta instituciones.
- **Detalles**: Al hacer clic en un club, verás su información, atletas asociados y estado de su matrícula.

### 3. Supervisión de Atletas
- Acceso a la base de datos central de deportistas.
- Filtros por club, documento, sexo y categoría.
- Posibilidad de editar perfiles y ver la documentación cargada (Aptos Médicos).

### 4. Administración de Eventos
- Creación de torneos nacionales y provinciales.
- Definición de pruebas específicas para cada evento.
- Visualización de inscripciones en tiempo real.

### 5. Recuperación de Acceso y Seguridad
- **Reseteo de Contraseñas**: Si un usuario (Club o Atleta) olvida su clave, el administrador puede generar una nueva desde el módulo de **Gestión de Usuarios**.
- Al presionar **Resetear**, se mostrará una clave temporal alfanumérica que el administrador debe copiar y entregar al usuario.
- El usuario podrá ingresar con esa clave y luego cambiarla desde su propio perfil.

---

## 🏟️ Perfil: CLUB (Gestor Deportivo)

### 1. Panel del Club
Resumen específico de tu institución:
- Cantidad de atletas activos.
- Próximos eventos donde el club tiene inscritos.
- Alertas de vencimiento de documentos.

### 2. Mis Atletas
- Botón `Nuevo Atleta`: Registro de tus deportistas (incluyendo gestión de tutores si es menor).
- Edición de perfiles y carga de documentación (fotos, certificados).
- Seguimiento del estado de pago federal.

### 3. Inscripción a Torneos
- **Eventos Disponibles**: Visualización del calendario de la Federación.
- **Inscripción**: Selección de atletas aptos para las pruebas publicadas.
- **Confirmación**: Generación de planilla de inscripción.

---

## ❓ Preguntas Frecuentes

### ¿Cómo sé si mi atleta puede competir?
El sistema marcará al atleta como **Apto** si tiene su certificado médico cargado y su matrícula al día (Estado de Pago: Abonado). La Federación es la encargada de cambiar este estado manualmente tras recibir el pago.

### ¿Cómo registro un pago?
La Federación debe ir a la lista de Atletas (o Clubes), seleccionar `Editar` y cambiar el campo **Estado de Pago** (o **Estado de Matrícula**) al valor correspondiente (Abonado/Activa).

### ¿Puedo eliminar un club?
Solo el rol de **Federación** puede eliminar clubes, siempre y cuando estos no tengan atletas o pagos asociados para mantener la integridad histórica.

---

**Próxima lectura recomendada:** [08-GUIA-DESARROLLO.md](./08-GUIA-DESARROLLO.md)
