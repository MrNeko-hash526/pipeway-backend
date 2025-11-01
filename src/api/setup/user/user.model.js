const { sequelize, Sequelize } = require('../../../../config/config');
const { tables, columns, fieldMapping, enums } = require('./tableConfig');

class UserModel {
  constructor() {
    this.tableName = tables.main;
    this.columns = columns;
    this.enums = enums;
  }

  // Map API fields to database fields
  mapApiToDb(apiData) {
    const dbData = {};
    
    // Direct snake_case mapping - no conversion needed
    const fieldMap = {
      userType: 'user_type',
      organizationId: 'organization_id', 
      companyName: 'company_name',
      userRole: 'user_role',
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      status: 'status'
    };
    
    Object.entries(fieldMap).forEach(([apiField, dbField]) => {
      if (apiData[apiField] !== undefined && apiData[apiField] !== null && apiData[apiField] !== '') {
        dbData[dbField] = apiData[apiField];
      }
    });
    
    console.log('🔄 Mapped API to DB:', { apiData, dbData });
    return dbData;
  }

  // Keep database response in snake_case (like risk management)
  mapDbToApi(dbData) {
    if (!dbData) return null;
    
    // Return snake_case fields as-is (consistent with risk management)
    return {
      id: dbData.id,
      user_type: dbData.user_type,
      organization_id: dbData.organization_id,
      company_name: dbData.company_name,
      user_role: dbData.user_role,
      first_name: dbData.first_name,
      last_name: dbData.last_name,
      email: dbData.email,
      status: dbData.status,
      created_at: dbData.created_at,
      updated_at: dbData.updated_at,
      // Keep computed fields
      organization_display: dbData.organization_display,
      full_name: dbData.full_name
    };
  }

  // Validate business rules
  validateBusinessRules(data) {
    const errors = [];
    
    if (data.user_type === 'Organization') {
      if (!data.organization_id) {
        errors.push('Organization users must have an organization_id');
      }
      if (data.company_name) {
        errors.push('Organization users cannot have a company_name');
      }
    }
    
    if (data.user_type === 'Company') {
      if (!data.company_name) {
        errors.push('Company users must have a company_name');
      }
      if (data.organization_id) {
        errors.push('Company users cannot have an organization_id');
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Business rule validation failed: ${errors.join(', ')}`);
    }
  }

  // Build dynamic WHERE clause
  buildWhereClause(filters = {}) {
    const conditions = [];
    const replacements = [];
    
    // Search across multiple fields
    if (filters.search && filters.search.trim()) {
      conditions.push(`(${this.columns.firstName} LIKE ? OR ${this.columns.lastName} LIKE ? OR ${this.columns.email} LIKE ? OR ${this.columns.companyName} LIKE ?)`);
      const searchTerm = `%${filters.search.trim()}%`;
      replacements.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Use snake_case for API filters
    if (filters.status && filters.status !== 'All' && filters.status.trim() !== '') {
      conditions.push(`${this.columns.status} = ?`);
      replacements.push(filters.status.trim());
    }
    
    if (filters.userType && filters.userType !== 'All' && filters.userType.trim() !== '') {
      conditions.push(`${this.columns.userType} = ?`);
      replacements.push(filters.userType.trim());
    }
    
    if (filters.userRole && filters.userRole !== 'All' && filters.userRole.trim() !== '') {
      conditions.push(`${this.columns.userRole} = ?`);
      replacements.push(filters.userRole.trim());
    }
    
    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      replacements
    };
  }

  // Get field list for SELECT queries
  getSelectFields() {
    return Object.values(this.columns).join(', ');
  }
}

module.exports = UserModel;