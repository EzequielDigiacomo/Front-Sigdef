# Criterios de aceptación — FrontSigdef

**Fecha de referencia:** 2026-07-11

## A. Formularios compactos

- [ ] Clubes, Atletas, Entrenadores, Delegados y Tutores (Fed y Club) usan layout compacto coherente.
- [ ] Labels legibles; no se perdieron campos al compactar (especialmente Tutores).

## B. Tutores

- [ ] Ruta **Nuevo Tutor** Federación abre el formulario (`/tutores/nuevo`).
- [ ] Edición precarga datos desde `participante`.
- [ ] Vínculos usan `ParticipanteId` / `IdTutor` en listados y POST.
- [ ] Club ve tutores asignados desde Federación.
- [ ] Selector de menores filtra solo &lt; 18; mensajes si la lista está vacía.
- [ ] Columna Tutor en atletas Fed y Club: ✅ / ❌ / — correctos (no todo “—”).

## C. Delegados de club

- [ ] No se listan cuentas de panel (`club1fec`, `club1fec2`, …) como delegados.
- [ ] Al fallar un borrado se muestra modal de error (no silencio).
- [ ] No se puede borrar la propia sesión sin aviso.

## D. Gestión de Accesos

- [ ] No existe pestaña “Cambiar Contraseña” del formulario viejo.
- [ ] Ícono llave abre modal **Editar contraseña** (no reset nativo del browser).
- [ ] Request usa `idUsuario` y `PUT /Auth/usuarios/{id}/password`.
- [ ] Modal centrado, márgenes laterales iguales, contenido visible sin cortarse.
- [ ] Éxito/error con modales del sistema.

## E. UX modal genérico

- [ ] `Modal` se renderiza con portal a `body`.
- [ ] Overlay scrolleable; no queda el contenido arriba fuera de pantalla.
- [ ] Sin scroll horizontal innecesario en grilla de usuarios (contenedor ≥ contenido).

## Definition of Done (DoD)

1. Código en FrontSigdef guardado y coherente con esta lista.  
2. Documentación actualizada en `docs/`.  
3. Flujos críticos probados manualmente (login Admin + Club).  
4. Si el fix depende de API (ej. `FechaNacimiento` en atletas de club), el cambio está en SportTrack-Sigdef y documentado allí.
