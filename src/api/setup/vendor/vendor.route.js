const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const vendorService = require('./vendor.service');

// Configure multer for file uploads
const uploadsDir = path.resolve(__dirname, '../../../../uploads/vendor');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory:', uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `vendor-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type: ' + file.mimetype));
    }
  }
});

// GET /api/setup/vendor - list all vendors
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/setup/vendor - Query params:', req.query);
    const { page = 1, limit = 50, search = '', status = '' } = req.query;
    const result = await vendorService.getAllVendors({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: String(search),
      status: String(status)
    });
    console.log(`✅ Returning ${result.rows.length} vendors (total: ${result.total})`);
    res.json(result);
  } catch (err) {
    console.error('❌ GET /api/setup/vendor error:', err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

// GET /api/setup/vendor/:id - get single vendor with attachments
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    console.log('🔍 GET /api/setup/vendor/:id - ID:', id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid vendor ID' });
    }
    
    const vendor = await vendorService.getVendorById(id);
    if (!vendor) {
      console.log('⚠️ Vendor not found:', id);
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    console.log('✅ Returning vendor:', id, 'with', vendor.attachments?.length || 0, 'attachments');
    res.json(vendor);
  } catch (err) {
    console.error('❌ GET /api/setup/vendor/:id error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

// POST /api/setup/vendor - create new vendor with attachments
router.post('/', upload.array('attachments', 5), async (req, res) => {
  try {
    console.log('📝 POST /api/setup/vendor - Body:', req.body);
    console.log('📎 Files received:', req.files?.length || 0);
    
    const data = req.body;
    const attachments = (req.files || []).map(f => {
      console.log('📎 Processing file:', f.originalname, '->', f.filename);
      return {
        filename: f.filename,
        original_name: f.originalname,
        file_path: `uploads/vendor/${f.filename}`,
        file_size: f.size,
        mime_type: f.mimetype
      };
    });

    console.log('📎 Attachments to save:', attachments);

    const vendor = await vendorService.createVendor(data, attachments);
    console.log('✅ Vendor created:', vendor.id);
    res.status(201).json(vendor);
  } catch (err) {
    console.error('❌ POST /api/setup/vendor error:', err);
    console.error('Stack:', err.stack);
    res.status(400).json({ error: err.message || 'create failed' });
  }
});

// PUT /api/setup/vendor/:id - update vendor
router.put('/:id', upload.array('attachments', 5), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    console.log('📝 PUT /api/setup/vendor/:id - ID:', id);
    console.log('📝 Body:', req.body);
    console.log('📎 Files received:', req.files?.length || 0);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid vendor ID' });
    }
    
    const data = req.body;
    const attachments = (req.files || []).map(f => ({
      filename: f.filename,
      original_name: f.originalname,
      file_path: `uploads/vendor/${f.filename}`,
      file_size: f.size,
      mime_type: f.mimetype
    }));

    const vendor = await vendorService.updateVendor(id, data, attachments);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    console.log('✅ Vendor updated:', id);
    res.json(vendor);
  } catch (err) {
    console.error('❌ PUT /api/setup/vendor/:id error:', err);
    console.error('Stack:', err.stack);
    res.status(400).json({ error: err.message || 'update failed' });
  }
});

// DELETE /api/setup/vendor/:id - delete vendor and attachments
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    console.log('🗑️ DELETE /api/setup/vendor/:id - ID:', id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid vendor ID' });
    }
    
    const deleted = await vendorService.deleteVendor(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    console.log('✅ Vendor deleted:', id);
    res.status(204).send();
  } catch (err) {
    console.error('❌ DELETE /api/setup/vendor/:id error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: err.message || 'delete failed' });
  }
});

module.exports = router;