const { body, param, query } = require('express-validator')

const createPolicyValidation = [
  // If status is Draft allow missing/minimal fields; otherwise enforce required fields.
  body('name').custom((val, { req }) => {
    if ((req.body?.status || '') !== 'Draft') {
      if (!val || String(val).trim().length < 2) throw new Error('Policy name is required and must be at least 2 characters')
    }
    return true
  }),
  body('title').custom((val, { req }) => {
    if ((req.body?.status || '') !== 'Draft') {
      if (!val || String(val).trim().length === 0) throw new Error('Title is required')
    }
    return true
  }),
  body('category').custom((val, { req }) => {
    if ((req.body?.status || '') !== 'Draft') {
      if (!val || String(val).trim().length === 0) throw new Error('Category is required')
    }
    return true
  }),
  body('citation_id').optional().isInt({ min: 1 }).withMessage('Invalid citation id'),
  // allow nullable values (null) from client by permitting nullable optional fields
  body('citation_name').optional({ nullable: true }).isString().withMessage('Invalid citation name'),
  body('reviewer').optional({ nullable: true }).isString().withMessage('Invalid reviewer'),
  body('approver').optional({ nullable: true }).isString().withMessage('Invalid approver'),
  body('reviewerIsOwner').optional({ nullable: true }).isBoolean().withMessage('reviewerIsOwner must be boolean'),
  body('description').optional({ nullable: true }).isString().isLength({ max: 1000 }).withMessage('Description too long'),
  // content may be null (client sends null) so allow nullable
  body('content').optional({ nullable: true }).isString().withMessage('Invalid content'),
  // accept ISO date string or null
  body('expDate').optional({ nullable: true }).isISO8601().withMessage('expDate must be a valid ISO8601 date (YYYY-MM-DD)').toDate(),
  body('status').optional().isIn(['Draft', 'Published', 'Archived']).withMessage('Invalid status'),
]
 
const updatePolicyValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid policy id is required'),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name too short'),
  body('title').optional().trim(),
  body('category').optional().trim(),
  body('citation_id').optional().isInt({ min: 1 }).withMessage('Invalid citation id'),
  body('citation_name').optional({ nullable: true }).isString().withMessage('Invalid citation name'),
  body('reviewer').optional({ nullable: true }).isString().withMessage('Invalid reviewer'),
  body('approver').optional({ nullable: true }).isString().withMessage('Invalid approver'),
  body('reviewerIsOwner').optional({ nullable: true }).isBoolean().withMessage('reviewerIsOwner must be boolean'),
  body('description').optional({ nullable: true }).isString().isLength({ max: 1000 }).withMessage('Description too long'),
  body('content').optional({ nullable: true }).isString().withMessage('Invalid content'),
  body('expDate').optional({ nullable: true }).isISO8601().withMessage('expDate must be a valid ISO8601 date').toDate(),
  body('status').optional().isIn(['Draft', 'Published', 'Archived']).withMessage('Invalid status'),
]

const getListValidation = [
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('status').optional().isString(),
  query('q').optional().isString(),
]

const idParamValidation = [param('id').isInt({ min: 1 }).withMessage('Valid id required')]

module.exports = {
  createPolicyValidation,
  updatePolicyValidation,
  getListValidation,
  idParamValidation,
}