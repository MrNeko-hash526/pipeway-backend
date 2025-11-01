const { Sequelize, sequelize } = require('../../../../config/config');

// Main Risk Management CRUD
async function createRiskManagement(data) {
  const criteria_id = data.criteria_id;
  const rrm_option = String(data.rrm_option || '').trim();
  const rrm_level = data.rrm_level;
  const rrm_exception = String(data.rrm_exception || '').trim();
  const status = data.status || 'Active';
  
  const sql = `INSERT INTO risk_management (criteria_id, rrm_option, rrm_level, rrm_exception, status, deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`;
  const res = await sequelize.query(sql, { replacements: [criteria_id, rrm_option, rrm_level, rrm_exception, status], type: Sequelize.QueryTypes.INSERT });
  return getRiskManagementById(res[0]);
}

async function getAllRiskManagement({ page = 1, limit = 100, search = '', status = '', includeDeleted = false } = {}) {
  const offset = (page - 1) * limit;
  const where = []; 
  const repl = [];
  
  // Always exclude deleted unless explicitly requested
  if (!includeDeleted) {
    where.push('rm.deleted = 0');
  }
  
  if (search) { 
    where.push('(rm.rrm_option LIKE ? OR rc.name LIKE ? OR rm.rrm_exception LIKE ?)'); 
    repl.push(`%${search}%`, `%${search}%`, `%${search}%`); 
  }
  if (status && status !== 'All' && status !== '') { 
    where.push('rm.status = ?'); 
    repl.push(status); 
  }
  
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  
  const rows = await sequelize.query(`
    SELECT 
      rm.id,
      rm.criteria_id,
      rc.name as criteria,
      rm.rrm_option as \`option\`,
      rm.rrm_level as level,
      rm.rrm_exception as exception,
      rm.status,
      rm.deleted,
      rm.created_at,
      rm.updated_at
    FROM risk_management rm
    JOIN rrm_criteria rc ON rm.criteria_id = rc.id
    ${whereClause}
    ORDER BY rm.id DESC
    LIMIT ? OFFSET ?
  `, { replacements: [...repl, limit, offset], type: Sequelize.QueryTypes.SELECT });
  
  const countRes = await sequelize.query(`
    SELECT COUNT(*) AS total 
    FROM risk_management rm 
    JOIN rrm_criteria rc ON rm.criteria_id = rc.id 
    ${whereClause}
  `, { replacements: repl, type: Sequelize.QueryTypes.SELECT });
  
  return { rows, total: countRes[0]?.total || 0, page, limit };
}

async function getRiskManagementById(id, includeDeleted = false) {
  const whereClause = includeDeleted ? 'WHERE rm.id = ?' : 'WHERE rm.id = ? AND rm.deleted = 0';
  
  const rows = await sequelize.query(`
    SELECT 
      rm.id,
      rm.criteria_id,
      rc.name as criteria,
      rm.rrm_option as \`option\`,
      rm.rrm_level as level,
      rm.rrm_exception as exception,
      rm.status,
      rm.deleted,
      rm.created_at,
      rm.updated_at
    FROM risk_management rm
    JOIN rrm_criteria rc ON rm.criteria_id = rc.id
    ${whereClause}
    LIMIT 1
  `, { replacements: [id], type: Sequelize.QueryTypes.SELECT });
  return rows[0] ?? null;
}

async function updateRiskManagement(id, data) {
  const existing = await getRiskManagementById(id);
  if (!existing) return null;
  
  const criteria_id = data.criteria_id || existing.criteria_id;
  const rrm_option = data.rrm_option ? String(data.rrm_option).trim() : existing.option;
  const rrm_level = data.rrm_level || existing.level;
  const rrm_exception = data.rrm_exception ? String(data.rrm_exception).trim() : existing.exception;
  const status = data.status || existing.status;
  
  await sequelize.query(`UPDATE risk_management SET criteria_id = ?, rrm_option = ?, rrm_level = ?, rrm_exception = ?, status = ?, updated_at = NOW() WHERE id = ? AND deleted = 0`, 
    { replacements: [criteria_id, rrm_option, rrm_level, rrm_exception, status, id], type: Sequelize.QueryTypes.UPDATE });
  return getRiskManagementById(id);
}

// Soft delete - mark as deleted instead of actual deletion
async function deleteRiskManagement(id) {
  const existing = await getRiskManagementById(id);
  if (!existing) return false;
  
  await sequelize.query(`UPDATE risk_management SET deleted = 1, updated_at = NOW() WHERE id = ?`, 
    { replacements: [id], type: Sequelize.QueryTypes.UPDATE });
  return true;
}

// Add restore function for soft deleted items
async function restoreRiskManagement(id) {
  const existing = await getRiskManagementById(id, true); // Include deleted items
  if (!existing || existing.deleted !== 1) return false;
  
  await sequelize.query(`UPDATE risk_management SET deleted = 0, updated_at = NOW() WHERE id = ?`, 
    { replacements: [id], type: Sequelize.QueryTypes.UPDATE });
  return true;
}

