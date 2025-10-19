const vendorService = require('./vendor.service');

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
    const vendor = await vendorService.createVendor(req.body, req.files);
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

async function listVendors(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const result = await vendorService.listVendors({ page, limit, q: req.query.q });
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getVendor(req, res) {
  try {
    const v = await vendorService.getVendorById(req.params.id);
    if (!v) return res.status(404).json({ error: 'Not found' });
    return res.json(v);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateVendor(req, res) {
  try {
    const vendor = await vendorService.updateVendor(req.params.id, req.body, req.files);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    res.json({
      success: true,
      data: vendor,
      message: 'Vendor updated successfully'
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
    const ok = await vendorService.deleteVendor(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createVendor,
  listVendors,
  getVendor,
  updateVendor,
  deleteVendor
};