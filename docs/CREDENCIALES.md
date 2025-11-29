# 🔑 Credenciales de Acceso - SIGDEF

## Credenciales Temporales para Desarrollo

### 👨‍💼 Federación (Administrador)
```
Usuario: admin
Contraseña: admin
Rol: FEDERACION
Acceso: Dashboard completo de administración
```

---

### 🏛️ Clubes

#### Club 1: Club Deportivo Central
```
Usuario: central
Contraseña: central
Club ID: 1
Nombre: Club Deportivo Central
Teléfono: 351-6047890
```

#### Club 2: Club Argentino
```
Usuario: argentino
Contraseña: argentino
Club ID: 2
Nombre: Club Argentino
Teléfono: 3412290901
```

#### Club 3: Reserva Nautica de Baigorria
```
Usuario: nautica
Contraseña: nautica
Club ID: 3
Nombre: Reserva Nautica de Baigorria
Teléfono: 3414710930
```

---

## Cómo Usar

### 1. Iniciar Sesión como Federación
1. Ve a la página de login
2. Ingresa: `admin` / `admin`
3. Accederás al dashboard de federación con acceso completo

### 2. Iniciar Sesión como Club
1. Ve a la página de login
2. Elige uno de los clubes:
   - `central` / `central`
   - `argentino` / `argentino`
   - `nautica` / `nautica`
3. Accederás al dashboard del club correspondiente

---

## Qué Verás en Cada Club

### Club Deportivo Central (ID: 1)
- Verás solo los atletas con `clubId = 1` o `idClub = 1`
- Verás solo los eventos con `clubId = 1` o `idClub = 1`
- Podrás crear atletas y eventos para este club

### Club Argentino (ID: 2)
- Verás solo los atletas con `clubId = 2` o `idClub = 2`
- Verás solo los eventos con `clubId = 2` o `idClub = 2`
- Podrás crear atletas y eventos para este club

### Reserva Nautica de Baigorria (ID: 3)
- Verás solo los atletas con `clubId = 3` o `idClub = 3`
- Verás solo los eventos con `clubId = 3` o `idClub = 3`
- Podrás crear atletas y eventos para este club

---

## Debugging

Si ves datos incorrectos o no ves datos:

1. **Abre la consola del navegador** (F12)
2. Ve a la pestaña "Console"
3. Busca los logs que empiezan con 🔍, 📊, ✅
4. Verifica:
   - ¿Qué `clubId` tiene el usuario logueado?
   - ¿Cuántos atletas/eventos hay en total?
   - ¿Qué `clubId` o `idClub` tienen los atletas/eventos?
   - ¿Coinciden los IDs?

### Ejemplo de logs esperados:
```
🔍 Obteniendo atletas...
👤 Usuario actual: {username: "central", role: "CLUB", clubId: 1, ...}
🏛️ Club ID del usuario: 1
📊 Total de atletas en la DB: 10
📋 Todos los atletas: [...]
Comparando: atleta.clubId/idClub (1) === user.clubId (1)
Comparando: atleta.clubId/idClub (2) === user.clubId (1)
✅ Atletas del club filtrados: 2
📋 Atletas del club: [{...}, {...}]
```

---

## Notas Importantes

### ⚠️ Estas son credenciales TEMPORALES
- Solo para desarrollo y pruebas
- No usar en producción
- Las contraseñas son iguales al usuario para facilitar las pruebas

### 🔒 Para Producción
Deberías implementar:
1. Endpoint de login real en el backend
2. Contraseñas hasheadas con bcrypt
3. JWT tokens
4. Refresh tokens
5. Validación de permisos en el backend

---

## Cambiar de Club

Para probar diferentes clubes:
1. Haz logout (botón en la navbar)
2. Vuelve al login
3. Ingresa las credenciales de otro club
4. Verás los datos de ese club

---

**Última actualización:** 25 de Noviembre, 2025
