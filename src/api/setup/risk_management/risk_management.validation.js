const { body, param, query } = require('express-validator');

// Main Risk Management Validations
const createRiskManagementValidation = [
  body('criteria_id')
    .isInt({ min: 1 })
    .withMessage('Valid criteria ID is required'),
  body('rrm_option')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Option must be between 1-1000 characters'),
  body('rrm_level')
    .isInt({ min: 1, max: 10 })
    .withMessage('Level must be between 1-10'),
  body('rrm_exception')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Exception must be between 1-500 characters'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive')
];

const updateRiskManagementValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid ID is required'),
  ...createRiskManagementValidation
];

const getRiskManagementValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid ID is required')
];

const getAllRiskManagementValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be 1-1000'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['Active', 'Inactive', 'All', '']).withMessage('Status must be Active, Inactive, All, or empty')
];

// Criteria Validations
const createCriteriaValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage('Name must be between 2-500 characters'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive')
];

const getAllCriteriaValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be 1-1000'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['Active', 'Inactive', 'All', '']).withMessage('Status must be Active, Inactive, All, or empty')
];

// Levels Validations
const createLevelValidation = [
  body('level_value')
    .isInt({ min: 1, max: 10 })
    .withMessage('Level value must be between 1-10'),
  body('level_label')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Level label must be between 1-100 characters'),
  body('range_min')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Range min must be >= 0'),
  body('range_max')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Range max must be >= 0'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive')
];

const getAllLevelsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be 1-1000'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['Active', 'Inactive', 'All', '']).withMessage('Status must be Active, Inactive, All, or empty')
];

module.exports = {
  createRiskManagementValidation,
  updateRiskManagementValidation,
  getRiskManagementValidation,
  getAllRiskManagementValidation,
  createCriteriaValidation,
  getAllCriteriaValidation,
  createLevelValidation,
  getAllLevelsValidation
};