# Casos de Uso - SIGDEF

## 1. Actor: Administrador de Federación

### CU-01: Gestión Global de Eventos
- **Descripción**: Crear un evento a nivel nacional e invitar a los clubes.
- **Flujo**: Define fecha/lugar → Define pruebas → Publica → Monitorea inscripciones.

### CU-02: Auditoría Documental
- **Descripción**: Revisar y validar los DNI y Aptos Médicos subidos por los clubes.
- **Flujo**: Accede a bandeja de validación → Visualiza documento → Cambia estado a "Aprobado".

## 2. Actor: Usuario de Club (Delegado)

### CU-03: Inscripción masiva de Atletas
- **Descripción**: Seleccionar un evento y anotar a los palistas del club.
- **Flujo**: Selecciona Evento → Filtra atletas aptos → Asocia a pruebas → Confirma inscripciones.

### CU-04: Gestión de Delegados
- **Descripción**: Asignar permisos a otras personas de su institución.

## 3. Actor: Atleta (App Móvil)

### CU-05: Consulta de Cronograma
- **Descripción**: Ver a qué hora larga su regata y en qué carril (andarivel).
- **Flujo**: Abre App → Busca Evento → Visualiza sus pruebas asignadas.

### CU-06: Acreditación Digital
- **Descripción**: Presentar el QR en la mesa de control de la regata.

## 4. Diagrama de Casos de Uso (Mermaid)

```mermaid
useCaseDiagram
    actor "Federación" as F
    actor "Club" as C
    actor "Atleta" as A

    F --> (Gestionar Clubes)
    F --> (Crear Eventos Globales)
    F --> (Validar Documentación)
    
    C --> (Gestionar Atletas del Club)
    C --> (Inscribir en Eventos)
    C --> (Pagar Inscripciones)
    
    A --> (Ver Cronograma)
    A --> (Mostrar QR Credencial)
```

---
*Mapa de interacciones del sistema SIGDEF.*
