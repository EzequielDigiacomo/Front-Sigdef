# CU — Tutores y atletas menores

## CU-T01 — Federación registra tutor y lo vincula a menores de un club

**Actor:** Admin Federación  
**Precondición:** Club con al menos un atleta menor.  
**Flujo:**

1. Admin abre Tutores → Nuevo.
2. Carga datos del tutor.
3. Elige club → sistema lista menores del club.
4. Selecciona uno o más menores + parentesco.
5. Guarda.

**Postcondición:** Existe tutor; existen filas `AtletaTutor` con `ParticipanteId`/`IdTutor`.  
**Alternativa:** Sin menores en el club → mensaje vacío, se puede guardar tutor sin vínculos.

## CU-T02 — Club ve tutores asignados por Federación

**Actor:** Club  
**Flujo:** Abrir Mis Tutores → aparecen tutores vinculados a atletas del club aunque el alta haya sido federativo.  
**Postcondición:** Lista coherente con `AtletaTutor` + atletas del `idClub`.

## CU-T03 — Indicador de tutor en grilla de atletas

**Actor:** Federación o Club  
**Flujo:** Abrir listado de atletas.  
**Resultado:**

- Menor con vínculo → ✅  
- Menor sin vínculo → ❌  
- Mayor → —

**Regla:** Fecha inválida no cuenta como edad; si no hay fecha, se puede inferir menor por categoría infantil.

## CU-T04 — Club asigna tutor a un menor

**Actor:** Club  
**Flujo:** Desde atleta o tutores, asignar tutor existente o crear uno; POST a `AtletaTutor` con `ParticipanteId`.  
**Error evitado:** Enviar `idAtleta` (campo incorrecto) deja el vínculo sin efecto.
