const { body, param, query } = require('express-validator');

const createUserGroupValidation = [
  body('groupName')
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Group name must be between 2-100 characters')
    .trim(),
  
  body('groupValues')
    .isArray({ min: 1 })
    .withMessage('At least one group value is required'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive')
];

const updateUserGroupValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid user group ID is required'),
  
  body('groupName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Group name must be between 2-100 characters')
    .trim(),
  
  body('groupValues')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one group value is required when provided'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive')
];

const getUserGroupValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid user group ID is required')
];

const getAllUserGroupsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1-1000')
];

module.exports = {
  createUserGroupValidation,
  updateUserGroupValidation,
  getUserGroupValidation,
  getAllUserGroupsValidation
};