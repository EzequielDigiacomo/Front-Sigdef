# SIGDEF — Control de Acceso por Plan SaaS

> **Última actualización:** julio 2026

---

## ¿Qué es el Plan Guard?

SIGDEF verifica que el usuario logueado tenga un plan SaaS que incluya acceso al sistema SIGDEF antes de renderizar cualquier pantalla de la aplicación.

Los planes que incluyen acceso a SIGDEF son:

| Plan       | Acceso SIGDEF |
|------------|:-------------:|
| SIGDEF (S) | ✅            |
| SIGDEF (M) | ✅            |
| SIGDEF (L) | ✅            |
| Pack Dúo (S/M/L) | ✅     |
| SportTrack (S/M/L) | ❌   |

---

## Flujo de verificación

```
Usuario abre SIGDEF
    │
    ▼
AuthContext.useEffect()
    └─ Restaura sesión de localStorage (token + plan)
           │
           ▼
PrivateRoute (App.jsx)
    ├─ ¿Autenticado? No → /login
    ├─ ¿Rol correcto? No → redirect
    └─ ¿role !== SUPERADMIN?
           └─ PlanGuard (requiereSigdef)
                  ├─ user.plan === null → pantalla "sin plan"
                  ├─ plan.accesoSigdef === false → pantalla "plan no compatible"
                  └─ plan.accesoSigdef === true → renderiza la app ✅
```

---

## Archivos clave

### `src/context/AuthContext.jsx`

Al hacer login, el objeto `loggedUser` incluye el campo `plan` proveniente del backend:

```js
const loggedUser = {
    username, token, role, idFederacion, idClub,
    // ...otros campos...
    plan: response.plan || null   // ← PlanSaaSDto del backend
};
```

El `plan` contiene (entre otros):
```json
{
  "id": 2,
  "nombre": "SIGDEF (M)",
  "accesoSigdef": true,
  "accesoSportTrack": false,
  "accesoControlesLive": false,
  "resultadosTiempoReal": true,
  "exportacionExcel": true,
  "soportePrioritario": false
}
```

### `src/components/common/PlanGuard.jsx`

Componente que recibe el user y muestra una pantalla de bloqueo si el plan no incluye el sistema requerido.

```jsx
// Uso en App.jsx:
<PlanGuard requiereSigdef user={user}>
    {children}
</PlanGuard>
```

**Props disponibles:**
- `requiereSigdef` — verifica `plan.accesoSigdef`
- `requiereSportTrack` — verifica `plan.accesoSportTrack`  
- `requiereControlesLive` — verifica `plan.accesoControlesLive`
- `user` — el objeto usuario del AuthContext

**Regla:** si `user.role === 'SUPERADMIN'`, el guard siempre deja pasar sin verificar el plan.

### `src/App.jsx` — `PrivateRoute`

```jsx
const PrivateRoute = ({ children, allowedRoles }) => {
    // ... checks de autenticación y rol ...

    if (user.role !== 'SUPERADMIN') {
        return (
            <PlanGuard requiereSigdef user={user}>
                {children}
            </PlanGuard>
        );
    }
    return children;
};
```

---

## Pantalla de plan no compatible

Cuando el plan no incluye SIGDEF, se muestra:

- Ícono de escudo bloqueado (`ShieldOff`)
- Título: "Acceso no disponible"
- Mensaje explicativo del motivo
- Información de planes disponibles

Esta pantalla reemplaza completamente el contenido de la app (no es un modal ni un overlay parcial).

---

## SuperAdmin

El SuperAdmin **nunca** está restringido por el plan. Tiene acceso total a ambos sistemas sin importar qué plan tenga asignada su entidad.

---

## Casos de error comunes

| Situación | Resultado |
|-----------|-----------|
| Usuario con plan SportTrack intenta entrar a SIGDEF | Pantalla "Acceso no disponible" |
| Usuario sin plan asignado | Pantalla "Sin plan asignado" |
| Token expirado | Redirect a `/login` |
| Cuenta suspendida | El backend rechaza el login con error |
| Suscripción vencida | El backend rechaza el login con error |
