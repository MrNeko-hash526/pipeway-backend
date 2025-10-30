const service = require('./risk_management.service');
console.log('RRM service exports:', Object.keys(service)); // temporary debug

const { validationResult } = require('express-validator');
// removed direct Sequelize/ sequelize import - service handles DB details

// Main Risk Management Controllers
async function getAllRiskManagement(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 100,
      search: req.query.search || '',
      status: req.query.status || '',
      includeDeleted: req.query.includeDeleted === 'true'
    };
    
    const result = await service.getAllRiskManagement(filters);
    res.json({ success: true, data: result.rows, total: result.total, page: result.page, limit: result.limit });
  } catch (error) {
    console.error('Get all risk management error:', error);
    res.status(500).json({ error: 'Failed to fetch risk management data' });
  }
}

async function getRiskManagementById(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const data = await service.getRiskManagementById(req.params.id);
    if (!data) {
      return res.status(404).json({ error: 'Risk management entry not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get risk management by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch risk management entry' });
  }
}

async function createRiskManagement(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const data = await service.createRiskManagement(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Create risk management error:', error);
    res.status(500).json({ error: 'Failed to create risk management entry' });
  }
}

async function updateRiskManagement(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const data = await service.updateRiskManagement(req.params.id, req.body);
    if (!data) {
      return res.status(404).json({ error: 'Risk management entry not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Update risk management error:', error);
    res.status(500).json({ error: 'Failed to update risk management entry' });
  }
}

// 🔥 FIXED - Proper soft delete with better error handling
async function deleteRiskManagement(req, res) {
  console.log('🗑️ DELETE request received for ID:', req.params.id);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Ask service for the record including deleted flag (so service handles schema)
    const existingRecord = await service.getRiskManagementById(req.params.id, { includeDeleted: true });

    if (!existingRecord) {
      console.log('❌ Record not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Risk management entry not found' });
    }

    if (existingRecord.deleted === 1 || existingRecord.deleted === true) {
      console.log('⚠️ Record already deleted:', req.params.id);
      return res.status(400).json({ error: 'Risk management entry is already deleted' });
    }

    const deleted = await service.softDeleteRiskManagement(req.params.id);
    console.log('🔄 Soft delete result:', deleted);

    if (!deleted) {
      console.log('❌ Soft delete failed');
      return res.status(500).json({ error: 'Failed to delete risk management entry' });
    }

    console.log('✅ Item soft deleted successfully');
    res.status(200).json({ success: true, message: 'Risk management entry deleted successfully' });
  } catch (error) {
    console.error('❌ Delete risk management error:', error);
    res.status(500).json({ error: 'Failed to delete risk management entry' });
  }
}

// 🔥 NEW - Restore deleted item
async function restoreRiskManagement(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const restored = await service.restoreRiskManagement(req.params.id);
    if (!restored) {
      return res.status(404).json({ error: 'Risk management entry not found or not deleted' });
    }
    res.status(200).json({ 
      success: true, 
      message: 'Risk management entry restored successfully',
      data: restored 
    });
  } catch (error) {
    console.error('Restore risk management error:', error);
    res.status(500).json({ error: 'Failed to restore risk management entry' });
  }
}

// Criteria Controllers
async function getAllCriteria(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 100,
      search: req.query.search || '',
      status: req.query.status || '',
      includeDeleted: req.query.includeDeleted === 'true'
    };
    
    const result = await service.getAllCriteria(filters);
    res.json({ success: true, data: result.rows, total: result.total, page: result.page, limit: result.limit });
  } catch (error) {
    console.error('Get all criteria error:', error);
    res.status(500).json({ error: 'Failed to fetch criteria' });
  }
}

async function createCriteria(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const data = await service.createCriteria(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Create criteria error:', error);
    res.status(500).json({ error: 'Failed to create criteria' });
  }
}

// 🔥 NEW - Soft delete criteria
async function deleteCriteria(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const deleted = await service.softDeleteCriteria(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Criteria not found' });
    }
    res.status(200).json({ 
      success: true, 
      message: 'Criteria deleted successfully' 
    });
  } catch (error) {
    console.error('Soft delete criteria error:', error);
    res.status(500).json({ error: 'Failed to delete criteria' });
  }
}

// Levels Controllers
async function getAllLevels(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 100,
      search: req.query.search || '',
      status: req.query.status || '',
      includeDeleted: req.query.includeDeleted === 'true'
    };
    
    const result = await service.getAllLevels(filters);
    res.json({ success: true, data: result.rows, total: result.total, page: result.page, limit: result.limit });
  } catch (error) {
    console.error('Get all levels error:', error);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
}

async function createLevel(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const data = await service.createLevel(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Create level error:', error);
    res.status(500).json({ error: 'Failed to create level' });
  }
}

// 🔥 NEW - Soft delete level
async function deleteLevel(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const deleted = await service.softDeleteLevel(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Level not found' });
    }
    res.status(200).json({ 
      success: true, 
      message: 'Level deleted successfully' 
    });
  } catch (error) {
    console.error('Soft delete level error:', error);
    res.status(500).json({ error: 'Failed to delete level' });
  }
}

// 🔥 UPDATED - Export all functions including missing ones
module.exports = {
  getAllRiskManagement,
  getRiskManagementById,
  createRiskManagement,
  updateRiskManagement,
  deleteRiskManagement,     // Now does soft delete
  restoreRiskManagement,    // NEW - for restoring deleted items
  getAllCriteria,
  createCriteria,
  deleteCriteria,           // NEW - soft delete criteria
  getAllLevels,
  createLevel,
  deleteLevel               // NEW - soft delete levels
};