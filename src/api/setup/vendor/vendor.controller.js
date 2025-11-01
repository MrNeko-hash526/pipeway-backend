const vendorService = require('./vendor.service');
const { validationResult } = require('express-validator');

/** helper to normalize multer files -> attachment objects */
function mapFilesToAttachments(files) {
  if (!files) return [];
  const fileArray = Array.isArray(files) ? files : Object.values(files).flat();
  return fileArray.map(f => ({
    filename: f.originalname || f.filename,
    url: f.path || f.location || null,
    mime_type: f.mimetype,
    size: f.size
  }));
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