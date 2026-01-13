# 🔐 SSO con n8n + LDAP - Guía Completa

## 📋 Resumen del Flujo

Este sistema implementa **Single Sign-On (SSO)** automático usando:
- **n8n** como middleware de autenticación
- **LDAP** para validar credenciales
- **Supabase** para persistir usuarios
- **Token SSO** para transferir sesión entre aplicaciones

**Beneficio**: El usuario NO tiene que loguearse múltiples veces. Hace login una vez en Lovable, y accede automáticamente a la app de puestos.

---

## 🎯 Arquitectura del Sistema

```
┌───────────────────────────────────────────────────────────────┐
│  USUARIO                                                       │
│  1. Inicia sesión en Lovable (email + password)               │
│  2. Pulsa botón "Ir a Sistema de Puestos"                     │
└────────────┬──────────────────────────────────────────────────┘
             │
             │ POST /webhook/auth/sso-login
             │ Body: { email, password, name, surname }
             ▼
┌───────────────────────────────────────────────────────────────┐
│  n8n WORKFLOW                                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  1. Recibe datos del usuario                            │ │
│  │  2. Valida contra LDAP (cn=email, password)             │ │
│  │  3. Extrae grupos de LDAP → Determina rol              │ │
│  │  4. Genera SSO Token (base64 JWT)                       │ │
│  │  5. Sincroniza usuario en Supabase (users table)        │ │
│  │  6. Retorna: { success: true, ssoToken: "..." }        │ │
│  └─────────────────────────────────────────────────────────┘ │
└────────────┬──────────────────────────────────────────────────┘
             │
             │ Response: { success, ssoToken }
             ▼
┌───────────────────────────────────────────────────────────────┐
│  LOVABLE APP                                                   │
│  1. Recibe respuesta de n8n                                   │
│  2. Redirige: window.location.href =                          │
│     https://puestos-hunsc.com/login.html?sso_token=xxx        │
└────────────┬──────────────────────────────────────────────────┘
             │
             │ Browser Redirect con Token
             ▼
┌───────────────────────────────────────────────────────────────┐
│  APP PUESTOS (login.html)                                      │
│  1. Detecta sso_token en URL                                  │
│  2. Decodifica token (base64 → JSON)                          │
│  3. Valida expiración (5 minutos)                             │
│  4. Busca/crea usuario en Supabase                            │
│  5. Guarda sesión en sessionStorage                           │
│  6. Limpia URL (quita token)                                  │
│  7. Redirige según rol:                                       │
│     → Administrador → admin-dashboard.html                    │
│     → Usuario → index.html                                    │
└───────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Configuración Paso a Paso

### **Paso 1: Configurar LDAP en n8n**

1. Abre n8n y ve a **Credentials**
2. Crea nueva credencial tipo **LDAP**
3. Configura:
   ```
   Host: ldap.hunsc.es (o tu servidor LDAP)
   Port: 389 (o 636 para LDAPS)
   Base DN: dc=hunsc,dc=es
   Bind DN: cn=admin,dc=hunsc,dc=es (opcional)
   Bind Password: tu_password_admin (opcional)
   ```
4. Guarda como **"LDAP HUNSC"**

---

### **Paso 2: Configurar Supabase en n8n**

1. Ve a **Credentials** en n8n
2. Crea nueva credencial tipo **Postgres**
3. Configura:
   ```
   Host: db.julrvkllcifpcdyvbikr.supabase.co
   Port: 5432
   Database: postgres
   User: postgres
   Password: tu_supabase_password
   SSL: true
   ```
4. Guarda como **"Supabase HUNSC"**

Para obtener estos datos:
- Dashboard de Supabase → Settings → Database
- **Connection string**: copia Host, User, Password

---

### **Paso 3: Importar Workflow en n8n**

1. Abre n8n
2. Click en **"+"** → **Import from File**
3. Selecciona: `n8n-workflow-sso-ldap.json`
4. El workflow se importará con todos los nodos

**Nodos del Workflow**:
- 🎣 **Webhook** - Recibe POST de Lovable
- ✅ **Validar Payload** - Verifica datos requeridos
- 🔐 **LDAP Autenticar** - Valida contra LDAP
- ❓ **¿LDAP OK?** - Verifica si autenticación exitosa
- 🎫 **Generar SSO Token** - Crea token base64
- 💾 **Supabase Sincronizar** - Guarda usuario en BD
- ✅ **Respuesta Éxito** - Retorna token
- ❌ **Respuesta Error** - Retorna error

---

### **Paso 4: Activar Webhook en n8n**

1. Haz click en el nodo **"Webhook - Recibir Login"**
2. Copia la **Webhook URL**, ejemplo:
   ```
   https://tu-n8n-instance.com/webhook/auth/sso-login
   ```
3. Activa el workflow (toggle en la esquina superior derecha)

---

### **Paso 5: Configurar Variables en Lovable**

En tu proyecto de Lovable, añade variables de entorno:

```bash
# .env en Lovable
VITE_N8N_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/auth/sso-login
VITE_APP_PUESTOS_URL=https://puestos-hunsc.vercel.app/login.html
```

O configúralas en:
- Dashboard de Lovable → Settings → Environment Variables

---

### **Paso 6: Añadir Botón en Lovable**

Ver código completo en: **`LOVABLE_BOTON_N8N.md`**

Resumen rápido:
```tsx
// Componente de botón en Lovable
<button onClick={handleRedirect}>
  🏥 Ir a Sistema de Puestos
