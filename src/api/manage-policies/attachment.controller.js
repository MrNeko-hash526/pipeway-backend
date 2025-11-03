const path = require('path')
const fs = require('fs')
const service = require('./attachment.service')

const UPLOAD_DIR = path.resolve(__dirname, '../../../../uploads/policies')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

function tryUnlink(relPath) {
  try {
    if (!relPath) return
    const p = path.resolve(process.cwd(), relPath)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  } catch (e) {
    console.warn('failed to unlink', relPath, e)
  }
}

async function upload(req, res) {
  try {
    const policyId = req.params.policyId ? String(req.params.policyId) : 'unlinked'
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })

    const fileMeta = {
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: `uploads/policies/${policyId}/${req.file.filename}`.replace(/\\/g, '/'),
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      uploaded_by: req.user?.id ?? null
    }

    const saved = await service.insertAttachment({ policyId: Number(policyId) || null, ...fileMeta })
    return res.json({ success: true, data: saved || fileMeta })
  } catch (err) {
    console.error('upload error', err)
    return res.status(500).json({ success: false, error: err.message || 'Upload failed' })
  }
}

async function replace(req, res) {
  try {
    const id = Number(req.params.id)
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' })

    const existing = await service.getById(id)
    const fileMeta = {
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: existing && existing.file_path
        ? path.posix.join(path.posix.dirname(existing.file_path), req.file.filename)
        : `uploads/policies/unlinked/${req.file.filename}`,
      mime_type: req.file.mimetype,
      file_size: req.file.size
    }

    // update DB
    const updated = await service.replaceAttachment(id, fileMeta)

    // remove previous file from disk (best-effort)
    if (existing && existing.file_path) {
      tryUnlink(path.resolve(process.cwd(), existing.file_path))
    }

    return res.json({ success: true, data: updated })
  } catch (err) {
    console.error('replace error', err)
    return res.status(500).json({ success: false, error: err.message || 'Replace failed' })
  }
}

async function listForPolicy(req, res) {
  try {
    const policyId = Number(req.params.policyId)
    if (Number.isNaN(policyId)) return res.status(400).json({ success: false, error: 'invalid policy id' })
    const rows = await service.listByPolicy(policyId)
    return res.json({ success: true, data: rows })
  } catch (err) {
    console.error('list error', err)
    return res.status(500).json({ success: false, error: err.message || 'List failed' })
  }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id)
    const ok = await service.softDeleteAttachment(id)
    if (!ok) return res.status(404).json({ success: false, error: 'not found' })
    return res.json({ success: true, data: { id } })
  } catch (err) {
    console.error('delete error', err)
    return res.status(500).json({ success: false, error: err.message || 'Delete failed' })
  }
}

module.exports = { upload, replace, listForPolicy, remove }