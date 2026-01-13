# 🔗 Conexión con Supabase - Aplicación Adaptativa

## ✅ Cambios Realizados

Se ha adaptado la aplicación para funcionar con **cualquier estructura de base de datos Supabase existente**, sin necesidad de crear tablas nuevas.

### Archivos Modificados

1. **`login.html`** - Adaptado para:
   - Buscar usuarios en tabla `users` existente
   - Intentar también en tabla `profiles` si no se encuentra
   - Soportar múltiples nombres de columnas (`rol`, `role`, `tipo`, etc.)
   - Manejar errores gracefully sin romper el flujo

2. **`js/auth.js`** - Adaptado para:
   - Función `loadUserData()` busca en ambas tablas (`users` y `profiles`)
   - Normalización de campos de rol desde múltiples nombres posibles
   - Soporte para diferentes estructuras de datos

---

## 🔍 Cómo Funciona Ahora

### Flujo de Autenticación SSO

```
1. Usuario llega con SSO token desde Lovable
2. App busca usuario en tabla "users" (por email)
   ├─ Si existe → Usa esos datos
   └─ Si no existe → Intenta crearlo (con campos que existan)
3. Si falla todo → Continúa con datos del token
4. Guarda sesión en sessionStorage
5. Redirige según rol detectado
```

### Flujo de Sesión Tradicional

```
1. Usuario tiene sesión activa de Supabase
2. App busca sus datos en tabla "users"
   ├─ Si existe → Usa esos datos
   └─ Si no → Busca en tabla "profiles"
3. Normaliza el rol (rol/role/tipo/user_role)
4. Redirige según rol
```

---

## 🧪 Probar la Conexión

### Opción 1: Herramienta de Verificación (RECOMENDADO)

Abre en tu navegador:

```
http://localhost:8080/verificar-tablas-existentes.html
```

O si está desplegado:

```
https://tu-dominio.com/verificar-tablas-existentes.html
```

Esta herramienta te mostrará:
- ✅ Estructura de tabla `users`
- ✅ Estructura de tabla `profiles`
- 🔗 Relación entre ambas tablas
- 📊 Distribución de roles

### Opción 2: Diagnóstico Completo

Abre:

```
http://localhost:8080/diagnostico-supabase.html
```

Muestra:
- Estado de conexión
- Total de usuarios
- Opciones para crear datos de prueba

### Opción 3: Prueba Manual

1. Abre `login.html` en el navegador
2. Abre la consola del navegador (F12)
3. Observa los logs:
   - `✅ Usuario encontrado en la base de datos`
   - `✅ Usuario autenticado: email@ejemplo.com - Rol: administrador`

---

## 📋 Campos de Rol Soportados

La aplicación detecta automáticamente el rol desde cualquiera de estos campos:

| Campo en BD | Detectado como |
|-------------|----------------|
| `rol` | ✅ Rol del usuario |
| `role` | ✅ Rol del usuario |
| `tipo` | ✅ Rol del usuario |
| `user_role` | ✅ Rol del usuario |

### Valores de Rol Reconocidos

| Valor en BD | Acceso |
|-------------|--------|
| `administrador`, `admin`, `administrator` | Admin Dashboard |
| `usuario`, `user` | Dashboard Usuario |
| `FIR`, `farmaceutico`, `tecnico` | Dashboard Usuario |
| Cualquier otro valor | Dashboard Usuario |

---

## 🔧 Estructura de Tablas Esperada

### Tabla `users` (Recomendada)

Columnas mínimas necesarias:
```sql
- id (UUID o cualquier tipo)
- email (VARCHAR/TEXT) ← REQUERIDO
- nombre o name (VARCHAR/TEXT) ← Opcional
- rol o role o tipo (VARCHAR/TEXT) ← REQUERIDO para control de acceso
```

Columnas opcionales que se usarán si existen:
```sql
- hospital (VARCHAR/TEXT)
- avatar_url (TEXT)
- telefono (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabla `profiles` (Alternativa)

Si no existe `users`, se buscará en `profiles` con:
```sql
- email (VARCHAR/TEXT) ← REQUERIDO
- nombre o name (VARCHAR/TEXT)
- rol o role o tipo (VARCHAR/TEXT)
```

---

## ⚙️ Configuración

### Credenciales de Supabase

Ya configuradas en `js/supabase-config.js`:

```javascript
const SUPABASE_URL = 'https://julrvkllcifpcdyvbikr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...';
```

### Variable de Entorno (Opcional)

Si prefieres usar variables de entorno:

```javascript
// En .env
VITE_SUPABASE_URL=https://julrvkllcifpcdyvbikr.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

