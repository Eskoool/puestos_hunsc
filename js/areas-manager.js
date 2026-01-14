/**
 * Módulo de Áreas de Trabajo - User Pharmacy Areas
 * Maneja operaciones con user_pharmacy_areas
 */

class AreasManager {
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
        console.log('✅ AreasManager inicializado');
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
  async assignArea(userId, area) {
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
          area: area
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
        .eq('area', area);

      if (error) {
        console.error('Error obteniendo usuarios por área:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en getUsersByArea:', error);
      return [];
    }
  }
}

// Exportar instancia global
window.areasManager = new AreasManager();

console.log('✅ AreasManager cargado');
