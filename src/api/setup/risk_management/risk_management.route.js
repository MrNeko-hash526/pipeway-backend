const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const controller = require('./risk_management.controller');

// Validation middleware
const validateId = [param('id').isInt().withMessage('Invalid ID')];
const validateRiskManagement = [
  body('criteria_id').isInt().withMessage('Criteria ID is required'),
  body('rrm_option').notEmpty().withMessage('RRM Option is required'),
  body('rrm_level').isInt().withMessage('RRM Level is required'),
  body('rrm_exception').notEmpty().withMessage('Exception is required')
];
const validateRiskManagementUpdate = [
  body('criteria_id').optional().isInt().withMessage('Criteria ID must be an integer'),
  body('rrm_option').optional().notEmpty().withMessage('RRM Option is required when provided'),
  body('rrm_level').optional().isInt().withMessage('RRM Level must be an integer when provided'),
  body('rrm_exception').optional().notEmpty().withMessage('Exception is required when provided'),
  body('status').optional().isIn(['Active','Inactive']).withMessage('Status must be Active or Inactive')
];

// Debug middleware
router.use((req, res, next) => {
  console.log('🔍 Risk Management Router:', {
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path
  });
  next();
});

// Risk Management routes only
router.get('/', controller.getAllRiskManagement);
router.get('/:id', validateId, controller.getRiskManagementById);
router.post('/', validateRiskManagement, controller.createRiskManagement);
router.put('/:id', validateId, validateRiskManagementUpdate, controller.updateRiskManagement);
router.delete('/:id', validateId, controller.deleteRiskManagement);
router.patch('/:id/restore', validateId, controller.restoreRiskManagement);

module.exports = router;