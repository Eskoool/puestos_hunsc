# 🔌 Guía de Integración con Supabase

## 📋 Paso 1: Configurar tus credenciales

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** (ej: `https://abc123.supabase.co`)
   - **anon/public key** (empieza con `eyJ...`)

4. Edita el archivo `js/supabase-config.js` y reemplaza:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co'; // ← Tu URL aquí
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui'; // ← Tu key aquí
```

---

## 🗄️ Paso 2: Estructura de Tablas SQL

Si aún no tienes las tablas creadas, ejecuta estos scripts SQL en tu Supabase SQL Editor:

### Tabla: `usuarios`

```sql
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('FIR', 'Farmacéutico', 'Técnico', 'Administrador')),
  avatar_url TEXT,
  telefono VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer
CREATE POLICY "Usuarios visibles para todos"
  ON usuarios FOR SELECT
  TO authenticated
  USING (true);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su perfil"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
```

### Tabla: `areas`

```sql
CREATE TABLE areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Áreas visibles para todos"
  ON areas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admin puede modificar áreas"
  ON areas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'Administrador'
    )
  );
```

### Tabla: `puestos`

```sql
CREATE TABLE puestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE puestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Puestos visibles para todos"
  ON puestos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admin puede modificar puestos"
  ON puestos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'Administrador'
    )
  );
```

### Tabla: `asignaciones`

```sql
CREATE TABLE asignaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  puesto_id UUID REFERENCES puestos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Evitar duplicados: misma persona, mismo puesto, mismo día
  UNIQUE(usuario_id, puesto_id, fecha)
);

ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Asignaciones visibles para todos"
  ON asignaciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admin puede gestionar asignaciones"
  ON asignaciones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'Administrador'
    )
  );
```

### Tabla: `guardias`

```sql
CREATE TABLE guardias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('mañana', 'tarde', 'noche')),
  horario VARCHAR(50),
  usuario_fir_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_farmaceutico_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Solo una guardia de cada tipo por día
  UNIQUE(fecha, tipo)
);

ALTER TABLE guardias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guardias visibles para todos"
  ON guardias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admin puede gestionar guardias"
  ON guardias FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'Administrador'
    )
  );
```

### Tabla: `vacaciones`

```sql
CREATE TABLE vacaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_totales INTEGER NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE vacaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propias vacaciones"
  ON vacaciones FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Admin ve todas las vacaciones"
  ON vacaciones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'Administrador'
    )
  );

CREATE POLICY "Usuarios pueden solicitar vacaciones"
  ON vacaciones FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Solo admin puede aprobar/rechazar"
  ON vacaciones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'Administrador'
    )
  );
```

### Tabla: `plantas`

```sql
CREATE TABLE plantas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  capacidad INTEGER NOT NULL DEFAULT 1,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE plantas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plantas visibles para todos"
  ON plantas FOR SELECT
  TO authenticated
  USING (true);
```

### Tabla: `validaciones_asignaciones`

```sql
CREATE TABLE validaciones_asignaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  planta_id UUID REFERENCES plantas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(usuario_id, planta_id, fecha)
);

ALTER TABLE validaciones_asignaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Validaciones visibles para todos"
  ON validaciones_asignaciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admin puede gestionar validaciones"
  ON validaciones_asignaciones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'Administrador'
    )
  );
```

### Tabla: `plantillas` (para calendario)

```sql
CREATE TABLE plantillas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  configuracion JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE plantillas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plantillas visibles para todos"
  ON plantillas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admin puede gestionar plantillas"
  ON plantillas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'Administrador'
    )
  );
```

---

## 🔗 Paso 3: Incluir los scripts en tus páginas HTML

Agrega estas líneas **antes del cierre de `</body>`** en todas tus páginas:

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Tu configuración -->
<script src="js/supabase-config.js"></script>
<script src="js/supabase-api.js"></script>
```

---

## 💻 Paso 4: Usar las APIs en tu código

### Ejemplo 1: Cargar usuarios en un select

```javascript
async function loadUsuarios() {
  const usuarios = await supabaseAPI.usuarios.getAll();

  const select = document.getElementById('usuario-select');
  select.innerHTML = '<option value="">Seleccionar...</option>';

  usuarios.forEach(u => {
    select.innerHTML += `<option value="${u.id}">${u.nombre} - ${u.rol}</option>`;
  });
}

// Llamar al cargar la página
loadUsuarios();
```

### Ejemplo 2: Crear asignación

```javascript
async function asignarPuesto(usuarioId, puestoId, fecha) {
  const asignacion = {
    usuario_id: usuarioId,
    puesto_id: puestoId,
    fecha: fecha
  };

  const result = await supabaseAPI.asignaciones.create(asignacion);

  if (result) {
    alert('✅ Asignación creada correctamente');
    // Recargar vista
    loadAsignaciones();
  } else {
    alert('❌ Error creando asignación');
  }
}
```

