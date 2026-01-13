# 🔘 Botón en Lovable para SSO con n8n + LDAP

## 📋 Código para Lovable

### **Opción 1: Botón Simple (Recomendado)**

Añade este código en tu componente de Lovable donde quieras el botón:

```tsx
// LoginPage.tsx o Dashboard.tsx en Lovable

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function RedirectToPuestosButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRedirect = async () => {
    setIsLoading(true);

    try {
      // 1. Obtener usuario actual de Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error('No hay sesión activa. Por favor, inicia sesión primero.');
        return;
      }

      // 2. Obtener datos completos del usuario
      const { data: userData, error: dataError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();

      if (dataError || !userData) {
        toast.error('No se encontraron datos del usuario.');
        return;
      }

      // 3. Construir payload para n8n
      const payload = {
        email: userData.email,
        password: sessionStorage.getItem('user_ldap_password') || '', // Ver nota abajo
        name: userData.nombre?.split(' ')[0] || 'Usuario',
        surname: userData.nombre?.split(' ').slice(1).join(' ') || '',
        userId: userData.id
      };

      // 4. Enviar a n8n
      toast.loading('Conectando con sistema de puestos...');

      const n8nWebhookURL = import.meta.env.VITE_N8N_WEBHOOK_URL ||
                            'https://tu-n8n-instance.com/webhook/auth/sso-login';

      const response = await fetch(n8nWebhookURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!result.success) {
        toast.error('Error de autenticación: ' + (result.error || 'Error desconocido'));
        return;
      }

      // 5. Redirigir con token SSO
      const appPuestosURL = import.meta.env.VITE_APP_PUESTOS_URL ||
                            'https://puestos-hunsc.vercel.app/login.html';

      toast.success('¡Redirigiendo a sistema de puestos!');

      window.location.href = `${appPuestosURL}?sso_token=${result.ssoToken}`;

    } catch (error) {
      console.error('Error en redirect:', error);
      toast.error('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRedirect}
      disabled={isLoading}
      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <span className="inline-block animate-spin mr-2">⏳</span>
          Conectando...
        </>
      ) : (
        <>
          🏥 Ir a Sistema de Puestos
        </>
      )}
    </button>
  );
}

export default RedirectToPuestosButton;
```

---

## ⚠️ Importante: Manejo de Password LDAP

El password de LDAP **NO debe guardarse** en Supabase por seguridad. Tienes 3 opciones:

### **Opción A: Guardar temporalmente en sessionStorage (Recomendada)**

Cuando el usuario hace login con LDAP en Lovable:

```typescript
// En tu función de login LDAP en Lovable
async function loginWithLDAP(email, password) {
  // ... tu código de autenticación LDAP ...

  if (loginSuccess) {
    // Guardar password temporalmente SOLO en sessionStorage (se borra al cerrar pestaña)
    sessionStorage.setItem('user_ldap_password', password);

    // Continuar con el flujo normal...
  }
}
```

### **Opción B: Usar Token de Sesión (Más Segura)**

Si n8n puede validar contra LDAP usando un token de sesión:

```typescript
const payload = {
  email: userData.email,
  sessionToken: session.access_token, // Token de Supabase
  name: userData.nombre?.split(' ')[0] || 'Usuario',
  surname: userData.nombre?.split(' ').slice(1).join(' ') || ''
};
```

Entonces en n8n, en lugar de autenticar con password, validas el token.

### **Opción C: Prompt al Usuario (Más Segura pero menos UX)**

Pedir el password al momento de hacer el redirect:

```typescript
const handleRedirect = async () => {
  // Mostrar modal/prompt para pedir password
  const password = prompt('Ingresa tu contraseña para acceder al sistema de puestos:');

  if (!password) {
    toast.error('Password requerido');
    return;
  }

  const payload = {
    email: userData.email,
    password: password,
    // ...
  };

  // Enviar a n8n...
};
```

---

## 🔧 Variables de Entorno en Lovable

Crea un archivo `.env` en tu proyecto de Lovable:

```bash
# .env en Lovable
VITE_N8N_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/auth/sso-login
VITE_APP_PUESTOS_URL=https://puestos-hunsc.vercel.app/login.html
```

