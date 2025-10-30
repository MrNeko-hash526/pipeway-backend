const { Sequelize, sequelize } = require('../../../../config/config');
const { tables, columns } = require('./tableConfig'); // Adjust the path as necessary

/**
 * Helpers
 */
async function columnExists(table, column) {
  try {
    const dbName = (sequelize && sequelize.config && sequelize.config.database) || process.env.DB_NAME || null;
    if (!dbName) return false;
    const rows = await sequelize.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      { replacements: [dbName, table, column], type: Sequelize.QueryTypes.SELECT }
    );
    return !!(rows && rows[0] && rows[0].cnt > 0);
  } catch (err) {
    console.warn('columnExists check failed', { table, column, err: err?.message });
    return false;
  }
}

/**
 * Try a query and fallback to a simpler one if it fails (e.g. missing lookup table)
 */
async function tryWithFallback(primaryFn, fallbackFn) {
  try {
    return await primaryFn();
  } catch (err) {
    // log and fallback
    console.warn('Primary query failed, falling back:', err?.message);
    return await fallbackFn();
  }
}

/* --------------------------
   Main Risk Management CRUD
   -------------------------- */

async function createRiskManagement(data) {
  const criteria_id = data.criteria_id;
  const rrm_option = String(data.rrm_option || '').trim();
  const rrm_level = data.rrm_level;
  const rrm_exception = String(data.rrm_exception || '').trim();
  const status = data.status || 'Active';

  const hasDeleted = await columnExists(tables.main, columns.deleted);

  let sql, replacements;
  if (hasDeleted) {
    sql = `INSERT INTO ${tables.main} (criteria_id, rrm_option, rrm_level, rrm_exception, status, deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`;
    replacements = [criteria_id, rrm_option, rrm_level, rrm_exception, status];
  } else {
    sql = `INSERT INTO ${tables.main} (criteria_id, rrm_option, rrm_level, rrm_exception, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
    replacements = [criteria_id, rrm_option, rrm_level, rrm_exception, status];
  }

  const res = await sequelize.query(sql, { replacements, type: Sequelize.QueryTypes.INSERT });
  // res[0] should be insert id in MySQL
  return getRiskManagementById(res[0]);
}

async function getAllRiskManagement({ page = 1, limit = 100, search = '', status = '', includeDeleted = false } = {}) {
  console.log('📋 getAllRiskManagement called:', { page, limit, search, status, includeDeleted });
  
  const offset = (page - 1) * limit;
  const where = [];
  const repl = [];

  if (search) {
    where.push(`(rm.${columns.option} LIKE ? OR rc.name LIKE ? OR rm.rrm_exception LIKE ?)`);
    repl.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status && status !== 'All' && status !== '') {
    where.push('rm.status = ?');
    repl.push(status);
  }

  const hasDeleted = await columnExists(tables.main, columns.deleted);
  if (hasDeleted && !includeDeleted) {
    where.push(`rm.${columns.deleted} = 0`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  console.log('🔍 Query details:', { whereClause, replacements: repl });

  const primary = async () => {
    console.log('🔄 Attempting primary query with JOIN');
    const rows = await sequelize.query(`
      SELECT 
        rm.id,
        rm.criteria_id,
        rc.name as criteria,
        rm.${columns.option} as \`option\`,
        rm.rrm_level as level,
        rm.rrm_exception as exception,
        rm.status,
        ${hasDeleted ? 'rm.deleted,' : '0 AS deleted,'}
        rm.created_at,
        rm.updated_at
      FROM ${tables.main} rm
      LEFT JOIN ${tables.criteria} rc ON rm.criteria_id = rc.id
      ${whereClause}
      ORDER BY rm.id DESC
      LIMIT ? OFFSET ?
    `, { replacements: [...repl, limit, offset], type: Sequelize.QueryTypes.SELECT });

    // Get total count
    const countRes = await sequelize.query(`
      SELECT COUNT(*) AS total 
      FROM ${tables.main} rm
      LEFT JOIN ${tables.criteria} rc ON rm.criteria_id = rc.id
      ${whereClause}
    `, { replacements: repl, type: Sequelize.QueryTypes.SELECT });

    console.log('✅ Primary query succeeded, found', rows.length, 'records');
    return { rows, total: countRes[0]?.total || 0, page, limit };
  };

  // Fallback: simple query from risk_management only (no join)
  const fallback = async () => {
    console.log('🔄 Attempting fallback query without JOIN');
    const rows = await sequelize.query(`
      SELECT 
        rm.id,
        rm.criteria_id,
        NULL AS criteria,
        rm.${columns.option} as \`option\`,
        rm.rrm_level as level,
        rm.rrm_exception as exception,
        rm.status,
        ${hasDeleted ? 'rm.deleted,' : '0 AS deleted,'}
        rm.created_at,
        rm.updated_at
      FROM ${tables.main} rm
      ${whereClause.replace(/rc\.name/g, 'NULL')}
      ORDER BY rm.id DESC
      LIMIT ? OFFSET ?
    `, { replacements: [...repl, limit, offset], type: Sequelize.QueryTypes.SELECT });

    const countRes = await sequelize.query(`
      SELECT COUNT(*) AS total FROM ${tables.main} rm ${whereClause.replace(/rc\.name/g, 'NULL')}
    `, { replacements: repl, type: Sequelize.QueryTypes.SELECT });

    console.log('✅ Fallback query succeeded, found', rows.length, 'records');
    return { rows, total: countRes[0]?.total || 0, page, limit };
  };

  return tryWithFallback(primary, fallback);
}

