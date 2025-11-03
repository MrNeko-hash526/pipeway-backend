const { Sequelize, sequelize } = require('../../../../config/config');

async function getDashboardStats() {
  try {
    console.log('📊 Getting dashboard statistics (excluding soft-deleted records)...');

    // Get vendor stats - table name is vendor_setup
    let vendorStats = [{ total: 0, active: 0, pending: 0, inactive: 0 }];
    try {
      vendorStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive
        FROM vendor_setup
        WHERE deleted = 0
      `, { type: Sequelize.QueryTypes.SELECT });
      console.log('✅ Vendor stats retrieved:', vendorStats[0]);
    } catch (err) {
      console.log('❌ Vendor_setup table error:', err.message);
    }

    // Get user stats - table name is user_setup
    let userStats = [{ total: 0, active: 0, pending: 0, inactive: 0 }];
    try {
      userStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive
        FROM user_setup
        WHERE deleted = 0
      `, { type: Sequelize.QueryTypes.SELECT });
      console.log('✅ User stats retrieved:', userStats[0]);
    } catch (err) {
      console.log('❌ User_setup table error:', err.message);
    }

    // Get user group stats - table name is user_groups_setup
    let userGroupStats = [{ total: 0, active: 0, inactive: 0 }];
    try {
      userGroupStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive
        FROM user_groups_setup
        WHERE deleted = 0
      `, { type: Sequelize.QueryTypes.SELECT });
      console.log('✅ User groups stats retrieved:', userGroupStats[0]);
    } catch (err) {
      console.log('❌ User_groups_setup table error:', err.message);
    }

    // Get risk management stats
    let riskStats = [{ total: 0, active: 0, inactive: 0 }];
    try {
      riskStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive
        FROM risk_management
        WHERE deleted = 0
      `, { type: Sequelize.QueryTypes.SELECT });
      console.log('✅ Risk management stats retrieved:', riskStats[0]);
    } catch (err) {
      console.log('❌ Risk_management table error:', err.message);
    }

    // Get standards stats - check if standards table exists
    let standardsStats = [{ total: 0, active: 0, inactive: 0 }];
    try {
      // Note: Standards table doesn't have deleted column based on your SQL
      standardsStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive
        FROM standards
      `, { type: Sequelize.QueryTypes.SELECT });
      console.log('✅ Standards stats retrieved:', standardsStats[0]);
    } catch (err) {
      console.log('❌ Standards table error:', err.message);
    }

    // Get criteria stats
    let criteriaStats = [{ total: 0, active: 0 }];
    try {
      criteriaStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
        FROM rrm_criteria
        WHERE deleted = 0
      `, { type: Sequelize.QueryTypes.SELECT });
      console.log('✅ Criteria stats retrieved:', criteriaStats[0]);
    } catch (err) {
      console.log('❌ RRM_criteria table error:', err.message);
    }

    // Get levels stats
    let levelsStats = [{ total: 0, active: 0 }];
    try {
      levelsStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
        FROM rrm_levels
        WHERE deleted = 0
      `, { type: Sequelize.QueryTypes.SELECT });
      console.log('✅ Levels stats retrieved:', levelsStats[0]);
    } catch (err) {
      console.log('❌ RRM_levels table error:', err.message);
    }

    // Get standard categories stats
    let categoriesStats = [{ total: 0, active: 0 }];
    try {
      // Note: Standard_categories table doesn't have deleted column based on your SQL
      categoriesStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
        FROM standard_categories
      `, { type: Sequelize.QueryTypes.SELECT });
      console.log('✅ Categories stats retrieved:', categoriesStats[0]);
    } catch (err) {
      console.log('❌ Standard_categories table error:', err.message);
    }

    // Get standard titles stats
    let titlesStats = [{ total: 0, active: 0 }];
    try {
      // Note: Standard_titles table doesn't have deleted column based on your SQL
      titlesStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
        FROM standard_titles
      `, { type: Sequelize.QueryTypes.SELECT });
      console.log('✅ Titles stats retrieved:', titlesStats[0]);
    } catch (err) {
      console.log('❌ Standard_titles table error:', err.message);
    }

    // Get standard citations stats - FIXED TABLE NAME
    let citationsStats = [{ total: 0, active: 0 }];
    try {
      console.log('🔍 Querying standard_citations table (corrected name)...');
      
      // Note: Standard_citations table doesn't have deleted column based on your SQL
      citationsStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
        FROM standard_citations
      `, { type: Sequelize.QueryTypes.SELECT });
      console.log('✅ Citations stats retrieved:', citationsStats[0]);
      
      // Also check what statuses exist
      const statusCheck = await sequelize.query(`
        SELECT DISTINCT status, COUNT(*) as count 
        FROM standard_citations 
        GROUP BY status
      `, { type: Sequelize.QueryTypes.SELECT });
      console.log('📊 Citation statuses:', statusCheck);
      
    } catch (err) {
      console.log('❌ Standard_citations table error:', err.message);
      console.log('❌ Full error details:', err);
    }

    const result = {
      vendors: {
        total: Number(vendorStats[0]?.total) || 0,
        active: Number(vendorStats[0]?.active) || 0,
        pending: Number(vendorStats[0]?.pending) || 0,
        inactive: Number(vendorStats[0]?.inactive) || 0
      },
      users: {
        total: Number(userStats[0]?.total) || 0,
        active: Number(userStats[0]?.active) || 0,
        pending: Number(userStats[0]?.pending) || 0,
        inactive: Number(userStats[0]?.inactive) || 0
      },
      userGroups: {
        total: Number(userGroupStats[0]?.total) || 0,
        active: Number(userGroupStats[0]?.active) || 0,
        inactive: Number(userGroupStats[0]?.inactive) || 0
      },
      risks: {
        total: Number(riskStats[0]?.total) || 0,
        active: Number(riskStats[0]?.active) || 0,
        inactive: Number(riskStats[0]?.inactive) || 0
      },
      standards: {
        total: Number(standardsStats[0]?.total) || 0,
        active: Number(standardsStats[0]?.active) || 0,
        inactive: Number(standardsStats[0]?.inactive) || 0
      },
      criteria: {
        total: Number(criteriaStats[0]?.total) || 0,
        active: Number(criteriaStats[0]?.active) || 0
      },
      levels: {
        total: Number(levelsStats[0]?.total) || 0,
        active: Number(levelsStats[0]?.active) || 0
      },
      categories: {
        total: Number(categoriesStats[0]?.total) || 0,
        active: Number(categoriesStats[0]?.active) || 0
      },
      titles: {
        total: Number(titlesStats[0]?.total) || 0,
        active: Number(titlesStats[0]?.active) || 0
      },
      citations: {
        total: Number(citationsStats[0]?.total) || 0,
        active: Number(citationsStats[0]?.active) || 0
      }
    };

    console.log('✅ Dashboard stats result:', result);
    
    // Log summary for debugging
    const totalRecords = result.vendors.total + result.users.total + result.userGroups.total + 
                        result.risks.total + result.standards.total + result.criteria.total + 
                        result.levels.total + result.categories.total + result.titles.total + 
                        result.citations.total;
    console.log(`📊 Total records across all modules: ${totalRecords}`);
    console.log(`📊 Citations specifically: total=${result.citations.total}, active=${result.citations.active}`);
    
    return result;

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    throw error;
  }
}

