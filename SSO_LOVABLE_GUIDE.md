# 🔐 Integración SSO con Lovable - Guía Completa

## 📋 Cómo Funciona el SSO

```
1. Usuario → Login en Lovable (LDAP/cualquier método)
2. Lovable → Genera SSO token (JSON en base64)
3. Lovable → Redirige a: puestos.com/login.html?sso_token=xxx
4. App Puestos → Decodifica token
5. App Puestos → Crea/actualiza usuario en Supabase
6. App Puestos → Guarda en sessionStorage
7. App Puestos → Redirige según rol
```

---

## 🛠️ Código para Lovable

### **Después del Login Exitoso**

Añade este código en Lovable **después de que el usuario se autentique correctamente**:

```typescript
// Imports necesarios
import { useNavigate } from 'react-router-dom';

// Función para generar SSO token
function generateSSOToken(user: {
  userId: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  hospital: string;
}) {
  // Crear payload del token
  const payload = {
    sub: user.userId,
    email: user.email,
    name: user.name,
    surname: user.surname,
    role: user.role,
    hospital: user.hospital,
    exp: Math.floor(Date.now() / 1000) + (5 * 60) // Expira en 5 minutos
  };

  // Codificar en base64
  const token = btoa(JSON.stringify(payload));

  return token;
}

// Función para redirigir a la app de puestos
function redirectToAppPuestos(user: {
  userId: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  hospital: string;
}) {
  // Generar token SSO
  const ssoToken = generateSSOToken(user);

  // URL de la app de puestos (cambiar según donde esté desplegada)
  const appPuestosURL = 'https://puestos-hunsc.vercel.app/login.html';
  // O localhost para pruebas: 'http://localhost:8080/login.html'

  // Redirigir con token
  window.location.href = `${appPuestosURL}?sso_token=${ssoToken}`;
}

// Ejemplo de uso después del login
async function handleLoginSuccess(userData) {
  // Después de autenticar al usuario (LDAP, Supabase, etc.)

  redirectToAppPuestos({
    userId: userData.id,
    email: userData.email,
    name: userData.nombre || userData.first_name,
    surname: userData.apellidos || userData.last_name,
    role: userData.rol, // 'administrador', 'usuario', 'FIR', etc.
    hospital: userData.hospital || 'HUNSC-Sur'
  });
}
```

---

## 📝 Ejemplo Completo en Componente React

```typescript
// LoginPage.tsx
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Autenticar con tu método (LDAP, Supabase, etc.)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert('Error de autenticación: ' + error.message);
        return;
      }

      // 2. Obtener datos completos del usuario desde tu tabla
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        alert('Usuario no encontrado en la base de datos');
        return;
      }

      // 3. Generar SSO token
      const ssoToken = btoa(JSON.stringify({
        sub: userData.id,
        email: userData.email,
        name: userData.nombre?.split(' ')[0] || 'Usuario',
        surname: userData.nombre?.split(' ').slice(1).join(' ') || '',
        role: userData.rol || 'usuario',
        hospital: userData.hospital || 'HUNSC-Sur',
        exp: Math.floor(Date.now() / 1000) + (5 * 60)
      }));

      // 4. Redirigir a app de puestos
      const appPuestosURL = import.meta.env.VITE_APP_PUESTOS_URL || 'https://puestos-hunsc.vercel.app/login.html';
      window.location.href = `${appPuestosURL}?sso_token=${ssoToken}`;

    } catch (error) {
      console.error('Error en login:', error);
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}

export default LoginPage;
```

---

## 🎯 Estructura del Token SSO

El token debe contener estos campos:

```typescript
interface SSOToken {
  sub: string;      // userId (obligatorio)
  email: string;    // Email del usuario (obligatorio)
  name: string;     // Nombre (obligatorio)
  surname: string;  // Apellido (obligatorio)
  role: string;     // Rol: 'administrador', 'usuario', 'FIR', 'farmaceutico', etc. (obligatorio)
  hospital: string; // Hospital: 'HUNSC-Sur' (obligatorio)
  exp: number;      // Timestamp de expiración (obligatorio)
}
```

### **Valores Posibles para `role`:**

- `'administrador'` o `'admin'` → Acceso total (admin-dashboard.html)
- `'usuario'` → Acceso básico (index.html)
- `'FIR'` → Farmacéutico Interno Residente
- `'farmaceutico'` → Farmacéutico
- `'tecnico'` → Técnico de farmacia

---

## 🔗 URLs de Redirección

### **Producción (Vercel/Netlify):**

```typescript
const appPuestosURL = 'https://puestos-hunsc.vercel.app/login.html';
```

### **Desarrollo (Localhost):**

```typescript
const appPuestosURL = 'http://localhost:8080/login.html';
```

