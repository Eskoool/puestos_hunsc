# Sistema de Gestión de Guardias - Farmacia HUNSC-Sur

## Índice
1. [Contexto del Sistema](#contexto-del-sistema)
2. [Arquitectura y Tecnologías](#arquitectura-y-tecnologías)
3. [Base de Datos Supabase](#base-de-datos-supabase)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Página de Calendario (Usuario + Admin)](#página-de-calendario)
6. [Manager de Guardias](#manager-de-guardias)
7. [Estilos y Diseño](#estilos-y-diseño)
8. [Funcionalidades Específicas](#funcionalidades-específicas)

---

## Contexto del Sistema

Sistema de gestión de guardias farmacéuticas para **Farmacia HUNSC-Sur** en las Islas Canarias. Permite visualizar, asignar y gestionar turnos de guardia para farmacéuticos y FIR (Farmacéuticos Internos Residentes).

### Características Principales:

**Todos los Usuarios:**
- Ver calendario mensual de guardias
- Ver sus propias guardias destacadas
- Ver detalles de cada guardia (fecha, horarios, personas asignadas)
- Solicitar cambios de guardia con otros usuarios del mismo rol
- Navegación entre meses

**Solo Administradores:**
- Crear nuevas guardias
- Asignar farmacéuticos y FIR a fechas específicas
- Ver todas las guardias del sistema
- Gestionar estado de guardias (pendiente/confirmada)

---

## Arquitectura y Tecnologías

### Frontend:
- **HTML5** - Estructura semántica
- **Tailwind CSS 3** - Framework de estilos (vía CDN)
- **Vanilla JavaScript** - Sin frameworks
- **Material Symbols** - Iconos de Google

### Backend:
- **Supabase** - PostgreSQL con API REST
- **@supabase/supabase-js@2** - Cliente JavaScript
- **SSO Authentication** - Autenticación vía token

### Colores del Sistema:
```javascript
{
  "primary": "#5A0E6E",         // Púrpura principal
  "secondary": "#AF9100",       // Dorado
  "brand-accent": "#AF9100",
  "tertiary": "#D4AF37",        // Dorado claro
  "background-light": "#f5f7f8",
  "background-dark": "#101c22"
}
```

### Colores de Turnos:
```javascript
{
  "shift-manana": "bg-blue-100 border-blue-400",    // Mañana: Azul
  "shift-tarde": "bg-yellow-100 border-yellow-500", // Tarde: Amarillo
  "shift-noche": "bg-purple-100 border-purple-500", // Noche: Púrpura
  "shift-24h": "bg-green-100 border-green-500",     // 24h: Verde
  "my-shift": "bg-primary text-white border-primary" // Mi guardia: Púrpura oscuro
}
```

---

## Base de Datos Supabase

### Tabla Principal: `pharmacy_guards`

```sql
CREATE TABLE pharmacy_guards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guard_date DATE NOT NULL UNIQUE,
  pharmacist_1_id UUID REFERENCES users(id),
  pharmacist_2_id UUID REFERENCES users(id),
  fir_id UUID REFERENCES users(id),
  assigned_by UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmada', 'cancelada')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_guards_date ON pharmacy_guards(guard_date);
CREATE INDEX idx_guards_pharmacist1 ON pharmacy_guards(pharmacist_1_id);
CREATE INDEX idx_guards_pharmacist2 ON pharmacy_guards(pharmacist_2_id);
CREATE INDEX idx_guards_fir ON pharmacy_guards(fir_id);
CREATE INDEX idx_guards_status ON pharmacy_guards(status);

-- Constraint: No permitir que la misma persona esté en pharmacist_1 y pharmacist_2
ALTER TABLE pharmacy_guards ADD CONSTRAINT different_pharmacists
  CHECK (pharmacist_1_id IS NULL OR pharmacist_2_id IS NULL OR pharmacist_1_id != pharmacist_2_id);
```

### Tabla: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('empleado', 'administrador', 'farmaceutico', 'fir')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Relaciones:
- `pharmacy_guards.pharmacist_1_id` → `users.id` (Farmacéutico turno mañana)
- `pharmacy_guards.pharmacist_2_id` → `users.id` (Farmacéutico turno tarde)
- `pharmacy_guards.fir_id` → `users.id` (FIR asignado)
- `pharmacy_guards.assigned_by` → `users.id` (Admin que asignó)

### Lógica de Turnos:
- **Farmacéutico 1**: Turno de mañana (08:00-15:00)
- **Farmacéutico 2**: Turno de tarde (15:00-22:00)
- **FIR**: Turno de mañana (08:00-15:00)
- Un farmacéutico y un FIR pueden estar juntos en la misma guardia
- Los dos farmacéuticos NO pueden ser la misma persona

---

## Estructura de Archivos

```
/pages/
  └── guardias.html              # Página única (user + admin)

/js/
  ├── supabase-config.js         # Configuración Supabase
  └── guardias-manager.js        # Clase para operaciones CRUD

/assets/css/
  └── styles.css                 # Estilos adicionales
```

---

## Página de Calendario

### HTML Completo: `pages/guardias.html`

```html
<!DOCTYPE html>
<html class="light" lang="es">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Calendario de Guardias - Farmacia HUNSC Sur</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

  <script>
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "primary": "#5A0E6E",
            "secondary": "#AF9100",
            "brand-primary": "#5A0E6E",
            "brand-accent": "#AF9100",
            "tertiary": "#D4AF37",
            "background-light": "#f5f7f8",
            "background-dark": "#101c22",
          },
          fontFamily: {
            "display": ["Inter", "sans-serif"]
          },
          borderRadius: {
            "DEFAULT": "1rem",
            "lg": "1.5rem",
            "xl": "2rem",
            "full": "9999px"
          },
        },
      },
    }
  </script>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf0 100%);
      min-height: 100vh;
      color: #1e293b;
    }
    .card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      transition: all 0.3s ease;
    }
    .card:hover {
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    /* Estilos del calendario */
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      background: #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }
    .calendar-day {
      background: white;
      padding: 8px;
      min-height: 120px;
      font-size: 13px;
      position: relative;
    }
    .calendar-day.other-month {
      background: #f9fafb;
      color: #9ca3af;
    }
    .calendar-day.today {
      background: #EFF6FF;
      border: 2px solid #3B82F6;
    }
    .calendar-header {
      font-weight: 700;
      text-align: center;
      padding: 12px;
      background: #f3f4f6;
      color: #374151;
      font-size: 13px;
    }

    /* Badges de turnos */
    .shift-badge {
      font-size: 10px;
      padding: 3px 6px;
      border-radius: 6px;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      transition: all 0.2s;
    }
    .shift-badge:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .shift-badge.my-shift {
      background: #5A0E6E;
      color: white;
      font-weight: 600;
      border: 2px solid #7B2D8E;
    }
    .shift-manana { background: #DBEAFE; color: #1E40AF; border: 1px solid #3B82F6; }
    .shift-tarde { background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B; }
    .shift-noche { background: #E9D5FF; color: #6B21A8; border: 1px solid #A855F7; }
    .shift-24h { background: #DCFCE7; color: #166534; border: 1px solid #10B981; }

    /* Modales */
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      animation: fadeIn 0.2s;
    }
    .modal.active {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .modal-content {
      background: white;
      padding: 24px;
      border-radius: 20px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      animation: slideUp 0.3s;
    }
    @keyframes slideUp {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  </style>
</head>

<body>
  <div class="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">

    <!-- Header -->
    <div class="sticky top-0 z-20 bg-white shadow-sm">
      <div class="mx-auto max-w-7xl">
        <div class="flex items-center p-4 lg:p-6 justify-between">
          <a href="../index.html" class="flex items-center gap-4">
            <img class="h-10 lg:h-12" src="https://lh3.googleusercontent.com/d/1S6INg4SoWOJsoccSDnmP92EKK3GwWeTY"/>
            <span class="hidden md:block text-lg lg:text-2xl font-bold text-gray-900">Calendario de Guardias</span>
          </a>
          <span class="md:hidden text-lg font-bold text-gray-900">Guardias</span>
          <a href="perfil.html" id="user-avatar" class="w-10 h-10 rounded-full bg-gradient-to-r from-brand-primary to-purple-700 flex items-center justify-center text-white font-bold cursor-pointer" title="Mi Perfil">
            U
          </a>
        </div>
      </div>
    </div>

    <!-- Contenedor principal -->
    <div class="mx-auto w-full max-w-7xl flex-1 pb-20 lg:pb-8 px-4 py-6">

      <!-- Leyenda y Controles -->
      <div class="card p-4 mb-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap gap-3 items-center">
            <span class="text-sm font-semibold text-gray-700">Leyenda:</span>
            <span class="shift-badge shift-manana">Mañana</span>
            <span class="shift-badge shift-tarde">Tarde</span>
            <span class="shift-badge shift-noche">Noche</span>
            <span class="shift-badge shift-24h">24h</span>
            <span class="shift-badge my-shift">
              <span class="material-symbols-outlined" style="font-size: 12px;">star</span>
              Mi Guardia
            </span>
          </div>
          <!-- Botón admin (se muestra dinámicamente) -->
          <button id="btn-new-guard" onclick="openNewGuardModal()" class="px-4 py-2 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90 flex items-center gap-2 hidden">
            <span class="material-symbols-outlined text-sm">add</span>
            Nueva Guardia
          </button>
          <button onclick="openSwapModal()" class="px-4 py-2 bg-secondary text-white rounded-full font-semibold text-sm hover:bg-secondary/90 flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">swap_horiz</span>
            Registrar Cambio
          </button>
        </div>
      </div>

      <!-- Navegación de Mes -->
      <div class="card p-4 mb-6">
        <div class="flex items-center justify-between">
          <button onclick="changeMonth(-1)" class="p-2 hover:bg-gray-100 rounded-lg">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <h2 id="calendar-month" class="text-xl md:text-2xl font-bold text-gray-900">Enero 2026</h2>
          <button onclick="changeMonth(1)" class="p-2 hover:bg-gray-100 rounded-lg">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <!-- Calendario Completo -->
      <div class="calendar-grid" id="calendar">
        <!-- Generado por JavaScript -->
      </div>

      <!-- Resumen del Mes -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div class="card p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600">Mis Guardias Este Mes</p>
              <p class="text-3xl font-bold text-primary" id="my-guards-count">0</p>
            </div>
            <span class="material-symbols-outlined text-4xl text-primary/30">event_available</span>
          </div>
        </div>
        <div class="card p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600">Total Guardias</p>
              <p class="text-3xl font-bold text-gray-700" id="total-guards-count">0</p>
            </div>
            <span class="material-symbols-outlined text-4xl text-gray-300">calendar_month</span>
          </div>
        </div>
        <div class="card p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600">Sin Asignar</p>
              <p class="text-3xl font-bold text-amber-600" id="unassigned-count">0</p>
            </div>
            <span class="material-symbols-outlined text-4xl text-amber-300">warning</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Navegación inferior (móvil) -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div class="grid grid-cols-5 h-16">
        <a href="../index.html" class="flex flex-col items-center justify-center text-gray-600">
          <span class="material-symbols-outlined text-2xl">dashboard</span>
          <span class="text-xs mt-1">Inicio</span>
        </a>
        <a href="vacaciones.html" class="flex flex-col items-center justify-center text-gray-600">
          <span class="material-symbols-outlined text-2xl">event</span>
          <span class="text-xs mt-1">Vacaciones</span>
        </a>
        <a href="guardias.html" class="flex flex-col items-center justify-center text-primary">
          <span class="material-symbols-outlined text-2xl">calendar_month</span>
          <span class="text-xs font-medium mt-1">Guardias</span>
        </a>
        <a href="asignaciones.html" class="flex flex-col items-center justify-center text-gray-600">
          <span class="material-symbols-outlined text-2xl">assignment</span>
          <span class="text-xs mt-1">Áreas</span>
        </a>
        <a href="perfil.html" class="flex flex-col items-center justify-center text-gray-600">
          <div id="user-avatar-nav" class="w-8 h-8 rounded-full bg-gradient-to-r from-brand-primary to-purple-700 flex items-center justify-center text-white text-sm font-bold">
            U
          </div>
          <span class="text-xs mt-1">Perfil</span>
        </a>
      </div>
    </nav>
  </div>

  <!-- Modal Ver Detalles de Guardia -->
  <div id="detailsModal" class="modal">
    <div class="modal-content">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-900">Detalles de Guardia</h3>
        <button onclick="closeDetailsModal()" class="p-2 hover:bg-gray-100 rounded-full">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div id="detailsContent">
        <!-- Contenido dinámico -->
      </div>
    </div>
  </div>

  <!-- Modal Registrar Cambio -->
  <div id="swapModal" class="modal">
    <div class="modal-content">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-900">Registrar Cambio de Guardia</h3>
        <button onclick="closeSwapModal()" class="p-2 hover:bg-gray-100 rounded-full">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form id="swapForm" class="space-y-4">
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-xs text-amber-700">
            <strong>⚠️ Importante:</strong> Solo se pueden intercambiar guardias entre personas del mismo rol (FIR ↔ FIR o Farmacéutico ↔ Farmacéutico)
          </p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Rol del Cambio</label>
          <select id="swapRole" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary">
            <option value="">Seleccionar rol...</option>
            <option value="FIR">🎓 FIR (Farmacéutico Interno Residente)</option>
            <option value="Farmacéutico">💊 Farmacéutico/Administrador</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Usuario 1</label>
          <select id="user1" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary" disabled>
            <option value="">Primero selecciona un rol...</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Guardia de Usuario 1</label>
          <select id="shift1" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary" disabled>
            <option value="">Seleccionar guardia...</option>
          </select>
        </div>

        <div class="flex items-center justify-center py-2">
          <span class="material-symbols-outlined text-3xl text-secondary">swap_vert</span>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Usuario 2</label>
          <select id="user2" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary" disabled>
            <option value="">Primero selecciona un rol...</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Guardia de Usuario 2</label>
          <select id="shift2" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary" disabled>
            <option value="">Seleccionar guardia...</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Motivo del Cambio</label>
          <textarea id="swapReason" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary" placeholder="Describe el motivo del cambio..."></textarea>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" onclick="closeSwapModal()" class="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-secondary text-white rounded-xl font-semibold hover:bg-secondary/90">
            Registrar Cambio
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal Nueva Guardia (Solo Admin) -->
  <div id="newGuardModal" class="modal">
    <div class="modal-content">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-900">Nueva Guardia</h3>
        <button onclick="closeNewGuardModal()" class="p-2 hover:bg-gray-100 rounded-full">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form id="newGuardForm" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha de la Guardia *</label>
          <input type="date" id="newGuardDate" required class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary"/>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Farmacéutico Principal (Turno Mañana)</label>
          <select id="newPharmacist1" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary">
            <option value="">Sin asignar</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Farmacéutico de Apoyo (Turno Tarde)</label>
          <select id="newPharmacist2" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary">
            <option value="">Sin asignar</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">FIR Asignado</label>
          <select id="newFir" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary">
            <option value="">Sin asignar</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
          <select id="newStatus" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary">
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Notas (opcional)</label>
          <textarea id="newNotes" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary" placeholder="Notas adicionales sobre esta guardia..."></textarea>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" onclick="closeNewGuardModal()" class="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90">
            Crear Guardia
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Supabase y Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../js/supabase-config.js"></script>
  <script src="../js/guardias-manager.js"></script>

  <script>
    // ============================================
    // VARIABLES GLOBALES
    // ============================================
    let currentUser = null;
    let currentUserRole = null;
    let currentUserId = null;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let allUsers = [];
    let shifts = {}; // Guardias por fecha

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    async function initPage() {
      try {
        // Cargar usuario desde sessionStorage
        const ssoUser = sessionStorage.getItem('sso_user');
        if (ssoUser) {
          const user = JSON.parse(ssoUser);
          currentUser = user.nombre;
          currentUserRole = user.rol;
          currentUserId = user.id;

          // Calcular iniciales
          let initials = 'U';
          if (user.nombre) {
            const parts = user.nombre.trim().split(' ');
            if (parts.length >= 2) {
              initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
            } else {
              initials = parts[0].charAt(0).toUpperCase();
            }
          }

          document.getElementById('user-avatar').textContent = initials;
          document.getElementById('user-avatar-nav').textContent = initials;

          console.log('✅ Usuario:', currentUser, '-', currentUserRole);
        } else {
          alert('No hay sesión activa. Por favor, inicia sesión.');
          window.location.href = '../login.html';
          return;
        }

        // Inicializar GuardiasManager
        await window.guardiasManager.init();

        // Cargar usuarios disponibles
        allUsers = await window.guardiasManager.getAvailableUsers();
        console.log(`✅ ${allUsers.length} usuarios cargados`);

        // Mostrar botón admin
        const isAdmin = ['administrador', 'admin', 'administrator'].includes(
          (currentUserRole || '').toLowerCase()
        );
        if (isAdmin) {
          document.getElementById('btn-new-guard').classList.remove('hidden');
          console.log('✅ Modo administrador activado');
        }

        // Cargar guardias del mes
        await loadShiftsForMonth(currentYear, currentMonth);

        // Renderizar calendario
        renderCalendar();

      } catch (error) {
        console.error('❌ Error inicializando:', error);
        alert('Error cargando datos. Por favor, recarga la página.');
      }
    }

    // ============================================
    // CARGAR GUARDIAS
    // ============================================
    async function loadShiftsForMonth(year, month) {
      try {
        const guards = await window.guardiasManager.getGuardsByMonth(year, month);

        shifts = {};

        guards.forEach(guard => {
          const dateStr = guard.guard_date;

          if (!shifts[dateStr]) {
            shifts[dateStr] = [];
          }

          // Farmacéutico 1 (Mañana)
          if (guard.pharmacist_1_id && guard.pharmacist_1) {
            shifts[dateStr].push({
              user: guard.pharmacist_1.nombre,
              userId: guard.pharmacist_1_id,
              role: 'Farmacéutico',
              type: 'manana',
              hours: '08:00-15:00',
              guardId: guard.id,
              status: guard.status
            });
          }

          // Farmacéutico 2 (Tarde)
          if (guard.pharmacist_2_id && guard.pharmacist_2) {
            shifts[dateStr].push({
              user: guard.pharmacist_2.nombre,
              userId: guard.pharmacist_2_id,
              role: 'Farmacéutico',
              type: 'tarde',
              hours: '15:00-22:00',
              guardId: guard.id,
              status: guard.status
            });
          }

          // FIR
          if (guard.fir_id && guard.fir) {
            shifts[dateStr].push({
              user: guard.fir.nombre,
              userId: guard.fir_id,
              role: 'FIR',
              type: 'manana',
              hours: '08:00-15:00',
              guardId: guard.id,
              status: guard.status
            });
          }
        });

        console.log(`✅ ${guards.length} guardias cargadas`);
        updateStats();

      } catch (error) {
        console.error('❌ Error cargando guardias:', error);
        shifts = {};
      }
    }

    // ============================================
    // RENDERIZAR CALENDARIO
    // ============================================
    function renderCalendar() {
      const calendar = document.getElementById('calendar');
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

      document.getElementById('calendar-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;

      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

      let html = '';

      // Headers
      const dayHeaders = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      dayHeaders.forEach(day => {
        html += `<div class="calendar-header">${day}</div>`;
      });

      // Celdas vacías antes del primer día
      for (let i = 0; i < adjustedFirstDay; i++) {
        html += '<div class="calendar-day other-month"></div>';
      }

      // Días del mes
      const today = new Date();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        const dayShifts = shifts[dateStr] || [];

        let className = 'calendar-day';
        if (isToday) className += ' today';

        html += `<div class="${className}">`;
        html += `<div class="font-bold mb-1">${day}</div>`;

        dayShifts.forEach(shift => {
          const isMine = shift.user === currentUser;
          const badgeClass = isMine ? 'shift-badge my-shift' : `shift-badge shift-${shift.type}`;
          const starIcon = isMine ? '<span class="material-symbols-outlined" style="font-size: 10px;">star</span>' : '';
          const roleIcon = shift.role === 'FIR' ? '🎓' : '💊';
          const displayName = shift.user.split(' ')[0];
          html += `<div class="${badgeClass}" onclick='showShiftDetails(${JSON.stringify(shift)}, "${dateStr}")' title="${shift.user} (${shift.role})">${starIcon}${roleIcon} <span>${displayName}</span></div>`;
        });

        html += '</div>';
      }

      calendar.innerHTML = html;
    }

    // ============================================
    // NAVEGACIÓN DE MES
    // ============================================
    async function changeMonth(delta) {
      currentMonth += delta;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }

      await loadShiftsForMonth(currentYear, currentMonth);
      renderCalendar();
    }

    // ============================================
    // DETALLES DE GUARDIA
    // ============================================
    function showShiftDetails(shift, date) {
      const modal = document.getElementById('detailsModal');
      const content = document.getElementById('detailsContent');

      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const typeNames = {
        'manana': 'Guardia de Mañana',
        'tarde': 'Guardia de Tarde',
        'noche': 'Guardia de Noche',
        '24h': 'Guardia de 24 Horas'
      };

      const allShifts = shifts[date] || [];
      const firStaff = allShifts.find(s => s.role === 'FIR');
      const pharmacistStaff = allShifts.filter(s => s.role === 'Farmacéutico');

      let pharmacistHTML = '';
      pharmacistStaff.forEach(p => {
        pharmacistHTML += `
          <div class="p-4 bg-purple-50 rounded-xl border-2 ${p.user === currentUser ? 'border-primary' : 'border-purple-200'}">
            <p class="text-xs text-purple-600 font-semibold mb-1">💊 Farmacéutico (${p.type === 'manana' ? 'Mañana' : 'Tarde'})</p>
            <p class="text-base font-bold text-gray-900">${p.user}</p>
            <p class="text-xs text-gray-600">${p.hours}</p>
            ${p.user === currentUser ? '<span class="inline-block mt-1 px-2 py-1 bg-primary text-white text-xs rounded-full font-semibold">Mi Guardia</span>' : ''}
          </div>
        `;
      });

      content.innerHTML = `
        <div class="space-y-4">
          <div class="p-4 bg-gray-50 rounded-xl">
            <p class="text-sm text-gray-600">Fecha</p>
            <p class="text-lg font-semibold text-gray-900">${formattedDate}</p>
          </div>

          <div class="grid gap-3">
            ${firStaff ? `
              <div class="p-4 bg-blue-50 rounded-xl border-2 ${firStaff.user === currentUser ? 'border-primary' : 'border-blue-200'}">
                <p class="text-xs text-blue-600 font-semibold mb-1">🎓 FIR</p>
                <p class="text-base font-bold text-gray-900">${firStaff.user}</p>
                <p class="text-xs text-gray-600">${firStaff.hours}</p>
                ${firStaff.user === currentUser ? '<span class="inline-block mt-1 px-2 py-1 bg-primary text-white text-xs rounded-full font-semibold">Mi Guardia</span>' : ''}
              </div>
            ` : '<div class="p-4 bg-gray-50 rounded-xl"><p class="text-xs text-gray-400">Sin FIR asignado</p></div>'}

            ${pharmacistHTML || '<div class="p-4 bg-gray-50 rounded-xl"><p class="text-xs text-gray-400">Sin Farmacéuticos asignados</p></div>'}
          </div>
        </div>
      `;

      modal.classList.add('active');
    }

    function closeDetailsModal() {
      document.getElementById('detailsModal').classList.remove('active');
    }

    // ============================================
    // MODAL CAMBIO DE GUARDIA
    // ============================================
    function openSwapModal() {
      document.getElementById('swapModal').classList.add('active');
    }

    function closeSwapModal() {
      document.getElementById('swapModal').classList.remove('active');
    }

    // ============================================
    // MODAL NUEVA GUARDIA (ADMIN)
    // ============================================
    function openNewGuardModal() {
      loadUsersForNewGuard();
      document.getElementById('newGuardModal').classList.add('active');
    }

    function closeNewGuardModal() {
      document.getElementById('newGuardModal').classList.remove('active');
      document.getElementById('newGuardForm').reset();
    }

    async function loadUsersForNewGuard() {
      try {
        const users = await window.guardiasManager.getAvailableUsers();

        const pharmacist1Select = document.getElementById('newPharmacist1');
        const pharmacist2Select = document.getElementById('newPharmacist2');
        const firSelect = document.getElementById('newFir');

        pharmacist1Select.innerHTML = '<option value="">Sin asignar</option>';
        pharmacist2Select.innerHTML = '<option value="">Sin asignar</option>';
        firSelect.innerHTML = '<option value="">Sin asignar</option>';

        users.forEach(user => {
          const option = `<option value="${user.id}">${user.nombre} (${user.rol})</option>`;

          if (user.rol && user.rol.toLowerCase().includes('fir')) {
            firSelect.innerHTML += option;
          } else {
            pharmacist1Select.innerHTML += option;
            pharmacist2Select.innerHTML += option;
          }
        });
      } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
      }
    }

    // Submit nueva guardia
    document.getElementById('newGuardForm').addEventListener('submit', async function(e) {
      e.preventDefault();

      try {
        const guardData = {
          guard_date: document.getElementById('newGuardDate').value,
          pharmacist_1_id: document.getElementById('newPharmacist1').value || null,
          pharmacist_2_id: document.getElementById('newPharmacist2').value || null,
          fir_id: document.getElementById('newFir').value || null,
          status: document.getElementById('newStatus').value,
          notes: document.getElementById('newNotes').value || null
        };

        await window.guardiasManager.createGuard(guardData);

        alert('✅ Guardia creada correctamente');
        closeNewGuardModal();

        await loadShiftsForMonth(currentYear, currentMonth);
        renderCalendar();

      } catch (error) {
        console.error('❌ Error creando guardia:', error);
        alert('Error al crear la guardia: ' + error.message);
      }
    });

    // ============================================
    // ESTADÍSTICAS
    // ============================================
    function updateStats() {
      let myGuardsCount = 0;
      let totalGuards = 0;
      let unassigned = 0;

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayShifts = shifts[dateStr] || [];

        if (dayShifts.length > 0) {
          totalGuards++;
          if (dayShifts.some(s => s.user === currentUser)) {
            myGuardsCount++;
          }
        } else {
          unassigned++;
        }
      }

      document.getElementById('my-guards-count').textContent = myGuardsCount;
      document.getElementById('total-guards-count').textContent = totalGuards;
      document.getElementById('unassigned-count').textContent = unassigned;
    }

    // ============================================
    // INICIAR AL CARGAR
    // ============================================
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPage);
    } else {
      initPage();
    }
  </script>
</body>
</html>
```

---

## Manager de Guardias

### Archivo: `js/guardias-manager.js`

```javascript
/**
 * Módulo de Guardias - Pharmacy Guards
 * Maneja todas las operaciones CRUD con la tabla pharmacy_guards
 */

class GuardiasManager {
  constructor() {
    this.currentUser = null;
    this.isAdmin = false;
  }

  /**
   * Inicializar con datos del usuario actual
   */
  async init() {
    try {
      const ssoUser = sessionStorage.getItem('sso_user');
      if (ssoUser) {
        this.currentUser = JSON.parse(ssoUser);
        this.isAdmin = ['administrador', 'admin', 'administrator'].includes(
          (this.currentUser.rol || '').toLowerCase()
        );
        console.log('✅ GuardiasManager inicializado:', {
          usuario: this.currentUser.nombre,
          rol: this.currentUser.rol,
          esAdmin: this.isAdmin
        });
      } else {
        throw new Error('No hay usuario autenticado');
      }
    } catch (error) {
      console.error('❌ Error inicializando GuardiasManager:', error);
      throw error;
    }
  }

  /**
   * Obtener guardias del usuario actual
   */
  async getMyGuards(startDate = null, endDate = null) {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      let query = window.supabaseClient
        .from('pharmacy_guards')
        .select(`
          *,
          pharmacist_1:users!pharmacist_1_id(id, nombre, email),
          pharmacist_2:users!pharmacist_2_id(id, nombre, email),
          fir:users!fir_id(id, nombre, email),
          assigned_by_user:users!assigned_by(id, nombre, email)
        `)
        .or(`pharmacist_1_id.eq.${this.currentUser.id},pharmacist_2_id.eq.${this.currentUser.id},fir_id.eq.${this.currentUser.id}`)
        .order('guard_date', { ascending: true });

      if (startDate) {
        query = query.gte('guard_date', startDate.toISOString().split('T')[0]);
      }

      if (endDate) {
        query = query.lte('guard_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo mis guardias:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} guardias del usuario`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getMyGuards:', error);
      return [];
    }
  }

  /**
   * Obtener TODAS las guardias (solo admin)
   */
  async getAllGuards(startDate = null, endDate = null) {
    try {
      if (!this.isAdmin) {
        console.warn('⚠️ No es admin, devolviendo guardias propias');
        return this.getMyGuards(startDate, endDate);
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      let query = window.supabaseClient
        .from('pharmacy_guards')
        .select(`
          *,
          pharmacist_1:users!pharmacist_1_id(id, nombre, email),
          pharmacist_2:users!pharmacist_2_id(id, nombre, email),
          fir:users!fir_id(id, nombre, email),
          assigned_by_user:users!assigned_by(id, nombre, email)
        `)
        .order('guard_date', { ascending: true });

      if (startDate) {
        query = query.gte('guard_date', startDate.toISOString().split('T')[0]);
      }

      if (endDate) {
        query = query.lte('guard_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo todas las guardias:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} guardias totales`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getAllGuards:', error);
      return [];
    }
  }

  /**
   * Obtener guardias de un mes específico
   */
  async getGuardsByMonth(year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    if (this.isAdmin) {
      return this.getAllGuards(startDate, endDate);
    } else {
      return this.getMyGuards(startDate, endDate);
    }
  }

  /**
   * Crear una nueva guardia (solo admin)
   */
  async createGuard(guardData) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden crear guardias');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('pharmacy_guards')
        .insert({
          guard_date: guardData.guard_date,
          pharmacist_1_id: guardData.pharmacist_1_id || null,
          pharmacist_2_id: guardData.pharmacist_2_id || null,
          fir_id: guardData.fir_id || null,
          assigned_by: this.currentUser.id,
          status: guardData.status || 'pendiente',
          notes: guardData.notes || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creando guardia:', error);
        throw error;
      }

      console.log('✅ Guardia creada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en createGuard:', error);
      throw error;
    }
  }

  /**
   * Actualizar una guardia existente (solo admin)
   */
  async updateGuard(guardId, updates) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden actualizar guardias');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('pharmacy_guards')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', guardId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando guardia:', error);
        throw error;
      }

      console.log('✅ Guardia actualizada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en updateGuard:', error);
      throw error;
    }
  }

  /**
   * Eliminar una guardia (solo admin)
   */
  async deleteGuard(guardId) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden eliminar guardias');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { error } = await window.supabaseClient
        .from('pharmacy_guards')
        .delete()
        .eq('id', guardId);

      if (error) {
        console.error('Error eliminando guardia:', error);
        throw error;
      }

      console.log('✅ Guardia eliminada');
      return true;
    } catch (error) {
      console.error('❌ Error en deleteGuard:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de usuarios disponibles para asignar
   */
  async getAvailableUsers() {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('users')
        .select('id, nombre, email, rol')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error obteniendo usuarios:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en getAvailableUsers:', error);
      return [];
    }
  }

  /**
   * Cambiar el estado de una guardia
   */
  async changeStatus(guardId, newStatus) {
    return this.updateGuard(guardId, { status: newStatus });
  }

  /**
   * Verificar si el usuario puede editar una guardia
   */
  canEdit(guard) {
    return this.isAdmin;
  }

  /**
   * Verificar si una fecha está dentro de una guardia del usuario
   */
  async isUserOnGuard(date) {
    const dateStr = date.toISOString().split('T')[0];

    const { data, error } = await window.supabaseClient
      .from('pharmacy_guards')
      .select('id')
      .eq('guard_date', dateStr)
      .or(`pharmacist_1_id.eq.${this.currentUser.id},pharmacist_2_id.eq.${this.currentUser.id},fir_id.eq.${this.currentUser.id}`)
      .limit(1);

    return !error && data && data.length > 0;
  }
}

// Exportar instancia global
window.guardiasManager = new GuardiasManager();

console.log('✅ GuardiasManager cargado');
```

---

## Estilos y Diseño

### Componentes Clave:

```css
/* Tarjetas con efecto hover */
.card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08);
}

