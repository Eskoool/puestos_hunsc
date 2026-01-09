# 🔐 Sistema de Autenticación con Supabase

## 📋 Funcionamiento

Este sistema conecta la aplicación de puestos con la autenticación de **Supabase** compartida con https://farma-frello-colabora.lovable.app

---

## 🔄 Flujo de Autenticación

```
1. Usuario inicia sesión en → https://farma-frello-colabora.lovable.app
2. Supabase crea sesión (cookie/localStorage)
3. Usuario abre → login.html (esta app)
4. Sistema detecta sesión automáticamente
5. Lee datos del usuario desde tabla `users`
6. Verifica el campo `rol` (administrador, usuario, etc.)
7. Redirige según el rol:
   - Administrador → admin-dashboard.html
   - Usuario → index.html
```

---

## 📁 Archivos del Sistema

### **`js/auth.js`**
Módulo principal de autenticación con funciones:

```javascript
// Inicializar autenticación (llamar en cada página)
await auth.init();

// Proteger página - solo usuarios autenticados
await auth.requireAuth();

// Proteger página - solo administradores
await auth.requireAdmin();

// Verificar si es admin
if (auth.isAdmin()) {
  // Mostrar opciones de admin
}

// Obtener usuario actual
const user = auth.getCurrentUser();

// Obtener rol
const rol = auth.getCurrentRole();

// Cerrar sesión
auth.logout();

// Mostrar info del usuario en UI
auth.displayUserInfo('user-info'); // ID del contenedor
```

### **`login.html`**
Página de entrada que:
- Detecta automáticamente si hay sesión activa
- Lee el rol del usuario de la tabla `users`
- Redirige a admin o usuario según corresponda
- Si no hay sesión, muestra botón para ir a la app de Lovable

### **`js/supabase-config.js`**
Configuración del cliente de Supabase (ya configurado con tus credenciales)

---

## 🛡️ Proteger Páginas

### Página de Usuario (index.html, pages/*)

```html
<!-- Al final del <body>, antes de tu código -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
<script src="js/auth.js"></script>

<script>
  // Proteger página - redirige a login si no está autenticado
  async function init() {
    const user = await auth.requireAuth();
    if (!user) return;

    // Tu código aquí
    console.log('Usuario:', user.email, 'Rol:', auth.getCurrentRole());

    // Mostrar info del usuario
    auth.displayUserInfo('user-info');
  }

  init();
</script>
```

### Página de Admin (admin-*.html)

```html
<!-- Al final del <body>, antes de tu código -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
<script src="js/auth.js"></script>

<script>
  // Proteger página - SOLO administradores
  async function init() {
    const isAdmin = await auth.requireAdmin();
    if (!isAdmin) return; // Redirige a index.html si no es admin

    // Tu código de admin aquí
    console.log('Admin:', auth.getCurrentUser().email);

    // Mostrar info del usuario
    auth.displayUserInfo('user-info');
  }

  init();
</script>
```

---

## 🔑 Estructura de la Tabla `users` en Supabase

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(255),
  rol VARCHAR(50) NOT NULL, -- 'administrador', 'usuario', 'FIR', 'farmaceutico', etc.
  avatar_url TEXT,
  telefono VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Valores posibles para `rol`:**
- `administrador` o `admin` o `administrator` → Acceso total
- `usuario` o `user` → Acceso básico
- `FIR` → Farmacéutico Interno Residente
- `farmaceutico` o `farmacéutico` → Farmacéutico
- `tecnico` o `técnico` → Técnico de farmacia

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Mostrar/Ocultar Botón según Rol

```html
<div id="admin-only" style="display: none;">
  <button onclick="abrirGestionUsuarios()">Gestionar Usuarios</button>
</div>

<script>
  async function init() {
    await auth.requireAuth();

    // Mostrar botón solo si es admin
    if (auth.isAdmin()) {
      document.getElementById('admin-only').style.display = 'block';
    }
  }

  init();
</script>
```

### Ejemplo 2: Cargar Datos del Usuario Actual

```javascript
async function cargarMisAsignaciones() {
  const user = auth.getCurrentUser();

  const { data, error } = await supabaseClient
    .from('asignaciones')
    .select('*')
    .eq('usuario_id', user.id);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Mis asignaciones:', data);
}
```

### Ejemplo 3: Botón de Logout

```html
<button onclick="cerrarSesion()">Cerrar Sesión</button>

<script>
  function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
      auth.logout(); // Redirige a la app de Lovable
    }
  }
</script>
```

### Ejemplo 4: Mostrar Información del Usuario en Navbar

