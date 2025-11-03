const { Sequelize, sequelize } = require('../../../config/config')

/**
 * Minimal service for policies using raw SQL via existing sequelize instance.
 * Adjust column names if your DB differs. All functions return plain objects.
 */

async function createPolicy(payload) {
  const sql = `
    INSERT INTO policies
      (name, title, category, citation_id, citation_name, reviewer, approver, reviewer_is_owner, description, content, exp_date, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  const params = [
    payload.name ?? null,
    payload.title ?? null,
    payload.category ?? null,
    payload.citation_id ?? null,
    payload.citation_name ?? null,
    payload.reviewer ?? null,
    payload.approver ?? null,
    payload.reviewerIsOwner ? 1 : 0,
    payload.description ?? null,
    payload.content ?? null,
    payload.expDate ?? null,
    payload.status ?? 'Draft',
    payload.created_by ?? null,
  ]

  const [result] = await sequelize.query(sql, {
    replacements: params,
    type: Sequelize.QueryTypes.INSERT,
  })

  // mysql returns insertId in result
  const id = result?.insertId ?? null
  if (!id) return null
  return getPolicyById(id)
}

async function updatePolicy(id, payload) {
  // Check if this is a soft delete request
  if (payload.deleted === 1 || payload.deleted === true || payload.delete === true) {
    return softDeletePolicy(id)
  }

  const fields = []
  const params = []

  const allowed = [
    'name',
    'title',
    'category',
    'citation_id',
    'citation_name',
    'reviewer',
    'approver',
    'reviewerIsOwner',
    'description',
    'content',
    'expDate',
    'status',
  ]

  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, k)) {
      if (k === 'reviewerIsOwner') {
        fields.push('reviewer_is_owner = ?')
        params.push(payload[k] ? 1 : 0)
      } else if (k === 'expDate') {
        fields.push('exp_date = ?')
        params.push(payload[k] ?? null)
      } else if (k === 'citation_id') {
        fields.push('citation_id = ?')
        params.push(payload[k] ?? null)
      } else if (k === 'citation_name') {
        fields.push('citation_name = ?')
        params.push(payload[k] ?? null)
      } else {
        fields.push(`${k} = ?`)
        params.push(payload[k] ?? null)
      }
    }
  }

  if (fields.length === 0) return getPolicyById(id)

  const sql = `UPDATE policies SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  params.push(Number(id))

  await sequelize.query(sql, {
    replacements: params,
    type: Sequelize.QueryTypes.UPDATE,
  })

  return getPolicyById(id)
}

async function getPolicyById(id) {
  const sql = `SELECT * FROM policies WHERE id = ? LIMIT 1`
  const rows = await sequelize.query(sql, {
    replacements: [Number(id)],
    type: Sequelize.QueryTypes.SELECT,
  })
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
}

async function listPolicies({ limit = 50, offset = 0, status = null, q = null } = {}) {
  const where = ['deleted = 0']
  const params = []

  if (status) {
    where.push('status = ?')
    params.push(status)
  }

  if (q) {
    where.push('(name LIKE ? OR title LIKE ? OR description LIKE ?)')
    const term = `%${q}%`
    params.push(term, term, term)
  }

  const sql = `
    SELECT id, name, title, category, citation_id, citation_name, reviewer, approver, reviewer_is_owner, description, exp_date, status, created_at, updated_at
    FROM policies
    WHERE ${where.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `
  params.push(Number(limit), Number(offset))

  const rows = await sequelize.query(sql, {
    replacements: params,
    type: Sequelize.QueryTypes.SELECT,
  })

  return rows
}

async function softDeletePolicy(id) {
  const sql = `UPDATE policies SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  await sequelize.query(sql, {
    replacements: [Number(id)],
    type: Sequelize.QueryTypes.UPDATE,
  })
  return true
}

module.exports = {
  createPolicy,
  updatePolicy,
  getPolicyById,
  listPolicies,
  softDeletePolicy,
}