async function getRiskManagementById(id, { includeDeleted = false } = {}) {
  // Fix: Use tables.main instead of hardcoded 'risk_management'
  const hasDeleted = await columnExists(tables.main, columns.deleted);

  const primary = async () => {
    const deletedFilter = hasDeleted && !includeDeleted ? 'AND rm.deleted = 0' : '';
    const rows = await sequelize.query(`
      SELECT 
        rm.id,
        rm.criteria_id,
        rc.name as criteria,
        rm.rrm_option as \`option\`,
        rm.rrm_level as level,
        rm.rrm_exception as exception,
        rm.status,
        ${hasDeleted ? 'rm.deleted,' : '0 AS deleted,'}
        rm.created_at,
        rm.updated_at
      FROM ${tables.main} rm
      LEFT JOIN ${tables.criteria} rc ON rm.criteria_id = rc.id
      WHERE rm.id = ? ${deletedFilter}
      LIMIT 1
    `, { replacements: [id], type: Sequelize.QueryTypes.SELECT });
    return rows[0] ?? null;
  };

  const fallback = async () => {
    const deletedFilter = hasDeleted && !includeDeleted ? 'AND rm.deleted = 0' : '';
    const rows = await sequelize.query(`
      SELECT 
        rm.id,
        rm.criteria_id,
        NULL AS criteria,
        rm.rrm_option as \`option\`,
        rm.rrm_level as level,
        rm.rrm_exception as exception,
        rm.status,
        ${hasDeleted ? 'rm.deleted,' : '0 AS deleted,'}
        rm.created_at,
        rm.updated_at
      FROM ${tables.main} rm
      WHERE rm.id = ? ${deletedFilter}
      LIMIT 1
    `, { replacements: [id], type: Sequelize.QueryTypes.SELECT });
    return rows[0] ?? null;
  };

  return tryWithFallback(primary, fallback);
}

async function updateRiskManagement(id, data) {
  // Only update non-deleted records if deleted column exists
  const existing = await getRiskManagementById(id);
  if (!existing) return null;

  const criteria_id = data.criteria_id || existing.criteria_id;
  const rrm_option = data.rrm_option ? String(data.rrm_option).trim() : existing.option;
  const rrm_level = data.rrm_level || existing.level;
  const rrm_exception = data.rrm_exception ? String(data.rrm_exception).trim() : existing.exception;
  const status = data.status || existing.status;

  const hasDeleted = await columnExists(tables.main, columns.deleted);

  const whereDeletedCheck = hasDeleted ? `AND ${columns.deleted} = 0` : '';

  await sequelize.query(`
    UPDATE ${tables.main} 
    SET criteria_id = ?, rrm_option = ?, rrm_level = ?, rrm_exception = ?, status = ?, updated_at = NOW() 
    WHERE id = ? ${whereDeletedCheck}
  `, { replacements: [criteria_id, rrm_option, rrm_level, rrm_exception, status, id], type: Sequelize.QueryTypes.UPDATE });

  return getRiskManagementById(id);
}