// Permanent delete function (if needed)
async function permanentDeleteRiskManagement(id) {
  const existing = await getRiskManagementById(id, true);
  if (!existing) return false;
  
  await sequelize.query(`DELETE FROM risk_management WHERE id = ?`, 
    { replacements: [id], type: Sequelize.QueryTypes.DELETE });
  return true;
}

// RRM Criteria CRUD with deleted handling
async function createCriteria(data) {
  const name = String(data.name || '').trim();
  const status = data.status || 'Active';
  const sql = `INSERT INTO rrm_criteria (name, status, deleted, created_at, updated_at) VALUES (?, ?, 0, NOW(), NOW())`;
  const res = await sequelize.query(sql, { replacements: [name, status], type: Sequelize.QueryTypes.INSERT });
  return getCriteriaById(res[0]);
}

async function getAllCriteria({ page = 1, limit = 100, search = '', status = '', includeDeleted = false } = {}) {
  const offset = (page - 1) * limit;
  const where = []; 
  const repl = [];
  
  if (!includeDeleted) {
    where.push('deleted = 0');
  }
  
  if (search) { where.push('name LIKE ?'); repl.push(`%${search}%`); }
  if (status && status !== 'All' && status !== '') { where.push('status = ?'); repl.push(status); }
  
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  
  const rows = await sequelize.query(`SELECT id, name, status, deleted, created_at, updated_at FROM rrm_criteria ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`, 
    { replacements: [...repl, limit, offset], type: Sequelize.QueryTypes.SELECT });
  const countRes = await sequelize.query(`SELECT COUNT(*) AS total FROM rrm_criteria ${whereClause}`, 
    { replacements: repl, type: Sequelize.QueryTypes.SELECT });
  return { rows, total: countRes[0]?.total || 0, page, limit };
}

async function getCriteriaById(id, includeDeleted = false) {
  const whereClause = includeDeleted ? 'WHERE id = ?' : 'WHERE id = ? AND deleted = 0';
  const rows = await sequelize.query(`SELECT id, name, status, deleted, created_at, updated_at FROM rrm_criteria ${whereClause} LIMIT 1`, 
    { replacements: [id], type: Sequelize.QueryTypes.SELECT });
  return rows[0] ?? null;
}

// RRM Levels CRUD with deleted handling
async function createLevel(data) {
  const level_value = data.level_value;
  const level_label = String(data.level_label || '').trim();
  const range_min = data.range_min || null;
  const range_max = data.range_max || null;
  const status = data.status || 'Active';
  const sql = `INSERT INTO rrm_levels (level_value, level_label, range_min, range_max, status, deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`;
  const res = await sequelize.query(sql, { replacements: [level_value, level_label, range_min, range_max, status], type: Sequelize.QueryTypes.INSERT });
  return getLevelById(res[0]);
}

async function getAllLevels({ page = 1, limit = 100, search = '', status = '', includeDeleted = false } = {}) {
  const offset = (page - 1) * limit;
  const where = []; 
  const repl = [];
  
  if (!includeDeleted) {
    where.push('deleted = 0');
  }
  
  if (search) { where.push('level_label LIKE ?'); repl.push(`%${search}%`); }
  if (status && status !== 'All' && status !== '') { where.push('status = ?'); repl.push(status); }
  
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  
  const rows = await sequelize.query(`SELECT id, level_value, level_label, range_min, range_max, status, deleted, created_at, updated_at FROM rrm_levels ${whereClause} ORDER BY level_value ASC LIMIT ? OFFSET ?`, 
    { replacements: [...repl, limit, offset], type: Sequelize.QueryTypes.SELECT });
  const countRes = await sequelize.query(`SELECT COUNT(*) AS total FROM rrm_levels ${whereClause}`, 
    { replacements: repl, type: Sequelize.QueryTypes.SELECT });
  return { rows, total: countRes[0]?.total || 0, page, limit };
}

async function getLevelById(id, includeDeleted = false) {
  const whereClause = includeDeleted ? 'WHERE id = ?' : 'WHERE id = ? AND deleted = 0';
  const rows = await sequelize.query(`SELECT id, level_value, level_label, range_min, range_max, status, deleted, created_at, updated_at FROM rrm_levels ${whereClause} LIMIT 1`, 
    { replacements: [id], type: Sequelize.QueryTypes.SELECT });
  return rows[0] ?? null;
}

module.exports = {
  createRiskManagement,
  getAllRiskManagement,
  getRiskManagementById,
  updateRiskManagement,
  deleteRiskManagement,
  restoreRiskManagement,
  permanentDeleteRiskManagement,
  createCriteria,
  getAllCriteria,
  getCriteriaById,
  createLevel,
  getAllLevels,
  getLevelById
};