// Test de conexión a Supabase - Tabla users
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://julrvkllcifpcdyvbikr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHJ2a2xsY2lmcGNkeXZiaWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNTk4NjUsImV4cCI6MjA2MjgzNTg2NX0.6EIGwcVca6dahNWJ3qniLGnhr2BOmqDLRr3y9C92GME';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUsersTable() {
  console.log('🔍 Probando conexión a Supabase...\n');

  try {
    // Test 1: Contar usuarios
    console.log('📊 Test 1: Contando registros en tabla "users"...');
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Error:', countError.message);
      console.log('💡 Código de error:', countError.code);

      // Intentar con "usuarios" en español
      console.log('\n🔄 Intentando con tabla "usuarios"...');
      const { count: count2, error: error2 } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true });

      if (error2) {
        console.log('❌ Error:', error2.message);
      } else {
        console.log('✅ Tabla "usuarios" encontrada:', count2, 'registros');
      }
      return;
    }

    console.log('✅ Tabla "users" encontrada:', count, 'registros\n');

    // Test 2: Obtener primeros 5 usuarios
    console.log('📋 Test 2: Obteniendo primeros 5 usuarios...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    if (data.length === 0) {
      console.log('⚠️ La tabla está vacía');
      return;
    }

    console.log('✅ Usuarios obtenidos:', data.length, '\n');

    // Mostrar estructura
    console.log('📐 Estructura de la tabla (columnas):');
    const columns = Object.keys(data[0]);
    console.log(columns.join(', '));
    console.log('');

    // Mostrar datos
    console.log('👥 Primeros usuarios:');
    data.forEach((user, i) => {
      console.log(`\n${i + 1}.`, JSON.stringify(user, null, 2));
    });

  } catch (err) {
    console.log('❌ Error general:', err.message);
  }
}

testUsersTable();
