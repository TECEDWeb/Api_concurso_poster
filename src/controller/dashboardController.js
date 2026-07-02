const dashboardService = require('../services/dashboardService');

const dashboardController = {

  /**
   * GET /api/dashboard/admin
   */
  async adminDashboard(req, res) {
    try {
      console.log('🟣 DASHBOARD ADMIN INICIADO');

      const data = await dashboardService.getAdminStats();

      console.log('🟢 DATA DASHBOARD:', data);

      return res.json({
        ok: true,
        data
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
  }

};

module.exports = dashboardController;