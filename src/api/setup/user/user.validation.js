const { body, param, query } = require('express-validator');

const createUserValidation = [
  body('userType')
    .notEmpty()
    .withMessage('User type is required')
    .isIn(['Organization', 'Company'])
    .withMessage('User type must be Organization or Company'),
  
  body('organizationId')
    .if(body('userType').equals('Organization'))
    .notEmpty()
    .withMessage('Organization ID is required for Organization users')
    .isInt({ min: 1 })
    .withMessage('Organization ID must be a positive integer'),
    
  body('companyName')
    .if(body('userType').equals('Company'))
    .notEmpty()
    .withMessage('Company name is required for Company users')
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name must be 2-255 characters'),
    
  body('userRole')
    .notEmpty()
    .withMessage('User role is required')
    .isIn(['Admin', 'Auditor', 'Manager', 'Viewer'])
    .withMessage('User role must be Admin, Auditor, Manager, or Viewer'),
    
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be 2-100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
    
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be 2-100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
    
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
    
  body('status')
    .optional()
    .isIn(['Active', 'Pending', 'Inactive'])
    .withMessage('Status must be Active, Pending, or Inactive')
];

const updateUserValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid user ID is required'),
  
  // Make all fields optional for updates (except what's being updated)
  body('userType').optional().isIn(['Organization', 'Company']).withMessage('User type must be Organization or Company'),
  body('organizationId').optional().isInt({ min: 1 }).withMessage('Organization ID must be a positive integer'),
  body('companyName').optional().isLength({ min: 2 }).trim().withMessage('Company name must be at least 2 characters'),
  body('userRole').optional().isIn(['Admin', 'Auditor', 'Manager', 'Viewer']).withMessage('Invalid user role'),
  body('firstName').optional().isLength({ min: 2, max: 50 }).trim().withMessage('First name must be 2-50 characters'),
  body('lastName').optional().isLength({ min: 2, max: 50 }).trim().withMessage('Last name must be 2-50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('status').optional().isIn(['Active', 'Pending', 'Inactive']).withMessage('Status must be Active, Pending, or Inactive'),
  
  // Custom validation for partial updates
  body().custom((value, { req }) => {
    // Allow status-only updates (for warn functionality)
    if (Object.keys(req.body).length === 1 && req.body.status) {
      return true;
    }
    
    // For full updates, check user type dependencies
    if (req.body.userType) {
      if (req.body.userType === 'Organization' && !req.body.organizationId) {
        throw new Error('Organization ID is required for Organization users');
      }
      if (req.body.userType === 'Company' && !req.body.companyName) {
        throw new Error('Company name is required for Company users');
      }
    }
    
    return true;
  })
];

const getUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const getAllUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('search')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Search term too long'),
    
  query('status')
    .optional()
    .isIn(['', 'All', 'Active', 'Pending', 'Inactive'])
    .withMessage('Status must be Active, Pending, or Inactive'),
    
  query('userType')
    .optional()
    .isIn(['', 'All', 'Organization', 'Company'])
    .withMessage('User type must be Organization or Company'),
    
  query('userRole')
    .optional()
    .isIn(['', 'All', 'Admin', 'Auditor', 'Manager', 'Viewer'])
    .withMessage('User role must be Admin, Auditor, Manager, or Viewer')
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  getUserValidation,
  getAllUsersValidation
};