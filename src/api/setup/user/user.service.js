const { sequelize, Sequelize } = require('../../../../config/config');

function mapInputToDb(data) {
  const mapped = {};
  const fieldMap = {
    userType: 'user_type',
    organizationId: 'organization_id',
    companyName: 'company_name',
    userRole: 'user_role',
    firstName: 'first_name',
    lastName: 'last_name'
  };

  console.log('🔍 Raw input data:', data);

  for (const [inputKey, dbKey] of Object.entries(fieldMap)) {
    if (data[inputKey] !== undefined && data[inputKey] !== null && data[inputKey] !== '') {
      mapped[dbKey] = data[inputKey];
    }
  }

  // Direct mappings
  ['email', 'status'].forEach(k => {
    if (data[k] !== undefined && data[k] !== null && data[k] !== '') {
      mapped[k] = data[k];
    }
  });

  console.log('🔍 Mapped fields:', mapped);
  return mapped;
}

async function createUser(data = {}) {
  console.log('📝 createUser called');
  console.log('📝 Input data:', JSON.stringify(data, null, 2));
  
  const t = await sequelize.transaction();
  try {
    const mapped = mapInputToDb(data);
    console.log('📊 Mapped data:', mapped);
    
    if (Object.keys(mapped).length === 0) {
      throw new Error('No valid fields to insert - all fields are empty');
    }

    // Validate user_type constraints
    if (mapped.user_type === 'Organization' && !mapped.organization_id) {
      throw new Error('Organization users must have an organization_id');
    }
    if (mapped.user_type === 'Company' && !mapped.company_name) {
      throw new Error('Company users must have a company_name');
    }

    const fields = Object.keys(mapped);
    const placeholders = fields.map(() => '?');
    const values = Object.values(mapped);

    const sql = `INSERT INTO user_setup (${fields.join(',')}, created_at, updated_at) VALUES (${placeholders.join(',')}, NOW(), NOW())`;
    console.log('🔍 SQL:', sql);
    console.log('🔍 Values:', values);

    const [result] = await sequelize.query(sql, { 
      replacements: values, 
      type: Sequelize.QueryTypes.INSERT, 
      transaction: t 
    });

    const userId = result;
    console.log('✅ User created with ID:', userId);

    await t.commit();
    console.log('✅ Transaction committed');
    
    return { id: userId, ...mapped };
  } catch (err) {
    console.error('❌ Error in createUser:', err.message);
    console.error('❌ Full error:', err);
    await t.rollback();
    throw err;
  }
}

async function getAllUsers({ page = 1, limit = 50, search = '', status = '', userType = '', userRole = '' }) {
  console.log('📋 getAllUsers - page:', page, 'limit:', limit, 'search:', search, 'status:', status, 'userType:', userType, 'userRole:', userRole);
  
  const offset = (page - 1) * limit;
  let where = [];
  const replacements = [];

  if (search) {
    where.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company_name LIKE ?)');
    replacements.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status && status !== 'All' && status !== '') {
    where.push('status = ?');
    replacements.push(status);
  }
  if (userType && userType !== 'All' && userType !== '') {
    where.push('user_type = ?');
    replacements.push(userType);
  }
  if (userRole && userRole !== 'All' && userRole !== '') {
    where.push('user_role = ?');
    replacements.push(userRole);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  try {
    // SIMPLIFIED QUERY - No JOIN with organization table for now
    const sql = `
      SELECT 
        u.*,
        CASE 
          WHEN u.user_type = 'Organization' THEN CONCAT('Organization ID: ', u.organization_id)
          ELSE u.company_name 
        END as organization_display
      FROM user_setup u
      ${whereClause} 
      ORDER BY u.id DESC 
      LIMIT ? OFFSET ?
    `;
    
    console.log('🔍 SQL:', sql);
    console.log('🔍 Replacements:', [...replacements, limit, offset]);

    const rows = await sequelize.query(sql, { 
      replacements: [...replacements, limit, offset], 
      type: Sequelize.QueryTypes.SELECT 
    });

    const countSql = `SELECT COUNT(*) as total FROM user_setup u ${whereClause}`;
    const countResult = await sequelize.query(countSql, { 
      replacements, 
      type: Sequelize.QueryTypes.SELECT 
    });

    const total = countResult[0]?.total || 0;

    console.log('✅ Found', rows.length, 'users (total:', total, ')');
    return { rows, total, page, limit };
  } catch (err) {
    console.error('❌ Error in getAllUsers:', err);
    throw err;
  }
}

async function getUserById(id) {
  console.log('🔍 getUserById - ID:', id);
  
  try {
    // SIMPLIFIED QUERY - No JOIN with organization table for now
    const sql = `
      SELECT 
        u.*,
        CASE 
          WHEN u.user_type = 'Organization' THEN CONCAT('Organization ID: ', u.organization_id)
          ELSE u.company_name 
        END as organization_display
      FROM user_setup u
      WHERE u.id = ?
    `;
    
    console.log('🔍 SQL:', sql, 'ID:', id);
    
    const users = await sequelize.query(sql, {
      replacements: [id], 
      type: Sequelize.QueryTypes.SELECT 
    });

    console.log('🔍 Users found:', users.length);

    if (!users || users.length === 0) {
      console.log('⚠️ No user found with ID:', id);
      return null;
    }

    const user = users[0];
    console.log('✅ User found:', user.email);

    return user;
  } catch (err) {
    console.error('❌ Error in getUserById:', err);
    console.error('❌ Stack:', err.stack);
    throw err;
  }
}

async function updateUser(id, data = {}) {
  console.log('📝 updateUser - ID:', id);
  console.log('📝 Data:', data);
  
  const t = await sequelize.transaction();
  try {
    const mapped = mapInputToDb(data);
    
    if (Object.keys(mapped).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Validate user_type constraints if user_type is being updated
    if (mapped.user_type) {
      if (mapped.user_type === 'Organization' && !mapped.organization_id) {
        throw new Error('Organization users must have an organization_id');
      }
      if (mapped.user_type === 'Company' && !mapped.company_name) {
        throw new Error('Company users must have a company_name');
      }
    }

    const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ');
    const sql = `UPDATE user_setup SET ${sets}, updated_at = NOW() WHERE id = ?`;
    
    console.log('🔍 Update SQL:', sql);
    console.log('🔍 Update values:', [...Object.values(mapped), id]);
    
    const [affectedRows] = await sequelize.query(sql, {
      replacements: [...Object.values(mapped), id], 
      type: Sequelize.QueryTypes.UPDATE, 
      transaction: t 
    });
    
    if (affectedRows === 0) {
      await t.rollback();
      return null;
    }
    
    console.log('✅ User updated');

    await t.commit();
    return await getUserById(id);
  } catch (err) {
    console.error('❌ Error in updateUser:', err);
    await t.rollback();
    throw err;
  }
}

async function deleteUser(id) {
  console.log('🗑️ deleteUser - ID:', id);
  
  const t = await sequelize.transaction();
  try {
    const sql = 'DELETE FROM user_setup WHERE id = ?';
    const [affectedRows] = await sequelize.query(sql, {
      replacements: [id], 
      type: Sequelize.QueryTypes.DELETE, 
      transaction: t 
    });

    await t.commit();
    
    if (affectedRows === 0) {
      console.log('⚠️ No user found with ID:', id);
      return false;
    }

    console.log('✅ User deleted:', id);
    return true;
  } catch (err) {
    console.error('❌ Error in deleteUser:', err);
    await t.rollback();
    throw err;
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};