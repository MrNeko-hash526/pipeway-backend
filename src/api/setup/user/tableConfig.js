const schema = process.env.DB_SCHEMA || process.env.DB_NAME || '';

function withSchema(tableName) {
  if (!schema) return tableName;
  // for MySQL/Postgres using schema-qualified names
  return `${schema}.${tableName}`;
}

const tables = {
  main: withSchema(process.env.USER_SETUP_TABLE || 'user_setup')
};

const columns = {
  // Core identity fields
  id: process.env.USER_ID_COL || 'id',
  userType: process.env.USER_TYPE_COL || 'user_type',
  organizationId: process.env.USER_ORG_ID_COL || 'organization_id',
  companyName: process.env.USER_COMPANY_COL || 'company_name',
  userRole: process.env.USER_ROLE_COL || 'user_role',
  
  // Personal info fields
  firstName: process.env.USER_FNAME_COL || 'first_name',
  lastName: process.env.USER_LNAME_COL || 'last_name',
  email: process.env.USER_EMAIL_COL || 'email',
  
  // Status and timestamps
  status: process.env.USER_STATUS_COL || 'status',
  createdAt: process.env.USER_CREATED_COL || 'created_at',
  updatedAt: process.env.USER_UPDATED_COL || 'updated_at'
};

// Field mappings for API flexibility (camelCase to snake_case)
const fieldMapping = {
  userType: columns.userType,
  organizationId: columns.organizationId,
  companyName: columns.companyName,
  userRole: columns.userRole,
  firstName: columns.firstName,
  lastName: columns.lastName,
  email: columns.email,
  status: columns.status,
  // Add id mapping too
  id: columns.id,
  createdAt: columns.createdAt,
  updatedAt: columns.updatedAt
};

// Enum values (can be overridden via environment)
const enums = {
  userTypes: (process.env.USER_TYPES || 'Organization,Company').split(','),
  userRoles: (process.env.USER_ROLES || 'Admin,Auditor,Manager,Viewer').split(','),
  statuses: (process.env.USER_STATUSES || 'Active,Pending,Inactive').split(',')
};

module.exports = { 
  tables, 
  columns, 
  fieldMapping, 
  enums 
};