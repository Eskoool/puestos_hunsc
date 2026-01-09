/**
 * Configuración de Supabase para Farmacia HUNSC-Sur
 *
 * INSTRUCCIONES:
 * 1. Ve a tu proyecto en https://supabase.com/dashboard
 * 2. Ve a Settings > API
 * 3. Copia tu Project URL y anon/public key
 * 4. Reemplaza las variables SUPABASE_URL y SUPABASE_ANON_KEY
 */

// ✅ CREDENCIALES DE SUPABASE CONFIGURADAS
const SUPABASE_URL = 'https://julrvkllcifpcdyvbikr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHJ2a2xsY2lmcGNkeXZiaWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNTk4NjUsImV4cCI6MjA2MjgzNTg2NX0.6EIGwcVca6dahNWJ3qniLGnhr2BOmqDLRr3y9C92GME';

// Crear cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar para uso global
window.supabaseClient = supabase;

// Verificar conexión (opcional, para debugging)
async function testConnection() {
  try {
    const { data, error } = await supabase.from('usuarios').select('count').single();
    if (error) throw error;
    console.log('✅ Supabase conectado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message);
    return false;
  }
}

// Configuración de autenticación
const authConfig = {
  // Detectar cambios en la sesión
  onAuthStateChange: (callback) => {
    supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Obtener sesión actual
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
};

window.supabaseAuth = authConfig;
