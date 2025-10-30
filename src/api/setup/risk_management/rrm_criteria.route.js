const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const controller = require('./risk_management.controller');

// Debug middleware
router.use((req, res, next) => {
  console.log('🔍 RRM Criteria Router:', {
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path
  });
  next();
});

// GET /api/setup/rrm-criteria
router.get('/', controller.getAllCriteria);

// POST /api/setup/rrm-criteria
router.post('/', [
  body('name').notEmpty().withMessage('Criteria name is required')
], controller.createCriteria);

// DELETE /api/setup/rrm-criteria/:id
router.delete('/:id', [
  param('id').isInt().withMessage('Invalid ID')
], controller.deleteCriteria);

module.exports = router;