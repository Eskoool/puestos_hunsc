# 📅 Sistema de Guardias - Documentación Completa

## ✅ Sistema Implementado

El sistema de guardias está completamente conectado a Supabase usando la tabla `pharmacy_guards`.

---

## 🗄️ Estructura de la Base de Datos

### Tabla: `pharmacy_guards`

```sql
CREATE TABLE pharmacy_guards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_date DATE NOT NULL,
  pharmacist_1_id UUID REFERENCES users(id),
  pharmacist_2_id UUID REFERENCES users(id),
  fir_id UUID REFERENCES users(id),
  assigned_by UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pendiente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**
- `guard_date`: Fecha de la guardia
- `pharmacist_1_id`: Farmacéutico principal (turno mañana)
- `pharmacist_2_id`: Farmacéutico de apoyo (turno tarde)
- `fir_id`: FIR asignado
- `assigned_by`: Quién asignó la guardia (administrador)
- `status`: Estado de la guardia (pendiente, confirmada, cancelada)
- `notes`: Notas adicionales

---

## 🔧 Componentes del Sistema

### 1. **`js/guardias-manager.js`** - Módulo principal

Clase `GuardiasManager` con métodos:

| Método | Descripción | Requiere Admin |
|--------|-------------|----------------|
| `init()` | Inicializa con usuario actual | No |
| `getMyGuards()` | Obtiene guardias del usuario | No |
| `getAllGuards()` | Obtiene todas las guardias | Sí |
| `getGuardsByMonth(year, month)` | Filtra por mes | No |
| `createGuard(data)` | Crea nueva guardia | Sí |
| `updateGuard(id, updates)` | Actualiza guardia | Sí |
| `deleteGuard(id)` | Elimina guardia | Sí |
| `getAvailableUsers()` | Lista usuarios para asignar | No |
| `changeStatus(id, status)` | Cambia estado | Sí |

### 2. **`pages/guardias.html`** - Interfaz de calendario

**Funcionalidades:**
- ✅ Ver guardias en calendario mensual
- ✅ Distingue guardias propias (estrella amarilla ⭐)
- ✅ Muestra roles: FIR 🎓 / Farmacéutico 💊
- ✅ Navegación por meses
- ✅ Detalles de guardias al hacer clic
- ✅ Solicitud de cambios de guardia

---

## 👥 Permisos por Rol

### **Usuario Normal (FIR / Farmacéutico)**
- ✅ Ver sus propias guardias
- ✅ Ver detalles de guardias
- ✅ Solicitar cambios de guardia
- ❌ No puede crear/editar/eliminar guardias

### **Administrador**
- ✅ Ver TODAS las guardias
- ✅ Crear nuevas guardias
- ✅ Editar guardias existentes
- ✅ Eliminar guardias
- ✅ Cambiar estado de guardias
- ✅ Asignar farmacéuticos y FIR

---

## 📝 Cómo Usar el Sistema

### Para Usuarios (Ver Guardias)

1. **Acceder a guardias:**
   ```
   https://puestos-hunsc.vercel.app/pages/guardias.html
   ```

2. **Navegar por meses:**
   - Botones "←" y "→" para cambiar de mes
   - Automáticamente carga guardias del mes seleccionado

3. **Ver detalles:**
   - Click en cualquier día con guardias
   - Se abre modal con información completa

4. **Identificar tus guardias:**
   - Tus guardias tienen **estrella amarilla ⭐**
   - Otros colores para otros usuarios

---

### Para Administradores (Crear Guardias)

#### **Opción 1: Desde Supabase Dashboard**

1. Ve a: https://supabase.com/dashboard/project/julrvkllcifpcdyvbikr
2. Table Editor → `pharmacy_guards`
3. Click **"Insert row"**
4. Llena los campos:

```
guard_date: 2025-01-15
pharmacist_1_id: [UUID del farmacéutico 1]
pharmacist_2_id: [UUID del farmacéutico 2]
fir_id: [UUID del FIR]
assigned_by: [Tu UUID de administrador]
status: pendiente
notes: (opcional)
```

5. Click **"Save"**

#### **Opción 2: Desde JavaScript (Consola del navegador)**

Abre `guardias.html` y en la consola (F12):

```javascript
// Crear una guardia nueva
await window.guardiasManager.createGuard({
  guard_date: '2025-01-20',
  pharmacist_1_id: '85df4182-c512-4eca-8126-133a33f7baaf', // UUID de Yared
  pharmacist_2_id: null, // Opcional
  fir_id: null, // Opcional
  status: 'pendiente',
  notes: 'Guardia de urgencias'
});
```

#### **Opción 3: Crear múltiples guardias (Script SQL)**

En Supabase → SQL Editor:

```sql
-- Insertar múltiples guardias para enero 2025
INSERT INTO pharmacy_guards (guard_date, pharmacist_1_id, fir_id, assigned_by, status)
VALUES
  ('2025-01-15', '85df4182-c512-4eca-8126-133a33f7baaf', NULL,
   (SELECT id FROM users WHERE rol = 'administrador' LIMIT 1), 'pendiente'),
  ('2025-01-16', '85df4182-c512-4eca-8126-133a33f7baaf', NULL,
   (SELECT id FROM users WHERE rol = 'administrador' LIMIT 1), 'pendiente'),
  ('2025-01-20', '85df4182-c512-4eca-8126-133a33f7baaf', NULL,
   (SELECT id FROM users WHERE rol = 'administrador' LIMIT 1), 'confirmada');
