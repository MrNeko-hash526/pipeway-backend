const timestampColumns = () => {
  return 'created_at, updated_at';
};

const timestampValues = () => {
  return 'NOW(), NOW()';
};

const updateTimestamp = () => {
  return 'updated_at = NOW()';
};

module.exports = { timestampColumns, timestampValues, updateTimestamp };