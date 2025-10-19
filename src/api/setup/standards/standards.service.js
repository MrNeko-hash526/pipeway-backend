const { Sequelize, sequelize } = require('../../../../config/config');

async function createStandard(data) {
  const category_id = parseInt(data.category_id, 10);
  const title_id = parseInt(data.title_id, 10);
  const citation_id = parseInt(data.citation_id, 10);
  const standard_text = String(data.standard_text || '');
  const status = data.status || 'Active';

  const sql = `INSERT INTO standards (category_id, title_id, citation_id, standard_text, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
  const res = await sequelize.query(sql, { replacements: [category_id, title_id, citation_id, standard_text, status], type: Sequelize.QueryTypes.INSERT });
  return getStandardById(res[0]);
}

async function getAllStandards({ page = 1, limit = 25, search = '', status = '' } = {}) {
  const offset = (page - 1) * limit;
  const where = []; const repl = [];
  if (search) { where.push('s.standard_text LIKE ?'); repl.push(`%${search}%`); }
  if (status && status !== 'All' && status !== '') { where.push('s.status = ?'); repl.push(status); }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT s.id, s.standard_text, s.status, s.created_at, s.updated_at,
           c.id AS category_id, c.name AS category_name,
           t.id AS title_id, t.name AS title_name,
           ci.id AS citation_id, ci.name AS citation_name
    FROM standards s
    LEFT JOIN standard_categories c ON c.id = s.category_id
    LEFT JOIN standard_titles t ON t.id = s.title_id
    LEFT JOIN standard_citations ci ON ci.id = s.citation_id
    ${whereClause}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const rows = await sequelize.query(sql, { replacements: [...repl, limit, offset], type: Sequelize.QueryTypes.SELECT });
  const countRes = await sequelize.query(`SELECT COUNT(*) AS total FROM standards s ${whereClause}`, { replacements: repl, type: Sequelize.QueryTypes.SELECT });
  return { rows, total: countRes[0]?.total || 0, page, limit };
}

async function getStandardById(id) {
  const sql = `
    SELECT s.id, s.standard_text, s.status, s.created_at, s.updated_at,
           c.id AS category_id, c.name AS category_name,
           t.id AS title_id, t.name AS title_name,
           ci.id AS citation_id, ci.name AS citation_name
    FROM standards s
    LEFT JOIN standard_categories c ON c.id = s.category_id
    LEFT JOIN standard_titles t ON t.id = s.title_id
    LEFT JOIN standard_citations ci ON ci.id = s.citation_id
    WHERE s.id = ?
    LIMIT 1
  `;
  const rows = await sequelize.query(sql, { replacements: [id], type: Sequelize.QueryTypes.SELECT });
  return rows[0] ?? null;
}

async function updateStandard(id, data) {
  const existing = await getStandardById(id);
  if (!existing) return null;
  const category_id = data.category_id ? parseInt(data.category_id, 10) : existing.category_id;
  const title_id = data.title_id ? parseInt(data.title_id, 10) : existing.title_id;
  const citation_id = data.citation_id ? parseInt(data.citation_id, 10) : existing.citation_id;
  const standard_text = data.standard_text ? String(data.standard_text) : existing.standard_text;
  const status = data.status || existing.status;

  await sequelize.query(`UPDATE standards SET category_id = ?, title_id = ?, citation_id = ?, standard_text = ?, status = ?, updated_at = NOW() WHERE id = ?`, {
    replacements: [category_id, title_id, citation_id, standard_text, status, id],
    type: Sequelize.QueryTypes.UPDATE
  });

  return getStandardById(id);
}

async function deleteStandard(id) {
  const existing = await getStandardById(id);
  if (!existing) return false;
  await sequelize.query(`DELETE FROM standards WHERE id = ?`, { replacements: [id], type: Sequelize.QueryTypes.DELETE });
  return true;
}

module.exports = { createStandard, getAllStandards, getStandardById, updateStandard, deleteStandard };