---

## 🚨 Troubleshooting

### Problema: "Usuario no encontrado en la base de datos"

**Causa:** No existe tabla `users` ni `profiles`, o el usuario no está registrado

**Solución:**

1. Verifica que existe la tabla:
   ```sql
   SELECT * FROM users LIMIT 1;
   -- O
   SELECT * FROM profiles LIMIT 1;
   ```

2. Si la tabla existe pero está vacía, inserta un usuario de prueba:
   ```sql
   INSERT INTO users (email, nombre, rol)
   VALUES ('admin@hunsc.es', 'Admin Test', 'administrador');
   ```

3. Si no existe ninguna tabla, ejecuta `supabase-setup.sql` en el SQL Editor de Supabase

### Problema: "Error al buscar en tabla users"

**Causa:** La tabla `users` existe pero tiene columnas diferentes

**Solución:**

La aplicación es **adaptativa** y debería continuar funcionando. Verifica en consola:
- `⚠️ Error al buscar en tabla users: [mensaje de error]`
- `🔍 Intentando buscar en tabla "profiles"...`

Si ambas fallan, verifica que al menos una tabla tenga la columna `email`.

### Problema: "Redirige a página incorrecta"

**Causa:** El campo de rol no está correctamente configurado

**Solución:**

1. Abre consola del navegador (F12)
2. Busca el log: `✅ Usuario autenticado: email - Rol: [valor]`
3. Verifica que el valor del rol sea correcto en la base de datos

Para actualizar el rol:
```sql
UPDATE users
SET rol = 'administrador'  -- o role = 'administrador'
WHERE email = 'tu-email@ejemplo.com';
```

### Problema: "No redirige desde Lovable"

**Causa:** Lovable no está generando el SSO token correctamente

**Solución:**

Ver documentación completa en: `SSO_LOVABLE_GUIDE.md`

---

## 📊 Logs en Consola

La aplicación muestra logs detallados en la consola del navegador:

### Logs de Éxito
```
✅ SSO Token recibido desde Lovable, procesando...
✅ Token SSO válido: {email: "...", role: "..."}
🔍 Buscando usuario en tabla "users"...
✅ Usuario encontrado en la base de datos: {...}
✅ Sesión guardada en sessionStorage: {...}
✅ Usuario autenticado: email@ejemplo.com - Rol: administrador
Redirigiendo a admin-dashboard.html
```

### Logs de Advertencia (No Críticos)
```
⚠️ Usuario no encontrado, intentando crear...
⚠️ Error al crear usuario: [mensaje]
✅ Continuando con datos del token SSO...
🔍 Usuario no encontrado en "users", intentando tabla "profiles"...
```

### Logs de Error
```
❌ Token SSO expirado. Por favor, vuelve a iniciar sesión.
❌ Usuario no encontrado en ninguna tabla
❌ Error procesando SSO token: [mensaje]
```

---

## ✅ Checklist de Implementación

- [x] Credenciales de Supabase configuradas en `js/supabase-config.js`
- [x] Tabla `users` o `profiles` existe en Supabase
- [x] Al menos un usuario tiene el campo `email` y `rol`/`role`
- [x] `login.html` adaptado para buscar en ambas tablas
- [x] `auth.js` adaptado para normalizar roles
- [ ] Probar con `verificar-tablas-existentes.html`
- [ ] Probar login desde Lovable con SSO token
- [ ] Verificar redirección según rol
- [ ] Probar acceso a páginas protegidas

---

## 🎯 Próximos Pasos

1. **Abrir `verificar-tablas-existentes.html`** para inspeccionar tu estructura actual
2. **Copiar los logs** de la consola del navegador
3. **Verificar que los campos necesarios existen** (email, rol)
4. **Probar el flujo SSO** desde Lovable
5. **Confirmar que redirige correctamente** según el rol

---

## 📝 Notas Importantes

- La aplicación **NO modifica** tu estructura de base de datos existente
- **NO crea tablas nuevas** automáticamente
- Es **adaptativa** y funciona con lo que ya tienes
- Soporta **múltiples nombres de columnas** (rol/role/tipo)
- Maneja **errores gracefully** sin romper el flujo

---

¿Necesitas ayuda? Revisa los logs en la consola del navegador (F12) y busca mensajes con los iconos: ✅ ⚠️ ❌ 🔍
