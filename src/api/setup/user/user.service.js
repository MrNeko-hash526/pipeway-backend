const { sequelize, Sequelize } = require('../../../../config/config');
const UserModel = require('./user.model');
const { tables, columns } = require('./tableConfig');

class UserService {
  constructor() {
    this.userModel = new UserModel();
    this.tableName = tables.main;
    this.columns = columns;
  }

  async createUser(apiData = {}) {
    console.log('📝 UserService.createUser called');
    console.log('📊 Input data:', JSON.stringify(apiData, null, 2));
    
    const transaction = await sequelize.transaction();
    
    try {
      // Map API data to database format
      const dbData = this.userModel.mapApiToDb(apiData);
      
      if (Object.keys(dbData).length === 0) {
        throw new Error('No valid fields provided for user creation');
      }
      
      // Validate business rules
      this.userModel.validateBusinessRules(dbData);
      
      // Build insert query
      const fields = Object.keys(dbData);
      const placeholders = fields.map(() => '?');
      const values = Object.values(dbData);
      
      const sql = `
        INSERT INTO ${this.tableName} 
        (${fields.join(', ')}, ${this.columns.createdAt}, ${this.columns.updatedAt}) 
        VALUES (${placeholders.join(', ')}, NOW(), NOW())
      `;
      
      console.log('🔍 SQL:', sql);
      console.log('🔍 Values:', values);
      
      const [result] = await sequelize.query(sql, {
        replacements: values,
        type: Sequelize.QueryTypes.INSERT,
        transaction
      });
      
      await transaction.commit();
      console.log('✅ User created with ID:', result);
      
      // Return created user
      return await this.getUserById(result);
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating user:', error.message);
      throw error;
    }
  }

  async getAllUsers(filters = {}) {
    console.log('📋 UserService.getAllUsers');
    console.log('📊 Filters:', filters);
    
    try {
      const { page = 1, limit = 50 } = filters;
      const offset = (page - 1) * limit;
      
      // Build WHERE clause
      const { whereClause, replacements } = this.userModel.buildWhereClause(filters);
      
      // Main query with enhanced display
      const sql = `
        SELECT 
          ${this.userModel.getSelectFields()},
          CASE 
            WHEN ${this.columns.userType} = 'Organization' THEN CONCAT('Org ID: ', COALESCE(${this.columns.organizationId}, 'N/A'))
            ELSE COALESCE(${this.columns.companyName}, 'N/A')
          END as organization_display,
          CONCAT(${this.columns.firstName}, ' ', ${this.columns.lastName}) as full_name
        FROM ${this.tableName}
        ${whereClause}
        ORDER BY ${this.columns.createdAt} DESC
        LIMIT ? OFFSET ?
      `;
      
      console.log('🔍 Query SQL:', sql);
      console.log('🔍 Replacements:', [...replacements, limit, offset]);
      
      const rows = await sequelize.query(sql, {
        replacements: [...replacements, limit, offset],
        type: Sequelize.QueryTypes.SELECT
      });
      
      // Count query
      const countSql = `
        SELECT COUNT(*) as total 
        FROM ${this.tableName} 
        ${whereClause}
      `;
      
      const [{ total }] = await sequelize.query(countSql, {
        replacements,
        type: Sequelize.QueryTypes.SELECT
      });
      
      // Map database results to API format
      const mappedRows = rows.map(row => this.userModel.mapDbToApi(row));
      
      console.log('✅ Found', mappedRows.length, 'users (total:', total, ')');
      
      return {
        rows: mappedRows,
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      throw error;
    }
  }

  async getUserById(id) {
    console.log('🔍 UserService.getUserById - ID:', id);
    
    try {
      const sql = `
        SELECT 
          ${this.userModel.getSelectFields()},
          CASE 
            WHEN ${this.columns.userType} = 'Organization' THEN CONCAT('Org ID: ', COALESCE(${this.columns.organizationId}, 'N/A'))
            ELSE COALESCE(${this.columns.companyName}, 'N/A')
          END as organization_display,
          CONCAT(${this.columns.firstName}, ' ', ${this.columns.lastName}) as full_name
        FROM ${this.tableName}
        WHERE ${this.columns.id} = ?
      `;
      
      const [user] = await sequelize.query(sql, {
        replacements: [id],
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (!user) {
        console.log('⚠️ User not found with ID:', id);
        return null;
      }
      
      console.log('✅ User found:', user[this.columns.email]);
      return this.userModel.mapDbToApi(user);
      
    } catch (error) {
      console.error('❌ Error getting user by ID:', error);
      throw error;
    }
  }

  async updateUser(id, apiData = {}) {
    console.log('📝 UserService.updateUser - ID:', id);
    console.log('📊 Update data:', apiData);
    
    const transaction = await sequelize.transaction();
    
    try {
      // Check if user exists
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }
      
      // Map API data to database format
      const dbData = this.userModel.mapApiToDb(apiData);
      
      if (Object.keys(dbData).length === 0) {
        throw new Error('No valid fields provided for update');
      }
      
      // Validate business rules with merged data
      const mergedData = { ...existingUser, ...dbData };
      this.userModel.validateBusinessRules(this.userModel.mapApiToDb(mergedData));
      
      // Build update query
      const setClause = Object.keys(dbData).map(field => `${field} = ?`).join(', ');
      const values = [...Object.values(dbData), id];
      
      const sql = `
        UPDATE ${this.tableName} 
        SET ${setClause}, ${this.columns.updatedAt} = NOW() 
        WHERE ${this.columns.id} = ?
      `;
      
      console.log('🔍 Update SQL:', sql);
      console.log('🔍 Values:', values);
      
      const [affectedRows] = await sequelize.query(sql, {
        replacements: values,
        type: Sequelize.QueryTypes.UPDATE,
        transaction
      });
      
      if (affectedRows === 0) {
        throw new Error('No rows were updated');
      }
      
      await transaction.commit();
      console.log('✅ User updated successfully');
      
      // Return updated user
      return await this.getUserById(id);
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    console.log('🗑️ UserService.deleteUser - ID:', id);
    
    const transaction = await sequelize.transaction();
    
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE ${this.columns.id} = ?`;
      
      const [affectedRows] = await sequelize.query(sql, {
        replacements: [id],
        type: Sequelize.QueryTypes.DELETE,
        transaction
      });
      
      await transaction.commit();
      
      if (affectedRows === 0) {
        console.log('⚠️ User not found with ID:', id);
        return false;
      }
      
      console.log('✅ User deleted successfully');
      return true;
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = UserService;