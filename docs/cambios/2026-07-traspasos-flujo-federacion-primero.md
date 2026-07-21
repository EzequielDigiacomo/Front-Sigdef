# Traspasos — Flujo federación primero (documentación)

**Fecha:** 2026-07-21  
**Alcance:** `SportTrack-Sigdef` + `Front-Sigdef`

## Cambio de flujo

### Antes
```text
Club destino solicita → Club origen acepta → Federación aprueba y ejecuta
```

### Ahora (vigente)
```text
Club destino solicita → Federación verifica deuda → Club origen acepta/rechaza → Ejecución al aceptar
```

Documentación canónica del flujo: [traspasos-atletas-flujo.md](../casos-de-uso/traspasos-atletas-flujo.md)

## Estados (sin cambio de enum)

| Estado | Momento |
|--------|---------|
| `PendienteFederacion` | Inicial: espera verificación de deuda |
| `PendienteOrigen` | Federación habilitó: club origen decide |
| `Aprobado` | Origen aceptó: traspaso ejecutado |
| `RechazadoFederacion` | Deuda/validaciones no superadas |
| `RechazadoOrigen` | Club origen no autoriza la salida |

## Backend

- `CrearSolicitudAsync` → estado inicial `PendienteFederacion`
- `AprobarFederacionAsync` (`POST .../aprobar`) → valida deuda, pasa a `PendienteOrigen` (**no ejecuta**)
- `AceptarOrigenAsync` → exige `FechaRespuestaFederacion` y ejecuta `EjecutarTraspasoAsync`
- Notificaciones: fed recibe solicitud nueva; origen solo tras habilitación
- `HealLegacyPendienteOrigenAsync`: al listar, corrige solicitudes del flujo viejo (`PendienteOrigen` sin fecha de respuesta federación → `PendienteFederacion`)

## Frontend

- Labels y filtros: *Pendientes verificación* / *Pendientes club origen*
- `TraspasoDetalle`: **Habilitar traspaso** (antes “Aprobar”)
- Club salientes: solo `PendienteOrigen`
- Guía usuario actualizada: [traspasos-paso-a-paso.md](../guias-usuario/traspasos-paso-a-paso.md)

## Nota operativa

Si una solicitud aparece en club origen con **Verificación federación = —**, fue creada con el flujo anterior o la API aún no tenía el deploy. Tras el heal + redeploy, debe volver a *Pendientes verificación*.
