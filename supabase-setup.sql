-- ============================================
-- Script de Configuración de Base de Datos
-- Farmacia HUNSC Sur - Sistema de Puestos
-- ============================================

-- 1. Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(255),
  rol VARCHAR(50) NOT NULL,
  hospital VARCHAR(100) DEFAULT 'HUNSC-Sur',
  avatar_url TEXT,
  telefono VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);

-- 3. Insertar usuarios de prueba
INSERT INTO users (email, nombre, rol, hospital) VALUES
  ('admin@hunsc.es', 'Administrador Sistema', 'administrador', 'HUNSC-Sur'),
  ('farmaceutico@hunsc.es', 'Juan Pérez García', 'farmaceutico', 'HUNSC-Sur'),
  ('fir@hunsc.es', 'María López Martínez', 'FIR', 'HUNSC-Sur'),
  ('usuario@hunsc.es', 'Usuario Prueba', 'usuario', 'HUNSC-Sur')
ON CONFLICT (email) DO NOTHING;

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Configurar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. Política: Los usuarios pueden ver su propia información
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- 8. Política: Los administradores pueden ver todos los usuarios
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.rol IN ('administrador', 'admin', 'administrator')
    )
  );

-- 9. Política: Los administradores pueden insertar usuarios
DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.rol IN ('administrador', 'admin', 'administrator')
    )
  );

-- 10. Política: Los administradores pueden actualizar usuarios
DROP POLICY IF EXISTS "Admins can update users" ON users;
CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.rol IN ('administrador', 'admin', 'administrator')
    )
  );

-- 11. Política: Permitir inserts durante SSO (sin autenticación)
DROP POLICY IF EXISTS "Allow SSO inserts" ON users;
CREATE POLICY "Allow SSO inserts"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 12. Política: Permitir updates durante SSO (sin autenticación)
DROP POLICY IF EXISTS "Allow SSO updates" ON users;
CREATE POLICY "Allow SSO updates"
  ON users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 13. Crear tabla de puestos
CREATE TABLE IF NOT EXISTS puestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  hospital VARCHAR(100) DEFAULT 'HUNSC-Sur',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Crear tabla de asignaciones
CREATE TABLE IF NOT EXISTS asignaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
  puesto_id UUID REFERENCES puestos(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  turno VARCHAR(20), -- 'mañana', 'tarde', 'noche'
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Crear tabla de guardias (con doble rol)
CREATE TABLE IF NOT EXISTS guardias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  turno VARCHAR(20) NOT NULL, -- 'mañana', 'tarde', 'noche'
  usuario_principal_id UUID REFERENCES users(id),
  usuario_apoyo_id UUID REFERENCES users(id),
  puesto_id UUID REFERENCES puestos(id),
  estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'confirmada', 'cancelada'
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_users CHECK (usuario_principal_id != usuario_apoyo_id)
);

-- 16. Crear tabla de vacaciones
CREATE TABLE IF NOT EXISTS vacaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- 'vacaciones', 'permiso', 'baja'
  estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
  notas TEXT,
  aprobado_por UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (fecha_fin >= fecha_inicio)
);

-- 17. Crear índices adicionales
CREATE INDEX IF NOT EXISTS idx_asignaciones_usuario ON asignaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_puesto ON asignaciones(puesto_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_fecha ON asignaciones(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_guardias_fecha ON guardias(fecha);
CREATE INDEX IF NOT EXISTS idx_guardias_usuarios ON guardias(usuario_principal_id, usuario_apoyo_id);
CREATE INDEX IF NOT EXISTS idx_vacaciones_usuario ON vacaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vacaciones_fechas ON vacaciones(fecha_inicio, fecha_fin);

-- 18. Triggers para updated_at en todas las tablas
CREATE TRIGGER update_puestos_updated_at
  BEFORE UPDATE ON puestos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asignaciones_updated_at
  BEFORE UPDATE ON asignaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guardias_updated_at
  BEFORE UPDATE ON guardias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacaciones_updated_at
  BEFORE UPDATE ON vacaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 19. Habilitar RLS en todas las tablas
ALTER TABLE puestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacaciones ENABLE ROW LEVEL SECURITY;

-- 20. Políticas para puestos (todos pueden leer, solo admin puede modificar)
CREATE POLICY "Anyone can view puestos"
  ON puestos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage puestos"
  ON puestos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.rol IN ('administrador', 'admin', 'administrator')
    )
  );

-- 21. Políticas para asignaciones
CREATE POLICY "Users can view own asignaciones"
  ON asignaciones FOR SELECT
  TO authenticated
  USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "Admins can view all asignaciones"
  ON asignaciones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.rol IN ('administrador', 'admin', 'administrator')
    )
  );

CREATE POLICY "Admins can manage asignaciones"
  ON asignaciones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.rol IN ('administrador', 'admin', 'administrator')
    )
  );

-- 22. Políticas para guardias
CREATE POLICY "Users can view own guardias"
  ON guardias FOR SELECT
  TO authenticated
  USING (
    usuario_principal_id::text = auth.uid()::text
    OR usuario_apoyo_id::text = auth.uid()::text
  );

CREATE POLICY "Admins can view all guardias"
  ON guardias FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.rol IN ('administrador', 'admin', 'administrator')
    )
  );

CREATE POLICY "Admins can manage guardias"
  ON guardias FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.rol IN ('administrador', 'admin', 'administrator')
    )
  );

-- 23. Políticas para vacaciones
CREATE POLICY "Users can view own vacaciones"
  ON vacaciones FOR SELECT
  TO authenticated
  USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own vacaciones"
  ON vacaciones FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id::text = auth.uid()::text);

CREATE POLICY "Admins can view all vacaciones"
  ON vacaciones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.rol IN ('administrador', 'admin', 'administrator')
    )
  );

CREATE POLICY "Admins can manage vacaciones"
  ON vacaciones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.rol IN ('administrador', 'admin', 'administrator')
    )
  );

-- ============================================
-- Verificación Final
-- ============================================

-- Verificar tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verificar usuarios insertados
SELECT email, nombre, rol FROM users ORDER BY rol, nombre;

-- ============================================
-- ¡Script completado!
-- ============================================
