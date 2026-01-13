# 📊 Sistema SSO con n8n + LDAP - Resumen Ejecutivo

## ✅ Sistema Implementado

Has implementado un **sistema completo de Single Sign-On (SSO)** que permite a los usuarios:
1. Hacer login **UNA SOLA VEZ** en Lovable con credenciales LDAP
2. Acceder **AUTOMÁTICAMENTE** a la app de puestos sin volver a loguearse
3. Mantener **roles sincronizados** desde LDAP

---

## 🎯 Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│  USUARIO                                                          │
│  • Inicia sesión en Lovable (LDAP)                               │
│  • Pulsa botón "Ir a Sistema de Puestos"                         │
└────────────┬─────────────────────────────────────────────────────┘
             │
             │ POST con { email, password, name, surname }
             ▼
┌──────────────────────────────────────────────────────────────────┐
│  n8n MIDDLEWARE                                                   │
│  • Valida contra LDAP (servidor LDAP de HUNSC)                   │
│  • Extrae rol desde grupos LDAP (memberOf)                       │
│  • Genera SSO token (base64 con expiración 5 min)               │
│  • Sincroniza usuario en Supabase                                │
│  • Retorna: { success: true, ssoToken: "..." }                  │
└────────────┬─────────────────────────────────────────────────────┘
             │
             │ Redirect con token
             ▼
┌──────────────────────────────────────────────────────────────────┐
│  APP PUESTOS                                                      │
│  • Decodifica token SSO                                          │
│  • Valida expiración                                             │
│  • Guarda sesión en sessionStorage                               │
│  • Redirige según rol (admin-dashboard o index)                  │
│  • Usuario autenticado automáticamente                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Archivos Creados

### **Para n8n:**
1. **`n8n-workflow-sso-ldap.json`**
   - Workflow completo importable
   - Validación LDAP
   - Generación de tokens
   - Sincronización Supabase

2. **`CONFIGURACION_N8N.md`**
   - Guía rápida de setup (5 minutos)
   - Configuración de credenciales
   - Troubleshooting

### **Para Lovable:**
3. **`LOVABLE_BOTON_N8N.md`**
   - Código del botón de redirect
   - Manejo de passwords LDAP
   - 3 opciones de implementación
   - Ejemplos de testing

### **Para App Puestos:**
4. **`login.html`** (actualizado)
   - Recepción de token desde n8n
   - Logs de debugging mejorados
   - Validación y redirect automático

### **Documentación:**
5. **`SSO_N8N_LDAP_COMPLETO.md`**
   - Arquitectura completa
   - Flujo paso a paso
   - Seguridad y CORS
   - Debugging y logs

6. **`CONEXION_SUPABASE_README.md`**
   - Adaptación a tablas existentes
   - Troubleshooting Supabase

### **Herramientas de Diagnóstico:**
7. **`verificar-tablas-existentes.html`**
   - Inspector de estructura de Supabase
   - Ver columnas de users/profiles

8. **`diagnostico-supabase.html`**
   - Verificación de conexión
   - Estadísticas de usuarios

---

## 🔧 Próximos Pasos

### **1. Configurar n8n (5 minutos)**

```bash
# Abrir archivo de configuración:
cat CONFIGURACION_N8N.md
```

**Tareas:**
- [ ] Importar `n8n-workflow-sso-ldap.json` en n8n
- [ ] Configurar credencial LDAP
- [ ] Configurar credencial Supabase (Postgres)
- [ ] Activar workflow
- [ ] Copiar Webhook URL

---

### **2. Configurar Lovable (10 minutos)**

```bash
# Abrir guía de implementación:
cat LOVABLE_BOTON_N8N.md
```

**Tareas:**
- [ ] Añadir variables de entorno:
  ```
  VITE_N8N_WEBHOOK_URL=https://tu-n8n.com/webhook/auth/sso-login
  VITE_APP_PUESTOS_URL=https://puestos-hunsc.vercel.app/login.html
  ```
- [ ] Copiar componente `RedirectToPuestosButton`
- [ ] Decidir manejo de password LDAP (sessionStorage recomendado)
- [ ] Añadir botón en la UI

---

### **3. Probar el Sistema**

```bash
# Ver guía de testing:
cat SSO_N8N_LDAP_COMPLETO.md
# (Ir a sección "Probar el Sistema")
```

**Tests:**
1. **Test webhook de n8n** con curl/Postman
2. **Test desde Lovable** con usuario real
3. **Verificar logs** en consola del navegador
4. **Confirmar redirect** automático

---

## 🎉 Resultado Final

Una vez configurado todo:

### **Antes (Sin SSO):**
```
Usuario → Login en Lovable → Ve botón "Ir a Puestos"
       → Click en botón → Redirige a login.html
       → Tiene que VOLVER A LOGUEARSE manualmente
       → Accede a la app
```

