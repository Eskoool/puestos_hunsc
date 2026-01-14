/**
 * Módulo de Vacaciones - Employee Leave Requests
 * Maneja todas las operaciones CRUD con la tabla employee_leave_requests
 */

class VacacionesManager {
  constructor() {
    this.currentUser = null;
    this.isAdmin = false;
  }

  /**
   * Inicializar con datos del usuario actual
   */
  async init() {
    try {
      const ssoUser = sessionStorage.getItem('sso_user');
      if (ssoUser) {
        this.currentUser = JSON.parse(ssoUser);
        this.isAdmin = ['administrador', 'admin', 'administrator'].includes(
          (this.currentUser.rol || '').toLowerCase()
        );
        console.log('✅ VacacionesManager inicializado:', {
          usuario: this.currentUser.nombre,
          esAdmin: this.isAdmin
        });
      } else {
        throw new Error('No hay usuario autenticado');
      }
    } catch (error) {
      console.error('❌ Error inicializando VacacionesManager:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes de vacaciones del usuario actual
   */
  async getMyRequests() {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .select(`
          *,
          user:users!user_id(id, nombre, email, rol),
          approver:users!approved_by(id, nombre, email)
        `)
        .eq('user_id', this.currentUser.id)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error obteniendo mis solicitudes:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} solicitudes de vacaciones cargadas`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getMyRequests:', error);
      return [];
    }
  }

  /**
   * Obtener TODAS las solicitudes (solo admin)
   */
  async getAllRequests() {
    try {
      if (!this.isAdmin) {
        console.warn('⚠️ Usuario no es administrador');
        return this.getMyRequests();
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .select(`
          *,
          user:users!user_id(id, nombre, email, rol),
          approver:users!approved_by(id, nombre, email)
        `)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error obteniendo todas las solicitudes:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} solicitudes totales cargadas`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getAllRequests:', error);
      return [];
    }
  }

  /**
   * Obtener solicitudes pendientes (solo admin)
   */
  async getPendingRequests() {
    try {
      if (!this.isAdmin) {
        return [];
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .select(`
          *,
          user:users!user_id(id, nombre, email, rol)
        `)
        .eq('status', 'pendiente')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error obteniendo solicitudes pendientes:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} solicitudes pendientes`);
      return data || [];
    } catch (error) {
      console.error('❌ Error en getPendingRequests:', error);
      return [];
    }
  }

  /**
   * Crear nueva solicitud de vacaciones
   */
  async createRequest(requestData) {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .insert({
          user_id: this.currentUser.id,
          start_date: requestData.start_date,
          end_date: requestData.end_date,
          leave_type: requestData.leave_type,
          status: 'pendiente',
          notes: requestData.notes || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creando solicitud:', error);
        throw error;
      }

      console.log('✅ Solicitud de vacaciones creada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en createRequest:', error);
      throw error;
    }
  }

  /**
   * Aprobar solicitud (solo admin)
   */
  async approveRequest(requestId) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden aprobar solicitudes');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .update({
          status: 'aprobado',
          approved_by: this.currentUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error aprobando solicitud:', error);
        throw error;
      }

      console.log('✅ Solicitud aprobada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en approveRequest:', error);
      throw error;
    }
  }

  /**
   * Rechazar solicitud (solo admin)
   */
  async rejectRequest(requestId, reason = null) {
    try {
      if (!this.isAdmin) {
        throw new Error('Solo administradores pueden rechazar solicitudes');
      }

      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      const updates = {
        status: 'rechazado',
        approved_by: this.currentUser.id,
        updated_at: new Date().toISOString()
      };

      if (reason) {
        updates.notes = (updates.notes ? updates.notes + '\n' : '') + `Rechazado: ${reason}`;
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .update(updates)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error rechazando solicitud:', error);
        throw error;
      }

      console.log('✅ Solicitud rechazada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en rejectRequest:', error);
      throw error;
    }
  }

  /**
   * Cancelar solicitud propia
   */
  async cancelRequest(requestId) {
    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase no está inicializado');
      }

      // Verificar que la solicitud pertenece al usuario
      const { data: existing, error: checkError } = await window.supabaseClient
        .from('employee_leave_requests')
        .select('user_id, status')
        .eq('id', requestId)
        .single();

      if (checkError || !existing) {
        throw new Error('Solicitud no encontrada');
      }

      if (existing.user_id !== this.currentUser.id && !this.isAdmin) {
        throw new Error('No tienes permiso para cancelar esta solicitud');
      }

      if (existing.status === 'aprobado') {
        throw new Error('No puedes cancelar una solicitud ya aprobada');
      }

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .update({
          status: 'cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelando solicitud:', error);
        throw error;
      }

      console.log('✅ Solicitud cancelada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en cancelRequest:', error);
      throw error;
    }
  }

  /**
   * Calcular días disponibles del usuario
   */
  async getAvailableDays() {
    try {
      // Por defecto 30 días al año (esto debería venir de una tabla de configuración)
      const totalDaysPerYear = 30;

      const { data, error } = await window.supabaseClient
        .from('employee_leave_requests')
        .select('start_date, end_date')
        .eq('user_id', this.currentUser.id)
        .eq('status', 'aprobado')
        .gte('start_date', `${new Date().getFullYear()}-01-01`);

      if (error) throw error;

      let usedDays = 0;
      data?.forEach(request => {
        const start = new Date(request.start_date);
        const end = new Date(request.end_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        usedDays += diffDays;
      });

      return {
        total: totalDaysPerYear,
        used: usedDays,
        available: totalDaysPerYear - usedDays
      };
    } catch (error) {
      console.error('❌ Error calculando días disponibles:', error);
      return { total: 30, used: 0, available: 30 };
    }
  }

  /**
   * Verificar si hay solicitudes que se solapen
   */
  async hasOverlap(startDate, endDate, excludeId = null) {
    try {
      let query = window.supabaseClient
        .from('employee_leave_requests')
        .select('id')
        .eq('user_id', this.currentUser.id)
        .neq('status', 'cancelado')
        .neq('status', 'rechazado')
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error('❌ Error verificando solapamiento:', error);
      return false;
    }
  }
}

// Exportar instancia global
window.vacacionesManager = new VacacionesManager();

console.log('✅ VacacionesManager cargado');