// Soft delete functions
async function softDeleteRiskManagement(id) {
  const hasDeleted = await columnExists(tables.main, columns.deleted);
  if (!hasDeleted) {
    // If deleted column doesn't exist, attempt hard delete as last resort
    const [del] = await sequelize.query(`DELETE FROM ${tables.main} WHERE id = ?`, { replacements: [id], type: Sequelize.QueryTypes.DELETE });
    return del > 0;
  }

  // Normal soft-delete
  const [affectedRows] = await sequelize.query(`
    UPDATE ${tables.main} 
    SET ${columns.deleted} = 1, updated_at = NOW()
    WHERE id = ? AND ${columns.deleted} = 0
  `, { replacements: [id], type: Sequelize.QueryTypes.UPDATE });

  return affectedRows > 0;
}

async function restoreRiskManagement(id) {
  const hasDeleted = await columnExists(tables.main, columns.deleted);
  if (!hasDeleted) return null;

  const [affectedRows] = await sequelize.query(`
    UPDATE ${tables.main} 
    SET ${columns.deleted} = 0, updated_at = NOW()
    WHERE id = ? AND ${columns.deleted} = 1
  `, { replacements: [id], type: Sequelize.QueryTypes.UPDATE });

  if (affectedRows === 0) return null;

  // Return restored record (use getRiskManagementById which handles join fallback)
  return getRiskManagementById(id);
}

/* --------------------------
   Criteria CRUD (flexible)
   -------------------------- */

async function createCriteria(data) {
  const name = String(data.name || '').trim();
  const status = data.status || 'Active';
  const hasDeleted = await columnExists(tables.criteria, columns.deleted);

  const sql = hasDeleted
    ? `INSERT INTO ${tables.criteria} (name, status, deleted, created_at, updated_at) VALUES (?, ?, 0, NOW(), NOW())`
    : `INSERT INTO ${tables.criteria} (name, status, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`;

  const res = await sequelize.query(sql, { replacements: [name, status], type: Sequelize.QueryTypes.INSERT });
  return getCriteriaById(res[0]);
}

async function getAllCriteria({ page = 1, limit = 100, search = '', status = '', includeDeleted = false } = {}) {
  const offset = (page - 1) * limit;
  const where = [];
  const repl = [];

  if (search) {
    where.push('name LIKE ?');
    repl.push(`%${search}%`);
  }
  if (status && status !== 'All' && status !== '') {
    where.push('status = ?');
    repl.push(status);
  }

  const hasDeleted = await columnExists(tables.criteria, columns.deleted);
  if (hasDeleted && !includeDeleted) where.push(`${columns.deleted} = 0`);

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = await sequelize.query(`
    SELECT id, name, status, ${hasDeleted ? 'deleted,' : '0 AS deleted,'} created_at, updated_at 
    FROM ${tables.criteria}
    ${whereClause}
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `, { replacements: [...repl, limit, offset], type: Sequelize.QueryTypes.SELECT });

  const countRes = await sequelize.query(`SELECT COUNT(*) AS total FROM ${tables.criteria} ${whereClause}`, { replacements: repl, type: Sequelize.QueryTypes.SELECT });

  return { rows, total: countRes[0]?.total || 0, page, limit };
}

async function getCriteriaById(id) {
  const hasDeleted = await columnExists(tables.criteria, columns.deleted);
  const rows = await sequelize.query(`
    SELECT id, name, status, ${hasDeleted ? 'deleted,' : '0 AS deleted,'} created_at, updated_at
    FROM ${tables.criteria}
    WHERE id = ? ${hasDeleted ? 'AND deleted = 0' : ''}
    LIMIT 1
  `, { replacements: [id], type: Sequelize.QueryTypes.SELECT });
  return rows[0] ?? null;
}

