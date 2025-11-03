const service = require('./setup_dashboard.service');

async function getDashboardStats(req, res) {
  console.log('📊 GET /api/setup/dashboard/stats - Get dashboard statistics');
  console.log('📊 Query params:', req.query);
  
  try {
    const stats = await service.getDashboardStats();
    
    console.log('✅ Dashboard stats retrieved successfully');
    console.log('📊 Stats summary:', {
      vendors: stats.vendors.total,
      users: stats.users.total,
      userGroups: stats.userGroups.total,
      risks: stats.risks.total,
      standards: stats.standards.total,
      criteria: stats.criteria.total,
      levels: stats.levels.total,
      categories: stats.categories.total,
      titles: stats.titles.total,
      citations: stats.citations.total
    });
    
    res.json({
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully',
      timestamp: new Date().toISOString(),
      excludesDeleted: true // Indicate that soft-deleted records are excluded
    });
  } catch (error) {
    console.error('❌ Dashboard controller error:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Alternative controller for optimized stats (if needed)
async function getDashboardStatsOptimized(req, res) {
  console.log('⚡ GET /api/setup/dashboard/stats-optimized - Get optimized dashboard statistics');
  
  try {
    const stats = await service.getDashboardStatsOptimized();
    
    console.log('✅ Optimized dashboard stats retrieved successfully');
    
    res.json({
      success: true,
      data: stats,
      message: 'Optimized dashboard statistics retrieved successfully',
      timestamp: new Date().toISOString(),
      excludesDeleted: true,
      optimized: true
    });
  } catch (error) {
    console.error('❌ Optimized dashboard controller error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get optimized dashboard statistics',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  }
}

// Health check endpoint for dashboard service
async function getDashboardHealth(req, res) {
  console.log('🏥 GET /api/setup/dashboard/health - Dashboard service health check');
  
  try {
    // Simple health check - just verify service is accessible
    const testStats = await service.getTableStats('user_setup', 'status', true);
    
    const healthStatus = {
      status: 'healthy',
      service: 'dashboard',
      timestamp: new Date().toISOString(),
      database: 'connected',
      testQuery: testStats ? 'success' : 'failed'
    };
    
    console.log('✅ Dashboard health check passed');
    
    res.json({
      success: true,
      data: healthStatus,
      message: 'Dashboard service is healthy'
    });
  } catch (error) {
    console.error('❌ Dashboard health check failed:', error);
    
    const healthStatus = {
      status: 'unhealthy',
      service: 'dashboard',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message
    };
    
    res.status(503).json({
      success: false,
      data: healthStatus,
      error: 'Dashboard service is unhealthy',
      message: error.message
    });
  }
}

// Get specific module stats
async function getModuleStats(req, res) {
  console.log('📊 GET /api/setup/dashboard/module/:module - Get specific module statistics');
  console.log('📊 Module:', req.params.module);
  
  try {
    const { module } = req.params;
    const validModules = [
      'vendors', 'users', 'userGroups', 'risks', 'standards', 
      'criteria', 'levels', 'categories', 'titles', 'citations'
    ];
    
    if (!validModules.includes(module)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid module',
        message: `Module must be one of: ${validModules.join(', ')}`,
        validModules
      });
    }
    
    const allStats = await service.getDashboardStats();
    const moduleStats = allStats[module];
    
    if (!moduleStats) {
      return res.status(404).json({
        success: false,
        error: 'Module stats not found',
        message: `No statistics available for module: ${module}`
      });
    }
    
    console.log(`✅ ${module} stats retrieved successfully`);
    
    res.json({
      success: true,
      data: {
        module,
        stats: moduleStats
      },
      message: `${module} statistics retrieved successfully`,
      timestamp: new Date().toISOString(),
      excludesDeleted: true
    });
  } catch (error) {
    console.error('❌ Module stats controller error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get module statistics',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  }
}

// Get dashboard summary (lightweight version)
async function getDashboardSummary(req, res) {
  console.log('📋 GET /api/setup/dashboard/summary - Get dashboard summary');
  
  try {
    const stats = await service.getDashboardStats();
    
    // Create a lightweight summary
    const summary = {
      totalRecords: stats.vendors.total + stats.users.total + stats.userGroups.total + 
                   stats.risks.total + stats.standards.total + stats.criteria.total + 
                   stats.levels.total + stats.categories.total + stats.titles.total + 
                   stats.citations.total,
      totalActive: stats.vendors.active + stats.users.active + stats.userGroups.active + 
                  stats.risks.active + stats.standards.active + stats.criteria.active + 
                  stats.levels.active + stats.categories.active + stats.titles.active + 
                  stats.citations.active,
      totalPending: stats.vendors.pending + stats.users.pending,
      totalInactive: stats.vendors.inactive + stats.users.inactive + stats.userGroups.inactive + 
                    stats.risks.inactive + stats.standards.inactive,
      modules: {
        vendors: { total: stats.vendors.total, active: stats.vendors.active },
        users: { total: stats.users.total, active: stats.users.active },
        userGroups: { total: stats.userGroups.total, active: stats.userGroups.active },
        risks: { total: stats.risks.total, active: stats.risks.active },
        standards: { total: stats.standards.total, active: stats.standards.active },
        criteria: { total: stats.criteria.total, active: stats.criteria.active }
      }
    };
    
    console.log('✅ Dashboard summary retrieved successfully');
    console.log('📋 Summary totals:', {
      total: summary.totalRecords,
      active: summary.totalActive,
      pending: summary.totalPending,
      inactive: summary.totalInactive
    });
    
    res.json({
      success: true,
      data: summary,
      message: 'Dashboard summary retrieved successfully',
      timestamp: new Date().toISOString(),
      excludesDeleted: true
    });
  } catch (error) {
    console.error('❌ Dashboard summary controller error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard summary',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getDashboardStats,
  getDashboardStatsOptimized,
  getDashboardHealth,
  getModuleStats,
  getDashboardSummary
};