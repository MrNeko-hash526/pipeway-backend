const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()

const controller = require('./certificate.controller')
const validation = require('./certificate.validation')

// sanity checks to show what is missing (prevents "argument handler must be a function")
if (!controller || typeof controller !== 'object') {
  console.error('certificate.controller require returned:', controller)
  throw new Error('certificate.controller not found or invalid')
}
if (!validation || typeof validation !== 'object') {
  console.error('certificate.validation require returned:', validation)
  throw new Error('certificate.validation not found or invalid')
}
if (typeof controller.uploadAndCreate !== 'function') {
  console.error('certificate.controller exports:', Object.keys(controller))
  throw new Error('certificate.controller.uploadAndCreate is not a function')
}
if (typeof controller.update !== 'function') {
  console.error('certificate.controller exports:', Object.keys(controller))
  throw new Error('certificate.controller.update is not a function')
}
if (typeof validation.validateCreate !== 'function' || typeof validation.validateIdParam !== 'function') {
  console.error('certificate.validation exports:', Object.keys(validation))
  throw new Error('certificate.validation missing validateCreate or validateIdParam')
}

// ensure uploads directory exists
const UPLOADS_DIR = path.resolve(__dirname, '../../../../uploads/certificates')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ''
    cb(null, `cert-${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`)
  }
})
const upload = multer({ storage })

// routes (ensure delete uses controller.softDelete)
router.get('/', controller.list)
router.get('/:id', validation.validateIdParam, controller.getById)
router.post('/', upload.single('file'), validation.validateCreate, controller.uploadAndCreate)
router.put('/:id', upload.single('file'), validation.validateIdParam, controller.update)
router.delete('/:id', validation.validateIdParam, controller.softDelete)
router.post('/:id/restore', validation.validateIdParam, controller.restore)

module.exports = router