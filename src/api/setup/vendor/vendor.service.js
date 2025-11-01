const { sequelize, Sequelize } = require('../../../../config/config');
const path = require('path');
const fs = require('fs');

function mapInputToDb(data) {
  const mapped = {};
  const fieldMap = {
    organizationName: 'organization_name',
    organizationCode: 'organization_code',
    riskLevel: 'risk_level',
    countryOther: 'country_other',
    stateOther: 'state_other',
    supportNumber: 'support_number',
    contactFirst: 'contact_first',
    contactLast: 'contact_last',
    phoneCountryCode: 'phone_country_code',
    workPhone: 'work_phone',
  };

  console.log('🔍 Raw input data:', data);

  for (const [inputKey, dbKey] of Object.entries(fieldMap)) {
    if (data[inputKey] !== undefined && data[inputKey] !== null && data[inputKey] !== '') {
      mapped[dbKey] = data[inputKey];
    }
  }

  // direct mappings
  ['type','description','address1','address2','address3','country','state','city','zip','website','email','category','status'].forEach(k => {
    if (data[k] !== undefined && data[k] !== null && data[k] !== '') {
      mapped[k] = data[k];
    }
  });

  console.log('🔍 Mapped fields:', mapped);
  return mapped;
}

async function createVendor(data = {}, attachments = []) {
  console.log('📝 createVendor called');
  console.log('📝 Input data:', JSON.stringify(data, null, 2));
  console.log('📎 Attachments:', attachments);
  
  const t = await sequelize.transaction();
  try {
    const mapped = mapInputToDb(data);
    console.log('📊 Mapped data:', mapped);
    
    if (Object.keys(mapped).length === 0) {
      throw new Error('No valid fields to insert - all fields are empty');
    }

    // Prepare attachments JSON
    const attachmentsJson = attachments.map(att => ({
      filename: att.filename,
      original_name: att.original_name,
      file_path: att.file_path,
      file_size: att.file_size,
      mime_type: att.mime_type,
      uploaded_at: new Date().toISOString()
    }));

    const fields = [...Object.keys(mapped), 'attachments'];
    const placeholders = fields.map(() => '?');
    const values = [...Object.values(mapped), JSON.stringify(attachmentsJson)];

    const sql = `INSERT INTO vendor_setup (${fields.join(',')}, deleted, created_at, updated_at) VALUES (${placeholders.join(',')}, 0, NOW(), NOW())`;
    console.log('🔍 SQL:', sql);
    console.log('🔍 Values:', values);
    console.log('📎 Attachments JSON:', JSON.stringify(attachmentsJson, null, 2));

    const [result] = await sequelize.query(sql, { 
      replacements: values, 
      type: Sequelize.QueryTypes.INSERT, 
      transaction: t 
    });

    const vendorId = result;
    console.log('✅ Vendor created with ID:', vendorId);
    console.log(`✅ Saved ${attachments.length} attachments in JSON column`);

    await t.commit();
    console.log('✅ Transaction committed');
    
    return { id: vendorId, ...mapped, attachments: attachmentsJson };
  } catch (err) {
    console.error('❌ Error in createVendor:', err.message);
    console.error('❌ Full error:', err);
    console.error('❌ Stack:', err.stack);
    await t.rollback();
    throw err;
  }
}