O configúralas en el dashboard de Lovable en **Settings → Environment Variables**.

---

## 🎯 Opción 2: Botón con Modal de Confirmación

Si quieres una UX más profesional:

```tsx
import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';

function RedirectToPuestosButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmRedirect = async () => {
    setIsLoading(true);
    setShowConfirm(false);

    // ... mismo código de arriba ...
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
      >
        🏥 Ir a Sistema de Puestos
      </button>

      {showConfirm && (
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">¿Acceder al Sistema de Puestos?</h3>
            <p className="text-gray-600 mb-6">
              Serás redirigido automáticamente al sistema de gestión de puestos y guardias.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmRedirect}
                disabled={isLoading}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Conectando...' : 'Sí, continuar'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}

export default RedirectToPuestosButton;
```

---

## 📊 Flujo Completo

```
┌─────────────────────────────────────┐
│ Lovable App                         │
│ 1. Usuario pulsa botón              │
│ 2. Obtiene datos de Supabase        │
│ 3. Construye payload con email +    │
│    password (LDAP)                  │
└────────────┬────────────────────────┘
             │ POST /webhook/auth/sso-login
             ▼
┌─────────────────────────────────────┐
│ n8n Workflow                        │
│ 1. Recibe payload                   │
│ 2. Valida contra LDAP               │
│ 3. Extrae rol desde grupos LDAP     │
│ 4. Genera SSO token (base64)        │
│ 5. Sincroniza usuario en Supabase   │
│ 6. Retorna { success, ssoToken }    │
└────────────┬────────────────────────┘
             │ Response JSON
             ▼
┌─────────────────────────────────────┐
│ Lovable App                         │
│ 1. Recibe respuesta                 │
│ 2. window.location.href =           │
│    puestos.com?sso_token=xxx        │
└────────────┬────────────────────────┘
             │ Redirect
             ▼
┌─────────────────────────────────────┐
│ App Puestos (login.html)            │
│ 1. Decodifica sso_token             │
│ 2. Guarda en sessionStorage         │
│ 3. Redirige según rol               │
│    (admin-dashboard o index)        │
└─────────────────────────────────────┘
```

---

## 🧪 Probar el Flujo

### Test 1: Verificar URL de n8n

```javascript
// En consola de Lovable (F12)
fetch('https://tu-n8n-instance.com/webhook/auth/sso-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@hunsc.es',
    password: 'test123',
    name: 'Test',
    surname: 'Usuario'
  })
})
  .then(r => r.json())
  .then(console.log);
```

### Test 2: Verificar Token Generado

```javascript
// Después de recibir respuesta de n8n
const token = 'eyJzdWI...'; // Token recibido
const decoded = JSON.parse(atob(token));
console.log('Token decodificado:', decoded);

// Debe mostrar:
// {
//   sub: "email@hunsc.es",
//   email: "email@hunsc.es",
//   name: "Nombre",
//   surname: "Apellido",
//   role: "administrador",
//   hospital: "HUNSC-Sur",
//   exp: 1234567890
// }
```

---

## ✅ Checklist de Implementación en Lovable

- [ ] Copiar componente `RedirectToPuestosButton`
- [ ] Importar en la página donde quieres el botón
- [ ] Configurar variables de entorno (n8n URL, app puestos URL)
- [ ] Decidir cómo manejar el password LDAP (sessionStorage recomendado)
- [ ] Probar con usuario de prueba
- [ ] Verificar que redirige correctamente
- [ ] Verificar logs en consola del navegador

---

## 🆘 Troubleshooting

### Error: "CORS blocked"

Configura CORS en n8n:
- En el nodo Webhook, añadir header: `Access-Control-Allow-Origin: *`

### Error: "user_ldap_password not found"

El password no está en sessionStorage. Usa Opción B (token) o C (prompt).

### Error: "LDAP_AUTH_FAILED"

Credenciales LDAP incorrectas. Verifica que el password sea correcto.

---

¡Listo! Con este código, el botón en Lovable enviará a n8n, validará con LDAP, y redirigirá automáticamente. 🎉