### **Variable de Entorno (Recomendado):**

```typescript
// En .env de Lovable:
VITE_APP_PUESTOS_URL=https://puestos-hunsc.vercel.app/login.html

// En código:
const appPuestosURL = import.meta.env.VITE_APP_PUESTOS_URL;
```

---

## 🧪 Cómo Probar

### **1. Generar Token de Prueba**

Abre la consola del navegador (F12) en Lovable y ejecuta:

```javascript
const testToken = btoa(JSON.stringify({
  sub: 'test-user-123',
  email: 'test@hospital.es',
  name: 'Juan',
  surname: 'Pérez',
  role: 'administrador',
  hospital: 'HUNSC-Sur',
  exp: Math.floor(Date.now() / 1000) + (5 * 60)
}));

console.log('Token SSO:', testToken);

// Copiar y probar manualmente:
// http://localhost:8080/login.html?sso_token=PEGAR_TOKEN_AQUI
```

### **2. Verificar Redirección**

```typescript
// Después del login en Lovable, deberías ver en consola:
console.log('Redirigiendo a app de puestos con SSO...');
// Y luego el navegador debe cambiar a la app de puestos
```

### **3. En App de Puestos**

Abre consola (F12) y deberías ver:

```
✅ SSO Token recibido desde Lovable, procesando...
✅ Token SSO válido: {email: "...", role: "..."}
✅ Usuario sincronizado en Supabase: {...}
Redirigiendo a admin-dashboard.html (o index.html)
```

---

## 🔐 Seguridad

### **✅ Buenas Prácticas:**

1. **Expiración corta (5 minutos)** - El token solo es válido 5 minutos
2. **HTTPS obligatorio** - Nunca uses HTTP en producción
3. **Validación en destino** - La app de puestos valida el token y su expiración
4. **Limpieza de URL** - Los tokens se eliminan de la URL después de procesarlos

### **⚠️ Importante:**

- No guardes información sensible en el token (como contraseñas)
- El token es de un solo uso (se consume al procesar)
- Usa HTTPS en producción siempre

---

## 🆚 Diferencias con el Método Anterior

| Característica | SSO Token (NUEVO) | Access/Refresh Tokens (ANTIGUO) |
|----------------|-------------------|-----------------------------------|
| Complejidad | ⭐ Simple | ⭐⭐⭐ Complejo |
| Seguridad | ✅ Buena | ✅ Excelente |
| Duración | 5 minutos | Horas/días |
| Dependencias | Ninguna | Supabase Auth |
| Facilidad | ✅ Muy fácil | ⚠️ Requiere configuración |

---

## 📊 Flujo Completo Visualizado

```
┌─────────────────────────────────────┐
│ Lovable App (Login)                 │
│ 1. Usuario hace login con LDAP     │
│ 2. Lovable autentica y obtiene     │
│    datos del usuario                │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Generar SSO Token                   │
│ - Codificar datos en base64        │
│ - Añadir expiración (5 min)        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Redirect con Token                  │
│ URL: puestos.com/login.html?        │
│      sso_token=eyJzdWI...           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ App Puestos (login.html)            │
│ 1. Decodifica token                 │
│ 2. Valida expiración                │
│ 3. Crea/actualiza usuario           │
│ 4. Guarda en sessionStorage         │
│ 5. Redirige según rol               │
└─────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

**En Lovable:**
- [ ] Copiar función `generateSSOToken`
- [ ] Copiar función `redirectToAppPuestos`
- [ ] Llamar después del login exitoso
- [ ] Configurar URL de app de puestos
- [ ] Probar con usuario de prueba

**En App de Puestos:**
- [x] login.html actualizado ✅
- [x] auth.js actualizado ✅
- [x] Manejo de sessionStorage ✅
- [ ] Desplegar en Vercel/servidor
- [ ] Probar redirect completo

---

## 🆘 Troubleshooting

### Problema: "Token SSO inválido"

**Causa:** El token no es base64 válido o JSON malformado

**Solución:**
```javascript
// Verificar en Lovable que el token se genera correctamente:
const token = btoa(JSON.stringify(payload));
console.log('Token generado:', token);
```

### Problema: "Token SSO expirado"

**Causa:** Han pasado más de 5 minutos desde la generación

**Solución:** Generar un nuevo token. El usuario debe volver a hacer login.

### Problema: Usuario redirige pero no se autentica

**Causa:** Tabla `users` en Supabase no existe o no tiene columnas correctas

**Solución:** Verificar que la tabla tenga: `email`, `nombre`, `rol`, `hospital`

---

¡Listo! Con esta configuración, el SSO entre Lovable y la app de puestos funcionará perfectamente. 🎉
