const FILE_MAX_BYTES = 15 * 1024 * 1024 // 15MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

function validateCreate(req, res, next) {
  const body = req.body || {}
  const file = req.file
  const errors = []

  if (!body.scope || !['org', 'company'].includes(body.scope)) {
    errors.push('scope is required and must be "org" or "company"')
  }

  if (body.scope === 'org' && !body.org_code && !body.orgCode) {
    errors.push('org_code is required when scope is "org"')
  }

  if (body.scope === 'company') {
    if (!body.company_name && !body.companyName) errors.push('company_name is required when scope is "company"')
    if (!body.cert_type && !body.certType) errors.push('cert_type is required when scope is "company"')
  }

  if (!file) {
    errors.push('file is required')
  } else {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) errors.push(`invalid file type: ${file.mimetype}`)
    if (file.size > FILE_MAX_BYTES) errors.push(`file exceeds max size ${Math.round(FILE_MAX_BYTES / 1024 / 1024)}MB`)
  }

  if (errors.length) return res.status(400).json({ success: false, errors })
  return next()
}

function validateIdParam(req, res, next) {
  const id = req.params && req.params.id
  if (!id || !/^\d+$/.test(String(id))) {
    return res.status(400).json({ success: false, errors: ['id param required and must be a number'] })
  }
  return next()
}

module.exports = {
  validateCreate,
  validateIdParam,
  FILE_MAX_BYTES,
  ALLOWED_MIME_TYPES
}