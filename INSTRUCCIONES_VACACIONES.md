# Sistema de Gestión de Vacaciones - Farmacia HUNSC-Sur

## Índice
1. [Contexto del Sistema](#contexto-del-sistema)
2. [Arquitectura y Tecnologías](#arquitectura-y-tecnologías)
3. [Base de Datos Supabase](#base-de-datos-supabase)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Página de Usuario Normal](#página-de-usuario-normal)
6. [Página de Administrador](#página-de-administrador)
7. [Manager de Vacaciones](#manager-de-vacaciones)
8. [Estilos y Diseño](#estilos-y-diseño)
9. [Autenticación y Roles](#autenticación-y-roles)

---

## Contexto del Sistema

Este es un sistema de gestión de vacaciones para la **Farmacia HUNSC-Sur** en las Islas Canarias. El sistema permite:

### Usuario Normal:
- Ver días disponibles (Vacaciones Anuales, Asuntos Propios, Días Libres)
- Solicitar vacaciones mediante selección de rango de fechas en calendario
- Ver historial de solicitudes propias
- Cancelar solicitudes pendientes
- Ver estado de solicitudes (pendiente/aprobada/rechazada)

### Administrador:
- Todo lo que puede hacer un usuario normal
- Ver TODAS las solicitudes de todos los usuarios
- Aprobar solicitudes pendientes
- Rechazar solicitudes con motivo
- Vista especial de solicitudes pendientes

---

## Arquitectura y Tecnologías

### Frontend:
- **HTML5** - Estructura semántica
- **Tailwind CSS 3** - Framework de estilos (vía CDN)
- **Vanilla JavaScript** - Sin frameworks, JavaScript puro
- **Material Symbols** - Iconos de Google

### Backend:
- **Supabase** - PostgreSQL con API REST/GraphQL
- **@supabase/supabase-js@2** - Cliente JavaScript
- **SSO Authentication** - Autenticación vía token SSO

### Colores del Sistema:
```javascript
{
  "primary": "#5A0E6E",        // Púrpura principal
  "secondary": "#AF9100",      // Dorado
  "tertiary": "#D4AF37",       // Dorado claro
  "background-light": "#f5f7f8",
  "background-dark": "#101c22",
  "status-approved": "#5A0E6E", // Aprobado = púrpura
  "status-pending": "#AF9100",  // Pendiente = dorado
  "status-rejected": "#993333"  // Rechazado = rojo
}
```

---

## Base de Datos Supabase

### Tabla: `employee_leave_requests`

```sql
CREATE TABLE employee_leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('anuales', 'asuntos', 'libres')),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'rechazada', 'cancelada')),
  reason TEXT,
  rejection_reason TEXT,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_leave_requests_user ON employee_leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON employee_leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON employee_leave_requests(start_date, end_date);
```

### Tabla: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('empleado', 'administrador', 'farmaceutico', 'fir')),
  vacation_days_annual INTEGER DEFAULT 30,
  vacation_days_personal INTEGER DEFAULT 6,
  vacation_days_free INTEGER DEFAULT 14,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Relaciones:
- `employee_leave_requests.user_id` → `users.id` (Usuario que solicita)
- `employee_leave_requests.approved_by` → `users.id` (Administrador que aprueba/rechaza)

---

## Estructura de Archivos

```
/pages/
  ├── vacaciones.html          # Página para usuario normal
  └── admin-vacaciones.html    # Página para administrador (opcional)

/js/
  ├── supabase-config.js       # Configuración de Supabase
  └── vacaciones-manager.js    # Clase para operaciones CRUD

/assets/css/
  └── styles.css               # Estilos adicionales
```

---

## Página de Usuario Normal

### HTML Completo: `pages/vacaciones.html`

```html
<!DOCTYPE html>
<html class="light" lang="es">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Solicitar Vacaciones - Farmacia HUNSC Sur</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>

  <!-- Supabase Client -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../js/supabase-config.js"></script>
  <script src="../js/vacaciones-manager.js"></script>

  <script>
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "primary": "#5A0E6E",
            "secondary": "#AF9100",
            "tertiary": "#D4AF37",
            "background-light": "#f5f7f8",
            "background-dark": "#101c22",
            "status-approved": "#5A0E6E",
            "status-pending": "#AF9100",
            "status-rejected": "#993333"
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

  <style type="text/tailwindcss">
    .glass-card {
      background-color: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .dark .glass-card {
      background-color: rgba(26, 38, 47, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .calendar-day.range-start {
      background: #5A0E6E !important;
      color: white !important;
      border-radius: 9999px 0 0 9999px;
    }
    .calendar-day.range-end {
      background: #5A0E6E !important;
      color: white !important;
      border-radius: 0 9999px 9999px 0;
    }
    .calendar-day.range-middle {
      background-color: rgba(90, 14, 110, 0.2);
    }
  </style>
</head>

<body class="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-200">
  <div class="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">

    <!-- Header -->
    <div class="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
      <div class="mx-auto max-w-7xl">
        <div class="flex items-center p-4 lg:p-6 pb-2 justify-between">
          <a href="../index.html" class="flex items-center gap-4">
            <img class="h-10 lg:h-12" src="https://lh3.googleusercontent.com/d/1S6INg4SoWOJsoccSDnmP92EKK3GwWeTY"/>
            <span class="hidden md:block text-lg lg:text-2xl font-bold text-slate-900 dark:text-white">Solicitar Vacaciones</span>
          </a>
          <a href="perfil.html" id="user-avatar-header" class="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-purple-700 flex items-center justify-center text-white font-bold cursor-pointer" title="Mi Perfil">
            U
          </a>
        </div>
      </div>
    </div>

    <!-- Contenedor principal -->
    <div class="mx-auto w-full max-w-7xl flex-1 pb-20 lg:pb-8">

    <!-- Cómputo de Días Disponibles -->
    <div class="px-4 py-4">
      <h2 class="text-slate-900 dark:text-white text-lg font-bold mb-3">Días Disponibles</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <!-- Vacaciones Anuales -->
        <div class="glass-card rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-slate-600 dark:text-slate-400">Vacaciones Anuales</p>
              <p class="text-2xl font-bold text-primary" id="vacation-available">-- días</p>
              <p class="text-xs text-slate-500 mt-1">de <span id="vacation-total">--</span> totales</p>
            </div>
            <span class="material-symbols-outlined text-4xl text-primary/30">beach_access</span>
          </div>
        </div>

        <!-- Asuntos Propios -->
        <div class="glass-card rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-slate-600 dark:text-slate-400">Asuntos Propios</p>
              <p class="text-2xl font-bold text-secondary" id="personal-available">-- días</p>
              <p class="text-xs text-slate-500 mt-1">de <span id="personal-total">--</span> totales</p>
            </div>
            <span class="material-symbols-outlined text-4xl text-secondary/30">event_note</span>
          </div>
        </div>

        <!-- Días Libres -->
        <div class="glass-card rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-slate-600 dark:text-slate-400">Días Libres</p>
              <p class="text-2xl font-bold text-green-600" id="free-available">-- días</p>
              <p class="text-xs text-slate-500 mt-1">de <span id="free-total">--</span> totales</p>
            </div>
            <span class="material-symbols-outlined text-4xl text-green-600/30">free_cancellation</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle: Solicitar / Mis Solicitudes -->
    <div class="flex px-4 py-3">
      <div class="flex h-12 flex-1 items-center justify-center rounded-full bg-slate-200 dark:bg-background-dark/80 p-1 shadow-inner">
        <label class="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-slate-700 has-[:checked]:shadow-md has-[:checked]:text-primary text-slate-600 dark:text-slate-400 text-sm font-medium transition-all duration-300">
          <span class="truncate">Solicitar</span>
          <input checked class="invisible w-0" name="view-toggle" type="radio" value="Solicitar" onchange="toggleView('solicitar')"/>
        </label>
        <label class="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-slate-700 has-[:checked]:shadow-md has-[:checked]:text-primary text-slate-600 dark:text-slate-400 text-sm font-medium transition-all duration-300">
          <span class="truncate">Mis Solicitudes</span>
          <input class="invisible w-0" name="view-toggle" type="radio" value="Mis Solicitudes" onchange="toggleView('historial')"/>
        </label>
      </div>
    </div>

    <!-- Vista: Solicitar -->
    <div id="view-solicitar">
      <!-- Tipo de Vacaciones -->
      <div class="px-4 py-2">
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tipo de Solicitud</label>
        <select id="vacation-type" class="form-select w-full rounded-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 focus:ring-2 focus:ring-primary">
          <option value="anuales">Vacaciones Anuales (-- días disponibles)</option>
          <option value="asuntos">Asuntos Propios (-- días disponibles)</option>
          <option value="libres">Días Libres (-- días disponibles)</option>
        </select>
      </div>

      <h2 class="text-slate-900 dark:text-white text-[22px] font-bold leading-tight px-4 pb-3 pt-5">Seleccionar Fechas</h2>
      <p class="text-sm text-slate-600 dark:text-slate-400 px-4 pb-3">Haz clic en el primer día y luego en el último para seleccionar un rango.</p>

      <!-- Calendario -->
      <div class="flex flex-wrap items-center justify-center gap-6 px-4">
        <div class="flex min-w-72 max-w-full flex-1 flex-col gap-0.5">
          <div class="flex items-center p-1 justify-between">
            <button onclick="changeMonth(-1)" class="flex size-10 items-center justify-center text-slate-800 dark:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <p id="calendar-month" class="text-slate-900 dark:text-white text-base font-bold leading-tight flex-1 text-center">Cargando...</p>
            <button onclick="changeMonth(1)" class="flex size-10 items-center justify-center text-slate-800 dark:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <div id="calendar" class="grid grid-cols-7 gap-y-1">
            <!-- Se genera dinámicamente con JavaScript -->
          </div>
        </div>
      </div>

      <!-- Resumen de Selección -->
      <div id="selection-summary" class="px-4 py-4 hidden">
        <div class="glass-card rounded-lg p-4">
          <h3 class="font-semibold text-slate-900 dark:text-white mb-2">Resumen de Selección</h3>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-600 dark:text-slate-400">Desde: <span id="start-date" class="font-semibold text-slate-900 dark:text-white"></span></p>
              <p class="text-sm text-slate-600 dark:text-slate-400">Hasta: <span id="end-date" class="font-semibold text-slate-900 dark:text-white"></span></p>
            </div>
            <div class="text-right">
              <p class="text-3xl font-bold text-primary" id="total-days">0</p>
              <p class="text-xs text-slate-500">días seleccionados</p>
            </div>
          </div>
          <button onclick="clearSelection()" class="mt-3 w-full text-center text-sm text-red-600 hover:text-red-700 font-medium">
            Limpiar selección
          </button>
        </div>
      </div>

      <!-- Comentarios -->
      <div class="px-4 py-2">
        <label class="flex flex-col w-full relative">
          <span class="text-xs font-medium text-primary absolute -top-2 left-4 bg-background-light dark:bg-background-dark px-1">Motivo / Comentarios</span>
          <textarea id="comments" class="form-textarea w-full resize-none rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-slate-300 dark:border-slate-600 bg-transparent p-4 placeholder:text-slate-400" placeholder="Describe el motivo de tu solicitud..." rows="3"></textarea>
        </label>
      </div>

      <!-- Botón de envío -->
      <div class="px-4 py-4">
        <button onclick="submitRequest()" class="flex w-full items-center justify-center rounded-full bg-primary h-14 text-white text-base font-bold leading-normal shadow-lg shadow-primary/30 hover:bg-primary/90">
          Enviar Solicitud
        </button>
      </div>
    </div>

    <!-- Vista: Historial -->
    <div id="view-historial" class="hidden">
      <h2 class="text-slate-900 dark:text-white text-[22px] font-bold leading-tight px-4 pb-3 pt-5">Historial de Solicitudes</h2>
      <div id="requests-container" class="flex flex-col gap-4 px-4 pb-8">
        <div class="text-center text-slate-500 dark:text-slate-400 py-8">
          Cargando solicitudes...
        </div>
      </div>
    </div>

    </div><!-- Cierre contenedor max-w-7xl -->
  </div>

  <script>
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDays = [];
    let selectionStart = null;
    let availableDays = {};
    let currentUser = null;

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    async function initPage() {
      await loadUserData();

      // Esperar a que Supabase esté listo
      if (typeof window.supabaseClient === 'undefined') {
        let attempts = 0;
        while (typeof window.supabaseClient === 'undefined' && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }

      // Inicializar vacaciones manager
      if (window.vacacionesManager) {
        try {
          await window.vacacionesManager.init();
          await loadAvailableDays();
          await loadRequestHistory();
        } catch (error) {
          console.error('❌ Error inicializando vacaciones manager:', error);
        }
      }

      renderCalendar();
    }

    // Cargar datos del usuario
    async function loadUserData() {
      try {
        const ssoUser = sessionStorage.getItem('sso_user');
        if (!ssoUser) {
          console.warn('No hay usuario en sessionStorage');
          return;
        }

        currentUser = JSON.parse(ssoUser);

        // Calcular iniciales
        let initials = 'U';
        if (currentUser.nombre) {
          const nameParts = currentUser.nombre.trim().split(' ');
          if (nameParts.length >= 2) {
            initials = (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
          } else if (nameParts.length === 1) {
            initials = nameParts[0].charAt(0).toUpperCase();
          }
        }

        // Actualizar avatar
        const avatarHeader = document.getElementById('user-avatar-header');
        if (avatarHeader) avatarHeader.textContent = initials;

      } catch (error) {
        console.error('❌ Error cargando datos del usuario:', error);
      }
    }

    // ============================================
    // DÍAS DISPONIBLES
    // ============================================
    async function loadAvailableDays() {
      try {
        availableDays = await window.vacacionesManager.getAvailableDays();

        document.getElementById('vacation-available').textContent = `${availableDays.vacation_available} días`;
        document.getElementById('vacation-total').textContent = availableDays.vacation_total;

        document.getElementById('personal-available').textContent = `${availableDays.personal_available} días`;
        document.getElementById('personal-total').textContent = availableDays.personal_total;

        document.getElementById('free-available').textContent = `${availableDays.free_available} días`;
        document.getElementById('free-total').textContent = availableDays.free_total;

        // Actualizar select
        const vacationType = document.getElementById('vacation-type');
        vacationType.options[0].text = `Vacaciones Anuales (${availableDays.vacation_available} días disponibles)`;
        vacationType.options[1].text = `Asuntos Propios (${availableDays.personal_available} días disponibles)`;
        vacationType.options[2].text = `Días Libres (${availableDays.free_available} días disponibles)`;

      } catch (error) {
        console.error('❌ Error cargando días disponibles:', error);
      }
    }

    // ============================================
    // HISTORIAL DE SOLICITUDES
    // ============================================
    async function loadRequestHistory() {
      try {
        const requests = await window.vacacionesManager.getMyRequests();
        const container = document.getElementById('requests-container');

        if (!requests || requests.length === 0) {
          container.innerHTML = '<div class="text-center text-slate-500 py-8">No tienes solicitudes registradas</div>';
          return;
        }

        container.innerHTML = requests.map(request => {
          const statusConfig = {
            aprobada: {
              icon: 'check_circle',
              label: 'Aprobado',
              bgClass: 'bg-status-approved/10 text-status-approved'
            },
            pendiente: {
              icon: 'hourglass_top',
              label: 'Pendiente',
              bgClass: 'bg-status-pending/10 text-status-pending'
            },
            rechazada: {
              icon: 'cancel',
              label: 'Rechazado',
              bgClass: 'bg-status-rejected/10 text-status-rejected'
            }
          };

          const status = statusConfig[request.status] || statusConfig.pendiente;
          const typeLabel = {
            anuales: 'Vacaciones Anuales',
            asuntos: 'Asuntos Propios',
            libres: 'Días Libres'
          }[request.request_type] || request.request_type;

          const startDate = formatDate(request.start_date);
          const endDate = formatDate(request.end_date);
          const days = Math.ceil((new Date(request.end_date) - new Date(request.start_date)) / (1000 * 60 * 60 * 24)) + 1;

          let actionButtons = '';
          if (request.status === 'pendiente') {
            actionButtons = `
              <div class="flex gap-3 pt-2">
                <button onclick="cancelRequest('${request.id}')" class="flex-1 rounded-full h-10 bg-red-500 text-white font-semibold text-sm hover:bg-red-600">
                  Cancelar Solicitud
                </button>
              </div>
            `;
          }

          let rejectionReason = '';
          if (request.status === 'rechazada' && request.rejection_reason) {
            rejectionReason = `<p class="text-sm text-slate-600"><strong>Motivo denegación:</strong> ${request.rejection_reason}</p>`;
          }

          return `
            <div class="glass-card rounded-lg p-4 flex flex-col gap-3">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-sm font-medium text-primary">${typeLabel}</p>
                  <p class="text-sm text-slate-600">${startDate} - ${endDate}</p>
                  <p class="text-lg font-bold text-slate-800">${days} día${days !== 1 ? 's' : ''}</p>
                </div>
                <div class="flex items-center gap-2 rounded-full ${status.bgClass} px-3 py-1 text-sm font-medium">
                  <span class="material-symbols-outlined text-base">${status.icon}</span>
                  <span>${status.label}</span>
                </div>
              </div>
              ${request.reason ? `<p class="text-sm text-slate-600"><strong>Motivo:</strong> ${request.reason}</p>` : ''}
              ${rejectionReason}
              ${actionButtons}
            </div>
          `;
        }).join('');

      } catch (error) {
        console.error('❌ Error cargando historial:', error);
        document.getElementById('requests-container').innerHTML = '<div class="text-center text-red-500 py-8">Error cargando solicitudes</div>';
      }
    }

    // Cancelar solicitud
    async function cancelRequest(requestId) {
      if (!confirm('¿Estás seguro de que quieres cancelar esta solicitud?')) {
        return;
      }

      try {
        await window.vacacionesManager.cancelRequest(requestId);
        alert('Solicitud cancelada correctamente');
        await loadRequestHistory();
        await loadAvailableDays();
      } catch (error) {
        console.error('❌ Error cancelando solicitud:', error);
        alert('Error al cancelar la solicitud');
      }
    }

    // ============================================
    // CALENDARIO
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
      const dayHeaders = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      dayHeaders.forEach(day => {
        html += `<p class="text-slate-500 text-xs font-bold flex h-10 w-full items-center justify-center">${day}</p>`;
      });

      // Celdas vacías antes del primer día
      for (let i = 0; i < adjustedFirstDay; i++) {
        html += '<div class="h-12 w-full"></div>';
      }

      // Días del mes
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isSelected = selectedDays.includes(dateStr);
        const isStart = dateStr === selectionStart;
        const isEnd = selectedDays.length > 1 && dateStr === selectedDays[selectedDays.length - 1] && dateStr !== selectionStart;
        const isMiddle = selectedDays.includes(dateStr) && !isStart && !isEnd;

        let className = 'calendar-day h-12 w-full text-slate-800 text-sm font-medium cursor-pointer';
        let innerClass = 'flex size-full items-center justify-center rounded-full';

        if (isStart && isEnd) {
          className += ' single-selected';
        } else if (isStart) {
          className += ' range-start';
        } else if (isEnd) {
          className += ' range-end';
        } else if (isMiddle) {
          className += ' range-middle';
        } else {
          innerClass += ' hover:bg-primary/20';
        }

        html += `<button class="${className}" onclick="selectDay('${dateStr}')"><div class="${innerClass}">${day}</div></button>`;
      }

      calendar.innerHTML = html;
    }

    function selectDay(dateStr) {
      if (selectionStart === null) {
        selectionStart = dateStr;
        selectedDays = [dateStr];
      } else {
        if (selectedDays.includes(dateStr)) {
          clearSelection();
          return;
        }

        const start = new Date(selectionStart);
        const end = new Date(dateStr);

        if (end < start) {
          selectionStart = dateStr;
          selectedDays = [dateStr];
        } else {
          selectedDays = [];
          const current = new Date(start);
          while (current <= end) {
            const str = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
            selectedDays.push(str);
            current.setDate(current.getDate() + 1);
          }
        }
      }

      updateSummary();
      renderCalendar();
    }

    function updateSummary() {
      if (selectedDays.length > 0) {
        document.getElementById('selection-summary').classList.remove('hidden');
        document.getElementById('start-date').textContent = formatDate(selectedDays[0]);
        document.getElementById('end-date').textContent = formatDate(selectedDays[selectedDays.length - 1]);
        document.getElementById('total-days').textContent = selectedDays.length;
      } else {
        document.getElementById('selection-summary').classList.add('hidden');
      }
    }

    function formatDate(dateStr) {
      const date = new Date(dateStr + 'T00:00:00');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    function clearSelection() {
      selectedDays = [];
      selectionStart = null;
      updateSummary();
      renderCalendar();
    }

    function changeMonth(delta) {
      currentMonth += delta;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    }

    // ============================================
    // ENVIAR SOLICITUD
    // ============================================
    async function submitRequest() {
      if (selectedDays.length === 0) {
        alert('Por favor selecciona al menos un día');
        return;
      }

      const typeSelect = document.getElementById('vacation-type');
      const requestType = typeSelect.value;
      const comments = document.getElementById('comments').value;

      // Verificar días disponibles
      const daysNeeded = selectedDays.length;
      let available = 0;

      if (requestType === 'anuales') {
        available = availableDays.vacation_available;
      } else if (requestType === 'asuntos') {
        available = availableDays.personal_available;
      } else if (requestType === 'libres') {
        available = availableDays.free_available;
      }

      if (daysNeeded > available) {
        alert(`No tienes suficientes días disponibles. Necesitas ${daysNeeded} días pero solo tienes ${available} disponibles.`);
        return;
      }

      try {
        const requestData = {
          request_type: requestType,
          start_date: selectedDays[0],
          end_date: selectedDays[selectedDays.length - 1],
          reason: comments || null
        };

        await window.vacacionesManager.createRequest(requestData);

        alert('✅ Solicitud enviada correctamente');

        // Limpiar formulario
        clearSelection();
        document.getElementById('comments').value = '';

        // Recargar datos
        await loadAvailableDays();
        await loadRequestHistory();

      } catch (error) {
        console.error('❌ Error enviando solicitud:', error);
        alert('Error al enviar la solicitud. Por favor intenta de nuevo.');
      }
    }

    // ============================================
    // TOGGLE DE VISTAS
    // ============================================
    function toggleView(view) {
      if (view === 'solicitar') {
        document.getElementById('view-solicitar').classList.remove('hidden');
        document.getElementById('view-historial').classList.add('hidden');
      } else {
        document.getElementById('view-solicitar').classList.add('hidden');
        document.getElementById('view-historial').classList.remove('hidden');
      }
    }

    // Inicializar página
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

## Página de Administrador

### Diferencias clave para administrador:

La página de administrador debe incluir TODO lo de usuario normal MÁS:

1. **Vista de Solicitudes Pendientes** - Pestaña adicional
2. **Botones de Aprobar/Rechazar** - En cada solicitud pendiente
3. **Ver solicitudes de TODOS los usuarios** - No solo las propias
4. **Filtros por usuario/estado** - Búsqueda avanzada

### Componentes adicionales para admin:

#### 1. Toggle con 3 vistas (en lugar de 2):

```html
<div class="flex px-4 py-3">
  <div class="flex h-12 flex-1 items-center justify-center rounded-full bg-slate-200 p-1 shadow-inner">
    <label class="flex cursor-pointer h-full grow items-center justify-center rounded-full px-2 has-[:checked]:bg-white has-[:checked]:shadow-md has-[:checked]:text-primary text-slate-600 text-sm font-medium transition-all">
      <span>Solicitar</span>
      <input checked class="invisible w-0" name="view-toggle" type="radio" onchange="toggleView('solicitar')"/>
    </label>
    <label class="flex cursor-pointer h-full grow items-center justify-center rounded-full px-2 has-[:checked]:bg-white has-[:checked]:shadow-md has-[:checked]:text-primary text-slate-600 text-sm font-medium transition-all">
      <span>Mis Solicitudes</span>
      <input class="invisible w-0" name="view-toggle" type="radio" onchange="toggleView('historial')"/>
    </label>
    <!-- NUEVA PESTAÑA PARA ADMIN -->
    <label id="admin-tab" class="flex cursor-pointer h-full grow items-center justify-center rounded-full px-2 has-[:checked]:bg-white has-[:checked]:shadow-md has-[:checked]:text-primary text-slate-600 text-sm font-medium transition-all hidden">
      <span>Pendientes</span>
      <input class="invisible w-0" name="view-toggle" type="radio" onchange="toggleView('pendientes')"/>
    </label>
  </div>
</div>
```

#### 2. Vista de Solicitudes Pendientes:

```html
<!-- Vista: Pendientes (Solo Admin) -->
<div id="view-pendientes" class="hidden">
  <h2 class="text-slate-900 text-[22px] font-bold px-4 pb-3 pt-5">Solicitudes Pendientes</h2>

  <!-- Filtros -->
  <div class="px-4 py-2">
    <input type="text" id="search-user" placeholder="Buscar por usuario..." class="w-full rounded-full border-slate-300 bg-white px-4 py-3 focus:ring-2 focus:ring-primary"/>
  </div>

  <div id="pending-requests-container" class="flex flex-col gap-4 px-4 pb-8">
    <!-- Se cargan dinámicamente -->
  </div>
</div>
```

#### 3. Tarjeta de solicitud con botones de admin:

```javascript
function renderPendingRequestCard(request) {
  const startDate = formatDate(request.start_date);
  const endDate = formatDate(request.end_date);
  const days = Math.ceil((new Date(request.end_date) - new Date(request.start_date)) / (1000 * 60 * 60 * 24)) + 1;

  const typeLabel = {
    anuales: 'Vacaciones Anuales',
    asuntos: 'Asuntos Propios',
    libres: 'Días Libres'
  }[request.request_type] || request.request_type;

  return `
    <div class="glass-card rounded-lg p-4 flex flex-col gap-3">
      <!-- Información del usuario -->
      <div class="flex items-center gap-2 mb-2">
        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-purple-700 flex items-center justify-center text-white font-bold text-sm">
          ${getUserInitials(request.user.nombre)}
        </div>
        <div>
          <p class="font-semibold text-slate-900">${request.user.nombre}</p>
          <p class="text-xs text-slate-600">${request.user.email}</p>
        </div>
      </div>

      <!-- Detalles de la solicitud -->
      <div class="flex justify-between items-start">
        <div>
          <p class="text-sm font-medium text-primary">${typeLabel}</p>
          <p class="text-sm text-slate-600">${startDate} - ${endDate}</p>
          <p class="text-lg font-bold text-slate-800">${days} día${days !== 1 ? 's' : ''}</p>
        </div>
        <div class="flex items-center gap-2 rounded-full bg-status-pending/10 text-status-pending px-3 py-1 text-sm font-medium">
          <span class="material-symbols-outlined text-base">hourglass_top</span>
          <span>Pendiente</span>
        </div>
      </div>

      ${request.reason ? `
        <div class="bg-slate-100 rounded-lg p-3">
          <p class="text-xs font-semibold text-slate-700 mb-1">Motivo:</p>
          <p class="text-sm text-slate-600">${request.reason}</p>
        </div>
      ` : ''}

      <!-- BOTONES DE ADMIN -->
      <div class="flex gap-3 pt-2">
        <button
          onclick="approveRequest('${request.id}')"
          class="flex-1 rounded-full h-10 bg-primary text-white font-semibold text-sm hover:bg-primary/90 flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-sm">check</span>
          Aprobar
        </button>
        <button
          onclick="openRejectModal('${request.id}')"
          class="flex-1 rounded-full h-10 bg-red-500 text-white font-semibold text-sm hover:bg-red-600 flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-sm">close</span>
          Rechazar
        </button>
      </div>
    </div>
  `;
}
```

#### 4. Modal de rechazo con motivo:

```html
<!-- Modal para rechazar solicitud -->
<div id="rejectModal" class="modal">
  <div class="modal-content">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xl font-bold text-gray-900">Rechazar Solicitud</h3>
      <button onclick="closeRejectModal()" class="p-2 hover:bg-gray-100 rounded-full">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <p class="text-sm text-slate-600 mb-4">Por favor indica el motivo del rechazo:</p>

    <textarea id="rejection-reason" class="form-textarea w-full resize-none rounded-lg border border-slate-300 p-4 focus:ring-2 focus:ring-primary" rows="4" placeholder="Escribe el motivo aquí..."></textarea>

    <div class="flex gap-3 mt-4">
      <button onclick="closeRejectModal()" class="flex-1 rounded-full h-10 bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300">
        Cancelar
      </button>
      <button onclick="confirmReject()" class="flex-1 rounded-full h-10 bg-red-500 text-white font-semibold hover:bg-red-600">
        Confirmar Rechazo
      </button>
    </div>
  </div>
</div>

<style>
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
}

.modal.active {
  display: flex;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}
</style>
```

#### 5. Funciones JavaScript para admin:

```javascript
let selectedRequestIdForRejection = null;

// Mostrar/ocultar pestaña de admin
async function checkAdminRole() {
  const isAdmin = ['administrador', 'admin', 'administrator'].includes(
    (currentUser?.rol || '').toLowerCase()
  );

  if (isAdmin) {
    document.getElementById('admin-tab').classList.remove('hidden');
    console.log('✅ Usuario es administrador - Pestaña "Pendientes" habilitada');
  }
}

// Cargar solicitudes pendientes (solo admin)
async function loadPendingRequests() {
  try {
    const requests = await window.vacacionesManager.getPendingRequests();
    const container = document.getElementById('pending-requests-container');

    if (!requests || requests.length === 0) {
      container.innerHTML = '<div class="text-center text-slate-500 py-8">No hay solicitudes pendientes</div>';
      return;
    }

    container.innerHTML = requests.map(request => renderPendingRequestCard(request)).join('');

  } catch (error) {
    console.error('❌ Error cargando solicitudes pendientes:', error);
    document.getElementById('pending-requests-container').innerHTML = '<div class="text-center text-red-500 py-8">Error cargando solicitudes</div>';
  }
}

// Aprobar solicitud
async function approveRequest(requestId) {
  if (!confirm('¿Estás seguro de que quieres aprobar esta solicitud?')) {
    return;
  }

  try {
    await window.vacacionesManager.approveRequest(requestId);
    alert('✅ Solicitud aprobada correctamente');
    await loadPendingRequests();
  } catch (error) {
    console.error('❌ Error aprobando solicitud:', error);
    alert('Error al aprobar la solicitud');
  }
}

// Abrir modal de rechazo
function openRejectModal(requestId) {
  selectedRequestIdForRejection = requestId;
  document.getElementById('rejectModal').classList.add('active');
}

// Cerrar modal de rechazo
function closeRejectModal() {
  selectedRequestIdForRejection = null;
  document.getElementById('rejection-reason').value = '';
  document.getElementById('rejectModal').classList.remove('active');
}

// Confirmar rechazo
async function confirmReject() {
  const reason = document.getElementById('rejection-reason').value.trim();

  if (!reason) {
    alert('Por favor indica el motivo del rechazo');
    return;
  }

  try {
    await window.vacacionesManager.rejectRequest(selectedRequestIdForRejection, reason);
    alert('✅ Solicitud rechazada');
    closeRejectModal();
    await loadPendingRequests();
  } catch (error) {
    console.error('❌ Error rechazando solicitud:', error);
    alert('Error al rechazar la solicitud');
  }
}

// Toggle de vistas (actualizado para 3 vistas)
function toggleView(view) {
  document.getElementById('view-solicitar').classList.add('hidden');
  document.getElementById('view-historial').classList.add('hidden');
  document.getElementById('view-pendientes').classList.add('hidden');

  if (view === 'solicitar') {
    document.getElementById('view-solicitar').classList.remove('hidden');
  } else if (view === 'historial') {
    document.getElementById('view-historial').classList.remove('hidden');
  } else if (view === 'pendientes') {
    document.getElementById('view-pendientes').classList.remove('hidden');
    loadPendingRequests();
  }
}

// Calcular iniciales de usuario
function getUserInitials(nombre) {
  if (!nombre) return 'U';
  const parts = nombre.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}

// Actualizar initPage para incluir checkAdminRole
async function initPage() {
  await loadUserData();
  await checkAdminRole(); // ← AÑADIR ESTA LÍNEA

  // ... resto del código de initPage
}
```

---

## Manager de Vacaciones

### Archivo: `js/vacaciones-manager.js`

```javascript
/**
 * Módulo de Vacaciones - Employee Leave Requests
 * Maneja todas las operaciones CRUD con la tabla employee_leave_requests
 */

class VacacionesManager {
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
        console.log('✅ VacacionesManager inicializado:', {
          usuario: this.currentUser.nombre,
          esAdmin: this.isAdmin
        });
      } else {
        throw new Error('No hay usuario autenticado');
      }
    } catch (error) {
      console.error('❌ Error inicializando VacacionesManager:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes de vacaciones del usuario actual
   */
  async getMyRequests() {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .select(`
          *,
          user:users!user_id(id, nombre, email, rol),
          approver:users!approved_by(id, nombre, email)
        `)
        .eq('user_id', this.currentUser.id)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error obteniendo mis solicitudes:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} solicitudes de vacaciones cargadas`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getMyRequests:', error);
      return [];
    }
  }

  /**
   * Obtener solicitudes pendientes (solo admin)
   */
  async getPendingRequests() {
    try {
      if (!this.isAdmin) {
        return [];
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .select(`
          *,
          user:users!user_id(id, nombre, email, rol)
        `)
        .eq('status', 'pendiente')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error obteniendo solicitudes pendientes:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} solicitudes pendientes`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getPendingRequests:', error);
      return [];
    }
  }

  /**
   * Crear nueva solicitud de vacaciones
   */
  async createRequest(requestData) {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .insert({
          user_id: this.currentUser.id,
          start_date: requestData.start_date,
          end_date: requestData.end_date,
          request_type: requestData.request_type,
          status: 'pendiente',
          reason: requestData.reason || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creando solicitud:', error);
        throw error;
      }

      console.log('✅ Solicitud de vacaciones creada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en createRequest:', error);
      throw error;
    }
  }

  /**
   * Aprobar solicitud (solo admin)
   */
  async approveRequest(requestId) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden aprobar solicitudes');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .update({
          status: 'aprobada',
          approved_by: this.currentUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error aprobando solicitud:', error);
        throw error;
      }

      console.log('✅ Solicitud aprobada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en approveRequest:', error);
      throw error;
    }
  }

  /**
   * Rechazar solicitud (solo admin)
   */
  async rejectRequest(requestId, reason = null) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden rechazar solicitudes');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .update({
          status: 'rechazada',
          rejection_reason: reason,
          approved_by: this.currentUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error rechazando solicitud:', error);
        throw error;
      }

      console.log('✅ Solicitud rechazada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en rejectRequest:', error);
      throw error;
    }
  }

  /**
   * Cancelar solicitud propia
   */
  async cancelRequest(requestId) {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      // Verificar que la solicitud pertenece al usuario
      const { data: existing, error: checkError } = await window.supabaseClient
        .from('employee_leave_requests')
        .select('user_id, status')
        .eq('id', requestId)
        .single();

      if (checkError || !existing) {
        throw new Error('Solicitud no encontrada');
      }

      if (existing.user_id !== this.currentUser.id && !this.isAdmin) {
        throw new Error('No tienes permiso para cancelar esta solicitud');
      }

      if (existing.status === 'aprobada') {
        throw new Error('No puedes cancelar una solicitud ya aprobada');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .update({
          status: 'cancelada',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelando solicitud:', error);
        throw error;
      }

      console.log('✅ Solicitud cancelada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en cancelRequest:', error);
      throw error;
    }
  }

  /**
   * Calcular días disponibles del usuario
   */
  async getAvailableDays() {
    try {
      // Obtener configuración del usuario de la tabla users
      const { data: userData, error: userError } = await window.supabaseClient
        .from('users')
        .select('vacation_days_annual, vacation_days_personal, vacation_days_free')
        .eq('id', this.currentUser.id)
        .single();

      if (userError) throw userError;

      const totals = {
        vacation_total: userData?.vacation_days_annual || 30,
        personal_total: userData?.vacation_days_personal || 6,
        free_total: userData?.vacation_days_free || 14
      };

      // Calcular días usados en el año actual
      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .select('start_date, end_date, request_type')
        .eq('user_id', this.currentUser.id)
        .eq('status', 'aprobada')
        .gte('start_date', `${new Date().getFullYear()}-01-01`);

      if (error) throw error;

      let usedVacation = 0;
      let usedPersonal = 0;
      let usedFree = 0;

      data?.forEach(request => {
        const start = new Date(request.start_date);
        const end = new Date(request.end_date);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (request.request_type === 'anuales') {
          usedVacation += days;
        } else if (request.request_type === 'asuntos') {
          usedPersonal += days;
        } else if (request.request_type === 'libres') {
          usedFree += days;
        }
      });

      return {
        vacation_total: totals.vacation_total,
        vacation_used: usedVacation,
        vacation_available: totals.vacation_total - usedVacation,

        personal_total: totals.personal_total,
        personal_used: usedPersonal,
        personal_available: totals.personal_total - usedPersonal,

        free_total: totals.free_total,
        free_used: usedFree,
        free_available: totals.free_total - usedFree
      };

    } catch (error) {
      console.error('❌ Error calculando días disponibles:', error);
      return {
        vacation_total: 30,
        vacation_used: 0,
        vacation_available: 30,
        personal_total: 6,
        personal_used: 0,
        personal_available: 6,
        free_total: 14,
        free_used: 0,
        free_available: 14
      };
    }
  }
}

