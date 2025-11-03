const { Sequelize, sequelize } = require('../../../config/config')

async function insertAttachment({ policyId = null, filename, original_name, file_path, mime_type, file_size = 0, uploaded_by = null }) {
  await sequelize.query(
    `INSERT INTO policy_attachments (policy_id, filename, original_name, file_path, mime_type, file_size, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    { replacements: [policyId, filename, original_name, file_path, mime_type, Number(file_size), uploaded_by], type: Sequelize.QueryTypes.INSERT }
  )
  const rows = await sequelize.query('SELECT * FROM policy_attachments WHERE id = LAST_INSERT_ID() LIMIT 1', { type: Sequelize.QueryTypes.SELECT })
  return rows[0] ?? null
}

async function listByPolicy(policyId) {
  return await sequelize.query(
    'SELECT * FROM policy_attachments WHERE policy_id = ? AND (deleted_at IS NULL) ORDER BY uploaded_at DESC',
    { replacements: [Number(policyId)], type: Sequelize.QueryTypes.SELECT }
  )
}

async function getById(id) {
  const rows = await sequelize.query('SELECT * FROM policy_attachments WHERE id = ? LIMIT 1', { replacements: [Number(id)], type: Sequelize.QueryTypes.SELECT })
  return rows[0] ?? null
}

async function replaceAttachment(id, fileMeta = {}) {
  const sets = [], params = []
  if (fileMeta.filename !== undefined) { sets.push('filename = ?'); params.push(fileMeta.filename) }
  if (fileMeta.original_name !== undefined) { sets.push('original_name = ?'); params.push(fileMeta.original_name) }
  if (fileMeta.file_path !== undefined) { sets.push('file_path = ?'); params.push(fileMeta.file_path) }
  if (fileMeta.mime_type !== undefined) { sets.push('mime_type = ?'); params.push(fileMeta.mime_type) }
  if (fileMeta.file_size !== undefined) { sets.push('file_size = ?'); params.push(Number(fileMeta.file_size || 0)) }
  if (!sets.length) return getById(id)
  params.push(Number(id))
  await sequelize.query(`UPDATE policy_attachments SET ${sets.join(', ')}, uploaded_at = NOW() WHERE id = ?`, { replacements: params, type: Sequelize.QueryTypes.UPDATE })
  return getById(id)
}

async function softDeleteAttachment(id) {
  await sequelize.query('UPDATE policy_attachments SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', { replacements: [Number(id)], type: Sequelize.QueryTypes.UPDATE })
  const rows = await sequelize.query('SELECT id FROM policy_attachments WHERE id = ? AND deleted_at IS NOT NULL LIMIT 1', { replacements: [Number(id)], type: Sequelize.QueryTypes.SELECT })
  return !!rows[0]
}

module.exports = { insertAttachment, listByPolicy, getById, replaceAttachment, softDeleteAttachment }