</button>

// Función
const handleRedirect = async () => {
  // 1. Obtener usuario de Supabase
  // 2. Enviar POST a n8n webhook
  // 3. Recibir ssoToken
  // 4. Redirigir con token
  window.location.href = `${appURL}?sso_token=${token}`;
};
```

---

## 🔑 Estructura del SSO Token

El token que genera n8n es un **JSON codificado en base64**:

```javascript
// Payload del token
{
  sub: "usuario@hunsc.es",        // ID del usuario (email)
  email: "usuario@hunsc.es",      // Email
  name: "Juan",                   // Nombre
  surname: "Pérez García",        // Apellidos
  role: "administrador",          // Rol extraído de grupos LDAP
  hospital: "HUNSC-Sur",          // Hospital
  exp: 1234567890                 // Timestamp de expiración (5 min)
}

// Codificado en base64:
const token = Buffer.from(JSON.stringify(payload)).toString('base64');
// Resultado: eyJzdWIiOiJ1c3VhcmlvQGh1bnNjLmVzIiwiZW1haWwiOiJ1c3VhcmlvQGh1bnNjLmVzIiwibmFtZSI6Ikp1YW4iLCJzdXJuYW1lIjoiUMOpcmV6IEdhcmPDrWEiLCJyb2xlIjoiYWRtaW5pc3RyYWRvciIsImhvc3BpdGFsIjoiSFVOU0MtU3VyIiwiZXhwIjoxMjM0NTY3ODkwfQ==
```

---

## 🔒 Mapeo de Roles desde LDAP

n8n extrae el rol automáticamente desde los grupos LDAP del usuario:

| Grupo LDAP | Rol Asignado |
|------------|--------------|
| `CN=Administradores,OU=Users,DC=hunsc,DC=es` | `administrador` |
| `CN=Admins,OU=Users,DC=hunsc,DC=es` | `administrador` |
| `CN=Farmaceuticos,OU=Users,DC=hunsc,DC=es` | `farmaceutico` |
| `CN=FIR,OU=Users,DC=hunsc,DC=es` | `FIR` |
| Cualquier otro | `usuario` |

**Personalizar Roles**:

Edita el nodo **"Generar SSO Token"** en n8n:

```javascript
// En n8n, nodo "Generar SSO Token"
let role = 'usuario';

