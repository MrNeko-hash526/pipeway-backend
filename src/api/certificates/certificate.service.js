const { Sequelize, sequelize } = require('../../../config/config')

async function createCertificateFile(payload = {}, fileMeta = {}) {
  const sql = `
    INSERT INTO certificate_files
      (scope, org_code, company_name, cert_type, filename, original_name, file_path, file_size, mime_type, exp_date, frequency, comment, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  const params = [
    payload.scope ?? 'org',
    payload.org_code ?? payload.orgCode ?? null,
    payload.company_name ?? payload.companyName ?? null,
    payload.cert_type ?? payload.certType ?? null,
    fileMeta.filename,
    fileMeta.original_name ?? fileMeta.originalName ?? null,
    fileMeta.file_path,
    Number(fileMeta.file_size || 0),
    fileMeta.mime_type ?? null,
    payload.exp_date ?? payload.expDate ?? null,
    payload.frequency ?? null,
    payload.comment ?? null,
    payload.uploaded_by ?? null
  ]

  const [result] = await sequelize.query(sql, {
    replacements: params,
    type: Sequelize.QueryTypes.INSERT
  })

  const insertedId = result?.insertId ?? null
  if (!insertedId) return null
  return getCertificateFileById(insertedId)
}

async function getCertificateFileById(id) {
  const sql = `SELECT * FROM certificate_files WHERE id = ? LIMIT 1`
  const rows = await sequelize.query(sql, {
    replacements: [Number(id)],
    type: Sequelize.QueryTypes.SELECT
  })
  return rows[0] ?? null
}

async function listCertificateFiles({ page = 1, limit = 50, scope = null, org_code = null, company_name = null, q = null } = {}) {
  const offset = (page - 1) * limit
  const where = ['deleted = 0']
  const replacements = []

  if (scope) {
    where.push('scope = ?'); replacements.push(scope)
  }
  if (org_code) {
    where.push('org_code = ?'); replacements.push(org_code)
  }
  if (company_name) {
    where.push('company_name = ?'); replacements.push(company_name)
  }
  if (q) {
    where.push('(original_name LIKE ? OR comment LIKE ? OR cert_type LIKE ?)')
    const term = `%${q}%`
    replacements.push(term, term, term)
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const sql = `
    SELECT * FROM certificate_files
    ${whereClause}
    ORDER BY uploaded_at DESC
    LIMIT ? OFFSET ?
  `
  const rows = await sequelize.query(sql, {
    replacements: [...replacements, Number(limit), Number(offset)],
    type: Sequelize.QueryTypes.SELECT
  })

  const countSql = `SELECT COUNT(*) as total FROM certificate_files ${whereClause}`
  const countRes = await sequelize.query(countSql, {
    replacements,
    type: Sequelize.QueryTypes.SELECT
  })

  return { rows, total: Number(countRes[0]?.total ?? 0), page, limit }
}

async function softDeleteCertificateFile(id) {
  const sql = `UPDATE certificate_files SET deleted = 1, uploaded_at = uploaded_at WHERE id = ?`
  const [res] = await sequelize.query(sql, {
    replacements: [Number(id)],
    type: Sequelize.QueryTypes.UPDATE
  })
  return res > 0
}

async function restoreCertificateFile(id) {
  const sql = `UPDATE certificate_files SET deleted = 0 WHERE id = ?`
  const [res] = await sequelize.query(sql, {
    replacements: [Number(id)],
    type: Sequelize.QueryTypes.UPDATE
  })
  return res > 0
}

async function updateCertificateFile(id, payload = {}, fileMeta = null) {
  // fetch existing row
  const rows = await sequelize.query('SELECT * FROM certificate_files WHERE id = ? LIMIT 1', {
    replacements: [Number(id)],
    type: Sequelize.QueryTypes.SELECT
  })
  const existing = rows[0]
  if (!existing) return null

  const sets = []
  const params = []

  if (payload.scope !== undefined) { sets.push('scope = ?'); params.push(payload.scope) }
  if (payload.org_code !== undefined) { sets.push('org_code = ?'); params.push(payload.org_code) }
  if (payload.company_name !== undefined) { sets.push('company_name = ?'); params.push(payload.company_name) }
  if (payload.cert_type !== undefined) { sets.push('cert_type = ?'); params.push(payload.cert_type) }
  if (payload.exp_date !== undefined) { sets.push('exp_date = ?'); params.push(payload.exp_date) }
  if (payload.frequency !== undefined) { sets.push('frequency = ?'); params.push(payload.frequency) }
  if (payload.comment !== undefined) { sets.push('comment = ?'); params.push(payload.comment) }

  if (fileMeta) {
    sets.push('filename = ?'); params.push(fileMeta.filename)
    sets.push('original_name = ?'); params.push(fileMeta.original_name ?? null)
    sets.push('file_path = ?'); params.push(fileMeta.file_path)
    sets.push('file_size = ?'); params.push(Number(fileMeta.file_size || 0))
    sets.push('mime_type = ?'); params.push(fileMeta.mime_type ?? null)
    sets.push('uploaded_at = NOW()')
  }

  if (sets.length === 0) {
    return existing
  }

  const sql = `UPDATE certificate_files SET ${sets.join(', ')} WHERE id = ?`
  params.push(Number(id))
  await sequelize.query(sql, { replacements: params, type: Sequelize.QueryTypes.UPDATE })

  const refreshed = await sequelize.query('SELECT * FROM certificate_files WHERE id = ? LIMIT 1', {
    replacements: [Number(id)],
    type: Sequelize.QueryTypes.SELECT
  })
  return refreshed[0] ?? null
}

module.exports = {
  createCertificateFile,
  getCertificateFileById,
  listCertificateFiles,
  softDeleteCertificateFile,
  restoreCertificateFile,
  updateCertificateFile
}