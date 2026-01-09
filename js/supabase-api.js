/**
 * API de Supabase para Farmacia HUNSC-Sur
 * Funciones CRUD para todas las tablas
 */

// ============================================
// USUARIOS / PERSONAL
// ============================================

const usuariosAPI = {
  // Obtener todos los usuarios
  getAll: async () => {
    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      return [];
    }
    return data;
  },

  // Obtener usuario por ID
  getById: async (id) => {
    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
    return data;
  },

  // Obtener usuarios por rol
  getByRole: async (rol) => {
    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('rol', rol)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo usuarios por rol:', error);
      return [];
    }
    return data;
  },

  // Crear usuario
  create: async (usuario) => {
    const { data, error } = await supabaseClient
      .from('usuarios')
      .insert([usuario])
      .select()
      .single();

    if (error) {
      console.error('Error creando usuario:', error);
      return null;
    }
    return data;
  },

  // Actualizar usuario
  update: async (id, updates) => {
    const { data, error } = await supabaseClient
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando usuario:', error);
      return null;
    }
    return data;
  },

  // Eliminar usuario
  delete: async (id) => {
    const { error } = await supabaseClient
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando usuario:', error);
      return false;
    }
    return true;
  }
};

// ============================================
// ÁREAS
// ============================================

const areasAPI = {
  // Obtener todas las áreas
  getAll: async () => {
    const { data, error } = await supabaseClient
      .from('areas')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo áreas:', error);
      return [];
    }
    return data;
  },

  // Crear área
  create: async (area) => {
    const { data, error } = await supabaseClient
      .from('areas')
      .insert([area])
      .select()
      .single();

    if (error) {
      console.error('Error creando área:', error);
      return null;
    }
    return data;
  },

  // Actualizar área
  update: async (id, updates) => {
    const { data, error } = await supabaseClient
      .from('areas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando área:', error);
      return null;
    }
    return data;
  },

  // Eliminar área
  delete: async (id) => {
    const { error } = await supabaseClient
      .from('areas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando área:', error);
      return false;
    }
    return true;
  }
};

// ============================================
// PUESTOS
// ============================================

const puestosAPI = {
  // Obtener todos los puestos
  getAll: async () => {
    const { data, error } = await supabaseClient
      .from('puestos')
      .select(`
        *,
        areas (
          id,
          nombre,
          color
        )
      `)
      .order('area_id', { ascending: true });

    if (error) {
      console.error('Error obteniendo puestos:', error);
      return [];
    }
    return data;
  },

  // Obtener puestos por área
  getByArea: async (areaId) => {
    const { data, error } = await supabaseClient
      .from('puestos')
      .select('*')
      .eq('area_id', areaId)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo puestos por área:', error);
      return [];
    }
    return data;
  },

  // Crear puesto
  create: async (puesto) => {
    const { data, error } = await supabaseClient
      .from('puestos')
      .insert([puesto])
      .select()
      .single();

    if (error) {
      console.error('Error creando puesto:', error);
      return null;
    }
    return data;
  },

  // Actualizar puesto
  update: async (id, updates) => {
    const { data, error } = await supabaseClient
      .from('puestos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando puesto:', error);
      return null;
    }
    return data;
  },

  // Eliminar puesto
  delete: async (id) => {
    const { error } = await supabaseClient
      .from('puestos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando puesto:', error);
      return false;
    }
    return true;
  }
};

// ============================================
// ASIGNACIONES
// ============================================