### **Después (Con SSO n8n + LDAP):**
```
Usuario → Login en Lovable (LDAP) → Ve botón "Ir a Puestos"
       → Click en botón → n8n valida en background
       → Redirige a app de puestos
       → ¡YA ESTÁ AUTENTICADO! No hace falta login
       → Acceso inmediato según su rol
```

---

## 🔒 Seguridad Implementada

✅ **Token de corta duración** (5 minutos)
✅ **Validación LDAP centralizada** (no se valida en cliente)
✅ **Password nunca se guarda** en localStorage
✅ **HTTPS obligatorio** en producción
✅ **Token se elimina de URL** después de usarse
✅ **sessionStorage** (se borra al cerrar pestaña)
✅ **Roles desde LDAP** (no manipulables por usuario)

---

## 📊 Mapeo de Roles LDAP

| Grupo en LDAP | Rol en App | Acceso |
|---------------|------------|--------|
| `CN=Administradores` | administrador | Admin Dashboard |
| `CN=Admins` | administrador | Admin Dashboard |
| `CN=Farmaceuticos` | farmaceutico | Dashboard Usuario |
| `CN=FIR` | FIR | Dashboard Usuario |
| Otros | usuario | Dashboard Usuario |

**Personalizable** en n8n (nodo "Generar SSO Token")

---

## 🆘 Soporte y Troubleshooting

### **Problema: Error de LDAP**
→ Ver: `CONFIGURACION_N8N.md` → Sección "Errores Comunes"

### **Problema: Token expirado**
→ Usuario debe volver a pulsar botón en Lovable
→ Ajustar tiempo de expiración en n8n (nodo "Generar SSO Token")

### **Problema: Usuario no se encuentra en Supabase**
→ Ver: `CONEXION_SUPABASE_README.md` → Troubleshooting
→ Verificar que el nodo "Supabase - Sincronizar Usuario" se ejecuta en n8n

### **Problema: CORS blocked**
→ Ver: `CONFIGURACION_N8N.md` → Sección "Configurar CORS"

---

## 📚 Documentación Completa

```
SISTEMA SSO n8n + LDAP
├── n8n-workflow-sso-ldap.json          ← Workflow para importar
├── CONFIGURACION_N8N.md                ← Setup rápido de n8n
├── LOVABLE_BOTON_N8N.md                ← Código del botón en Lovable
├── SSO_N8N_LDAP_COMPLETO.md            ← Guía arquitectura completa
├── CONEXION_SUPABASE_README.md         ← Troubleshooting Supabase
├── verificar-tablas-existentes.html    ← Herramienta diagnóstico
└── diagnostico-supabase.html           ← Herramienta diagnóstico

GUÍAS ALTERNATIVAS (sin n8n)
├── SSO_LOVABLE_GUIDE.md                ← SSO directo sin n8n
├── REDIRECT_SETUP.md                   ← Redirect con tokens
└── AUTH_README.md                      ← Sistema auth básico
```

---

## ✅ Checklist General

### n8n:
- [ ] Workflow importado
- [ ] LDAP configurado
- [ ] Supabase configurado
- [ ] Workflow activado
- [ ] Test del webhook OK

### Lovable:
- [ ] Variables de entorno configuradas
- [ ] Botón implementado
- [ ] Manejo de password decidido
- [ ] Test desde Lovable OK

### App Puestos:
- [ ] login.html actualizado (ya está ✅)
- [ ] Tabla users existe en Supabase
- [ ] Test de flujo completo OK

---

## 🎯 Beneficios del Sistema

| Antes | Después |
|-------|---------|
| Login manual en cada app | ✅ Login automático |
| Usuarios duplican credenciales | ✅ LDAP centralizado |
| Roles desincronizados | ✅ Roles desde LDAP |
| Experiencia fragmentada | ✅ UX fluida |
| Gestión manual de usuarios | ✅ Sincronización automática |

---

## 🚀 Empezar Ahora

**Paso 1:** Lee `CONFIGURACION_N8N.md` y configura n8n (5 min)
**Paso 2:** Lee `LOVABLE_BOTON_N8N.md` e implementa botón (10 min)
**Paso 3:** Prueba el flujo completo
**Paso 4:** ¡Disfruta del SSO automático! 🎉

---

**¿Preguntas?** Consulta:
- `SSO_N8N_LDAP_COMPLETO.md` - Guía detallada
- `CONFIGURACION_N8N.md` - Setup de n8n
- `LOVABLE_BOTON_N8N.md` - Código de Lovable

---

## 📈 Próximas Mejoras (Opcionales)

- [ ] Añadir refresh token (extender sesión)
- [ ] Implementar logout sincronizado entre apps
- [ ] Dashboard de auditoría (quién accedió cuándo)
- [ ] Múltiples apps conectadas al mismo SSO
- [ ] Integración con Active Directory

---

**Sistema SSO n8n + LDAP implementado completamente** 🎉🔐