```

---

## 📊 Estados de Guardias

| Estado | Descripción | Color en UI |
|--------|-------------|-------------|
| `pendiente` | Guardia asignada pero no confirmada | Amarillo |
| `confirmada` | Guardia confirmada por el usuario | Verde |
| `cancelada` | Guardia cancelada | Rojo |

---

## 🔍 Obtener UUIDs de Usuarios

Para asignar guardias, necesitas los UUIDs de los usuarios. En Supabase SQL Editor:

```sql
-- Ver todos los usuarios con sus IDs y roles
SELECT id, nombre, email, rol
FROM users
ORDER BY nombre;

-- Resultado:
-- id: 85df4182-c512-4eca-8126-133a33f7baaf
-- nombre: Yared González Pérez
-- email: ygonperf@gobiernodecanarias.org
-- rol: Farmacéutico
```

Copia el `id` del usuario que quieres asignar.

---

## 🧪 Probar el Sistema

### Test 1: Ver guardias existentes

1. Abre: `https://puestos-hunsc.vercel.app/pages/guardias.html`
2. Abre consola (F12)
3. Ejecuta:
   ```javascript
   await window.guardiasManager.getMyGuards()
   ```
4. Deberías ver tus guardias en el array

### Test 2: Crear guardia de prueba (solo admin)

```javascript
const testGuard = await window.guardiasManager.createGuard({
  guard_date: '2025-01-25',
  pharmacist_1_id: '85df4182-c512-4eca-8126-133a33f7baaf',
  status: 'pendiente',
  notes: 'Guardia de prueba'
});

console.log('Guardia creada:', testGuard);
```

### Test 3: Actualizar estado (solo admin)

```javascript
await window.guardiasManager.changeStatus(
  'id-de-la-guardia',
  'confirmada'
);
```

---

## 🚀 Flujo Completo de Uso

### 1. **Administrador crea guardias** (inicio de mes)

```sql
-- En Supabase SQL Editor
INSERT INTO pharmacy_guards (guard_date, pharmacist_1_id, fir_id, assigned_by, status)
SELECT
  generate_series('2025-02-01'::date, '2025-02-28'::date, '1 day'::interval)::date,
  (SELECT id FROM users WHERE rol = 'Farmacéutico' ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM users WHERE rol = 'FIR' ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM users WHERE rol = 'administrador' LIMIT 1),
  'pendiente';
```

### 2. **Usuario consulta sus guardias**

- Accede a `guardias.html`
- Ve calendario con sus guardias marcadas con ⭐
- Click en día para ver detalles

### 3. **Usuario solicita cambio** (opcional)

- Click en "Solicitar Cambio de Guardia"
- Llena formulario
- Envía solicitud al administrador

### 4. **Administrador aprueba/rechaza**

- Abre `guardias.html` (ve TODAS las guardias)
- Actualiza estado o reasigna:
  ```javascript
  await window.guardiasManager.updateGuard('guard-id', {
    pharmacist_1_id: 'nuevo-usuario-id',
    status: 'confirmada'
  });
  ```

---

## ✅ Checklist de Implementación

- [x] Módulo `guardiasManager` creado
- [x] `guardias.html` conectado a Supabase
- [x] Carga usuario desde sessionStorage
- [x] Filtra guardias por usuario/admin
- [x] Navegación por meses funcional
- [x] Detecta guardias propias (⭐)
- [x] Muestra roles (🎓💊)
- [ ] Implementar creación de guardias desde UI (próxima feature)
- [ ] Implementar edición de guardias desde UI (próxima feature)
- [ ] Sistema de notificaciones para cambios (futuro)

---

## 🆘 Troubleshooting

### Problema: "No se cargan las guardias"

**Solución:**
1. Abre consola (F12)
2. Verifica errores
3. Ejecuta:
   ```javascript
   await window.guardiasManager.init();
   await window.guardiasManager.getMyGuards();
   ```

### Problema: "Usuario no puede ver guardias"

**Causa:** No tiene guardias asignadas en ese mes

**Solución:** Crear guardia en Supabase con su `user_id`

### Problema: "Error al cargar usuarios disponibles"

**Causa:** Tabla `users` vacía o sin permisos

**Solución:** Verificar que existan usuarios en la tabla:
```sql
SELECT * FROM users LIMIT 5;
```

---

## 📚 Recursos

- **Supabase Dashboard:** https://supabase.com/dashboard/project/julrvkllcifpcdyvbikr
- **Tabla Editor:** https://supabase.com/dashboard/project/julrvkllcifpcdyvbikr/editor
- **SQL Editor:** https://supabase.com/dashboard/project/julrvkllcifpcdyvbikr/sql
- **Logs:** https://supabase.com/dashboard/project/julrvkllcifpcdyvbikr/logs

---

**Sistema de guardias completamente funcional y conectado a Supabase** ✅🎉
