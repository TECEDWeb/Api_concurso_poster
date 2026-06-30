const dashboardService = require('../services/dashboardService');

exports.adminDashboard = async (req, res) => {
  try {

    console.log('🟣 DASHBOARD ADMIN INICIADO');

    const data = await dashboardService.getAdminStats();

    console.log('🟢 DATA DASHBOARD:', data);

    res.json({
      success: true,
      data
    });

  } catch (error) {

    console.log('🔴 ERROR REAL DASHBOARD:');
    console.log(error); // 👈 ESTE ES EL IMPORTANTE

    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
};