async function softDeleteCriteria(id) {
  const hasDeleted = await columnExists(tables.criteria, columns.deleted);
  if (!hasDeleted) {
    const [del] = await sequelize.query(`DELETE FROM ${tables.criteria} WHERE id = ?`, { replacements: [id], type: Sequelize.QueryTypes.DELETE });
    return del > 0;
  }

  const [affectedRows] = await sequelize.query(`
    UPDATE ${tables.criteria} SET deleted = 1, updated_at = NOW() WHERE id = ? AND deleted = 0
  `, { replacements: [id], type: Sequelize.QueryTypes.UPDATE });

  return affectedRows > 0;
}

/* --------------------------
   Levels CRUD (flexible)
   -------------------------- */

async function createLevel(data) {
  const level_value = data.level_value;
  const level_label = String(data.level_label || '').trim();
  const range_min = data.range_min || null;
  const range_max = data.range_max || null;
  const status = data.status || 'Active';
  const hasDeleted = await columnExists(tables.levels, columns.deleted);

  const sql = hasDeleted
    ? `INSERT INTO ${tables.levels} (level_value, level_label, range_min, range_max, status, deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`
    : `INSERT INTO ${tables.levels} (level_value, level_label, range_min, range_max, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;

  const res = await sequelize.query(sql, { replacements: [level_value, level_label, range_min, range_max, status], type: Sequelize.QueryTypes.INSERT });
  return getLevelById(res[0]);
}

async function getAllLevels({ page = 1, limit = 100, search = '', status = '', includeDeleted = false } = {}) {
  const offset = (page - 1) * limit;
  const where = [];
  const repl = [];

  if (search) {
    where.push('level_label LIKE ?');
    repl.push(`%${search}%`);
  }
  if (status && status !== 'All' && status !== '') {
    where.push('status = ?');
    repl.push(status);
  }

  const hasDeleted = await columnExists(tables.levels, columns.deleted);
  if (hasDeleted && !includeDeleted) where.push(`${columns.deleted} = 0`);

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = await sequelize.query(`
    SELECT id, level_value, level_label, range_min, range_max, status, ${hasDeleted ? 'deleted,' : '0 AS deleted,'} created_at, updated_at 
    FROM ${tables.levels}
    ${whereClause}
    ORDER BY level_value ASC
    LIMIT ? OFFSET ?
  `, { replacements: [...repl, limit, offset], type: Sequelize.QueryTypes.SELECT });

  const countRes = await sequelize.query(`SELECT COUNT(*) AS total FROM ${tables.levels} ${whereClause}`, { replacements: repl, type: Sequelize.QueryTypes.SELECT });

  return { rows, total: countRes[0]?.total || 0, page, limit };
}

async function getLevelById(id) {
  const hasDeleted = await columnExists(tables.levels, columns.deleted);
  const rows = await sequelize.query(`
    SELECT id, level_value, level_label, range_min, range_max, status, ${hasDeleted ? 'deleted,' : '0 AS deleted,'} created_at, updated_at
    FROM ${tables.levels}
    WHERE id = ? ${hasDeleted ? 'AND deleted = 0' : ''}
    LIMIT 1
  `, { replacements: [id], type: Sequelize.QueryTypes.SELECT });
  return rows[0] ?? null;
}

async function softDeleteLevel(id) {
  const hasDeleted = await columnExists(tables.levels, columns.deleted);
  if (!hasDeleted) {
    const [del] = await sequelize.query(`DELETE FROM ${tables.levels} WHERE id = ?`, { replacements: [id], type: Sequelize.QueryTypes.DELETE });
    return del > 0;
  }

  const [affectedRows] = await sequelize.query(`
    UPDATE ${tables.levels} SET deleted = 1, updated_at = NOW() WHERE id = ? AND deleted = 0
  `, { replacements: [id], type: Sequelize.QueryTypes.UPDATE });

  return affectedRows > 0;
}

/* --------------------------
   Exports
   -------------------------- */
module.exports = {
  createRiskManagement,
  getAllRiskManagement,
  getRiskManagementById,
  updateRiskManagement,
  // export deleteRiskManagement as alias to softDeleteRiskManagement for backwards compatibility
  deleteRiskManagement: softDeleteRiskManagement,
  softDeleteRiskManagement,
  restoreRiskManagement,
  createCriteria,
  getAllCriteria,
  getCriteriaById,
  softDeleteCriteria,
  createLevel,
  getAllLevels,
  getLevelById,
  softDeleteLevel
};