const asignacionesAPI = {
  // Obtener asignaciones por fecha
  getByDate: async (fecha) => {
    const { data, error } = await supabaseClient
      .from('asignaciones')
      .select(`
        *,
        usuarios (
          id,
          nombre,
          rol
        ),
        puestos (
          id,
          nombre,
          area_id,
          areas (
            nombre,
            color
          )
        )
      `)
      .eq('fecha', fecha);

    if (error) {
      console.error('Error obteniendo asignaciones:', error);
      return [];
    }
    return data;
  },

  // Obtener asignaciones por rango de fechas
  getByDateRange: async (fechaInicio, fechaFin) => {
    const { data, error } = await supabaseClient
      .from('asignaciones')
      .select(`
        *,
        usuarios (
          id,
          nombre,
          rol
        ),
        puestos (
          id,
          nombre,
          area_id,
          areas (
            nombre,
            color
          )
        )
      `)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true });

    if (error) {
      console.error('Error obteniendo asignaciones por rango:', error);
      return [];
    }
    return data;
  },

  // Obtener asignaciones de un usuario
  getByUsuario: async (usuarioId) => {
    const { data, error } = await supabaseClient
      .from('asignaciones')
      .select(`
        *,
        puestos (
          id,
          nombre,
          areas (
            nombre,
            color
          )
        )
      `)
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error obteniendo asignaciones de usuario:', error);
      return [];
    }
    return data;
  },

  // Crear asignación
  create: async (asignacion) => {
    const { data, error } = await supabaseClient
      .from('asignaciones')
      .insert([asignacion])
      .select()
      .single();

    if (error) {
      console.error('Error creando asignación:', error);
      return null;
    }
    return data;
  },

  // Crear múltiples asignaciones
  createBatch: async (asignaciones) => {
    const { data, error } = await supabaseClient
      .from('asignaciones')
      .insert(asignaciones)
      .select();

    if (error) {
      console.error('Error creando asignaciones en lote:', error);
      return null;
    }
    return data;
  },

  // Eliminar asignación
  delete: async (id) => {
    const { error } = await supabaseClient
      .from('asignaciones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando asignación:', error);
      return false;
    }
    return true;
  },

  // Eliminar asignaciones por fecha y puesto
  deleteByDateAndPuesto: async (fecha, puestoId) => {
    const { error } = await supabaseClient
      .from('asignaciones')
      .delete()
      .eq('fecha', fecha)
      .eq('puesto_id', puestoId);

    if (error) {
      console.error('Error eliminando asignación:', error);
      return false;
    }
    return true;
  }
};

// ============================================
// GUARDIAS
// ============================================

const guardiasAPI = {
  // Obtener guardias por fecha
  getByDate: async (fecha) => {
    const { data, error } = await supabaseClient
      .from('guardias')
      .select(`
        *,
        usuario_fir:usuarios!guardias_usuario_fir_id_fkey (
          id,
          nombre,
          rol
        ),
        usuario_farmaceutico:usuarios!guardias_usuario_farmaceutico_id_fkey (
          id,
          nombre,
          rol
        )
      `)
      .eq('fecha', fecha);

    if (error) {
      console.error('Error obteniendo guardias:', error);
      return [];
    }
    return data;
  },

  // Obtener guardias por mes
  getByMonth: async (year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabaseClient
      .from('guardias')
      .select(`
        *,
        usuario_fir:usuarios!guardias_usuario_fir_id_fkey (
          id,
          nombre,
          rol
        ),
        usuario_farmaceutico:usuarios!guardias_usuario_farmaceutico_id_fkey (
          id,
          nombre,
          rol
        )
      `)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: true });

    if (error) {
      console.error('Error obteniendo guardias del mes:', error);
      return [];
    }
    return data;
  },

  // Crear guardia
  create: async (guardia) => {
    const { data, error } = await supabaseClient
      .from('guardias')
      .insert([guardia])
      .select()
      .single();

    if (error) {
      console.error('Error creando guardia:', error);
      return null;
    }
    return data;
  },

  // Actualizar guardia
  update: async (id, updates) => {
    const { data, error } = await supabaseClient
      .from('guardias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando guardia:', error);
      return null;
    }
    return data;
  },

  // Eliminar guardia
  delete: async (id) => {
    const { error } = await supabaseClient
      .from('guardias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando guardia:', error);
      return false;
    }
    return true;
  }
};

// ============================================
// VACACIONES
// ============================================

