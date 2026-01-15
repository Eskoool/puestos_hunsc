# Sistema de Asignación de Áreas - Farmacia HUNSC-Sur

## Índice
1. [Contexto del Sistema](#contexto-del-sistema)
2. [Arquitectura y Tecnologías](#arquitectura-y-tecnologías)
3. [Base de Datos Supabase](#base-de-datos-supabase)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Página de Asignaciones](#página-de-asignaciones)
6. [Manager de Áreas](#manager-de-áreas)
7. [Estilos y Diseño](#estilos-y-diseño)
8. [Funcionalidades](#funcionalidades)

---

## Contexto del Sistema

Sistema de visualización de asignaciones de áreas de trabajo para **Farmacia HUNSC-Sur** en las Islas Canarias. Permite ver qué personal está asignado a cada planta o área específica de la farmacia hospitalaria.

### Características Principales:

**Usuarios Normales:**
- Ver sus propias asignaciones de áreas
- Buscar por nombre de área o persona
- Ver estado de asignación (activo/inactivo)

**Administradores:**
- Ver TODAS las asignaciones de todos los usuarios
- Ver personal agrupado por área
- Ver porcentajes de ocupación por área
- Badge especial de "Administrador"
- Buscar por nombre de área o persona

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
  "secondary": "#7B2D8E",       // Púrpura secundario
  "accent": "#AF9100",          // Dorado
  "background-light": "#F0FDF4", // Verde claro
  "background-dark": "#1A202C",
  "info": "#4299E1",            // Azul información
  "warning": "#ED8936"          // Naranja advertencia
}
```

### Paleta Visual:
- **Fondo con gradientes animados** - Burbujas de color púrpura y dorado con blur
- **Glassmorphism** - Tarjetas con efecto vidrio esmerilado
- **Avatares con gradiente** - from-primary to-secondary
- **Estados con colores** - Azul para activo, gris para inactivo

---

## Base de Datos Supabase

### Tabla: `user_pharmacy_areas`

```sql
CREATE TABLE user_pharmacy_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  pharmacy_area TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_user_areas_user ON user_pharmacy_areas(user_id);
CREATE INDEX idx_user_areas_area ON user_pharmacy_areas(pharmacy_area);
CREATE INDEX idx_user_areas_active ON user_pharmacy_areas(is_active);

-- Constraint: Un usuario puede tener múltiples áreas, pero no duplicadas
CREATE UNIQUE INDEX idx_unique_user_area ON user_pharmacy_areas(user_id, pharmacy_area);
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
- `user_pharmacy_areas.user_id` → `users.id`

### Áreas Típicas de Farmacia Hospitalaria:
- **Planta 1** - Urgencias y Consultas Externas
- **Planta 2** - Hospitalización General
- **Planta 3** - Pediatría
- **Planta 4** - UCI y Críticos
- **Almacén** - Gestión de stock
- **Oncología** - Preparación de citostáticos
- **Nutrición** - Preparaciones parenterales
- **Farmacotecnia** - Elaboración de fórmulas magistrales
- **Ensayos Clínicos** - Gestión de medicamentos de investigación
- **Farmacocinética** - Seguimiento de niveles plasmáticos

---

## Estructura de Archivos

```
/pages/
  └── asignaciones.html          # Página única (user + admin)

/js/
  ├── supabase-config.js         # Configuración Supabase
  └── areas-manager.js           # Clase para operaciones CRUD

/assets/css/
  └── styles.css                 # Estilos adicionales
```

---

## Página de Asignaciones

### HTML Completo: `pages/asignaciones.html`

```html
<!DOCTYPE html>
<html class="light" lang="es">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Asignación de Plantas y Áreas - Farmacia HUNSC Sur</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap" rel="stylesheet"/>

  <!-- Supabase Client -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../js/supabase-config.js"></script>
  <script src="../js/areas-manager.js"></script>

  <style>
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    .frosted-glass {
      background-color: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .dark .frosted-glass {
      background-color: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    body {
      min-height: max(884px, 100dvh);
    }
  </style>

  <script>
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "primary": "#5A0E6E",
            "secondary": "#7B2D8E",
            "accent": "#AF9100",
            "background-light": "#F0FDF4",
            "background-dark": "#1A202C",
            "text-light": "#1A202C",
            "text-dark": "#F7FAFC",
            "info": "#4299E1",
            "warning": "#ED8936"
          },
          fontFamily: {
            "display": ["Inter", "sans-serif"]
          },
          borderRadius: {
            "DEFAULT": "1rem",
            "lg": "2rem",
            "xl": "3rem",
            "full": "9999px"
          },
        },
      },
    }
  </script>
</head>

<body class="font-display bg-background-light dark:bg-background-dark">
  <div class="relative flex min-h-screen w-full flex-col">
    <!-- Fondo animado con burbujas de color -->
    <div class="absolute inset-0 z-0 overflow-hidden">
      <div class="absolute -top-1/4 left-0 h-1/2 w-1/2 rounded-full bg-primary/20 blur-3xl dark:bg-primary/20"></div>
      <div class="absolute bottom-0 right-0 h-1/2 w-1/2 rounded-full bg-accent/20 blur-3xl dark:bg-accent/20"></div>
    </div>

    <div class="relative z-10 flex flex-col pb-20 lg:pb-8">
      <!-- Header -->
      <header class="sticky top-0 z-20 frosted-glass border-b-0">
        <div class="mx-auto max-w-7xl">
          <div class="flex items-center p-4 lg:p-6 pb-2 justify-between">
            <a href="../index.html" class="flex items-center gap-4">
              <img alt="Logo Farmacia HUNSC" class="h-10 lg:h-12" src="https://lh3.googleusercontent.com/d/1S6INg4SoWOJsoccSDnmP92EKK3GwWeTY"/>
              <span class="hidden md:block text-lg lg:text-2xl font-bold text-text-light dark:text-text-dark">Asignación de Áreas</span>
            </a>
            <span class="md:hidden text-lg font-bold text-text-light dark:text-text-dark">Asignaciones</span>
            <a href="perfil.html" id="user-avatar-header" class="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-90 transition-opacity" title="Mi Perfil">
              U
            </a>
          </div>
        </div>
      </header>

      <!-- Contenido con max-width -->
      <div class="mx-auto w-full max-w-7xl flex-1">

        <!-- Barra de búsqueda -->
        <div class="px-4 lg:px-6 py-3">
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              id="search-input"
              class="w-full rounded-full border-gray-300/80 bg-white/60 py-2.5 pl-10 pr-4 shadow-sm focus:border-primary focus:ring-primary dark:border-slate-600/80 dark:bg-slate-800/60 dark:text-white dark:placeholder-gray-400 dark:focus:border-accent dark:focus:ring-accent"
              placeholder="Buscar personal o área..."
              type="search"
            />
          </div>
        </div>

        <!-- Gestión de áreas -->
        <main class="flex flex-col gap-6 px-4">
          <section>
            <div class="flex items-center justify-between px-1 pb-2 pt-4">
              <h2 id="section-title" class="text-lg font-bold leading-tight tracking-[-0.015em] text-text-light dark:text-text-dark">
                Mis Asignaciones de Áreas
              </h2>
              <!-- Badge de admin (se muestra dinámicamente) -->
              <div id="admin-badge" class="px-3 py-1.5 bg-info/10 rounded-full hidden">
                <span class="text-xs font-semibold text-info dark:text-cyan-400">Administrador</span>
              </div>
            </div>

            <div id="areas-container" class="flex flex-col gap-4">
              <!-- Se cargarán dinámicamente desde Supabase -->
              <div class="text-center text-slate-500 dark:text-slate-400 py-8">
                Cargando asignaciones de áreas...
              </div>
            </div>
          </section>
        </main>

      </div><!-- Cierre contenedor max-w-7xl -->
    </div>

    <!-- Navegación inferior (solo móvil) -->
    <nav class="lg:hidden fixed bottom-0 left-0 z-20 w-full frosted-glass border-t border-white/50 dark:border-slate-700/50">
      <div class="mx-auto flex h-20 max-w-md items-center justify-around px-4">
        <a class="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400" href="../index.html">
          <span class="material-symbols-outlined">home</span>
          <span class="text-xs font-medium">Inicio</span>
        </a>
        <a class="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400" href="vacaciones.html">
          <span class="material-symbols-outlined">event</span>
          <span class="text-xs font-medium">Vacaciones</span>
        </a>
        <a class="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400" href="guardias.html">
          <span class="material-symbols-outlined">calendar_month</span>
          <span class="text-xs font-medium">Guardias</span>
        </a>
        <a class="flex flex-col items-center gap-1 text-primary dark:text-accent" href="asignaciones.html">
          <span class="material-symbols-outlined">assignment_ind</span>
          <span class="text-xs font-bold">Asignación</span>
        </a>
        <a class="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400" href="perfil.html">
          <div id="user-avatar-nav" class="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
            U
          </div>
          <span class="text-xs font-medium">Perfil</span>
        </a>
      </div>
    </nav>
  </div>

  <script>
    // ============================================
    // VARIABLES GLOBALES
    // ============================================
    let currentUser = null;
    let isAdmin = false;
    let allAssignments = [];

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    async function initPage() {
      await loadUserData();

      // Esperar a que Supabase esté listo
      if (typeof window.supabaseClient === 'undefined') {
        console.log('⏳ Esperando a que Supabase se inicialice...');
        let attempts = 0;
        while (typeof window.supabaseClient === 'undefined' && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }

      // Inicializar areas manager
      if (window.areasManager) {
        try {
          await window.areasManager.init();
          await loadAreas();
        } catch (error) {
          console.error('❌ Error inicializando areas manager:', error);
        }
      }

      // Configurar búsqueda
      document.getElementById('search-input').addEventListener('input', handleSearch);
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
        isAdmin = ['administrador', 'admin', 'administrator'].includes(
          (currentUser.rol || '').toLowerCase()
        );
        console.log('✅ Usuario cargado:', currentUser.nombre, 'Admin:', isAdmin);

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

        // Actualizar todos los avatares
        const avatarHeader = document.getElementById('user-avatar-header');
        const avatarNav = document.getElementById('user-avatar-nav');
        if (avatarHeader) avatarHeader.textContent = initials;
        if (avatarNav) avatarNav.textContent = initials;

        // Actualizar título si es admin
        if (isAdmin) {
          document.getElementById('section-title').textContent = 'Todas las Asignaciones de Áreas';
          document.getElementById('admin-badge').classList.remove('hidden');
        }

      } catch (error) {
        console.error('❌ Error cargando datos del usuario:', error);
      }
    }

    // ============================================
    // CARGAR ÁREAS
    // ============================================
    async function loadAreas() {
      try {
        // Cargar asignaciones
        allAssignments = await window.areasManager.getAllAreaAssignments();
        console.log('✅ Asignaciones cargadas:', allAssignments);

        renderAreas(allAssignments);

      } catch (error) {
        console.error('❌ Error cargando áreas:', error);
        document.getElementById('areas-container').innerHTML =
          '<div class="text-center text-red-500 py-8">Error cargando asignaciones de áreas</div>';
      }
    }

    // ============================================
    // RENDERIZAR ÁREAS
    // ============================================
    function renderAreas(assignments) {
      const container = document.getElementById('areas-container');

      if (!assignments || assignments.length === 0) {
        container.innerHTML =
          '<div class="text-center text-slate-500 dark:text-slate-400 py-8">No hay asignaciones de áreas registradas</div>';
        return;
      }

      // Agrupar por área
      const areaMap = {};
      assignments.forEach(assignment => {
        const areaName = assignment.pharmacy_area || 'Sin área';
        if (!areaMap[areaName]) {
          areaMap[areaName] = [];
        }
        areaMap[areaName].push(assignment);
      });

      // Renderizar cada área
      const areasHTML = Object.keys(areaMap).sort().map(areaName => {
        const areaAssignments = areaMap[areaName];
        const activeCount = areaAssignments.filter(a => a.is_active).length;
        const totalCount = areaAssignments.length;
        const percentage = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;

        const assignmentsHTML = areaAssignments.map(assignment => {
          const user = assignment.user;
          if (!user) return '';

          // Calcular iniciales del usuario
          let userInitials = 'U';
          if (user.nombre) {
            const nameParts = user.nombre.trim().split(' ');
            if (nameParts.length >= 2) {
              userInitials = (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
            } else if (nameParts.length === 1) {
              userInitials = nameParts[0].charAt(0).toUpperCase();
            }
          }

          const statusLabel = assignment.is_active ? 'Actual' : 'Inactivo';
          const statusClass = assignment.is_active
            ? 'text-info dark:text-cyan-400'
            : 'text-gray-500 dark:text-gray-400';

          return `
            <div class="flex items-center gap-2 rounded-lg bg-white/50 p-2 dark:bg-slate-800/50">
              <div class="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
                ${userInitials}
              </div>
              <div>
                <p class="truncate text-sm font-medium text-text-light dark:text-text-dark">${user.nombre}</p>
                <p class="text-xs ${statusClass}">${statusLabel}</p>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="flex flex-col gap-3 rounded-lg frosted-glass p-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-secondary dark:text-accent">${areaName}</h3>
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">${activeCount}/${totalCount}</span>
                <div class="h-2.5 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div class="h-2.5 rounded-full bg-primary" style="width: ${percentage}%"></div>
                </div>
              </div>
            </div>
            ${assignmentsHTML
              ? `<div class="grid grid-cols-2 gap-3">${assignmentsHTML}</div>`
              : '<div class="min-h-[50px] flex items-center justify-center"><p class="text-center text-sm text-gray-500 dark:text-gray-400">No hay personal asignado en esta área</p></div>'
            }
          </div>
        `;
      }).join('');

      container.innerHTML = areasHTML ||
        '<div class="text-center text-slate-500 dark:text-slate-400 py-8">No hay áreas configuradas</div>';
    }

    // ============================================
    // BÚSQUEDA
    // ============================================
    function handleSearch(e) {
      const searchTerm = e.target.value.toLowerCase().trim();

      if (!searchTerm) {
        renderAreas(allAssignments);
        return;
      }

      // Filtrar asignaciones que coincidan con el término de búsqueda
      const filtered = allAssignments.filter(assignment => {
        const areaMatch = (assignment.pharmacy_area || '').toLowerCase().includes(searchTerm);
        const userMatch = (assignment.user?.nombre || '').toLowerCase().includes(searchTerm);
        return areaMatch || userMatch;
      });

      renderAreas(filtered);
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

## Manager de Áreas

### Archivo: `js/areas-manager.js`

```javascript
/**
 * Módulo de Áreas de Trabajo - User Pharmacy Areas
 * Maneja operaciones con user_pharmacy_areas
 */

class AreasManager {
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
        console.log('✅ AreasManager inicializado:', {
          usuario: this.currentUser.nombre,
          rol: this.currentUser.rol,
          esAdmin: this.isAdmin
        });
      } else {
        throw new Error('No hay usuario autenticado');
      }
    } catch (error) {
      console.error('❌ Error inicializando AreasManager:', error);
      throw error;
    }
  }

  /**
   * Obtener áreas del usuario actual
   */
  async getMyAreas() {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('user_pharmacy_areas')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo mis áreas:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} áreas asignadas`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getMyAreas:', error);
      return [];
    }
  }

  /**
   * Obtener todas las asignaciones de áreas (solo admin)
   */
  async getAllAreaAssignments() {
    try {
      if (!this.isAdmin) {
        console.log('ℹ️ Usuario no es admin, devolviendo solo mis áreas');
        return this.getMyAreas();
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('user_pharmacy_areas')
        .select(`
          *,
          user:users!user_id(id, nombre, email, rol)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo asignaciones de áreas:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} asignaciones de áreas cargadas`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getAllAreaAssignments:', error);
      return [];
    }
  }

  /**
   * Asignar área a usuario (solo admin)
   */
  async assignArea(userId, area, isActive = true) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden asignar áreas');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('user_pharmacy_areas')
        .insert({
          user_id: userId,
          pharmacy_area: area,
          is_active: isActive
        })
        .select()
        .single();

      if (error) {
        console.error('Error asignando área:', error);
        throw error;
      }

      console.log('✅ Área asignada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en assignArea:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de asignación (solo admin)
   */
  async updateAreaStatus(assignmentId, isActive) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden actualizar áreas');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('user_pharmacy_areas')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando estado:', error);
        throw error;
      }

      console.log('✅ Estado actualizado:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en updateAreaStatus:', error);
      throw error;
    }
  }

  /**
   * Eliminar asignación de área (solo admin)
   */
  async removeAreaAssignment(assignmentId) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden eliminar áreas');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { error } = await window.supabaseClient
        .from('user_pharmacy_areas')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        console.error('Error eliminando asignación:', error);
        throw error;
      }

      console.log('✅ Asignación eliminada');
      return true;
    } catch (error) {
      console.error('❌ Error en removeAreaAssignment:', error);
      throw error;
    }
  }

  /**
   * Obtener usuarios por área
   */
  async getUsersByArea(area) {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('user_pharmacy_areas')
        .select(`
          *,
          user:users!user_id(id, nombre, email, rol)
        `)
        .eq('pharmacy_area', area)
        .eq('is_active', true);

      if (error) {
        console.error('Error obteniendo usuarios por área:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} usuarios en ${area}`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getUsersByArea:', error);
      return [];
    }
  }

  /**
   * Obtener todas las áreas únicas
   */
  async getAllUniqueAreas() {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('user_pharmacy_areas')
        .select('pharmacy_area')
        .order('pharmacy_area', { ascending: true });

      if (error) {
        console.error('Error obteniendo áreas:', error);
        throw error;
      }

      // Obtener valores únicos
      const uniqueAreas = [...new Set(data.map(item => item.pharmacy_area))];
      console.log(`✅ ${uniqueAreas.length} áreas únicas`);
      return uniqueAreas;
    } catch (error) {
      console.error('❌ Error en getAllUniqueAreas:', error);
      return [];
    }
  }
}