// Helper function to get table stats with error handling
async function getTableStats(tableName, statusField = 'status', hasDeleted = true) {
  try {
    const deletedCondition = hasDeleted ? 'WHERE deleted = 0' : '';
    
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ${statusField} = 'Active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN ${statusField} = 'Inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN ${statusField} = 'Pending' THEN 1 ELSE 0 END) as pending
      FROM ${tableName}
      ${deletedCondition}
    `;
    
    const result = await sequelize.query(query, { 
      type: Sequelize.QueryTypes.SELECT 
    });
    
    return {
      total: Number(result[0]?.total) || 0,
      active: Number(result[0]?.active) || 0,
      inactive: Number(result[0]?.inactive) || 0,
      pending: Number(result[0]?.pending) || 0
    };
  } catch (error) {
    console.log(`❌ Error querying table ${tableName}:`, error.message);
    return { total: 0, active: 0, inactive: 0, pending: 0 };
  }
}

// Alternative optimized version for better performance
async function getDashboardStatsOptimized() {
  try {
    console.log('📊 Getting optimized dashboard statistics...');

    const queries = [
      // Vendor stats
      sequelize.query(`
        SELECT 
          'vendors' as type,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive
        FROM vendor_setup WHERE deleted = 0
      `, { type: Sequelize.QueryTypes.SELECT }).catch(() => [{ type: 'vendors', total: 0, active: 0, pending: 0, inactive: 0 }]),

      // User stats
      sequelize.query(`
        SELECT 
          'users' as type,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive
        FROM user_setup WHERE deleted = 0
      `, { type: Sequelize.QueryTypes.SELECT }).catch(() => [{ type: 'users', total: 0, active: 0, pending: 0, inactive: 0 }]),

      // User groups stats  
      sequelize.query(`
        SELECT 
          'userGroups' as type,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive
        FROM user_groups_setup WHERE deleted = 0
      `, { type: Sequelize.QueryTypes.SELECT }).catch(() => [{ type: 'userGroups', total: 0, active: 0, inactive: 0 }])
    ];

    const results = await Promise.allSettled(queries);
    
    // Process results with fallback values
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled' && result.value && result.value[0]) {
        return result.value[0];
      }
      
      // Fallback based on query index
      const fallbacks = [
        { type: 'vendors', total: 0, active: 0, pending: 0, inactive: 0 },
        { type: 'users', total: 0, active: 0, pending: 0, inactive: 0 },
        { type: 'userGroups', total: 0, active: 0, inactive: 0 }
      ];
      return fallbacks[index] || { total: 0, active: 0 };
    });

    console.log('✅ Optimized dashboard stats completed');
    return processedResults;

  } catch (error) {
    console.error('❌ Optimized dashboard stats error:', error);
    throw error;
  }
}

module.exports = {
  getDashboardStats,
  getDashboardStatsOptimized,
  getTableStats
};