// Exportar instancia global
window.vacacionesManager = new VacacionesManager();

console.log('✅ VacacionesManager cargado');
```

---

## Estilos y Diseño

### Principios de diseño:

1. **Glassmorphism** - Tarjetas con efecto de vidrio esmerilado
2. **Rounded corners** - Bordes redondeados en todos los componentes
3. **Color coding** - Colores específicos por estado y tipo
4. **Responsive** - Mobile-first, adaptable a desktop
5. **Iconos Material** - Uso consistente de iconos de Google

### Clases Tailwind clave:

```css
/* Botones primarios */
.btn-primary {
  @apply flex items-center justify-center rounded-full bg-primary h-14
         text-white text-base font-bold shadow-lg shadow-primary/30
         hover:bg-primary/90 transition-colors;
}

/* Botones secundarios */
.btn-secondary {
  @apply flex items-center justify-center rounded-full bg-secondary h-14
         text-white text-base font-bold shadow-lg shadow-secondary/30
         hover:bg-secondary/90 transition-colors;
}

/* Botones de rechazo/cancelar */
.btn-danger {
  @apply flex items-center justify-center rounded-full bg-red-500 h-10
         text-white font-semibold text-sm hover:bg-red-600 transition-colors;
}

/* Tarjetas */
.glass-card {
  @apply backdrop-blur-md bg-white/60 border border-white/20 rounded-lg p-4;
}

