const { Sequelize, sequelize } = require('../../../../config/config');

async function createCitation(data) {
  const name = String(data.name || '').trim();
  const status = data.status || 'Active';
  const res = await sequelize.query(`INSERT INTO standard_citations (name, status, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`, { replacements: [name, status], type: Sequelize.QueryTypes.INSERT });
  return getCitationById(res[0]);
}

async function getAllCitations({ page=1, limit=100, search='', status='' } = {}) {
  const offset = (page-1)*limit; const where=[]; const repl=[];
  if (search) { where.push('name LIKE ?'); repl.push(`%${search}%`); }
  if (status && status !== 'All' && status !== '') { where.push('status = ?'); repl.push(status); }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await sequelize.query(`SELECT id, name, status, created_at, updated_at FROM standard_citations ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`, { replacements: [...repl, limit, offset], type: Sequelize.QueryTypes.SELECT });
  const countRes = await sequelize.query(`SELECT COUNT(*) AS total FROM standard_citations ${whereClause}`, { replacements: repl, type: Sequelize.QueryTypes.SELECT });
  return { rows, total: countRes[0]?.total || 0, page, limit };
}

async function getCitationById(id) {
  const rows = await sequelize.query(`SELECT id, name, status, created_at, updated_at FROM standard_citations WHERE id = ? LIMIT 1`, { replacements: [id], type: Sequelize.QueryTypes.SELECT });
  return rows[0] ?? null;
}

async function updateCitation(id, data) {
  const existing = await getCitationById(id); if (!existing) return null;
  const name = data.name ? String(data.name).trim() : existing.name;
  const status = data.status || existing.status;
  await sequelize.query(`UPDATE standard_citations SET name = ?, status = ?, updated_at = NOW() WHERE id = ?`, { replacements: [name, status, id], type: Sequelize.QueryTypes.UPDATE });
  return getCitationById(id);
}

async function deleteCitation(id) {
  const existing = await getCitationById(id); if (!existing) return false;
  await sequelize.query(`DELETE FROM standard_citations WHERE id = ?`, { replacements: [id], type: Sequelize.QueryTypes.DELETE });
  return true;
}

module.exports = { createCitation, getAllCitations, getCitationById, updateCitation, deleteCitation };