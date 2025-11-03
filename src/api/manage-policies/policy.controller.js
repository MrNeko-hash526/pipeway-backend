const { validationResult } = require('express-validator')
const policyService = require('./policy.service')

function handleValidationErrors(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    // return structured errors so frontend can show param + message
    const errs = errors.array().map((e) => ({ param: e.param, msg: e.msg }))
    return res.status(400).json({ success: false, errors: errs })
  }
  return null
}

async function listPolicies(req, res) {
  const vErr = handleValidationErrors(req, res)
  if (vErr) return
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50
    const offset = req.query.offset ? Number(req.query.offset) : 0
    const status = req.query.status || null
    const q = req.query.q || null
    const rows = await policyService.listPolicies({ limit, offset, status, q })
    return res.json({ success: true, data: rows })
  } catch (err) {
    console.error('listPolicies error', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

async function getPolicy(req, res) {
  const vErr = handleValidationErrors(req, res)
  if (vErr) return
  try {
    const id = Number(req.params.id)
    const row = await policyService.getPolicyById(id)
    if (!row) return res.status(404).json({ success: false, message: 'Policy not found' })
    return res.json({ success: true, data: row })
  } catch (err) {
    console.error('getPolicy error', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

async function createPolicy(req, res) {
  const vErr = handleValidationErrors(req, res)
  if (vErr) return
  try {
    const payload = { ...req.body }
    // map reviewerIsOwner boolean if provided as string
    if (typeof payload.reviewerIsOwner === 'string') {
      payload.reviewerIsOwner = payload.reviewerIsOwner === 'true'
    }
    // created_by: rely on auth in future; keep null for now
    payload.created_by = req.user?.id ?? null
    const created = await policyService.createPolicy(payload)
    return res.status(201).json({ success: true, data: created })
  } catch (err) {
    console.error('createPolicy error', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

async function updatePolicy(req, res) {
  const vErr = handleValidationErrors(req, res)
  if (vErr) return
  try {
    const id = Number(req.params.id)
    const payload = { ...req.body }
    if (typeof payload.reviewerIsOwner === 'string') {
      payload.reviewerIsOwner = payload.reviewerIsOwner === 'true'
    }
    const updated = await policyService.updatePolicy(id, payload)
    if (!updated) return res.status(404).json({ success: false, message: 'Policy not found' })
    return res.json({ success: true, data: updated })
  } catch (err) {
    console.error('updatePolicy error', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

async function deletePolicy(req, res) {
  try {
    const { id } = req.params

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid policy ID',
      })
    }

    // Check if policy exists first
    const policy = await policyService.getPolicyById(Number(id))
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
      })
    }

    // Perform soft delete
    await policyService.softDeletePolicy(Number(id))

    res.json({
      success: true,
      message: 'Policy deleted successfully',
    })
  } catch (error) {
    console.error('Delete policy error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete policy',
    })
  }
}

const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// simple upload handler (demo): returns basic metadata; integrate S3 or disk storage as needed
async function uploadPolicyFile(req, res) {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' })
    // TODO: store file.buffer to storage and persist metadata
    return res.json({
      success: true,
      data: {
        filename: file.originalname,
        size: file.size,
        mime: file.mimetype,
      },
    })
  } catch (err) {
    console.error('uploadPolicyFile error', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = {
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  uploadPolicyFile,
  uploadMiddleware: upload.single('file'),
}