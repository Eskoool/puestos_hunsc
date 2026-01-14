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
      // Obtener usuario desde sessionStorage
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
   * @param {Date} startDate - Fecha de inicio (opcional)
   * @param {Date} endDate - Fecha de fin (opcional)
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

      console.log(`✅ Guardias del usuario cargadas: ${data?.length || 0}`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getMyGuards:', error);
      return [];
    }
  }

  /**
   * Obtener TODAS las guardias (solo admin)
   * @param {Date} startDate - Fecha de inicio (opcional)
   * @param {Date} endDate - Fecha de fin (opcional)
   */
  async getAllGuards(startDate = null, endDate = null) {
    try {
      if (!this.isAdmin) {
        console.warn('⚠️ Usuario no es administrador, devolviendo guardias propias');
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

      console.log(`✅ Todas las guardias cargadas: ${data?.length || 0}`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getAllGuards:', error);
      return [];
    }
  }

  /**
   * Obtener guardias de un mes específico
   * @param {number} year - Año
   * @param {number} month - Mes (0-11)
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
   * @param {Object} guardData - Datos de la guardia
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
   * @param {string} guardId - ID de la guardia
   * @param {Object} updates - Campos a actualizar
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
   * @param {string} guardId - ID de la guardia
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
   * @param {string} guardId - ID de la guardia
   * @param {string} newStatus - Nuevo estado
   */
  async changeStatus(guardId, newStatus) {
    return this.updateGuard(guardId, { status: newStatus });
  }

  /**
   * Verificar si el usuario puede editar una guardia
   * @param {Object} guard - Objeto de guardia
   */
  canEdit(guard) {
    return this.isAdmin;
  }

  /**
   * Verificar si una fecha está dentro de una guardia del usuario
   * @param {Date} date - Fecha a verificar
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