// Exportar instancia global
window.areasManager = new AreasManager();

console.log('✅ AreasManager cargado');
```

---

## Estilos y Diseño

### Componentes Clave:

```css
/* Glassmorphism */
.frosted-glass {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.dark .frosted-glass {
  background-color: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Fondo animado */
.bg-primary\/20 {
  background-color: rgba(90, 14, 110, 0.2);
}

.bg-accent\/20 {
  background-color: rgba(175, 145, 0, 0.2);
}

/* Avatares con gradiente */
.bg-gradient-to-r.from-primary.to-secondary {
  background: linear-gradient(to right, #5A0E6E, #7B2D8E);
}

/* Barra de progreso */
.h-2.5.rounded-full.bg-primary {
  background-color: #5A0E6E;
  height: 10px;
  border-radius: 9999px;
}
```

### Layout:

1. **Fondo con burbujas difuminadas** - Dos círculos grandes con blur-3xl
2. **Header glassmorphism** - Sticky con efecto vidrio
3. **Barra de búsqueda** - Input redondeado con icono de lupa
4. **Tarjetas de área** - Frosted glass con título y barra de progreso
5. **Grid de personal** - 2 columnas en móvil, adaptable
6. **Avatares circulares** - Con iniciales y gradiente

---

## Funcionalidades

### 1. Ver Asignaciones Agrupadas por Área

```javascript
// Agrupar asignaciones por nombre de área
const areaMap = {};
assignments.forEach(assignment => {
  const areaName = assignment.pharmacy_area || 'Sin área';
  if (!areaMap[areaName]) {
    areaMap[areaName] = [];
  }
  areaMap[areaName].push(assignment);
});

// Renderizar cada área con su personal
```

### 2. Calcular Porcentaje de Ocupación

```javascript
// Contar activos vs totales
const activeCount = areaAssignments.filter(a => a.is_active).length;
const totalCount = areaAssignments.length;
const percentage = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;

// Mostrar barra de progreso
<div class="h-2.5 rounded-full bg-primary" style="width: ${percentage}%"></div>
```

### 3. Búsqueda en Tiempo Real

```javascript
// Filtrar por nombre de área o nombre de persona
const filtered = allAssignments.filter(assignment => {
  const areaMatch = (assignment.pharmacy_area || '').toLowerCase().includes(searchTerm);
  const userMatch = (assignment.user?.nombre || '').toLowerCase().includes(searchTerm);
  return areaMatch || userMatch;
});

// Re-renderizar con resultados filtrados
renderAreas(filtered);
```

### 4. Iniciales de Usuario

```javascript
// Calcular iniciales: Primera letra nombre + Primera letra apellido
let userInitials = 'U';
if (user.nombre) {
  const nameParts = user.nombre.trim().split(' ');
  if (nameParts.length >= 2) {
    userInitials = (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  } else if (nameParts.length === 1) {
    userInitials = nameParts[0].charAt(0).toUpperCase();
  }
}

// Mostrar en avatar circular
<div class="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary">
  ${userInitials}
</div>
```

### 5. Estado Activo/Inactivo

```javascript
// Indicador visual de estado
const statusLabel = assignment.is_active ? 'Actual' : 'Inactivo';
const statusClass = assignment.is_active
  ? 'text-info dark:text-cyan-400'    // Azul para activo
  : 'text-gray-500 dark:text-gray-400'; // Gris para inactivo
```

### 6. Badge de Administrador

```javascript
// Solo visible para administradores
if (isAdmin) {
  document.getElementById('section-title').textContent = 'Todas las Asignaciones de Áreas';
  document.getElementById('admin-badge').classList.remove('hidden');
}
```

---

## Resumen de Permisos

| Acción | Usuario Normal | Administrador |
|--------|---------------|---------------|
| Ver mis asignaciones | ✅ | ✅ |
| Ver asignaciones de otros | ❌ | ✅ |
| Ver áreas agrupadas | ❌ | ✅ |
| Ver porcentajes de ocupación | ❌ | ✅ |
| Buscar por área/persona | ✅ | ✅ |
| Badge "Administrador" | ❌ | ✅ |
| **Asignar área a usuario** | ❌ | ✅ (función disponible) |
| **Cambiar estado activo/inactivo** | ❌ | ✅ (función disponible) |
| **Eliminar asignación** | ❌ | ✅ (función disponible) |

---

## Diferencias con Otros Módulos

### vs Vacaciones:
- **Vacaciones**: Formularios complejos, solicitudes, aprobaciones
- **Asignaciones**: Solo visualización, sin formularios

### vs Guardias:
- **Guardias**: Calendario con navegación de meses, múltiples modales
- **Asignaciones**: Vista de lista agrupada, búsqueda simple

### Simplicidad:
- **Sin modales** - Todo en una sola vista
- **Sin formularios** - Solo lectura para usuarios
- **Sin calendario** - Vista de lista agrupada
- **Un solo color principal** - Púrpura/dorado

---

## Extensiones Futuras (No Implementadas)

Si se requiere funcionalidad de admin para gestionar asignaciones:

### Modal para Asignar Área (Admin):
```html
<div id="assignAreaModal" class="modal">
  <div class="modal-content">
    <h3>Asignar Área</h3>
    <form>
      <select id="selectUser"><!-- Usuarios --></select>
      <select id="selectArea"><!-- Áreas --></select>
      <button type="submit">Asignar</button>
    </form>
  </div>
</div>
```

### Botón de Edición (Admin):
```html
<button onclick="toggleActiveStatus(assignmentId)">
  ${isActive ? 'Desactivar' : 'Activar'}
</button>
```

---

## Notas Finales

- **Un usuario puede tener múltiples áreas** (ej: un farmacéutico puede rotar)
- **`is_active` indica la asignación actual** vs historial
- **Las áreas se ordenan alfabéticamente** para facilitar navegación
- **La búsqueda es case-insensitive** y busca en nombres y áreas
- **El fondo tiene efecto parallax** con burbujas difuminadas
- **El glassmorphism requiere backdrop-filter** (compatible con navegadores modernos)
- **El sistema es 100% responsive** desde 320px hasta 4K

---

**Generado para Farmacia HUNSC-Sur - Sistema de Gestión de Personal**
