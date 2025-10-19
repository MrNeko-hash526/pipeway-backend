const { body, param, query } = require('express-validator');

const createStandardValidation = [
  body('category_id').isInt({ min: 1 }).withMessage('category_id required'),
  body('title_id').isInt({ min: 1 }).withMessage('title_id required'),
  body('citation_id').isInt({ min: 1 }).withMessage('citation_id required'),
  body('standard_text').notEmpty().withMessage('standard_text required').isLength({ max: 1500 }).withMessage('Max 1500 chars'),
  body('status').optional().isIn(['Active','Inactive','Draft']).withMessage('Invalid status')
];

const updateStandardValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid id required'),
  body('category_id').optional().isInt({ min: 1 }),
  body('title_id').optional().isInt({ min: 1 }),
  body('citation_id').optional().isInt({ min: 1 }),
  body('standard_text').optional().isLength({ max: 1500 }),
  body('status').optional().isIn(['Active','Inactive','Draft'])
];

const getStandardValidation = [ param('id').isInt({ min: 1 }).withMessage('Valid id required') ];

const getAllStandardsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('search').optional().isString().isLength({ max: 300 }),
  query('status').optional().isIn(['All','Active','Inactive','Draft',''])
];

module.exports = { createStandardValidation, updateStandardValidation, getStandardValidation, getAllStandardsValidation };