async function getAllVendors({ page = 1, limit = 50, search = '', status = '', includeDeleted = false } = {}) {
  console.log('📋 getAllVendors - page:', page, 'limit:', limit, 'search:', search, 'status:', status, 'includeDeleted:', includeDeleted);
  
  const offset = (page - 1) * limit;
  let where = [];
  const replacements = [];

  // Always exclude deleted unless explicitly requested
  if (!includeDeleted) {
    where.push('deleted = 0');
  }

  if (search) {
    where.push('organization_name LIKE ?');
    replacements.push(`%${search}%`);
  }
  if (status && status !== 'All' && status !== '') {
    where.push('status = ?');
    replacements.push(status);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const sql = `SELECT * FROM vendor_setup ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
    console.log('🔍 SQL:', sql);
    console.log('🔍 Replacements:', [...replacements, limit, offset]);

    const rows = await sequelize.query(sql, { 
      replacements: [...replacements, limit, offset], 
      type: Sequelize.QueryTypes.SELECT 
    });

    // Parse JSON attachments
    const parsedRows = rows.map(row => ({
      ...row,
      attachments: row.attachments ? (typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments) : []
    }));

    const countSql = `SELECT COUNT(*) as total FROM vendor_setup ${whereClause}`;
    const countResult = await sequelize.query(countSql, { 
      replacements, 
      type: Sequelize.QueryTypes.SELECT 
    });

    const total = countResult[0]?.total || 0;

    console.log('✅ Found', parsedRows.length, 'vendors (total:', total, ')');
    return { rows: parsedRows, total, page, limit };
  } catch (err) {
    console.error('❌ Error in getAllVendors:', err);
    throw err;
  }
}

async function getVendorById(id, includeDeleted = false) {
  console.log('🔍 getVendorById - ID:', id, 'includeDeleted:', includeDeleted);
  
  try {
    const whereClause = includeDeleted ? 'WHERE id = ?' : 'WHERE id = ? AND deleted = 0';
    const vendorSql = `SELECT * FROM vendor_setup ${whereClause}`;
    console.log('🔍 Vendor SQL:', vendorSql, 'ID:', id);
    
    const vendors = await sequelize.query(vendorSql, {
      replacements: [id], 
      type: Sequelize.QueryTypes.SELECT 
    });

    console.log('🔍 Vendors found:', vendors.length);

    if (!vendors || vendors.length === 0) {
      console.log('⚠️ No vendor found with ID:', id);
      return null;
    }

    const vendor = vendors[0];
    console.log('✅ Vendor found:', vendor.organization_name);

    // Parse attachments JSON
    let attachments = [];
    if (vendor.attachments) {
      try {
        attachments = typeof vendor.attachments === 'string' 
          ? JSON.parse(vendor.attachments) 
          : vendor.attachments;
        
        // Add full URL to each attachment
        attachments = attachments.map(att => ({
          ...att,
          url: `/${att.file_path}`
        }));
      } catch (err) {
        console.error('⚠️ Failed to parse attachments JSON:', err);
        attachments = [];
      }
    }

    console.log(`📎 Found ${attachments.length} attachments in JSON`);

    return { ...vendor, attachments };
  } catch (err) {
    console.error('❌ Error in getVendorById:', err);
    console.error('❌ Stack:', err.stack);
    throw err;
  }
}

async function updateVendor(id, data = {}, newAttachments = []) {
  console.log('📝 updateVendor - ID:', id);
  console.log('📝 Data:', data);
  console.log('📎 New Attachments:', newAttachments);
  
  const t = await sequelize.transaction();
  try {
    // Get existing vendor to preserve existing attachments
    const existing = await getVendorById(id);
    if (!existing) {
      throw new Error('Vendor not found');
    }

    const mapped = mapInputToDb(data);
    
    // Merge existing attachments with new ones
    const existingAttachments = existing.attachments || [];
    const attachmentsToAdd = newAttachments.map(att => ({
      filename: att.filename,
      original_name: att.original_name,
      file_path: att.file_path,
      file_size: att.file_size,
      mime_type: att.mime_type,
      uploaded_at: new Date().toISOString()
    }));
    
    const allAttachments = [...existingAttachments, ...attachmentsToAdd];

    const updates = { ...mapped, attachments: JSON.stringify(allAttachments) };
    const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const sql = `UPDATE vendor_setup SET ${sets}, updated_at = NOW() WHERE id = ? AND deleted = 0`;
    
    console.log('🔍 Update SQL:', sql);
    console.log('🔍 Update values:', [...Object.values(updates), id]);
    console.log(`📎 Total attachments after update: ${allAttachments.length}`);
    
    await sequelize.query(sql, {
      replacements: [...Object.values(updates), id], 
      type: Sequelize.QueryTypes.UPDATE, 
      transaction: t 
    });
    
    console.log('✅ Vendor updated');

    await t.commit();
    return await getVendorById(id);
  } catch (err) {
    console.error('❌ Error in updateVendor:', err);
    await t.rollback();
    throw err;
  }
}

// Soft delete - mark as deleted instead of actual deletion
async function deleteVendor(id) {
  console.log('🗑️ deleteVendor - ID:', id);
  
  const t = await sequelize.transaction();
  try {
    // Check if vendor exists and is not already deleted
    const vendor = await getVendorById(id);
    if (!vendor) {
      return false;
    }

    // Soft delete - just mark as deleted
    await sequelize.query(
      'UPDATE vendor_setup SET deleted = 1, updated_at = NOW() WHERE id = ?',
      { replacements: [id], type: Sequelize.QueryTypes.UPDATE, transaction: t }
    );

    await t.commit();
    console.log('✅ Vendor soft deleted:', id);
    return true;
  } catch (err) {
    console.error('❌ Error in deleteVendor:', err);
    await t.rollback();
    throw err;
  }
}

// Add restore function for soft deleted vendors
async function restoreVendor(id) {
  console.log('🔄 restoreVendor - ID:', id);
  
  const t = await sequelize.transaction();
  try {
    // Check if vendor exists and is deleted
    const vendor = await getVendorById(id, true); // Include deleted
    if (!vendor || vendor.deleted !== 1) {
      return false;
    }

    // Restore - mark as not deleted
    await sequelize.query(
      'UPDATE vendor_setup SET deleted = 0, updated_at = NOW() WHERE id = ?',
      { replacements: [id], type: Sequelize.QueryTypes.UPDATE, transaction: t }
    );

    await t.commit();
    console.log('✅ Vendor restored:', id);
    return true;
  } catch (err) {
    console.error('❌ Error in restoreVendor:', err);
    await t.rollback();
    throw err;
  }
}

// Permanent delete function (if needed)
async function permanentDeleteVendor(id) {
  console.log('💀 permanentDeleteVendor - ID:', id);
  
  const t = await sequelize.transaction();
  try {
    // Get vendor to delete files (include deleted ones)
    const vendor = await getVendorById(id, true);
    if (!vendor) {
      return false;
    }

    const attachments = vendor.attachments || [];
    console.log('📎 Found', attachments.length, 'attachments to delete');

    // Delete files from disk
    for (const att of attachments) {
      try {
        const fullPath = path.resolve(__dirname, '../../../../', att.file_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log('🗑️ Deleted file:', fullPath);
        }
      } catch (err) {
        console.error('⚠️ Failed to delete file:', att.file_path, err.message);
      }
    }

    // Permanent delete from database
    await sequelize.query(
      'DELETE FROM vendor_setup WHERE id = ?',
      { replacements: [id], type: Sequelize.QueryTypes.DELETE, transaction: t }
    );

    await t.commit();
    console.log('✅ Vendor permanently deleted:', id);
    return true;
  } catch (err) {
    console.error('❌ Error in permanentDeleteVendor:', err);
    await t.rollback();
    throw err;
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