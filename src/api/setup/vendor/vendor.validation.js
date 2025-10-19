const { sequelize, Sequelize } = require('../../../../config/config');

const FILE_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

function normalizeFiles(files) {
  if (!files) return [];
  return Array.isArray(files) ? files : Object.values(files).flat();
}

function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function pushIf(cond, arr, msg) {
  if (cond) arr.push(msg);
}

// Check for duplicate email
async function checkDuplicateEmail(email, excludeId = null) {
  try {
    const whereClause = excludeId ? 'WHERE email = ? AND id != ?' : 'WHERE email = ?';
    const replacements = excludeId ? [email, excludeId] : [email];
    
    const result = await sequelize.query(
      `SELECT COUNT(*) as count FROM vendor_setup ${whereClause}`,
      { replacements, type: Sequelize.QueryTypes.SELECT }
    );
    
    return result[0]?.count > 0;
  } catch (error) {
    console.error('Error checking duplicate email:', error);
    return false;
  }
}

// Check for duplicate phone number
async function checkDuplicatePhone(phoneCountryCode, workPhone, excludeId = null) {
  try {
    const whereClause = excludeId ? 
      'WHERE phone_country_code = ? AND work_phone = ? AND id != ?' : 
      'WHERE phone_country_code = ? AND work_phone = ?';
    const replacements = excludeId ? 
      [phoneCountryCode, workPhone, excludeId] : 
      [phoneCountryCode, workPhone];
    
    const result = await sequelize.query(
      `SELECT COUNT(*) as count FROM vendor_setup ${whereClause}`,
      { replacements, type: Sequelize.QueryTypes.SELECT }
    );
    
    return result[0]?.count > 0;
  } catch (error) {
    console.error('Error checking duplicate phone:', error);
    return false;
  }
}

// Validate create — required fields enforced
async function validateCreateVendor(req, res, next) {
  const body = req.body || {};
  const files = normalizeFiles(req.files);

  const errors = [];

  // required strings
  const required = [
    'organizationName', 'address1', 'country', 'state',
    'contactFirst', 'contactLast', 'phoneCountryCode',
    'workPhone', 'email', 'category', 'type'
  ];
  required.forEach(k => pushIf(!body[k] || String(body[k]).trim() === '', errors, `${k} is required`));

  // enums
  const allowedTypes = ['Vendor', 'Partner', 'Customer'];
  if (body.type && !allowedTypes.includes(body.type)) {
    errors.push(`type must be one of ${allowedTypes.join(', ')}`);
  }
  const allowedRisk = ['Low', 'Medium', 'High'];
  if (body.riskLevel && !allowedRisk.includes(body.riskLevel)) {
    errors.push(`riskLevel must be one of ${allowedRisk.join(', ')}`);
  }

  // organization code length
  if (body.organizationCode && String(body.organizationCode).length > 20) {
    errors.push('organizationCode must be at most 20 characters');
  }

  // email + confirmEmail check
  if (!isEmail(body.email)) {
    errors.push('email is invalid');
  } else {
    // Check for duplicate email
    const emailExists = await checkDuplicateEmail(body.email);
    if (emailExists) {
      errors.push('email already exists in the system');
    }
  }
  
  if (body.confirmEmail && body.confirmEmail !== body.email) {
    errors.push('confirmEmail does not match email');
  }

  // Check for duplicate phone number
  if (body.phoneCountryCode && body.workPhone) {
    const phoneExists = await checkDuplicatePhone(body.phoneCountryCode, body.workPhone);
    if (phoneExists) {
      errors.push('phone number already exists in the system');
    }
  }

  // attachments (from multer)
  for (const f of files) {
    if (!ALLOWED_MIME_TYPES.includes(f.mimetype)) {
      errors.push(`file "${f.originalname || f.filename}" has unsupported type ${f.mimetype}`);
    }
    if (f.size > FILE_MAX_BYTES) {
      errors.push(`file "${f.originalname || f.filename}" exceeds max size ${Math.round(FILE_MAX_BYTES/1024/1024)}MB`);
    }
  }

  if (errors.length) return res.status(400).json({ success: false, errors });
  return next();
}

// Validate update — allow partial, but validate provided fields
async function validateUpdateVendor(req, res, next) {
  const body = req.body || {};
  const files = normalizeFiles(req.files);
  const errors = [];
  const vendorId = req.params?.id;

  if (body.email && !isEmail(body.email)) {
    errors.push('email is invalid');
  } else if (body.email) {
    // Check for duplicate email (excluding current vendor)
    const emailExists = await checkDuplicateEmail(body.email, vendorId);
    if (emailExists) {
      errors.push('email already exists in the system');
    }
  }

  if (body.organizationCode && String(body.organizationCode).length > 20) {
    errors.push('organizationCode must be at most 20 characters');
  }

  if (body.type) {
    const allowedTypes = ['Vendor', 'Partner', 'Customer'];
    if (!allowedTypes.includes(body.type)) errors.push(`type must be one of ${allowedTypes.join(', ')}`);
  }

  if (body.riskLevel) {
    const allowedRisk = ['Low', 'Medium', 'High'];
    if (!allowedRisk.includes(body.riskLevel)) errors.push(`riskLevel must be one of ${allowedRisk.join(', ')}`);
  }

  // Check for duplicate phone number (excluding current vendor)
  if (body.phoneCountryCode && body.workPhone) {
    const phoneExists = await checkDuplicatePhone(body.phoneCountryCode, body.workPhone, vendorId);
    if (phoneExists) {
      errors.push('phone number already exists in the system');
    }
  }

  for (const f of files) {
    if (!ALLOWED_MIME_TYPES.includes(f.mimetype)) {
      errors.push(`file "${f.originalname || f.filename}" has unsupported type ${f.mimetype}`);
    }
    if (f.size > FILE_MAX_BYTES) {
      errors.push(`file "${f.originalname || f.filename}" exceeds max size ${Math.round(FILE_MAX_BYTES/1024/1024)}MB`);
    }
  }

  if (errors.length) return res.status(400).json({ success: false, errors });
  return next();
}

// Validate numeric id param
function validateIdParam(req, res, next) {
  const id = req.params && req.params.id;
  if (!id || !/^\d+$/.test(String(id))) {
    return res.status(400).json({ errors: ['id param is required and must be a number'] });
  }
  return next();
}

module.exports = {
  validateCreateVendor,
  validateUpdateVendor,
  validateIdParam,
  checkDuplicateEmail,
  checkDuplicatePhone
};