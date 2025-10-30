const schema = process.env.DB_SCHEMA || process.env.DB_NAME || '';

function withSchema(tableName) {
  if (!schema) return tableName;
  // for MySQL/Postgres using schema-qualified names
  return `${schema}.${tableName}`;
}

const tables = {
  main: withSchema(process.env.RRM_TABLE || 'risk_management'),
  criteria: withSchema(process.env.RRM_CRITERIA_TABLE || 'rrm_criteria'),
  levels: withSchema(process.env.RRM_LEVELS_TABLE || 'rrm_levels')
};

const columns = {
  deleted: process.env.RRM_DELETED_COL || 'deleted',
  option: process.env.RRM_OPTION_COL || 'rrm_option'
};

module.exports = { tables, columns };