/* Grid del calendario */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  background: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

/* Día del calendario */
.calendar-day {
  background: white;
  padding: 8px;
  min-height: 120px;
  font-size: 13px;
}

.calendar-day.today {
  background: #EFF6FF;
  border: 2px solid #3B82F6;
}

/* Badges de turno */
.shift-badge {
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 6px;
  margin-top: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.shift-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Mi guardia - destacada */
.shift-badge.my-shift {
  background: #5A0E6E;
  color: white;
  font-weight: 600;
  border: 2px solid #7B2D8E;
}

/* Turnos por tipo */
.shift-manana {
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #3B82F6;
}

.shift-tarde {
  background: #FEF3C7;
  color: #92400E;
  border: 1px solid #F59E0B;
}
```

---

## Funcionalidades Específicas

### 1. Ver Mis Guardias Destacadas

```javascript
// Las guardias del usuario actual se destacan con:
const isMine = shift.user === currentUser;
const badgeClass = isMine ? 'shift-badge my-shift' : `shift-badge shift-${shift.type}`;
const starIcon = isMine ? '<span class="material-symbols-outlined">star</span>' : '';
```

### 2. Crear Nueva Guardia (Admin)

```javascript
// Solo visible para administradores
if (isAdmin) {
  document.getElementById('btn-new-guard').classList.remove('hidden');
}

// Formulario con 3 selectores:
// - Farmacéutico 1 (Mañana)
// - Farmacéutico 2 (Tarde)
// - FIR
// Todos opcionales, pero al menos uno debe estar asignado
```

### 3. Registrar Cambio de Guardia

```javascript
// Restricción: Solo entre mismo rol
// FIR ↔ FIR
// Farmacéutico ↔ Farmacéutico

// Flujo:
// 1. Seleccionar rol (FIR o Farmacéutico)
// 2. Seleccionar Usuario 1
// 3. Seleccionar Guardia de Usuario 1
// 4. Seleccionar Usuario 2
// 5. Seleccionar Guardia de Usuario 2
// 6. Escribir motivo del cambio
// 7. Confirmar cambio
```

### 4. Detalles de Guardia

```javascript
// Al hacer clic en un badge, se muestra modal con:
// - Fecha completa formateada
// - FIR asignado (con avatar y horario)
// - Farmacéutico(s) asignado(s) (con avatar y horario)
// - Indicador si es "Mi Guardia"
```

### 5. Navegación por Meses

```javascript
// Botones de navegación
// Al cambiar mes:
// 1. Actualizar currentMonth y currentYear
// 2. Cargar guardias del nuevo mes desde Supabase
// 3. Renderizar calendario con nuevos datos
// 4. Actualizar estadísticas
```

### 6. Estadísticas del Mes

```javascript
// Tres tarjetas:
// 1. Mis Guardias Este Mes: Cuenta guardias donde aparece el usuario
// 2. Total Guardias: Días con al menos una persona asignada
// 3. Sin Asignar: Días sin ninguna asignación
```

---

## Resumen de Permisos

| Acción | Usuario Normal | Administrador |
|--------|---------------|---------------|
| Ver calendario | ✅ | ✅ |
| Ver mis guardias destacadas | ✅ | ✅ |
| Ver detalles de guardia | ✅ | ✅ |
| Solicitar cambio de guardia | ✅ | ✅ |
| **Crear nueva guardia** | ❌ | ✅ |
| **Ver todas las guardias** | ❌ (solo propias) | ✅ |
| **Editar guardia** | ❌ | ✅ |
| **Eliminar guardia** | ❌ | ✅ |

---

## Notas Finales

- **Una guardia = un día completo** con 1-3 personas asignadas
- **Farmacéutico 1**: Turno mañana (08:00-15:00)
- **Farmacéutico 2**: Turno tarde (15:00-22:00)
- **FIR**: Turno mañana (08:00-15:00)
- **Los cambios de guardia** son solicitudes que deben ser confirmadas
- **El calendario empieza en lunes** (semana laboral europea)
- **Los domingos** están a la derecha del calendario
- **Color púrpura (#5A0E6E)** identifica al usuario actual

---

**Generado para Farmacia HUNSC-Sur - Sistema de Gestión de Personal**