### Ejemplo 3: Cargar guardias del mes

```javascript
async function loadGuardiasDelMes(year, month) {
  const guardias = await supabaseAPI.guardias.getByMonth(year, month);

  // Renderizar calendario con las guardias
  guardias.forEach(guardia => {
    console.log(`${guardia.fecha}: ${guardia.usuario_fir.nombre} + ${guardia.usuario_farmaceutico.nombre}`);
  });
}
```

### Ejemplo 4: Crear asignaciones en lote (calendario)

```javascript
async function asignarSemanaCompleta(usuarioId, puestoId, fechas) {
  const asignaciones = fechas.map(fecha => ({
    usuario_id: usuarioId,
    puesto_id: puestoId,
    fecha: fecha
  }));

  const result = await supabaseAPI.asignaciones.createBatch(asignaciones);

  if (result) {
    alert(`✅ ${result.length} asignaciones creadas`);
  }
}
```

### Ejemplo 5: Aprobar vacaciones (admin)

```javascript
async function aprobarVacaciones(vacacionId) {
  const result = await supabaseAPI.vacaciones.updateEstado(
    vacacionId,
    'aprobado',
    'Aprobado por administración'
  );

  if (result) {
    alert('✅ Vacaciones aprobadas');
    loadVacacionesPendientes();
  }
}
```

---

## 🔐 Paso 5: Autenticación (Opcional)

Si quieres añadir login real con email/password:

```javascript
// Login
async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert('Error de login: ' + error.message);
    return;
  }

  // Redirigir a dashboard
  window.location.href = 'index.html';
}

// Logout
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// Verificar si hay sesión activa
async function checkAuth() {
  const session = await supabaseAuth.getSession();

  if (!session) {
    window.location.href = 'login.html';
  }
}

// Llamar al cargar páginas protegidas
checkAuth();
```

---

## 🧪 Paso 6: Probar la conexión

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Test conexión
testConnection();

// Test cargar usuarios
supabaseAPI.usuarios.getAll().then(console.log);

// Test crear área
supabaseAPI.areas.create({
  nombre: 'Unidosis',
  color: 'purple',
  descripcion: 'Área de preparación de dosis unitarias'
}).then(console.log);
```

---

## 📚 Estructura de Datos

### Usuario
```javascript
{
  id: "uuid",
  nombre: "Ana Pérez García",
  email: "ana.perez@hunsc.es",
  rol: "Farmacéutico", // FIR | Farmacéutico | Técnico | Administrador
  avatar_url: "https://...",
  telefono: "+34 123456789"
}
```

### Área
```javascript
{
  id: "uuid",
  nombre: "Unidosis",
  color: "purple", // purple | green | amber | blue | red | pink | teal | indigo
  descripcion: "Preparación de dosis unitarias"
}
```

### Puesto
```javascript
{
  id: "uuid",
  nombre: "Turno Mañana (08:00-15:00)",
  area_id: "uuid",
  descripcion: "Puesto de mañana en Unidosis"
}
```

### Asignación
```javascript
{
  id: "uuid",
  usuario_id: "uuid",
  puesto_id: "uuid",
  fecha: "2024-12-30"
}
```

### Guardia
```javascript
{
  id: "uuid",
  fecha: "2024-12-30",
  tipo: "mañana", // mañana | tarde | noche
  horario: "08:00-15:00",
  usuario_fir_id: "uuid",
  usuario_farmaceutico_id: "uuid"
}
```

### Vacación
```javascript
{
  id: "uuid",
  usuario_id: "uuid",
  fecha_inicio: "2025-01-15",
  fecha_fin: "2025-01-20",
  dias_totales: 6,
  estado: "pendiente", // pendiente | aprobado | rechazado
  comentario: "Vacaciones de invierno"
}
```

---

## 🚀 Próximos Pasos

1. ✅ Configurar credenciales en `supabase-config.js`
2. ✅ Ejecutar SQL para crear tablas
3. ✅ Incluir scripts en páginas HTML
4. ✅ Reemplazar datos estáticos con llamadas a API
5. ✅ Probar funcionalidad completa

---

## 💡 Consejos

- **Usa RLS (Row Level Security)**: Ya está configurado en los scripts SQL
- **Índices**: Supabase crea automáticamente índices en claves foráneas
- **Realtime**: Puedes activar subscripciones para actualizar en tiempo real
- **Storage**: Usa Supabase Storage para avatares de usuarios

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12) para ver errores
2. Verifica que las credenciales en `supabase-config.js` sean correctas
3. Asegúrate de que las tablas existan en Supabase
4. Verifica que RLS esté configurado correctamente
