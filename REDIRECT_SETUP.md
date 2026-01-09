# 🔗 Configurar Redirect con Token desde Lovable

## 📋 Instrucciones para la App de Lovable

### **Paso 1: Identificar dónde se hace el Login**

En tu app de Lovable (https://farma-frello-colabora.lovable.app), busca el código donde el usuario hace login exitosamente. Probablemente se ve algo así:

```javascript
// Código existente en Lovable
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

if (error) {
  // Manejar error
  return;
}

// ✅ Login exitoso
console.log('Login exitoso:', data);

// Aquí es donde debes añadir el redirect
```

---

### **Paso 2: Añadir Código de Redirect**

**DESPUÉS** del login exitoso, añade este código:

```javascript
// ===== AÑADIR ESTE CÓDIGO =====

async function redirectToAppPuestos() {
  try {
    // Obtener la sesión actual
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      console.error('Error obteniendo sesión:', error);
      return;
    }

    // Extraer tokens
    const accessToken = session.access_token;
    const refreshToken = session.refresh_token;

    // URL de tu app de puestos (ajustar según donde esté desplegada)
    const appPuestosURL = 'https://TU-DOMINIO-AQUI.com/login.html';

    // O si está en Vercel:
    // const appPuestosURL = 'https://puestos-hunsc.vercel.app/login.html';

    // O si pruebas localmente:
    // const appPuestosURL = 'http://localhost:8080/login.html';

    // Construir URL con tokens
    const redirectURL = `${appPuestosURL}?access_token=${accessToken}&refresh_token=${refreshToken}`;

    // Redirigir
    console.log('Redirigiendo a app de puestos...');
    window.location.href = redirectURL;

  } catch (err) {
    console.error('Error en redirect:', err);
  }
}

// Llamar la función después del login exitoso
redirectToAppPuestos();

// ===== FIN DEL CÓDIGO A AÑADIR =====
```

---

### **Paso 3: Ejemplo Completo**

Aquí un ejemplo de cómo quedaría tu código de login en Lovable:

```javascript
// En tu componente de Login en Lovable

const handleLogin = async (email, password) => {
  try {
    // Login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      alert('Error de login: ' + error.message);
      return;
    }

    // ✅ Login exitoso
    console.log('Login exitoso:', data);

    // 🔗 REDIRIGIR A APP DE PUESTOS CON TOKEN
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const accessToken = session.access_token;
      const refreshToken = session.refresh_token;

      // Cambiar esta URL por la tuya
      const appPuestosURL = 'https://TU-DOMINIO.com/login.html';

      window.location.href = `${appPuestosURL}?access_token=${accessToken}&refresh_token=${refreshToken}`;
    }

  } catch (err) {
    console.error('Error:', err);
  }
};
```

---

### **Paso 4: Si usas React en Lovable**

Si tu app de Lovable usa React, el código sería:

```jsx
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    // Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    // Obtener tokens
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const accessToken = session.access_token;
      const refreshToken = session.refresh_token;

      // Redirigir a app de puestos
      const appPuestosURL = 'https://TU-DOMINIO.com/login.html';
      window.location.href = `${appPuestosURL}?access_token=${accessToken}&refresh_token=${refreshToken}`;
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const email = e.target.email.value;
      const password = e.target.password.value;
      handleLogin(email, password);
    }}>
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## 🎯 URLs a Configurar

Cambia `'https://TU-DOMINIO.com/login.html'` por:

### **Opción 1: Producción (Vercel/Netlify/otro)**
```javascript
const appPuestosURL = 'https://puestos-hunsc.vercel.app/login.html';
```

### **Opción 2: Desarrollo Local**
```javascript
const appPuestosURL = 'http://localhost:8080/login.html';
```

### **Opción 3: GitHub Pages**
```javascript
const appPuestosURL = 'https://tu-usuario.github.io/puestos_hunsc/login.html';
```

---

## 🔐 Seguridad

**¿Es seguro pasar tokens en la URL?**

✅ **SÍ, si:**
- Usas HTTPS (obligatorio)
- Los tokens se eliminan de la URL inmediatamente (lo hace login.html automáticamente)
- Son tokens de corta duración (Supabase los renueva automáticamente)

⚠️ **Alternativa más segura (opcional):**

Si prefieres NO pasar tokens en la URL, puedes usar:

```javascript
// En Lovable, después del login:
const { data: { session } } = await supabase.auth.getSession();

// Guardar tokens en sessionStorage temporalmente
sessionStorage.setItem('temp_access_token', session.access_token);
sessionStorage.setItem('temp_refresh_token', session.refresh_token);

// Redirigir sin tokens en URL
window.location.href = 'https://TU-DOMINIO.com/login.html';
```

Pero esto requiere que ambas apps estén en el mismo dominio.

---

## ✅ Flujo Completo

```
1. Usuario → Abre Lovable app
2. Usuario → Hace login (email + password)
3. Lovable → Obtiene tokens de Supabase
4. Lovable → Redirige a:
   https://puestos-hunsc.com/login.html?access_token=xxx&refresh_token=yyy
5. App Puestos → Lee tokens de la URL
6. App Puestos → Establece sesión en Supabase con esos tokens
7. App Puestos → Limpia la URL (quita tokens)
8. App Puestos → Lee usuario de tabla 'users'
9. App Puestos → Redirige según rol (admin o usuario)
```

---

## 🧪 Cómo Probar

### **1. En Lovable:**

Añade console.log para verificar:

```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Access Token:', session.access_token);
console.log('Refresh Token:', session.refresh_token);
```

### **2. En App de Puestos:**

Abre la consola del navegador (F12) y verás:

```
✅ Token recibido desde Lovable, estableciendo sesión...
✅ Sesión establecida correctamente
Sesión encontrada, cargando usuario...
Usuario encontrado: {email: "...", rol: "..."}
Redirigiendo a admin-dashboard.html (o index.html)
```

---

## 📍 Dónde Colocar la URL

**Recomendación:** Crea una variable de entorno en Lovable:

```javascript
// En .env de Lovable
VITE_APP_PUESTOS_URL=https://puestos-hunsc.vercel.app/login.html

// En tu código:
const appPuestosURL = import.meta.env.VITE_APP_PUESTOS_URL;
```

Así puedes cambiar fácilmente entre desarrollo y producción.

---

## 🆘 Troubleshooting

### Problema: "Error estableciendo sesión"

**Causa:** Tokens inválidos o expirados

**Solución:** Verifica que estés pasando ambos tokens (access_token y refresh_token)

### Problema: Redirige pero no detecta sesión

**Causa:** Los tokens no se están pasando correctamente

**Solución:**
```javascript
// En Lovable, verifica:
console.log('Access Token:', session.access_token);
console.log('Refresh Token:', session.refresh_token);
console.log('URL completa:', redirectURL);
```

### Problema: Usuario no encontrado en base de datos

**Causa:** El email del usuario no existe en tabla 'users'

**Solución:** Insertar el usuario en Supabase:
```sql
INSERT INTO users (email, nombre, rol)
VALUES ('usuario@ejemplo.com', 'Nombre Usuario', 'usuario');
```

---

## 📝 Resumen

**En Lovable (después del login):**
```javascript
const { data: { session } } = await supabase.auth.getSession();
const url = `https://TU-DOMINIO.com/login.html?access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
window.location.href = url;
```

**En App de Puestos (login.html):**
Ya está configurado ✅ - lee los tokens automáticamente

---

¡Listo! Con esto deberías poder redirigir desde Lovable a tu app de puestos manteniendo la sesión activa.
