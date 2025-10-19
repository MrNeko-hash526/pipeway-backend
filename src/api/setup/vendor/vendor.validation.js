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
  if (!isEmail(body.email)) errors.push('email is invalid');
  if (body.confirmEmail && body.confirmEmail !== body.email) {
    errors.push('confirmEmail does not match email');
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

  if (errors.length) return res.status(400).json({ errors });
  return next();
}

// Validate update — allow partial, but validate provided fields
async function validateUpdateVendor(req, res, next) {
  const body = req.body || {};
  const files = normalizeFiles(req.files);
  const errors = [];

  if (body.email && !isEmail(body.email)) errors.push('email is invalid');
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

  for (const f of files) {
    if (!ALLOWED_MIME_TYPES.includes(f.mimetype)) {
      errors.push(`file "${f.originalname || f.filename}" has unsupported type ${f.mimetype}`);
    }
    if (f.size > FILE_MAX_BYTES) {
      errors.push(`file "${f.originalname || f.filename}" exceeds max size ${Math.round(FILE_MAX_BYTES/1024/1024)}MB`);
    }
  }

  if (errors.length) return res.status(400).json({ errors });
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
  validateIdParam
};