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
    .withMessage('Status must be Active, Pending, or Inactive'),

  // Custom validation to ensure proper field combinations and email uniqueness
  body().custom(async (value, { req }) => {
    const { userType, organizationId, companyName, email } = req.body;
    
    if (userType === 'Organization') {
      if (!organizationId) {
        throw new Error('Organization ID is required for Organization users');
      }
      // Ensure companyName is not provided for Organization users
      if (companyName) {
        throw new Error('Company name should not be provided for Organization users');
      }
    }
    
    if (userType === 'Company') {
      if (!companyName) {
        throw new Error('Company name is required for Company users');
      }
      // Ensure organizationId is not provided for Company users
      if (organizationId) {
        throw new Error('Organization ID should not be provided for Company users');
      }
    }
    
    return true;
  })
];

const updateUserValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid user ID is required'),
  
  // Make all fields optional for updates
  body('userType')
    .optional()
    .isIn(['Organization', 'Company'])
    .withMessage('User type must be Organization or Company'),
    
  body('organizationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Organization ID must be a positive integer'),
    
  body('companyName')
    .optional()
    .isLength({ min: 2, max: 255 })
    .trim()
    .withMessage('Company name must be 2-255 characters'),
    
  body('userRole')
    .optional()
    .isIn(['Admin', 'Auditor', 'Manager', 'Viewer'])
    .withMessage('Invalid user role'),
    
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must be 2-100 characters and contain only letters and spaces'),
    
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must be 2-100 characters and contain only letters and spaces'),
    
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
    
  body('status')
    .optional()
    .isIn(['Active', 'Pending', 'Inactive'])
    .withMessage('Status must be Active, Pending, or Inactive'),
  
  // Custom validation for updates
  body().custom(async (value, { req }) => {
    // Allow status-only updates (for warn functionality)
    if (Object.keys(req.body).length === 1 && req.body.status) {
      return true;
    }
    
    // For updates involving userType, validate dependencies
    const { userType, organizationId, companyName } = req.body;
    
    if (userType === 'Organization') {
      if (!organizationId) {
        throw new Error('Organization ID is required when changing to Organization user type');
      }
      if (companyName) {
        throw new Error('Company name should not be provided for Organization users');
      }
    }
    
    if (userType === 'Company') {
      if (!companyName) {
        throw new Error('Company name is required when changing to Company user type');
      }
      if (organizationId) {
        throw new Error('Organization ID should not be provided for Company users');
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

const deleteUserValidation = [
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
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
    
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
    .withMessage('User role must be Admin, Auditor, Manager, or Viewer'),

  query('includeDeleted')
    .optional()
    .isBoolean()
    .withMessage('includeDeleted must be a boolean')
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  getUserValidation,
  deleteUserValidation,
  getAllUsersValidation
};