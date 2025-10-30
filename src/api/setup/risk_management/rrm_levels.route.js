const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const controller = require('./risk_management.controller');

// Debug middleware
router.use((req, res, next) => {
  console.log('🔍 RRM Levels Router:', {
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path
  });
  next();
});

// GET /api/setup/rrm-levels
router.get('/', controller.getAllLevels);

// POST /api/setup/rrm-levels
router.post('/', [
  body('level_value').isInt().withMessage('Level value is required'),
  body('level_label').notEmpty().withMessage('Level label is required')
], controller.createLevel);

// DELETE /api/setup/rrm-levels/:id
router.delete('/:id', [
  param('id').isInt().withMessage('Invalid ID')
], controller.deleteLevel);

module.exports = router;