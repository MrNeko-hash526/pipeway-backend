const vendorService = require('./vendor.service');
const { validationResult } = require('express-validator');
const path = require('path');

/** helper to normalize multer files -> attachment objects */
function mapFilesToAttachments(files) {
  if (!files) return [];
  const fileArray = Array.isArray(files) ? files : Object.values(files).flat();
  // log full multer info to debug where files were written
  console.log('uploaded files (multer):', fileArray.map(f => ({ originalname: f.originalname, destination: f.destination, path: f.path, filename: f.filename })));
 
  return fileArray.map(f => {
    // multers saved filename is f.filename (the disk name); original file name is f.originalname
    const savedName = f.filename || (f.path ? path.basename(f.path) : null)
    // keep relative path matching how we serve /uploads -> uploads/<folder>/<file>
    // assume multer destination is something like <project>/uploads/vendor
    const relativePath = savedName ? `uploads/vendor/${savedName}` : (f.path ? path.relative(process.cwd(), f.path).replace(/\\/g,'/') : null)
    return {
      filename: savedName || f.originalname || null,
      original_name: f.originalname || null,
      file_path: relativePath,
      file_size: f.size || 0,
      mime_type: f.mimetype || null,
      uploaded_at: new Date().toISOString(),
      // frontend convenience URL (leading slash)
      url: relativePath ? `/${relativePath.replace(/^\/+/, '')}` : null
    }
  })
}

// when creating/updating vendor, normalize attachments before storing
// assume incoming attachments may be JSON string or array from frontend
function normalizeAttachmentsInput(raw) {
  let arr = []
  try {
    if (!raw) return []
    if (typeof raw === 'string') {
      arr = JSON.parse(raw)
    } else if (Array.isArray(raw)) {
      arr = raw
    } else if (raw && typeof raw === 'object') {
      arr = [raw]
    }
  } catch (e) {
    arr = []
  }
  return arr.map((it) => {
    const file_path = (it.file_path || it.path || it.filePath || '').replace(/^\/+/, '')
    return {
      filename: it.filename || it.file_name || it.name || path.basename(file_path),
      original_name: it.original_name || it.originalname || it.name || null,
      file_path: file_path ? `uploads/${file_path}`.replace(/\/+/g, '/') : file_path,
      file_size: it.file_size || it.size || 0,
      mime_type: it.mime_type || it.mimetype || null,
      uploaded_at: it.uploaded_at || new Date().toISOString(),
      // add url for frontend convenience (leading slash so '/uploads/...' resolves)
      url: file_path ? `/${file_path}` : null
    }
  })
}

async function createVendor(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const attachments = mapFilesToAttachments(req.files);
    const vendor = await vendorService.createVendor(req.body, attachments);
    res.status(201).json({
      success: true,
      data: vendor,
      message: 'Vendor created successfully'
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    
    // Check if it's a validation error
    if (error.message && (
      error.message.includes('email already exists') || 
      error.message.includes('phone number already exists')
    )) {
      return res.status(400).json({
        success: false,
        errors: [error.message]
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create vendor'
    });
  }
}

async function getAllVendors(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      search: req.query.search || '',
      status: req.query.status || '',
      includeDeleted: req.query.includeDeleted === 'true'
    };

    console.log('📊 Vendor filters:', filters);

    const result = await vendorService.getAllVendors(filters);
    console.log(`✅ Found ${result.rows.length} vendors (total: ${result.total})`);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (err) {
    console.error('❌ Error fetching vendors:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors',
      message: err.message
    });
  }
}

async function getVendorById(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const includeDeleted = req.query.includeDeleted === 'true';
    console.log('📊 Vendor ID:', id, 'includeDeleted:', includeDeleted);

    const vendor = await vendorService.getVendorById(id, includeDeleted);
    
    if (!vendor) {
      console.log('⚠️ Vendor not found');
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Attachments normalization
    let attachments = vendor.attachments || vendor.attachments_json || null
    // normalize stored value (may already be JSON string or array)
    attachments = normalizeAttachmentsInput(attachments)
    // ensure url field present
    attachments = attachments.map(a => ({
      ...a,
      url: a.url || (a.file_path ? `/${a.file_path.replace(/^\/+/, '')}` : null)
    }))
    vendor.attachments = attachments

    console.log('✅ Vendor found:', vendor.organization_name);
    res.json({
      success: true,
      data: vendor
    });
  } catch (err) {
    console.error('❌ Error fetching vendor:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor',
      message: err.message
    });
  }
}

async function updateVendor(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    console.log('📊 Vendor ID:', id);
    console.log('📊 Update data:', req.body);

    const attachments = mapFilesToAttachments(req.files);
    const vendor = await vendorService.updateVendor(id, req.body, attachments);
    
    if (!vendor) {
      console.log('⚠️ Vendor not found');
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    console.log('✅ Vendor updated successfully:', vendor.organization_name);
    res.json({
      success: true,
      message: 'Vendor updated successfully',
      data: vendor
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    
    // Check if it's a validation error
    if (error.message && (
      error.message.includes('email already exists') || 
      error.message.includes('phone number already exists')
    )) {
      return res.status(400).json({
        success: false,
        errors: [error.message]
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update vendor'
    });
  }
}

async function deleteVendor(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    console.log('📊 Vendor ID:', id);

    const success = await vendorService.deleteVendor(id);
    
    if (!success) {
      console.log('⚠️ Vendor not found');
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    console.log('✅ Vendor deleted successfully');
    res.json({
      success: true,
      message: 'Vendor deleted successfully (soft delete)'
    });
  } catch (err) {
    console.error('❌ Error deleting vendor:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete vendor',
      message: err.message
    });
  }
}

async function restoreVendor(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    console.log('📊 Vendor ID:', id);

    const success = await vendorService.restoreVendor(id);
    
    if (!success) {
      console.log('⚠️ Vendor not found or not deleted');
      return res.status(404).json({
        success: false,
        error: 'Vendor not found or not deleted'
      });
    }

    console.log('✅ Vendor restored successfully');
    res.json({
      success: true,
      message: 'Vendor restored successfully'
    });
  } catch (err) {
    console.error('❌ Error restoring vendor:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to restore vendor',
      message: err.message
    });
  }
}

async function permanentDeleteVendor(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    console.log('📊 Vendor ID:', id);

    const success = await vendorService.permanentDeleteVendor(id);
    
    if (!success) {
      console.log('⚠️ Vendor not found');
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    console.log('✅ Vendor permanently deleted');
    res.json({
      success: true,
      message: 'Vendor permanently deleted'
    });
  } catch (err) {
    console.error('❌ Error permanently deleting vendor:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to permanently delete vendor',
      message: err.message
    });
  }
}

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  restoreVendor,
  permanentDeleteVendor
};