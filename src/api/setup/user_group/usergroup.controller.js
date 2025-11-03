const userGroupService = require('./usergroup.service');
const { validationResult } = require('express-validator');

const createUserGroup = async (req, res) => {
  console.log('📝 POST /api/setup/user-group - Create user group');
  console.log('📊 Request body:', req.body);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const userGroup = await userGroupService.createUserGroup(req.body);
    console.log('✅ User group created successfully:', userGroup.id);
    
    res.status(201).json({
      success: true,
      message: 'User group created successfully',
      data: userGroup
    });
  } catch (err) {
    console.error('❌ Error creating user group:', err);
    res.status(500).json({
      error: 'Failed to create user group',
      message: err.message
    });
  }
};

const getAllUserGroups = async (req, res) => {
  console.log('📋 GET /api/setup/user-group - Get all user groups');
  
  try {
    const { page = 1, limit = 100, search = '', status = 'Active', includeDeleted = 'false' } = req.query;
    
    const params = {
      page: parseInt(page),
      limit: parseInt(limit),
      search: search.trim(),
      status: status.trim(),
      includeDeleted: includeDeleted === 'true'
    };

    console.log('📊 Query params:', params);

    const result = await userGroupService.getAllUserGroups(params);
    console.log(`✅ Found ${result.rows.length} user groups (total: ${result.total})`);
    
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
    console.error('❌ Error fetching user groups:', err);
    res.status(500).json({
      error: 'Failed to fetch user groups',
      message: err.message
    });
  }
};

const getUserGroupById = async (req, res) => {
  console.log('🔍 GET /api/setup/user-group/:id - Get user group by ID');
  
  try {
    const { id } = req.params;
    const includeDeleted = req.query.includeDeleted === 'true';
    console.log('📊 User group ID:', id, 'includeDeleted:', includeDeleted);

    const userGroup = await userGroupService.getUserGroupById(id, includeDeleted);
    
    if (!userGroup) {
      console.log('⚠️ User group not found');
      return res.status(404).json({
        error: 'User group not found'
      });
    }

    console.log('✅ User group found:', userGroup.group_name);
    res.json({
      success: true,
      data: userGroup
    });
  } catch (err) {
    console.error('❌ Error fetching user group:', err);
    res.status(500).json({
      error: 'Failed to fetch user group',
      message: err.message
    });
  }
};

const updateUserGroup = async (req, res) => {
  console.log('📝 PUT /api/setup/user-group/:id - Update user group');
  
  try {
    const { id } = req.params;
    console.log('📊 User group ID:', id);
    console.log('📊 Update data:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const userGroup = await userGroupService.updateUserGroup(id, req.body);
    
    if (!userGroup) {
      console.log('⚠️ User group not found');
      return res.status(404).json({
        error: 'User group not found'
      });
    }

    console.log('✅ User group updated successfully:', userGroup.group_name);
    res.json({
      success: true,
      message: 'User group updated successfully',
      data: userGroup
    });
  } catch (err) {
    console.error('❌ Error updating user group:', err);
    res.status(500).json({
      error: 'Failed to update user group',
      message: err.message
    });
  }
};

const deleteUserGroup = async (req, res) => {
  console.log('🗑️ DELETE /api/setup/user-group/:id - Delete user group');
  
  try {
    const { id } = req.params;
    console.log('📊 User group ID:', id);

    const success = await userGroupService.deleteUserGroup(id);
    
    if (!success) {
      console.log('⚠️ User group not found');
      return res.status(404).json({
        error: 'User group not found'
      });
    }

    console.log('✅ User group deleted successfully');
    res.json({
      success: true,
      message: 'User group deleted successfully (soft delete)'
    });
  } catch (err) {
    console.error('❌ Error deleting user group:', err);
    res.status(500).json({
      error: 'Failed to delete user group',
      message: err.message
    });
  }
};

const restoreUserGroup = async (req, res) => {
  console.log('🔄 PUT /api/setup/user-group/:id/restore - Restore user group');
  
  try {
    const { id } = req.params;
    console.log('📊 User group ID:', id);

    const success = await userGroupService.restoreUserGroup(id);
    
    if (!success) {
      console.log('⚠️ User group not found or not deleted');
      return res.status(404).json({
        error: 'User group not found or not deleted'
      });
    }

    console.log('✅ User group restored successfully');
    res.json({
      success: true,
      message: 'User group restored successfully'
    });
  } catch (err) {
    console.error('❌ Error restoring user group:', err);
    res.status(500).json({
      error: 'Failed to restore user group',
      message: err.message
    });
  }
};

const permanentDeleteUserGroup = async (req, res) => {
  console.log('💀 DELETE /api/setup/user-group/:id/permanent - Permanent delete user group');
  
  try {
    const { id } = req.params;
    console.log('📊 User group ID:', id);

    const success = await userGroupService.permanentDeleteUserGroup(id);
    
    if (!success) {
      console.log('⚠️ User group not found');
      return res.status(404).json({
        error: 'User group not found'
      });
    }

    console.log('✅ User group permanently deleted');
    res.json({
      success: true,
      message: 'User group permanently deleted'
    });
  } catch (err) {
    console.error('❌ Error permanently deleting user group:', err);
    res.status(500).json({
      error: 'Failed to permanently delete user group',
      message: err.message
    });
  }
};

module.exports = {
  createUserGroup,
  getAllUserGroups,
  getUserGroupById,
  updateUserGroup,
  deleteUserGroup,
  restoreUserGroup,
  permanentDeleteUserGroup
};