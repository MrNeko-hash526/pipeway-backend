const { body, param, query } = require('express-validator');

const createCategoryValidation = [
  body('name').notEmpty().withMessage('Name required').isLength({ min: 2, max: 200 }).withMessage('2-200 chars').trim(),
  body('status').optional().isIn(['Active','Inactive']).withMessage('Invalid status')
];

const updateCategoryValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid id required'),
  body('name').optional().isLength({ min: 2, max: 200 }).withMessage('2-200 chars').trim(),
  body('status').optional().isIn(['Active','Inactive']).withMessage('Invalid status')
];

const getCategoryValidation = [ param('id').isInt({ min:1 }).withMessage('Valid id required') ];

const getAllCategoriesValidation = [
  query('page').optional().isInt({ min:1 }),
  query('limit').optional().isInt({ min:1, max:1000 }),
  query('search').optional().isString().isLength({ max:200 }),
  query('status').optional().isIn(['All','Active','Inactive',''])
];

module.exports = {
  createCategoryValidation,
  updateCategoryValidation,
  getCategoryValidation,
  getAllCategoriesValidation
};