# ⚙️ Configuración Rápida de n8n para SSO + LDAP

## 🚀 Inicio Rápido (5 minutos)

### 1. Importar Workflow

1. Abre n8n
2. Click en **"+"** → **"Import from File"**
3. Selecciona: `n8n-workflow-sso-ldap.json`
4. El workflow se carga automáticamente

---

### 2. Configurar Credenciales LDAP

1. Click en el nodo **"LDAP - Autenticar"**
2. En "Credential to connect with", click **"Create New"**
3. Llena los datos:

```
Credential Name: LDAP HUNSC
Host: ldap.hunsc.es           ← Tu servidor LDAP
Port: 389                      ← 389 (LDAP) o 636 (LDAPS)
Base DN: dc=hunsc,dc=es        ← Base DN de tu organización

# Opcional (si tu LDAP requiere bind):
Bind DN: cn=admin,dc=hunsc,dc=es
Bind Password: tu_password_admin
```

4. Click **"Save"**

---

### 3. Configurar Credenciales Supabase (Postgres)

1. Click en el nodo **"Supabase - Sincronizar Usuario"**
2. En "Credential to connect with", click **"Create New"**
3. Llena los datos:

```
Credential Name: Supabase HUNSC
Host: db.julrvkllcifpcdyvbikr.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: TU_SUPABASE_PASSWORD
SSL: Enabled (activar checkbox)
```

**¿Dónde obtener estos datos?**
1. Ve a tu dashboard de Supabase
2. Project Settings → Database
3. Copia **Connection string**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.julrvkllcifpcdyvbikr.supabase.co:5432/postgres
   ```
4. Extrae:
   - Host: `db.julrvkllcifpcdyvbikr.supabase.co`
   - Password: `[YOUR-PASSWORD]`

4. Click **"Save"**

---

### 4. Activar Workflow

1. En la esquina superior derecha, activa el toggle **"Active"**
2. Copia la **Webhook URL** del primer nodo:
   ```
   https://tu-n8n-instance.com/webhook/auth/sso-login
   ```
3. Guarda esta URL (la usarás en Lovable)

---

### 5. Probar el Webhook

Desde terminal o Postman:

```bash
curl -X POST https://tu-n8n-instance.com/webhook/auth/sso-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hunsc.es",
    "password": "test123",
    "name": "Test",
    "surname": "Usuario"
  }'
```

**Respuesta esperada si LDAP OK:**
```json
{
  "success": true,
  "ssoToken": "eyJzdWIiOiJ0ZXN0QGh1bnNjLmVzIi...",
  "user": {
    "email": "test@hunsc.es",
    "name": "Test",
    "surname": "Usuario",
    "role": "usuario"
  }
}
```

**Respuesta si LDAP falla:**
```json
{
  "success": false,
  "error": "Credenciales LDAP inválidas",
  "code": "LDAP_AUTH_FAILED"
}
```

---

## 🔧 Personalizar Roles

### Cambiar Mapeo de Grupos LDAP → Roles

1. Click en el nodo **"Generar SSO Token"**
2. Edita el código JavaScript:

```javascript
// Busca esta sección:
if (ldapData.memberOf) {
  const groups = Array.isArray(ldapData.memberOf) ? ldapData.memberOf : [ldapData.memberOf];

  if (groups.some(g => g.includes('CN=Administradores') || g.includes('CN=Admins'))) {
    role = 'administrador';
  } else if (groups.some(g => g.includes('CN=Farmaceuticos'))) {
    role = 'farmaceutico';
  } else if (groups.some(g => g.includes('CN=FIR'))) {
    role = 'FIR';
  }
}
```

**Añadir nuevo rol:**
```javascript
else if (groups.some(g => g.includes('CN=Tecnicos'))) {
  role = 'tecnico';
}
```

**Cambiar nombre del grupo:**
```javascript
// Si en tu LDAP el grupo es "CN=Admins,OU=..."
if (groups.some(g => g.includes('CN=Admins'))) {
  role = 'administrador';
}
```

3. Click **"Save"** (arriba a la derecha)

---

## 🔒 Configurar CORS (Seguridad)

Para que Lovable pueda enviar requests a n8n:

1. Click en el nodo **"Webhook - Recibir Login"**
2. Scroll hasta **"Options"**
3. Añade **"Response Headers"**:

```
Header Name: Access-Control-Allow-Origin
Header Value: https://farma-frello-colabora.lovable.app
```

O si quieres permitir cualquier origen (menos seguro):
```
Header Value: *
```

4. Añade también:
```
Header Name: Access-Control-Allow-Methods
Header Value: POST, OPTIONS

