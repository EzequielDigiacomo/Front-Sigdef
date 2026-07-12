# Caso de uso — Mensajes internos SIGDEF

## Actor

Admin de federación, Club, o SuperAdmin (según ruta).

## Flujo principal (1:1)

1. Usuario abre **Mensajes**.
2. Redacta a un destinatario permitido por rol.
3. Destinatario ve el hilo y el badge de no leídos.
4. Al abrir, se marca leído; puede responder.

## Flujo alternativo (masivo)

1. Admin o Super elige **Comunicado masivo**.
2. Selecciona N destinatarios y envía.
3. Cada destinatario recibe su hilo privado.
4. Remitente consulta tab **Comunicados enviados** (lecturas / respuestas).

## Reglas

- Origen del mensaje = producto del front (`sigdef`).
- Club no crea campañas.
- No hay chat grupal: masivo = N hilos 1:1 ligados a una campaña.

## Criterios

Ver [../criterios/mensajeria-aislamiento.md](../criterios/mensajeria-aislamiento.md).
