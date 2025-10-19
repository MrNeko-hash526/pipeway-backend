const { body, param, query } = require('express-validator');

const createCitationValidation = [
  body('name').notEmpty().withMessage('Citation name required').isLength({ min:2, max:300 }).withMessage('2-300 chars').trim(),
  body('status').optional().isIn(['Active','Inactive']).withMessage('Invalid status')
];

const updateCitationValidation = [
  param('id').isInt({ min:1 }).withMessage('Valid id required'),
  body('name').optional().isLength({ min:2, max:300 }).withMessage('2-300 chars').trim(),
  body('status').optional().isIn(['Active','Inactive']).withMessage('Invalid status')
];

const getCitationValidation = [ param('id').isInt({ min:1 }).withMessage('Valid id required') ];
const getAllCitationsValidation = [
  query('page').optional().isInt({ min:1 }),
  query('limit').optional().isInt({ min:1, max:1000 }),
  query('search').optional().isString().isLength({ max:300 }),
  query('status').optional().isIn(['All','Active','Inactive',''])
];

module.exports = { createCitationValidation, updateCitationValidation, getCitationValidation, getAllCitationsValidation };