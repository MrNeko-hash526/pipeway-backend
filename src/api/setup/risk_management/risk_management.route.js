const express = require('express');
const router = express.Router();

const controller = require('./risk_management.controller');
const {
  createRiskManagementValidation,
  updateRiskManagementValidation,
  getRiskManagementValidation,
  getAllRiskManagementValidation,
  createCriteriaValidation,
  getAllCriteriaValidation,
  createLevelValidation,
  getAllLevelsValidation
} = require('./risk_management.validation');

// Main Risk Management Routes (for /api/setup/risk-management)
router.get('/', getAllRiskManagementValidation, (req, res) => {
  // Check if this is criteria or levels endpoint
  if (req.baseUrl.includes('rrm-criteria')) {
    return controller.getAllCriteria(req, res);
  }
  if (req.baseUrl.includes('rrm-levels')) {
    return controller.getAllLevels(req, res);
  }
  // Default to risk management
  return controller.getAllRiskManagement(req, res);
});

router.get('/:id', getRiskManagementValidation, controller.getRiskManagementById);

router.post('/', (req, res) => {
  // Check if this is criteria or levels endpoint
  if (req.baseUrl.includes('rrm-criteria')) {
    return controller.createCriteria(req, res);
  }
  if (req.baseUrl.includes('rrm-levels')) {
    return controller.createLevel(req, res);
  }
  // Default to risk management with validation
  const validation = createRiskManagementValidation;
  return controller.createRiskManagement(req, res);
});

router.put('/:id', updateRiskManagementValidation, controller.updateRiskManagement);
router.delete('/:id', getRiskManagementValidation, controller.deleteRiskManagement);

module.exports = router;