const service = require('./setup_dashboard.service');

async function getDashboardStats(req, res) {
  try {
    const stats = await service.getDashboardStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics'
    });
  }
}

module.exports = {
  getDashboardStats
};