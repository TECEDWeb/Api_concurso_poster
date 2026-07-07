const dashboardService = require('../services/dashboardService');

const dashboardController = {

  /**
   * GET /api/dashboard/admin
   * GET /api/dashboard/admin/resumen (para compatibilidad)
   */
  async adminDashboard(req, res) {
    try {
      console.log('🟣 DASHBOARD ADMIN INICIADO');

      const data = await dashboardService.getAdminStats();

      console.log('🟢 DATA DASHBOARD:', data);

      // Mapear los campos para que coincidan con lo que espera el frontend
      const responseData = {
        usuarios: data.usuarios || 0,
        concursos: data.concursos || data.proyectos || 0, // Si no hay concursos, usar proyectos
        proyectos: data.proyectos || 0,
        reportes: data.evaluaciones || data.reportes || 0, // Si no hay reportes, usar evaluaciones
        // También mantener los campos originales por si acaso
        ...data
      };

      return res.json({
        ok: true,
        data: responseData
      });

    } catch (error) {

      console.log('🔴 ERROR REAL DASHBOARD:');
      console.error(error);

      return res.status(500).json({
        ok: false,
        mensaje: 'Error al cargar dashboard',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * GET /api/dashboard/admin/resumen - Alias para compatibilidad
   */
  async adminResumen(req, res) {
    // Redirigir al mismo método
    return this.adminDashboard(req, res);
  },

  /**
   * GET /api/dashboard/actividades-recientes
   */
  async actividadesRecientes(req, res) {
    try {
      console.log('🟣 ACTIVIDADES RECIENTES INICIADO');

      const actividades = await dashboardService.getActividadesRecientes();

      return res.json({
        ok: true,
        data: actividades
      });

    } catch (error) {
      console.error('🔴 ERROR ACTIVIDADES RECIENTES:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al cargar actividades recientes'
      });
    }
  },

  /**
   * GET /api/dashboard/notificaciones
   */
  async notificaciones(req, res) {
    try {
      console.log('🟣 NOTIFICACIONES INICIADO');

      const notificaciones = await dashboardService.getNotificaciones(req.usuario.id);

      return res.json({
        ok: true,
        data: notificaciones
      });

    } catch (error) {
      console.error('🔴 ERROR NOTIFICACIONES:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al cargar notificaciones'
      });
    }
  },

  /**
   * GET /api/dashboard/notificaciones/contar
   */
  async contarNotificaciones(req, res) {
    try {
      console.log('🟣 CONTAR NOTIFICACIONES INICIADO');

      const count = await dashboardService.contarNotificaciones(req.usuario.id);

      return res.json({
        ok: true,
        data: { count }
      });

    } catch (error) {
      console.error('🔴 ERROR CONTAR NOTIFICACIONES:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al contar notificaciones'
      });
    }
  },

  /**
   * POST /api/dashboard/notificaciones/leer
   */
  async marcarNotificacionesLeidas(req, res) {
    try {
      console.log('🟣 MARCAR NOTIFICACIONES LEÍDAS INICIADO');

      await dashboardService.marcarNotificacionesLeidas(req.usuario.id);

      return res.json({
        ok: true,
        mensaje: 'Notificaciones marcadas como leídas'
      });

    } catch (error) {
      console.error('🔴 ERROR MARCAR NOTIFICACIONES:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al marcar notificaciones'
      });
    }
  }

};

module.exports = dashboardController;