if (ldapData.memberOf) {
  const groups = Array.isArray(ldapData.memberOf) ? ldapData.memberOf : [ldapData.memberOf];

  if (groups.some(g => g.includes('CN=Administradores') || g.includes('CN=Admins'))) {
    role = 'administrador';
  } else if (groups.some(g => g.includes('CN=Farmaceuticos'))) {
    role = 'farmaceutico';
  } else if (groups.some(g => g.includes('CN=FIR'))) {
    role = 'FIR';
  } else if (groups.some(g => g.includes('CN=Tecnicos'))) {
    role = 'tecnico'; // ← Añadir rol nuevo
  }
}
```

---

## 🧪 Probar el Sistema

### **Test 1: Verificar Webhook de n8n**

Desde la terminal o Postman:

```bash
curl -X POST https://tu-n8n-instance.com/webhook/auth/sso-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hunsc.es",
    "password": "password123",
    "name": "Test",
    "surname": "Usuario"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "ssoToken": "eyJzdWIiOiJ0ZXN0QGh1bnNjLmVzIiwiZW1haWwiOiJ0ZXN0QGh1bnNjLmVzIiwibmFtZSI6IlRlc3QiLCJzdXJuYW1lIjoiVXN1YXJpbyIsInJvbGUiOiJ1c3VhcmlvIiwiaG9zcGl0YWwiOiJIVU5TQy1TdXIiLCJleHAiOjEyMzQ1Njc4OTB9",
  "user": {
    "email": "test@hunsc.es",
    "name": "Test",
    "surname": "Usuario",
    "role": "usuario"
  }
}
```

---

### **Test 2: Decodificar Token**

En consola del navegador (F12):

```javascript
const token = "eyJzdWIiOiJ0ZXN0..."; // Token recibido
const decoded = JSON.parse(atob(token));
console.log('Token decodificado:', decoded);
```

Debe mostrar:
```javascript
{
  sub: "test@hunsc.es",
  email: "test@hunsc.es",
  name: "Test",
  surname: "Usuario",
  role: "usuario",
  hospital: "HUNSC-Sur",
  exp: 1234567890
}
```

---

### **Test 3: Probar Flujo Completo**

1. Abre Lovable: `https://farma-frello-colabora.lovable.app`
2. Haz login con tus credenciales LDAP
3. Pulsa el botón **"Ir a Sistema de Puestos"**
4. Verifica en consola del navegador (F12):
   ```
   ✅ SSO Token recibido (desde n8n/Lovable), procesando...
   🔐 Token generado y validado por n8n con LDAP
   ✅ Token SSO válido: {email: "...", role: "..."}
   ✅ Usuario encontrado en la base de datos
   ✅ Sesión guardada en sessionStorage
   Redirigiendo a admin-dashboard.html
   ```
5. Debes ser redirigido automáticamente sin hacer login de nuevo

---

## 🔧 Configuración de LDAP

### Estructura LDAP Esperada

```
dc=hunsc,dc=es
├── ou=Users
│   ├── cn=Juan Pérez,ou=Users,dc=hunsc,dc=es
│   │   ├── mail: juan.perez@hunsc.es
│   │   ├── givenName: Juan
│   │   ├── sn: Pérez García
│   │   └── memberOf: CN=Administradores,OU=Groups,DC=hunsc,DC=es
│   └── cn=María López,ou=Users,dc=hunsc,dc=es
│       ├── mail: maria.lopez@hunsc.es
│       ├── givenName: María
│       ├── sn: López Martínez
│       └── memberOf: CN=FIR,OU=Groups,DC=hunsc,DC=es
└── ou=Groups
    ├── CN=Administradores,ou=Groups,dc=hunsc,dc=es
    ├── CN=Farmaceuticos,ou=Groups,dc=hunsc,dc=es
    └── CN=FIR,ou=Groups,dc=hunsc,dc=es
```

### Atributos LDAP Utilizados

| Atributo LDAP | Uso en Token SSO |
|---------------|------------------|
| `mail` | `email` |
| `givenName` | `name` |
| `sn` | `surname` |
| `memberOf` | Extracción de `role` |

---

## ⚠️ Seguridad

### ✅ Buenas Prácticas Implementadas

1. **Token de corta duración** (5 minutos)
2. **HTTPS obligatorio** en producción
3. **Password no se guarda** en cliente (solo se envía a n8n)
4. **Validación LDAP** centralizada en n8n
5. **Token se elimina de URL** después de procesar
6. **sessionStorage** (se borra al cerrar pestaña)

### ⚠️ Consideraciones

- **NO** uses HTTP en producción, solo HTTPS
- **NO** guardes passwords de LDAP en localStorage
- **NO** compartas el service_role key de Supabase
- **SÍ** usa LDAPS (LDAP over SSL) si está disponible
- **SÍ** configura CORS en n8n para permitir solo tu dominio

### Configurar CORS en n8n

En el nodo **"Webhook - Recibir Login"**:
- Options → Response Headers →
  ```
  Access-Control-Allow-Origin: https://farma-frello-colabora.lovable.app
  Access-Control-Allow-Methods: POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type
  ```

---

## 🆘 Troubleshooting

### Problema: "CORS blocked"

**Causa**: n8n no permite requests desde Lovable

