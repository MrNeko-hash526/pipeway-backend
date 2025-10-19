const { Sequelize, sequelize } = require('../../../../config/config');

async function createUserGroup(data) {
  console.log('📝 createUserGroup - data:', data);
  
  try {
    // Map frontend field names to database field names
    const mappedData = {
      group_name: data.groupName?.trim(),
      group_values: JSON.stringify(data.groupValues || []),
      status: data.status || 'Active'
    };

    console.log('📊 Mapped data:', mappedData);

    const sql = `
      INSERT INTO user_groups_setup (group_name, group_values, status, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;

    const result = await sequelize.query(sql, {
      replacements: [mappedData.group_name, mappedData.group_values, mappedData.status],
      type: Sequelize.QueryTypes.INSERT
    });

    const insertedId = result[0];
    console.log('✅ User group created with ID:', insertedId);

    // Return the created user group
    return await getUserGroupById(insertedId);
  } catch (err) {
    console.error('❌ Error in createUserGroup:', err);
    
    // Handle different types of errors
    if (err.name === 'SequelizeUniqueConstraintError' || err.code === 'ER_DUP_ENTRY') {
      throw new Error('Group name already exists. Please choose a different name.');
    }
    if (err.code === 'ER_NO_SUCH_TABLE') {
      throw new Error('Database table does not exist');
    }
    
    throw new Error('Failed to create user group: ' + err.message);
  }
}

async function getAllUserGroups({ page = 1, limit = 100, search = '', status = 'Active' }) {
  console.log('📋 getAllUserGroups - page:', page, 'limit:', limit, 'search:', search, 'status:', status);
  
  const offset = (page - 1) * limit;
  let where = [];
  const replacements = [];

  if (search) {
    where.push('group_name LIKE ?');
    replacements.push(`%${search}%`);
  }
  if (status && status !== 'All' && status !== '') {
    where.push('status = ?');
    replacements.push(status);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const sql = `
      SELECT 
        id,
        group_name,
        group_values,
        status,
        created_at,
        updated_at
      FROM user_groups_setup
      ${whereClause} 
      ORDER BY group_name ASC 
      LIMIT ? OFFSET ?
    `;
    
    console.log('🔍 SQL:', sql);
    console.log('🔍 Replacements:', [...replacements, limit, offset]);

    const rows = await sequelize.query(sql, { 
      replacements: [...replacements, limit, offset], 
      type: Sequelize.QueryTypes.SELECT 
    });

    // Parse JSON group_values for each row
    const parsedRows = rows.map(row => ({
      ...row,
      group_values: typeof row.group_values === 'string' 
        ? JSON.parse(row.group_values) 
        : row.group_values
    }));

    const countSql = `SELECT COUNT(*) as total FROM user_groups_setup ${whereClause}`;
    const countResult = await sequelize.query(countSql, { 
      replacements, 
      type: Sequelize.QueryTypes.SELECT 
    });

    const total = countResult[0]?.total || 0;

    console.log('✅ Found', parsedRows.length, 'user groups (total:', total, ')');
    return { rows: parsedRows, total, page, limit };
  } catch (err) {
    console.error('❌ Error in getAllUserGroups:', err);
    throw err;
  }
}

async function getUserGroupById(id) {
  console.log('🔍 getUserGroupById - ID:', id);
  
  try {
    const sql = `
      SELECT 
        id,
        group_name,
        group_values,
        status,
        created_at,
        updated_at
      FROM user_groups_setup
      WHERE id = ?
    `;
    
    console.log('🔍 SQL:', sql, 'ID:', id);
    
    const userGroups = await sequelize.query(sql, {
      replacements: [id], 
      type: Sequelize.QueryTypes.SELECT 
    });

    console.log('🔍 User groups found:', userGroups.length);

    if (!userGroups || userGroups.length === 0) {
      console.log('⚠️ No user group found with ID:', id);
      return null;
    }

    const userGroup = userGroups[0];
    
    // Parse JSON group_values
    userGroup.group_values = typeof userGroup.group_values === 'string' 
      ? JSON.parse(userGroup.group_values) 
      : userGroup.group_values;

    console.log('✅ User group found:', userGroup.group_name);

    return userGroup;
  } catch (err) {
    console.error('❌ Error in getUserGroupById:', err);
    console.error('❌ Stack:', err.stack);
    throw err;
  }
}

async function updateUserGroup(id, data) {
  console.log('📝 updateUserGroup - ID:', id, 'data:', data);
  
  try {
    // Check if user group exists
    const existing = await getUserGroupById(id);
    if (!existing) {
      console.log('⚠️ User group not found for update:', id);
      return null;
    }

    // Map frontend field names to database field names
    const mappedData = {
      group_name: data.groupName?.trim() || existing.group_name,
      group_values: data.groupValues ? JSON.stringify(data.groupValues) : JSON.stringify(existing.group_values),
      status: data.status || existing.status
    };

    console.log('📊 Mapped update data:', mappedData);

    const sql = `
      UPDATE user_groups_setup 
      SET group_name = ?, group_values = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await sequelize.query(sql, {
      replacements: [mappedData.group_name, mappedData.group_values, mappedData.status, id],
      type: Sequelize.QueryTypes.UPDATE
    });

    console.log('✅ User group updated successfully');

    // Return updated user group
    return await getUserGroupById(id);
  } catch (err) {
    console.error('❌ Error in updateUserGroup:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      throw new Error('Group name already exists');
    }
    throw err;
  }
}

async function deleteUserGroup(id) {
  console.log('🗑️ deleteUserGroup - ID:', id);
  
  try {
    // Check if user group exists
    const existing = await getUserGroupById(id);
    if (!existing) {
      console.log('⚠️ User group not found for deletion:', id);
      return false;
    }

    const sql = `DELETE FROM user_groups_setup WHERE id = ?`;
    
    const result = await sequelize.query(sql, {
      replacements: [id],
      type: Sequelize.QueryTypes.DELETE
    });

    console.log('✅ User group deleted successfully');
    return true;
  } catch (err) {
    console.error('❌ Error in deleteUserGroup:', err);
    throw err;
  }
}

module.exports = {
  createUserGroup,
  getAllUserGroups,
  getUserGroupById,
  updateUserGroup,
  deleteUserGroup
};