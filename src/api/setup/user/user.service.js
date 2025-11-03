const { Sequelize, sequelize } = require('../../../../config/config');

const mapInputToDb = (data) => {
  const mapped = {};
  if (data.firstName !== undefined) mapped.first_name = data.firstName || '';
  if (data.lastName !== undefined) mapped.last_name = data.lastName || '';
  if (data.email !== undefined) mapped.email = data.email || '';
  if (data.userType !== undefined) mapped.user_type = data.userType || 'Organization';
  if (data.organizationId !== undefined) mapped.organization_id = data.organizationId || null;
  if (data.companyName !== undefined) mapped.company_name = data.companyName || '';
  if (data.userRole !== undefined) mapped.user_role = data.userRole || '';
  if (data.status !== undefined) mapped.status = data.status || 'Active';
  return mapped;
};

class UserService {
  constructor() {
    this.tableName = 'user_setup';
  }

  async createUser(data) {
    console.log('📝 createUser - data:', data);
    
    try {
      // Map camelCase input to snake_case database columns
      const mappedData = {
        first_name: data.firstName || '',
        last_name: data.lastName || '',
        email: data.email || '',
        user_type: data.userType || 'Organization',
        organization_id: data.organizationId || null,
        company_name: data.companyName || '',
        user_role: data.userRole || '',
        status: data.status || 'Active'
      };

      // Handle database constraints for user_type
      if (mappedData.user_type === 'Organization') {
        if (!mappedData.organization_id) {
          throw new Error('Organization users must have an organization_id');
        }
        // Set company_name to NULL for Organization users (database constraint)
        mappedData.company_name = null;
      } else if (mappedData.user_type === 'Company') {
        if (!mappedData.company_name) {
          throw new Error('Company users must have a company_name');
        }
        // Set organization_id to NULL for Company users (database constraint)
        mappedData.organization_id = null;
      }

      // Check if email already exists globally (since DB has unique constraint)
      await this.validateEmailUniqueness(mappedData.email);

      const sql = `
        INSERT INTO ${this.tableName} 
        (first_name, last_name, email, user_type, organization_id, company_name, user_role, status, deleted, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
      `;

      const result = await sequelize.query(sql, {
        replacements: [
          mappedData.first_name,
          mappedData.last_name,
          mappedData.email,
          mappedData.user_type,
          mappedData.organization_id,
          mappedData.company_name,
          mappedData.user_role,
          mappedData.status
        ],
        type: Sequelize.QueryTypes.INSERT
      });

      const insertedId = result[0];
      console.log('✅ User created with ID:', insertedId);

      return await this.getUserById(insertedId);
    } catch (err) {
      console.error('❌ Error in createUser:', err);
      
      // Handle Sequelize unique constraint errors
      if (err.name === 'SequelizeUniqueConstraintError') {
        const emailError = err.errors.find(e => e.path === 'email');
        if (emailError) {
          throw new Error(`Email '${emailError.value}' is already registered in the system`);
        }
      }
      
      throw err;
    }
  }

