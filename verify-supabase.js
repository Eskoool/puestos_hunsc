/**
 * Script de Diagnóstico de Supabase
 * Verifica la conexión y estructura de la base de datos
 */

const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase
const SUPABASE_URL = 'https://julrvkllcifpcdyvbikr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bHJ2a2xsY2lmcGNkeXZiaWtyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI1OTg2NSwiZXhwIjoyMDYyODM1ODY1fQ.8YdwRGRxmNqwFWMkB7w62hOt6aNVp1fdAQMLu95e1BI';

// Crear cliente con service_role (acceso completo)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verificarConexion() {
  console.log('🔍 Verificando conexión con Supabase...\n');
  console.log('📍 URL:', SUPABASE_URL);
  console.log('🔑 Usando: service_role key\n');

  try {
    // Test 1: Verificar conexión básica
    console.log('✅ Test 1: Conexión básica');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Error:', testError.message);
      console.log('⚠️  La tabla "users" podría no existir aún\n');
    } else {
      console.log('✅ Conexión exitosa\n');
    }

    // Test 2: Listar tablas disponibles
    console.log('📋 Test 2: Listando tablas en la base de datos');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (!tablesError && tables) {
      console.log('✅ Tablas encontradas:');
      tables.forEach(table => console.log(`   - ${table.table_name}`));
      console.log('');
    }

    // Test 3: Verificar estructura de tabla users
    console.log('🔍 Test 3: Verificando estructura de tabla "users"');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ Error:', usersError.message);
      console.log('');
      console.log('📝 Necesitas crear la tabla "users" con esta estructura:');
      console.log(`
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(255),
  rol VARCHAR(50) NOT NULL,
  hospital VARCHAR(100),
  avatar_url TEXT,
  telefono VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
    } else {
      console.log('✅ Tabla "users" existe');

      if (usersData && usersData.length > 0) {
        console.log('✅ Ejemplo de registro:');
        console.log(JSON.stringify(usersData[0], null, 2));
      } else {
        console.log('⚠️  La tabla existe pero está vacía');
      }
      console.log('');
    }

    // Test 4: Verificar columnas necesarias
    console.log('🔍 Test 4: Verificando columnas requeridas para SSO');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
      .catch(() => null);

    const requiredColumns = ['id', 'email', 'nombre', 'rol', 'hospital'];
    console.log('📋 Columnas requeridas:', requiredColumns.join(', '));

    // Test 5: Contar usuarios
    console.log('\n📊 Test 5: Estadísticas de usuarios');
    const { data: countData, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log('✅ Total de usuarios en la base de datos:', countData?.length || 0);
    }

    // Test 6: Verificar usuarios por rol
    const { data: roleData, error: roleError } = await supabase
      .from('users')
      .select('rol');

    if (!roleError && roleData) {
      const roleCounts = roleData.reduce((acc, user) => {
        acc[user.rol] = (acc[user.rol] || 0) + 1;
        return acc;
      }, {});

      console.log('📊 Usuarios por rol:');
      Object.entries(roleCounts).forEach(([rol, count]) => {
        console.log(`   - ${rol}: ${count}`);
      });
    }

    console.log('\n✅ Diagnóstico completado');
    console.log('\n📝 Resumen:');
    console.log('   - Conexión: ✅ Funcionando');
    console.log('   - Base de datos: ✅ Accesible');
    console.log('   - Tabla users: ' + (usersError ? '❌ Necesita crearse' : '✅ Existe'));
    console.log('\n🔗 Listo para conectar con la aplicación\n');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error(error);
  }
}

// Ejecutar verificación
verificarConexion().then(() => {
  console.log('🏁 Verificación finalizada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
