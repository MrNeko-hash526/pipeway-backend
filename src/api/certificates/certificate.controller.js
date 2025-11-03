const certificateService = require('./certificate.service')
const path = require('path')

// helper to map multer file -> file metadata expected by service
function fileToMeta(file) {
  if (!file) return null
  return {
    filename: file.filename || path.basename(file.path || ''),
    original_name: file.originalname || file.original_name || null,
    file_path: `uploads/certificates/${file.filename || path.basename(file.path || '')}`.replace(/\\/g, '/'),
    file_size: file.size || 0,
    mime_type: file.mimetype || null
  }
}

async function uploadAndCreate(req, res) {
  try {
    const payload = req.body || {}
    const fileMeta = fileToMeta(req.file)
    if (!fileMeta) return res.status(400).json({ success: false, error: 'file is required' })

    const created = await certificateService.createCertificateFile(payload, fileMeta)
    res.status(201).json({ success: true, data: created })
  } catch (err) {
    console.error('certificate upload/create error:', err)
    res.status(500).json({ success: false, error: err.message || 'failed' })
  }
}

async function getById(req, res) {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ success: false, error: 'invalid id' })
    const row = await certificateService.getCertificateFileById(id)
    if (!row) return res.status(404).json({ success: false, error: 'not found' })
    res.json({ success: true, data: row })
  } catch (err) {
    console.error('get certificate file error:', err)
    res.status(500).json({ success: false, error: err.message || 'failed' })
  }
}

async function list(req, res) {
  try {
    const params = {
      page: parseInt(req.query.page || 1, 10),
      limit: parseInt(req.query.limit || 50, 10),
      scope: req.query.scope || null,
      org_code: req.query.orgCode || req.query.org_code || null,
      company_name: req.query.companyName || req.query.company_name || null,
      q: req.query.q || null
    }
    const result = await certificateService.listCertificateFiles(params)
    res.json({ success: true, data: result.rows, pagination: { total: result.total, page: result.page, limit: result.limit } })
  } catch (err) {
    console.error('list certificate files error:', err)
    res.status(500).json({ success: false, error: err.message || 'failed' })
  }
}

async function softDelete(req, res) {
  try {
    const id = Number(req.params.id)
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'invalid id' })
    }

    console.log(`[certificates] softDelete called for id=${id}`)

    // call service function that exists in service file
    const ok = await certificateService.softDeleteCertificateFile(id)
    if (!ok) {
      return res.status(404).json({ success: false, error: 'not found' })
    }

    return res.json({ success: true, data: { id } })
  } catch (err) {
    console.error('[certificates] softDelete error', err)
    return res.status(500).json({ success: false, error: err.message || 'failed' })
  }
}

async function restore(req, res) {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ success: false, error: 'invalid id' })
    const ok = await certificateService.restoreCertificateFile(id)
    if (!ok) return res.status(404).json({ success: false, error: 'not found or cannot restore' })
    res.json({ success: true, message: 'restored' })
  } catch (err) {
    console.error('restore certificate file error:', err)
    res.status(500).json({ success: false, error: err.message || 'failed' })
  }
}

async function update(req, res) {
  try {
    const id = Number(req.params.id)
    if (!id || Number.isNaN(id)) return res.status(400).json({ success: false, error: 'invalid id' })

    const payload = req.body || {}
    let fileMeta = null
    if (req.file) {
      fileMeta = {
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_path: `uploads/certificates/${req.file.filename}`.replace(/\\/g, '/'),
        file_size: req.file.size,
        mime_type: req.file.mimetype
      }
    }

    const updated = await certificateService.updateCertificateFile(id, payload, fileMeta)
    if (!updated) return res.status(404).json({ success: false, error: 'not found' })
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('certificate update error', err)
    res.status(500).json({ success: false, error: err.message || 'failed' })
  }
}

module.exports = {
  uploadAndCreate,
  getById,
  list,
  softDelete,
  restore,
  update
}