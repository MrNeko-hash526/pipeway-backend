const service = require('./risk_management.service');
const { validationResult } = require('express-validator');

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
      status: req.query.status || ''
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

async function deleteRiskManagement(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const deleted = await service.deleteRiskManagement(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Risk management entry not found' });
    }
    res.json({ success: true, message: 'Risk management entry deleted' });
  } catch (error) {
    console.error('Delete risk management error:', error);
    res.status(500).json({ error: 'Failed to delete risk management entry' });
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
      status: req.query.status || ''
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
      status: req.query.status || ''
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

module.exports = {
  getAllRiskManagement,
  getRiskManagementById,
  createRiskManagement,
  updateRiskManagement,
  deleteRiskManagement,
  getAllCriteria,
  createCriteria,
  getAllLevels,
  createLevel
};