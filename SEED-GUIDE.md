# Guía: Cómo Poblar la Base de Datos con Datos de Prueba

## 📋 Datos que se crearán

El script `seed-database.js` creará:

- **5 Clubes**: River Plate, Boca Juniors, Racing, Estudiantes, Gimnasia
- **6 Atletas Mayores** (18+ años) distribuidos en diferentes clubes
- **4 Atletas Menores** (con tutores) 
- **4 Entrenadores de Club**
- **2 Entrenadores de Selección** 
- **5 Eventos**: 2 finalizados y 3 pendientes

## 🚀 Cómo Ejecutar el Script

### Opción 1: Desde la Consola del Navegador (Recomendado)

1. **Inicia sesión** en tu aplicación
2. Abre la **Consola del Navegador** (F12 → pestaña Console)
3. Copia todo el contenido del archivo `seed-database.js`
4. Pega en la consola y presiona Enter
5. Ejecuta el comando:
   ```javascript
   seedDatabase()
   ```
6. Observa el progreso en la consola:
   - ✅ = Operación exitosa
   - ❌ = Error (revisa los detalles)

### Opción 2: Usando un Botón Temporal en la UI

Si prefieres no usar la consola, puedo crear un botón temporal en la interfaz para ejecutar el seed.

## ⚠️ Importante

- **Debes estar logueado** como administrador de federación para que el script funcione
- El script usa la API de tu aplicación (`https://localhost:7112/api`)
- **Verifica que tu backend esté corriendo** antes de ejecutar
- Los datos se crean **secuencialmente** para mantener las relaciones correctas

## 📊 Ejemplo de Salida

```
🌱 Iniciando seed de base de datos...

📍 Creando clubes...
✅ Club creado: Club Atlético River Plate (ID: 1)
✅ Club creado: Club Atlético Boca Juniors (ID: 2)
...

👤 Creando atletas mayores...
✅ Atleta mayor: Juan Martínez
✅ Atleta mayor: María González
...

👶 Creando atletas menores con tutores...
✅ Atleta menor: Sofía Ramírez (Tutor: Roberto Ramírez)
...

✨ ¡Seed completado exitosamente!

📊 Resumen:
   - 5 clubes creados
   - 6 atletas mayores creados
   - 4 atletas menores con tutores creados
   - 4 entrenadores de club creados
   - 2 entrenadores de selección creados
   - 5 eventos creados (2 finalizados, 3 pendientes)
```

## 🔍 Verificación

Después de ejecutar el script, verifica que los datos se crearon correctamente:

1. **Clubes**: Navega a la sección de Clubes
2. **Atletas**: Revisa la lista de Atletas (deberías ver 10 atletas en total)
3. **Entrenadores**: Verifica entrenadores de club y selección
4. **Eventos**: Comprueba que haya eventos finalizados y pendientes

## 🛠️ Solución de Problemas

### Error: "Failed to fetch"
- Verifica que tu backend esté corriendo
- Confirma la URL de la API en `seed-database.js` (línea 4)

### Error: "Authorization"
- Asegúrate de estar logueado correctamente
- Verifica que tengas permisos de administrador

### Error: "Duplicate key"
- Algunos datos ya existen en la base de datos
- Puedes modificar los documentos/nombres en el script para evitar duplicados

## 📝 Notas

- El script maneja automáticamente las relaciones entre entidades (atletas-tutores, clubes, etc.)
- Los datos son realistas pero ficticios
- Puedes modificar el archivo `seed-database.js` para personalizar los datos
