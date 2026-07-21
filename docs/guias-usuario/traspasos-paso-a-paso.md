# Traspasos de atletas — Guía paso a paso (SIGDEF)

Workflow formal para mover un atleta de un club a otro dentro de la misma federación.

## Quién interviene

| Rol | Qué hace |
|-----|----------|
| **Club destino** | Inicia la solicitud (solo durante un periodo habilitado) |
| **Federación** | Verifica deuda del atleta; habilita o rechaza |
| **Club origen** | Acepta o rechaza la salida (solo tras habilitación federativa) |

## Antes de empezar

1. La federación debe crear un **periodo de traspaso** con fecha inicio y fin (`Traspasos → Periodos`).
2. Fuera de ese rango no se pueden crear solicitudes nuevas.
3. El traspaso instantáneo desde la ficha del club en federación está deshabilitado; use siempre este módulo.

---

## Paso 1 — Club destino: solicitar traspaso

1. Ir a **Traspasos → Solicitar** (`/club/traspasos/solicitar`).
2. Verificar que aparezca el periodo activo.
3. Buscar al atleta por nombre o documento (debe pertenecer a **otro club** de la misma federación).
4. Seleccionar al atleta, opcionalmente indicar motivo, y **Enviar solicitud**.

**Resultado:** la solicitud queda en *Pendiente verificación federación*. La federación recibe un **mensaje automático**.

---

## Paso 2 — Federación: verificar deuda y habilitar

1. Ir a **Traspasos** (`/dashboard/traspasos`), filtro *Pendientes verificación*.
2. Abrir el detalle de la solicitud.
3. Revisar el **checklist de validaciones** (deuda del atleta, clubes, inscripciones impagas).
4. Si la cuenta está en regla: **Habilitar traspaso** → pasa a *Pendiente club origen*.
5. Si hay deuda bloqueante: **Rechazar** (o regularizar la deuda del atleta y volver a evaluar una nueva solicitud).

**Notificaciones:** al habilitar, el club origen recibe aviso por Mensajes.

---

## Paso 3 — Club origen: aceptar o rechazar

1. Ir a **Traspasos → Salientes** (`/club/traspasos/salientes`).
2. Solo verá solicitudes **ya habilitadas** por la federación.
3. **Aceptar** → el traspaso se **ejecuta** de inmediato (cambio de club).
4. **Rechazar** → indicar motivo; la solicitud finaliza como *Rechazado origen*.

---

## Paso 4 — Seguimiento (club destino)

En **Traspasos → Entrantes** (`/club/traspasos/entrantes`) el club destino ve el historial y estados.

- Puede **cancelar** mientras esté *Pendiente verificación* o *Pendiente club origen*.
- Estados finales: *Aprobado*, *Rechazado origen*, *Rechazado federación*, *Cancelado*.

---

## Mensajes automáticos

| Evento | Destinatarios |
|--------|---------------|
| Nueva solicitud | Admins federación + club destino |
| Federación habilita | Club origen + club destino |
| Federación rechaza (deuda) | Club destino |
| Origen acepta (ejecutado) | Club destino + admins federación |
| Origen rechaza | Club destino + admins federación |
| Cancelación | Club origen + admins federación |

---

## Export e historial (federación)

En la bandeja de traspasos: **Exportar CSV** e **Historial de auditoría** (ver changelog Fase 4).

---

## Preguntas frecuentes

**¿El club origen ve la solicitud apenas la crean?**  
No. Primero la federación debe verificar la deuda y habilitar el traspaso.

**¿Quién ejecuta el cambio de club?**  
Al **aceptar** el club origen, si la federación ya habilitó la solicitud.

**¿Puedo cambiar el club editando la ficha del atleta?**  
No desde rol Club. Use el módulo de traspasos.

---

## Enlaces

- [Flujo completo (estados, API, validaciones)](../casos-de-uso/traspasos-atletas-flujo.md)
- [Mensajes internos](./mensajes.md)
- Changelog flujo: [2026-07-traspasos-flujo-federacion-primero.md](../cambios/2026-07-traspasos-flujo-federacion-primero.md)
- Plan técnico: [PLAN_TRASPASOS_ATLETAS.md](../referencia/PLAN_TRASPASOS_ATLETAS.md)