Header Name: Access-Control-Allow-Headers
Header Value: Content-Type
```

---

## 🔍 Ver Logs de Ejecución

1. Click en **"Executions"** (esquina superior derecha)
2. Verás lista de todas las ejecuciones
3. Click en una ejecución para ver detalles:
   - ✅ Verde: Nodo ejecutado correctamente
   - ❌ Rojo: Nodo con error
   - ⏸️ Gris: Nodo no ejecutado (rama alternativa)

### Debugging

Para cada nodo puedes ver:
- **Input**: Datos que recibió
- **Output**: Datos que generó

Ejemplo en nodo "LDAP - Autenticar":
```json
// Input:
{
  "email": "test@hunsc.es",
  "password": "test123"
}

// Output (si exitoso):
{
  "mail": "test@hunsc.es",
  "givenName": "Test",
  "sn": "Usuario",
  "memberOf": ["CN=Farmaceuticos,OU=Groups,DC=hunsc,DC=es"]
}
```

---

## ⚡ Optimizaciones

### Cambiar Tiempo de Expiración del Token

Por defecto el token expira en 5 minutos. Para cambiar:

1. Click en nodo **"Generar SSO Token"**
2. Busca:
   ```javascript
   exp: Math.floor(Date.now() / 1000) + (5 * 60)
   //                                      ↑ minutos
   ```
3. Cambia `5` por el número de minutos deseado:
   - `10` → 10 minutos
   - `30` → 30 minutos
   - `60` → 1 hora (no recomendado por seguridad)

---

### Añadir más Atributos LDAP

Si necesitas extraer más datos del usuario:

1. Click en nodo **"LDAP - Autenticar"**
2. En campo **"Attributes"**, añade más atributos separados por coma:
   ```
   mail,cn,sn,givenName,memberOf,telephoneNumber,department
   ```
3. En nodo **"Generar SSO Token"**, usa esos datos:
   ```javascript
   const ssoPayload = {
     // ... campos existentes ...
     phone: ldapData.telephoneNumber || '',
     department: ldapData.department || ''
   };
   ```

---

### Añadir Logs Personalizados

Para debugging, añade nodos **"Function"** con console.log:

```javascript
console.log('Usuario:', $json.email);
console.log('Grupos LDAP:', $json.memberOf);
console.log('Rol asignado:', $json.role);
return $input.all();
```

Los logs aparecerán en:
- n8n → Executions → [Ejecución] → Nodo → Browser Console

---

## 🆘 Errores Comunes

### Error: "Cannot connect to LDAP"

**Causa**: n8n no puede alcanzar el servidor LDAP

**Solución**:
1. Verifica que el host es correcto: `ldap.hunsc.es`
2. Verifica el puerto: 389 (LDAP) o 636 (LDAPS)
3. Asegúrate de que n8n tiene acceso de red al servidor LDAP
4. Prueba conectividad:
   ```bash
   telnet ldap.hunsc.es 389
   ```

---

### Error: "Invalid credentials"

**Causa**: Credenciales de Postgres (Supabase) incorrectas

**Solución**:
1. Ve a Supabase → Settings → Database
2. Verifica password de Postgres
3. Actualiza credencial en n8n
4. Prueba conexión desde terminal:
   ```bash
   psql "postgresql://postgres:[PASSWORD]@db.julrvkllcifpcdyvbikr.supabase.co:5432/postgres"
   ```

---

### Error: "Table users does not exist"

**Causa**: La tabla `users` no existe en Supabase

**Solución**:
1. Ve a Supabase → SQL Editor
2. Ejecuta:
   ```sql
   CREATE TABLE IF NOT EXISTS users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     nombre VARCHAR(255),
     rol VARCHAR(50) NOT NULL,
     hospital VARCHAR(100) DEFAULT 'HUNSC-Sur',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

O usa el script completo: `supabase-setup.sql`

---

### Webhook retorna "Workflow is waiting for webhook call"

**Causa**: El workflow no está activado

**Solución**:
1. Activa el toggle **"Active"** en la esquina superior derecha
2. El webhook debe cambiar a estado "Listening"

---

## ✅ Checklist Final

- [ ] Workflow importado
- [ ] Credencial LDAP configurada y guardada
- [ ] Credencial Supabase (Postgres) configurada y guardada
- [ ] Roles personalizados según tu estructura LDAP
- [ ] CORS configurado para permitir requests desde Lovable
- [ ] Workflow activado (toggle Active ON)
- [ ] Webhook URL copiada
- [ ] Test del webhook exitoso con curl/Postman
- [ ] Verificado en "Executions" que funciona correctamente

---

## 📝 Siguiente Paso

Una vez configurado n8n, ve a:
**`LOVABLE_BOTON_N8N.md`** → Añadir botón en Lovable

---

¡Configuración de n8n completada! 🎉