/* Badges de estado */
.badge-approved {
  @apply flex items-center gap-2 rounded-full bg-status-approved/10
         text-status-approved px-3 py-1 text-sm font-medium;
}

.badge-pending {
  @apply flex items-center gap-2 rounded-full bg-status-pending/10
         text-status-pending px-3 py-1 text-sm font-medium;
}

.badge-rejected {
  @apply flex items-center gap-2 rounded-full bg-status-rejected/10
         text-status-rejected px-3 py-1 text-sm font-medium;
}
```

---

## Autenticación y Roles

### Sistema SSO:

El sistema usa autenticación SSO con tokens. Los datos del usuario se almacenan en `sessionStorage`:

```javascript
// Formato del objeto de usuario en sessionStorage
{
  "id": "uuid-del-usuario",
  "nombre": "Juan Pérez García",
  "email": "juan.perez@example.com",
  "rol": "administrador" // o "empleado", "farmaceutico", "fir"
}
```

### Verificar rol de administrador:

```javascript
function isAdmin() {
  try {
    const ssoUser = sessionStorage.getItem('sso_user');
    if (!ssoUser) return false;

    const user = JSON.parse(ssoUser);
    return ['administrador', 'admin', 'administrator'].includes(
      (user.rol || '').toLowerCase()
    );
  } catch {
    return false;
  }
}
```

---

## Resumen de Diferencias Usuario vs Admin

| Característica | Usuario Normal | Administrador |
|---------------|----------------|---------------|
| **Ver días disponibles** | ✅ Propios | ✅ Propios |
| **Solicitar vacaciones** | ✅ Sí | ✅ Sí |
| **Ver solicitudes propias** | ✅ Sí | ✅ Sí |
| **Cancelar solicitudes** | ✅ Pendientes propias | ✅ Pendientes propias |
| **Ver solicitudes de otros** | ❌ No | ✅ Sí |
| **Pestaña "Pendientes"** | ❌ No visible | ✅ Visible |
| **Aprobar solicitudes** | ❌ No | ✅ Sí |
| **Rechazar solicitudes** | ❌ No | ✅ Sí (con motivo) |
| **Filtrar por usuario** | ❌ No | ✅ Sí |

---

## Checklist de Implementación

### Para Usuario Normal:
- [ ] Página con 2 pestañas: Solicitar y Mis Solicitudes
- [ ] Mostrar días disponibles (3 tipos)
- [ ] Calendario interactivo para selección de rango
- [ ] Formulario de solicitud con tipo y comentarios
- [ ] Validación de días disponibles antes de enviar
- [ ] Historial de solicitudes propias con estados
- [ ] Botón de cancelar para solicitudes pendientes
- [ ] Avatares con iniciales del usuario
- [ ] Responsive design

### Para Administrador (además de lo anterior):
- [ ] Pestaña adicional "Pendientes" visible solo para admins
- [ ] Ver solicitudes pendientes de todos los usuarios
- [ ] Botón "Aprobar" en cada solicitud pendiente
- [ ] Botón "Rechazar" que abre modal para motivo
- [ ] Modal de rechazo con campo de texto obligatorio
- [ ] Ver información del solicitante en cada tarjeta
- [ ] Filtro de búsqueda por nombre de usuario
- [ ] Actualización automática después de aprobar/rechazar

---

## Ejemplo de Uso Completo

### Flujo Usuario Normal:

1. Usuario accede a `/pages/vacaciones.html`
2. Sistema carga automáticamente sus días disponibles
3. Usuario selecciona "Vacaciones Anuales" del dropdown
4. Usuario hace clic en fecha inicial (ej: 15 de marzo)
5. Usuario hace clic en fecha final (ej: 29 de marzo)
6. Sistema muestra resumen: 15 días seleccionados
7. Usuario escribe motivo: "Vacaciones de verano"
8. Usuario hace clic en "Enviar Solicitud"
9. Sistema valida que tiene 15 días disponibles
10. Sistema crea solicitud en Supabase con estado "pendiente"
11. Usuario ve la solicitud en pestaña "Mis Solicitudes"

### Flujo Administrador:

1. Admin accede a `/pages/vacaciones.html` (misma página)
2. Sistema detecta rol y muestra pestaña "Pendientes"
3. Admin hace clic en pestaña "Pendientes"
4. Sistema carga todas las solicitudes con status='pendiente'
5. Admin ve solicitud de "Juan Pérez" por 15 días
6. Admin revisa motivo y fechas
7. **OPCIÓN A - Aprobar:**
   - Admin hace clic en "Aprobar"
   - Sistema actualiza status a 'aprobada' y guarda admin ID
   - Solicitud desaparece de la lista de pendientes
8. **OPCIÓN B - Rechazar:**
   - Admin hace clic en "Rechazar"
   - Se abre modal pidiendo motivo
   - Admin escribe: "Ya hay otro compañero de vacaciones esas fechas"
   - Admin hace clic en "Confirmar Rechazo"
   - Sistema actualiza status a 'rechazada' con motivo
   - Usuario verá el motivo en su historial

---

## Notas Finales

- **Todos los archivos deben estar en UTF-8** para correcta visualización del español
- **Los días se calculan inclusivos**: del 1 al 5 son 5 días (no 4)
- **Los fines de semana cuentan** en el cálculo actual (ajustar si es necesario)
- **Las solicitudes aprobadas no se pueden cancelar** (lógica de negocio)
- **Los administradores pueden ver TODO** pero solo gestionar pendientes
- **El sistema usa fecha del servidor** (`new Date().getFullYear()`)

---

**Generado para Farmacia HUNSC-Sur - Sistema de Gestión de Personal**
