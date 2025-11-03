const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const controller = require('./attachment.controller')

// upload dir (separate from any other uploader)
const UPLOAD_DIR = path.resolve(__dirname, '../../../../uploads/policies')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // use policyId param if present, otherwise store in 'unlinked'
    const policyId = req.params.policyId ? String(req.params.policyId) : 'unlinked'
    const dir = path.join(UPLOAD_DIR, policyId)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf'
    cb(null, `policy-${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`)
  }
})

function pdfOnlyFilter(req, file, cb) {
  if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF files are allowed'), false)
  cb(null, true)
}

// use single-field name "policy_pdf" to avoid collisions with other forms
const upload = multer({ storage, fileFilter: pdfOnlyFilter })

// POST /api/manage-policies/:policyId/attachments  -> upload new PDF for a policy
router.post('/:policyId/attachments', upload.single('policy_pdf'), controller.upload)

// PUT /api/manage-policies/attachments/:id -> replace file for an existing attachment id
router.put('/attachments/:id', upload.single('policy_pdf'), controller.replace)

// GET /api/manage-policies/:policyId/attachments -> list attachments for a policy
router.get('/:policyId/attachments', controller.listForPolicy)

// DELETE /api/manage-policies/attachments/:id -> soft-delete
router.delete('/attachments/:id', controller.remove)

module.exports = router