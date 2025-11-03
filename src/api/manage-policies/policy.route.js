const express = require('express')
const router = express.Router()
const controller = require('./policy.controller')
const validation = require('./policy.validation')

// Routes:
// GET    /api/manage-policies           -> list (supports ?limit&offset&status&q)
// POST   /api/manage-policies           -> create
// GET    /api/manage-policies/:id       -> get
// PUT    /api/manage-policies/:id       -> update
// DELETE /api/manage-policies/:id       -> soft-delete
// POST   /api/manage-policies/upload    -> upload PDF (multipart/form-data, field "file")

router.get('/', validation.getListValidation, controller.listPolicies)
router.post('/', validation.createPolicyValidation, controller.createPolicy)
router.get('/:id', validation.idParamValidation, controller.getPolicy)
router.put('/:id', validation.updatePolicyValidation, controller.updatePolicy)
router.delete('/:id', validation.idParamValidation, controller.deletePolicy)

// upload route (multer middleware)
router.post('/upload', controller.uploadMiddleware, controller.uploadPolicyFile)

module.exports = router