**Solución**: Configurar CORS en el webhook de n8n (ver arriba)

---

### Problema: "LDAP_AUTH_FAILED"

**Causa**: Credenciales LDAP incorrectas

**Solución**:
1. Verifica que el email existe en LDAP
2. Verifica que el password es correcto
3. Prueba autenticación LDAP directamente:
   ```bash
   ldapsearch -x -H ldap://ldap.hunsc.es -D "cn=test@hunsc.es,dc=hunsc,dc=es" -W -b "dc=hunsc,dc=es"
   ```

---

### Problema: "Token SSO expirado"

**Causa**: Han pasado más de 5 minutos desde que n8n generó el token

**Solución**: El usuario debe volver a pulsar el botón en Lovable

---

### Problema: "Usuario no encontrado en la base de datos"

**Causa**: El usuario no se sincronizó en Supabase

**Solución**:
1. Verifica que el nodo **"Supabase - Sincronizar Usuario"** se ejecutó en n8n
2. Verifica credenciales de Postgres en n8n
3. Verifica que la tabla `users` existe en Supabase
4. Revisa logs en n8n (cada nodo muestra input/output)

---

### Problema: "Password no disponible en sessionStorage"

**Causa**: El password de LDAP no se guardó al hacer login en Lovable

**Solución**:

Ver **`LOVABLE_BOTON_N8N.md`** → Sección "Manejo de Password LDAP"

Opciones:
1. Guardar en sessionStorage al login
2. Usar token de sesión en lugar de password
3. Pedir password al momento del redirect

---

## 📊 Logs y Debugging

### Ver Logs en n8n

1. Abre el workflow en n8n
2. Click en **"Executions"** (esquina superior derecha)
3. Verás todas las ejecuciones del workflow
4. Click en una ejecución para ver:
   - Input de cada nodo
   - Output de cada nodo
   - Errores si los hay

### Ver Logs en App de Puestos

Abre consola del navegador (F12) al cargar `login.html`:

```
✅ SSO Token recibido (desde n8n/Lovable), procesando...
🔐 Token generado y validado por n8n con LDAP
✅ Token SSO válido: {...}
🔍 Buscando usuario en tabla "users"...
✅ Usuario encontrado en la base de datos: {...}
✅ Datos del usuario para sesión: {...}
✅ Sesión guardada en sessionStorage: {...}
Redirigiendo a admin-dashboard.html
```

---

## ✅ Checklist de Implementación

### En n8n:
- [ ] Credencial LDAP configurada
- [ ] Credencial Supabase (Postgres) configurada
- [ ] Workflow `n8n-workflow-sso-ldap.json` importado
- [ ] Webhook URL copiada
- [ ] Workflow activado
- [ ] Test del webhook exitoso

### En Lovable:
- [ ] Variables de entorno configuradas (`VITE_N8N_WEBHOOK_URL`, `VITE_APP_PUESTOS_URL`)
- [ ] Componente `RedirectToPuestosButton` añadido
- [ ] Botón visible en la interfaz
- [ ] Manejo de password LDAP decidido (sessionStorage/token/prompt)
- [ ] Test del botón exitoso

### En App de Puestos:
- [ ] `login.html` actualizado (ya está ✅)
- [ ] `auth.js` actualizado (ya está ✅)
- [ ] Tabla `users` existe en Supabase
- [ ] Test del flujo completo exitoso

---

## 🎉 Resultado Final

Cuando todo esté configurado:

1. Usuario hace login **UNA SOLA VEZ** en Lovable con sus credenciales LDAP
2. Pulsa botón **"Ir a Sistema de Puestos"**
3. Es redirigido **AUTOMÁTICAMENTE** a la app de puestos, ya autenticado
4. **NO** tiene que volver a hacer login
5. El rol se asigna automáticamente desde grupos LDAP
6. Puede navegar libremente entre páginas sin perder la sesión

---

¿Necesitas ayuda? Revisa:
- **`n8n-workflow-sso-ldap.json`** - Workflow completo de n8n
- **`LOVABLE_BOTON_N8N.md`** - Código del botón en Lovable
- **`SSO_LOVABLE_GUIDE.md`** - Guía alternativa sin n8n (más simple)
- **`CONEXION_SUPABASE_README.md`** - Troubleshooting de Supabase

---

**¡Sistema SSO con n8n + LDAP completado!** 🎉🔐
