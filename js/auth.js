/**
 * Sistema de Autenticación con Supabase
 * Gestiona login, sesiones compartidas y roles de usuario
 */

// Estado global de autenticación
let currentUser = null;
let userRole = null;

/**
 * Inicializar autenticación
 * Llama a esta función al cargar cada página
 */
async function initAuth() {
  try {
    // PRIORIDAD 1: Verificar SSO en sessionStorage (desde Lovable)
    const ssoUser = sessionStorage.getItem('sso_user');

    if (ssoUser) {
      try {
        const parsed = JSON.parse(ssoUser);

        // Verificar expiración
        if (parsed.exp && parsed.exp > Date.now() / 1000) {
          console.log('✅ Usuario SSO encontrado en sessionStorage:', parsed.email);

          currentUser = {
            id: parsed.id,
            email: parsed.email,
            nombre: parsed.nombre,
            rol: parsed.rol,
            hospital: parsed.hospital
          };
          userRole = parsed.rol;

          console.log('✅ Usuario autenticado via SSO:', currentUser.email, '- Rol:', userRole);
          return currentUser;
        } else {
          console.log('Token SSO expirado, limpiando...');
          sessionStorage.removeItem('sso_user');
        }
      } catch (parseError) {
        console.error('Error parseando SSO user:', parseError);
        sessionStorage.removeItem('sso_user');
      }
    }

    // PRIORIDAD 2: Sesión de Supabase tradicional
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error('Error obteniendo sesión:', error);
      redirectToLogin();
      return null;
    }

    if (!session) {
      console.log('No hay sesión activa');
      redirectToLogin();
      return null;
    }

    // Usuario autenticado, cargar sus datos completos
    const userData = await loadUserData(session.user.id);

    if (!userData) {
      console.error('Usuario no encontrado en tabla users');
      redirectToLogin();
      return null;
    }

    currentUser = userData;
    userRole = userData.rol || userData.role; // Soportar ambos nombres

    console.log('✅ Usuario autenticado:', currentUser.email, '- Rol:', userRole);

    return currentUser;

  } catch (err) {
    console.error('Error en initAuth:', err);
    redirectToLogin();
    return null;
  }
}

/**
 * Cargar datos completos del usuario desde la tabla users
 */
async function loadUserData(userId) {
  try {
    // Primero intentar con auth.uid()
    const { data: authUser, error: authError } = await supabaseClient.auth.getUser();

    if (authError) {
      console.error('Error obteniendo auth user:', authError);
      return null;
    }

    // Buscar en tabla users por email
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', authUser.user.email)
      .single();

    if (error) {
      console.error('Error cargando usuario de tabla users:', error);
      return null;
    }

    return data;

  } catch (err) {
    console.error('Error en loadUserData:', err);
    return null;
  }
}

/**
 * Verificar si el usuario es administrador
 */
function isAdmin() {
  if (!currentUser) return false;
  const rol = userRole?.toLowerCase() || '';
  return rol === 'administrador' || rol === 'admin' || rol === 'administrator';
}

/**
 * Verificar si el usuario tiene un rol específico
 */
function hasRole(role) {
  if (!currentUser) return false;
  const currentRol = userRole?.toLowerCase() || '';
  return currentRol === role.toLowerCase();
}

/**
 * Redirigir a login si no hay sesión
 */
function redirectToLogin() {
  // Redirigir a la app de login (Lovable)
  const currentPath = window.location.pathname;
  if (!currentPath.includes('login')) {
    window.location.href = 'https://farma-frello-colabora.lovable.app';
  }
}

/**
 * Redirigir según el rol del usuario
 */
function redirectByRole() {
  if (!currentUser) {
    redirectToLogin();
    return;
  }

  const currentPath = window.location.pathname;

  if (isAdmin()) {
    // Es admin, permitir acceso a páginas admin
    if (currentPath.includes('index.html') || currentPath === '/') {
      // Si está en página de usuario, redirigir a admin
      window.location.href = 'admin-dashboard.html';
    }
  } else {
    // Es usuario normal, NO permitir acceso a páginas admin
    if (currentPath.includes('admin-')) {
      window.location.href = 'index.html';
    }
  }
}

/**
 * Proteger página - solo admin
 */
async function requireAdmin() {
  const user = await initAuth();
  if (!user || !isAdmin()) {
    alert('⚠️ Acceso denegado. Solo administradores pueden acceder a esta página.');
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

/**
 * Proteger página - cualquier usuario autenticado
 */
async function requireAuth() {
  const user = await initAuth();
  if (!user) {
    return false;
  }
  return true;
}

/**
 * Cerrar sesión
 */
async function logout() {
  try {
    // Limpiar sessionStorage de SSO
    sessionStorage.removeItem('sso_user');

    // Cerrar sesión de Supabase (si existe)
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error);
    }

    currentUser = null;
    userRole = null;

    // Redirigir a la app de login
    window.location.href = 'https://farma-frello-colabora.lovable.app';

  } catch (err) {
    console.error('Error en logout:', err);
  }
}

/**
 * Escuchar cambios en la autenticación
 */
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event);

  if (event === 'SIGNED_IN') {
    console.log('Usuario inició sesión');
    await initAuth();
  } else if (event === 'SIGNED_OUT') {
    console.log('Usuario cerró sesión');
    currentUser = null;
    userRole = null;
    redirectToLogin();
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token renovado');
  }
});

/**
 * Obtener usuario actual
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Obtener rol del usuario actual
 */
function getCurrentRole() {
  return userRole;
}

/**
 * Mostrar información del usuario en el UI
 */
function displayUserInfo(containerId = 'user-info') {
  const container = document.getElementById(containerId);
  if (!container || !currentUser) return;

  const roleBadgeColor = isAdmin() ? 'bg-purple-600' : 'bg-blue-600';

  container.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
        ${currentUser.nombre ? currentUser.nombre.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
      </div>
      <div>
        <p class="font-semibold text-gray-900">${currentUser.nombre || currentUser.email}</p>
        <p class="text-xs ${roleBadgeColor} text-white px-2 py-1 rounded inline-block">${userRole}</p>
      </div>
    </div>
  `;
}

// Exportar funciones globalmente
window.auth = {
  init: initAuth,
  requireAuth,
  requireAdmin,
  logout,
  isAdmin,
  hasRole,
  getCurrentUser,
  getCurrentRole,
  displayUserInfo,
  redirectByRole
};