const vacacionesAPI = {
  // Obtener vacaciones de un usuario
  getByUsuario: async (usuarioId) => {
    const { data, error } = await supabaseClient
      .from('vacaciones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha_inicio', { ascending: false });

    if (error) {
      console.error('Error obteniendo vacaciones:', error);
      return [];
    }
    return data;
  },

  // Obtener todas las vacaciones (admin)
  getAll: async () => {
    const { data, error } = await supabaseClient
      .from('vacaciones')
      .select(`
        *,
        usuarios (
          id,
          nombre,
          rol
        )
      `)
      .order('fecha_inicio', { ascending: false });

    if (error) {
      console.error('Error obteniendo todas las vacaciones:', error);
      return [];
    }
    return data;
  },

  // Obtener vacaciones pendientes
  getPendientes: async () => {
    const { data, error } = await supabaseClient
      .from('vacaciones')
      .select(`
        *,
        usuarios (
          id,
          nombre,
          rol
        )
      `)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error obteniendo vacaciones pendientes:', error);
      return [];
    }
    return data;
  },

  // Crear solicitud de vacaciones
  create: async (vacacion) => {
    const { data, error } = await supabaseClient
      .from('vacaciones')
      .insert([vacacion])
      .select()
      .single();

    if (error) {
      console.error('Error creando solicitud de vacaciones:', error);
      return null;
    }
    return data;
  },

  // Actualizar estado de vacaciones (aprobar/rechazar)
  updateEstado: async (id, estado, comentario = null) => {
    const updates = { estado };
    if (comentario) updates.comentario = comentario;

    const { data, error } = await supabaseClient
      .from('vacaciones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando estado de vacaciones:', error);
      return null;
    }
    return data;
  },

  // Eliminar solicitud
  delete: async (id) => {
    const { error } = await supabaseClient
      .from('vacaciones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando solicitud de vacaciones:', error);
      return false;
    }
    return true;
  }
};

// ============================================
// VALIDACIONES (PLANTAS)
// ============================================

const validacionesAPI = {
  // Obtener todas las plantas
  getAll: async () => {
    const { data, error } = await supabaseClient
      .from('plantas')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error obteniendo plantas:', error);
      return [];
    }
    return data;
  },

  // Obtener asignaciones de validación por fecha
  getAsignacionesByDate: async (fecha) => {
    const { data, error } = await supabaseClient
      .from('validaciones_asignaciones')
      .select(`
        *,
        usuarios (
          id,
          nombre,
          rol
        ),
        plantas (
          id,
          nombre,
          capacidad
        )
      `)
      .eq('fecha', fecha);

    if (error) {
      console.error('Error obteniendo asignaciones de validación:', error);
      return [];
    }
    return data;
  },

  // Crear asignación de validación
  createAsignacion: async (asignacion) => {
    const { data, error } = await supabaseClient
      .from('validaciones_asignaciones')
      .insert([asignacion])
      .select()
      .single();

    if (error) {
      console.error('Error creando asignación de validación:', error);
      return null;
    }
    return data;
  },

  // Eliminar asignación de validación
  deleteAsignacion: async (id) => {
    const { error } = await supabaseClient
      .from('validaciones_asignaciones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando asignación de validación:', error);
      return false;
    }
    return true;
  }
};

// ============================================
// PLANTILLAS (para calendario)
// ============================================

const plantillasAPI = {
  // Obtener todas las plantillas
  getAll: async () => {
    const { data, error } = await supabaseClient
      .from('plantillas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo plantillas:', error);
      return [];
    }
    return data;
  },

  // Crear plantilla
  create: async (plantilla) => {
    const { data, error } = await supabaseClient
      .from('plantillas')
      .insert([plantilla])
      .select()
      .single();

    if (error) {
      console.error('Error creando plantilla:', error);
      return null;
    }
    return data;
  },

  // Eliminar plantilla
  delete: async (id) => {
    const { error } = await supabaseClient
      .from('plantillas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando plantilla:', error);
      return false;
    }
    return true;
  }
};

// Exportar todas las APIs
window.supabaseAPI = {
  usuarios: usuariosAPI,
  areas: areasAPI,
  puestos: puestosAPI,
  asignaciones: asignacionesAPI,
  guardias: guardiasAPI,
  vacaciones: vacacionesAPI,
  validaciones: validacionesAPI,
  plantillas: plantillasAPI
};
