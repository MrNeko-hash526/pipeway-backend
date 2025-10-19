const { Sequelize, sequelize } = require('../../../../config/config');

async function getDashboardStats() {
  try {
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
      `, { type: Sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.log('Vendor_setup table error:', err.message);
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
      `, { type: Sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.log('User_setup table error:', err.message);
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
      `, { type: Sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.log('User_groups_setup table error:', err.message);
    }

    // Get risk management stats
    const riskStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive
      FROM risk_management
    `, { type: Sequelize.QueryTypes.SELECT });

    // Get standards stats - check if standards table exists
    let standardsStats = [{ total: 0, active: 0, inactive: 0 }];
    try {
      standardsStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive
        FROM standards
      `, { type: Sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.log('Standards table error:', err.message);
    }

    // Get criteria stats
    const criteriaStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
      FROM rrm_criteria
    `, { type: Sequelize.QueryTypes.SELECT });

    // Get levels stats
    const levelsStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
      FROM rrm_levels
    `, { type: Sequelize.QueryTypes.SELECT });

    // Get standard categories stats
    let categoriesStats = [{ total: 0, active: 0 }];
    try {
      categoriesStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
        FROM standard_categories
      `, { type: Sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.log('Standard_categories table error:', err.message);
    }

    // Get standard titles stats
    let titlesStats = [{ total: 0, active: 0 }];
    try {
      titlesStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
        FROM standard_titles
      `, { type: Sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.log('Standard_titles table error:', err.message);
    }

    // Get standard citations stats
    let citationsStats = [{ total: 0, active: 0 }];
    try {
      citationsStats = await sequelize.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active
        FROM standards_citations
      `, { type: Sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.log('Standards_citations table error:', err.message);
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

    console.log('Dashboard stats result:', result);
    return result;

  } catch (error) {
    console.error('Dashboard stats error:', error);
    throw error;
  }
}

module.exports = {
  getDashboardStats
};