```html
<nav>
  <div id="user-info"></div>
  <button onclick="auth.logout()">Salir</button>
</nav>

<script>
  async function init() {
    await auth.requireAuth();

    // Muestra avatar, nombre y rol automáticamente
    auth.displayUserInfo('user-info');
  }

  init();
</script>
```

---

## 🔄 Sincronización de Sesiones

La sesión de Supabase se comparte automáticamente entre:
- https://farma-frello-colabora.lovable.app
- Esta aplicación (puestos_hunsc)

**Cookies/LocalStorage:**
- Supabase guarda el token en `localStorage`
- Ambas apps comparten el mismo dominio de Supabase
- La sesión expira automáticamente según la configuración de Supabase

---

## 🧪 Probar la Autenticación

### Test 1: Verificar Sesión

Abre `login.html` en el navegador:
- Si ya iniciaste sesión en Lovable → Redirige automáticamente
- Si no hay sesión → Muestra botón "Ir a Login Principal"

### Test 2: Verificar Roles

```javascript
// En la consola del navegador (F12):
auth.getCurrentUser(); // Ver datos del usuario
auth.getCurrentRole(); // Ver rol
auth.isAdmin(); // true/false
```

### Test 3: Protección de Páginas

1. Cierra sesión: `auth.logout()`
2. Intenta acceder a `admin-dashboard.html`
3. Debe redirigir a `login.html` automáticamente

---

## ⚠️ Seguridad

### Row Level Security (RLS)

Asegúrate de tener políticas de seguridad en Supabase:

```sql
-- Solo usuarios pueden ver/editar sus propios datos
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Solo admins pueden ver todos los usuarios
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.rol IN ('administrador', 'admin', 'administrator')
    )
  );
```

---

## 🚀 Integración Completa

### Paso 1: Incluir Scripts

En **TODAS** tus páginas HTML (index.html, admin-*.html, pages/*.html):

```html
<!-- Antes de </body> -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
<script src="js/auth.js"></script>
```

### Paso 2: Proteger Páginas

```javascript
// Páginas de usuario
await auth.requireAuth();

// Páginas de admin
await auth.requireAdmin();
```

### Paso 3: Usar Datos del Usuario

```javascript
const user = auth.getCurrentUser();
const rol = auth.getCurrentRole();
const esAdmin = auth.isAdmin();
```

---

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────┐
│ farma-frello-colabora.lovable.app   │
│ (Login con Supabase Auth)           │
└───────────────┬─────────────────────┘
                │ Crea sesión
                ▼
┌─────────────────────────────────────┐
│ Supabase (Session Storage)          │
│ localStorage/cookies                 │
└───────────────┬─────────────────────┘
                │ Sesión compartida
                ▼
┌─────────────────────────────────────┐
│ puestos_hunsc/login.html            │
│ - Detecta sesión                    │
│ - Lee tabla users                   │
│ - Verifica campo rol                │
└───────────────┬─────────────────────┘
                │
      ┌─────────┴─────────┐
      ▼                   ▼
┌─────────────┐   ┌──────────────────┐
│ index.html  │   │ admin-dashboard  │
│ (Usuario)   │   │ (Administrador)  │
└─────────────┘   └──────────────────┘
```

---

## 🆘 Troubleshooting

### Problema: "Usuario no encontrado en la base de datos"

**Causa:** El email del usuario autenticado no existe en la tabla `users`

**Solución:**
```sql
-- Insertar usuario en Supabase
INSERT INTO users (email, nombre, rol)
VALUES ('usuario@ejemplo.com', 'Nombre Usuario', 'usuario');
```

### Problema: No redirige automáticamente

**Causa:** Sesión expirada o no compartida

**Solución:**
1. Cerrar sesión en ambas apps
2. Volver a iniciar sesión en Lovable
3. Refrescar la página de puestos_hunsc

### Problema: Acceso denegado siendo admin

**Causa:** El campo `rol` no tiene el valor correcto

**Solución:**
```sql
-- Actualizar rol a administrador
UPDATE users
SET rol = 'administrador'
WHERE email = 'admin@ejemplo.com';
```

---

## ✅ Checklist de Implementación

- [ ] Credenciales configuradas en `js/supabase-config.js`
- [ ] Tabla `users` creada en Supabase
- [ ] Usuarios insertados con campo `rol` correcto
- [ ] Scripts incluidos en todas las páginas HTML
- [ ] Llamadas a `auth.requireAuth()` o `auth.requireAdmin()` en cada página
- [ ] Row Level Security (RLS) configurado
- [ ] Probado login desde Lovable
- [ ] Probado redirección automática
- [ ] Probado protección de páginas admin

---

Con este sistema, la autenticación está completamente integrada y sincronizada entre ambas aplicaciones! 🎉
