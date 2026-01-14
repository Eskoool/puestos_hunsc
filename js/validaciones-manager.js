/**
 * Módulo de Validaciones - Plant Validation Assignments
 * Maneja operaciones con plant_validation_assignments
 */

class ValidacionesManager {
  constructor() {
    this.currentUser = null;
    this.isAdmin = false;
  }

  async init() {
    try {
      const ssoUser = sessionStorage.getItem('sso_user');
      if (ssoUser) {
        this.currentUser = JSON.parse(ssoUser);
        this.isAdmin = ['administrador', 'admin', 'administrator'].includes(
          (this.currentUser.rol || '').toLowerCase()
        );
        console.log('✅ ValidacionesManager inicializado');
      } else {
        throw new Error('No hay usuario autenticado');
      }
    } catch (error) {
      console.error('❌ Error inicializando ValidacionesManager:', error);
      throw error;
    }
  }

  /**
   * Obtener validaciones asignadas al usuario actual
   */
  async getMyValidations() {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('plant_validation_assignments')
        .select(`
          *,
          validator:users!validator_user_id(id, nombre, email, rol),
          assigned_by_user:users!assigned_by(id, nombre, email)
        `)
        .eq('validator_user_id', this.currentUser.id)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error obteniendo mis validaciones:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} validaciones asignadas`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getMyValidations:', error);
      return [];
    }
  }

  /**
   * Obtener todas las validaciones (solo admin)
   */
  async getAllValidations() {
    try {
      if (!this.isAdmin) {
        return this.getMyValidations();
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('plant_validation_assignments')
        .select(`
          *,
          validator:users!validator_user_id(id, nombre, email, rol),
          assigned_by_user:users!assigned_by(id, nombre, email)
        `)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error obteniendo todas las validaciones:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} validaciones totales cargadas`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getAllValidations:', error);
      return [];
    }
  }

  /**
   * Obtener validaciones pendientes
   */
  async getPendingValidations() {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      let query = window.supabaseClient
        .from('plant_validation_assignments')
        .select(`
          *,
          validator:users!validator_user_id(id, nombre, email, rol),
          assigned_by_user:users!assigned_by(id, nombre, email)
        `)
        .eq('status', 'pendiente');

      // Si no es admin, solo sus validaciones
      if (!this.isAdmin) {
        query = query.eq('validator_user_id', this.currentUser.id);
      }

      const { data, error } = await query.order('start_date', { ascending: true });

      if (error) {
        console.error('Error obteniendo validaciones pendientes:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} validaciones pendientes`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getPendingValidations:', error);
      return [];
    }
  }

  /**
   * Crear nueva asignación de validación (solo admin)
   */
  async createValidation(validationData) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden crear validaciones');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('plant_validation_assignments')
        .insert({
          plant_id: validationData.plant_id || null,
          validator_user_id: validationData.validator_user_id,
          assigned_by: this.currentUser.id,
          start_date: validationData.start_date,
          end_date: validationData.end_date || null,
          assignment_type: validationData.assignment_type,
          status: validationData.status || 'pendiente',
          notes: validationData.notes || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creando validación:', error);
        throw error;
      }

      console.log('✅ Validación creada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en createValidation:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de validación
   */
  async updateStatus(validationId, newStatus, notes = null) {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      // Verificar permisos
      const { data: existing, error: checkError } = await window.supabaseClient
        .from('plant_validation_assignments')
        .select('validator_user_id')
        .eq('id', validationId)
        .single();

      if (checkError || !existing) {
        throw new Error('Validación no encontrada');
      }

      if (existing.validator_user_id !== this.currentUser.id && !this.isAdmin) {
        throw new Error('No tienes permiso para actualizar esta validación');
      }

      const updates = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updates.notes = notes;
      }

      const { data, error } = await window.supabaseClient
        .from('plant_validation_assignments')
        .update(updates)
        .eq('id', validationId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando validación:', error);
        throw error;
      }

      console.log('✅ Validación actualizada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en updateStatus:', error);
      throw error;
    }
  }

  /**
   * Completar validación
   */
  async completeValidation(validationId, notes = null) {
    return this.updateStatus(validationId, 'completado', notes);
  }

  /**
   * Marcar como en progreso
   */
  async startValidation(validationId) {
    return this.updateStatus(validationId, 'en_progreso');
  }

  /**
   * Eliminar validación (solo admin)
   */
  async deleteValidation(validationId) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden eliminar validaciones');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { error } = await window.supabaseClient
        .from('plant_validation_assignments')
        .delete()
        .eq('id', validationId);

      if (error) {
        console.error('Error eliminando validación:', error);
        throw error;
      }

      console.log('✅ Validación eliminada');
      return true;
    } catch (error) {
      console.error('❌ Error en deleteValidation:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de validaciones
   */
  async getStats() {
    try {
      const allValidations = this.isAdmin ?
        await this.getAllValidations() :
        await this.getMyValidations();

      const stats = {
        total: allValidations.length,
        pendiente: allValidations.filter(v => v.status === 'pendiente').length,
        en_progreso: allValidations.filter(v => v.status === 'en_progreso').length,
        completado: allValidations.filter(v => v.status === 'completado').length
      };

      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return { total: 0, pendiente: 0, en_progreso: 0, completado: 0 };
    }
  }
}

// Exportar instancia global
window.validacionesManager = new ValidacionesManager();

console.log('✅ ValidacionesManager cargado');