  async validateEmailUniqueness(email, excludeUserId = null) {
    console.log('🔍 validateEmailUniqueness - email:', email, 'excludeId:', excludeUserId);
    
    try {
      let whereClause = 'WHERE email = ? AND deleted = 0';
      const replacements = [email];

      // Exclude current user for updates
      if (excludeUserId) {
        whereClause += ' AND id != ?';
        replacements.push(excludeUserId);
      }

      const sql = `SELECT id, email, user_type, organization_id, company_name FROM ${this.tableName} ${whereClause}`;
      
      console.log('🔍 Email check SQL:', sql);
      console.log('🔍 Email check replacements:', replacements);

      const existingUsers = await sequelize.query(sql, {
        replacements,
        type: Sequelize.QueryTypes.SELECT
      });

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        let context = '';
        
        if (existingUser.user_type === 'Organization') {
          context = `organization (ID: ${existingUser.organization_id})`;
        } else if (existingUser.user_type === 'Company') {
          context = `company (${existingUser.company_name})`;
        } else {
          context = 'the system';
        }
        
        throw new Error(`Email '${email}' is already registered in ${context}`);
      }

      console.log('✅ Email is unique');
    } catch (err) {
      console.error('❌ Error in validateEmailUniqueness:', err);
      throw err;
    }
  }

  async getAllUsers({ page = 1, limit = 50, search = '', status = '', userType = '', userRole = '', includeDeleted = false }) {
    console.log('📋 getAllUsers - page:', page, 'limit:', limit, 'search:', search, 'status:', status, 'userType:', userType, 'userRole:', userRole, 'includeDeleted:', includeDeleted);
    
    const offset = (page - 1) * limit;
    let where = [];
    const replacements = [];

    if (!includeDeleted) {
      where.push('deleted = 0');
    }

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
      const sql = `
        SELECT 
          u.*,
          CASE 
            WHEN u.user_type = 'Organization' THEN CONCAT('Org ID: ', COALESCE(u.organization_id, 'N/A'))
            ELSE COALESCE(u.company_name, 'N/A') 
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
      return { 
        data: rows, 
        pagination: { 
          total, 
          page, 
          limit,
          totalPages: Math.ceil(total / limit)
        },
        success: true 
      };
    } catch (err) {
      console.error('❌ Error in getAllUsers:', err);
      throw err;
    }
  }

  async getUserById(id, includeDeleted = false) {
    console.log('🔍 getUserById - ID:', id, 'includeDeleted:', includeDeleted);
    
    try {
      const whereClause = includeDeleted ? 'WHERE u.id = ?' : 'WHERE u.id = ? AND u.deleted = 0';
      const sql = `
        SELECT 
          u.*,
          CASE 
            WHEN u.user_type = 'Organization' THEN CONCAT('Org ID: ', COALESCE(u.organization_id, 'N/A'))
            ELSE COALESCE(u.company_name, 'N/A') 
          END as organization_display
        FROM user_setup u
        ${whereClause}
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
      throw err;
    }
  }

  async updateUser(id, data = {}) {
    console.log('📝 updateUser - ID:', id);
    console.log('📝 Data:', data);
    
    const t = await sequelize.transaction();
    try {
      const mapped = mapInputToDb(data);
      
      if (Object.keys(mapped).length === 0) {
        throw new Error('No valid fields to update');
      }

      // Get current user data for context
      const currentUser = await this.getUserById(id);
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Handle database constraints for user_type
      if (mapped.user_type) {
        if (mapped.user_type === 'Organization') {
          if (!mapped.organization_id) {
            throw new Error('Organization users must have an organization_id');
          }
          mapped.company_name = null;
        } else if (mapped.user_type === 'Company') {
          if (!mapped.company_name) {
            throw new Error('Company users must have a company_name');
          }
          mapped.organization_id = null;
        }
      }

      // Check email uniqueness if email is being updated
      if (mapped.email && mapped.email !== currentUser.email) {
        await this.validateEmailUniqueness(mapped.email, id);
      }

      const sets = Object.keys(mapped).map(k => `${k} = ?`).join(', ');
      const sql = `UPDATE user_setup SET ${sets}, updated_at = NOW() WHERE id = ? AND deleted = 0`;
      
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
      return await this.getUserById(id);
    } catch (err) {
      console.error('❌ Error in updateUser:', err);
      await t.rollback();
      
      // Handle Sequelize unique constraint errors
      if (err.name === 'SequelizeUniqueConstraintError') {
        const emailError = err.errors.find(e => e.path === 'email');
        if (emailError) {
          throw new Error(`Email '${emailError.value}' is already registered in the system`);
        }
      }
      
      throw err;
    }
  }

  async deleteUser(id) {
    console.log('🗑️ deleteUser - ID:', id);
    
    try {
      const sql = `UPDATE user_setup SET deleted = 1, updated_at = NOW() WHERE id = ? AND deleted = 0`;
      
      const [affectedRows] = await sequelize.query(sql, {
        replacements: [id],
        type: Sequelize.QueryTypes.UPDATE
      });
      
      if (affectedRows === 0) {
        console.log('⚠️ No user found to delete with ID:', id);
        return false;
      }
      
      console.log('✅ User soft deleted');
      return true;
    } catch (err) {
      console.error('❌ Error in deleteUser:', err);
      throw err;
    }
  }
}

module.exports = { UserService };