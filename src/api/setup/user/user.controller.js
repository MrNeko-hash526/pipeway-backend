const userService = require('./user.service');
const { validationResult } = require('express-validator');

const createUser = async (req, res) => {
  console.log('📝 POST /api/setup/user - Create user');
  console.log('📊 Request body:', req.body);

  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await userService.createUser(req.body);
    console.log('✅ User created successfully:', user.id);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (err) {
    console.error('❌ Error creating user:', err);
    res.status(500).json({
      error: 'Failed to create user',
      message: err.message
    });
  }
};

const getAllUsers = async (req, res) => {
  console.log('📋 GET /api/setup/user - Get all users');
  
  try {
    const { page = 1, limit = 50, search = '', status = '', userType = '', userRole = '' } = req.query;
    
    const params = {
      page: parseInt(page),
      limit: parseInt(limit),
      search: search.trim(),
      status: status.trim(),
      userType: userType.trim(),
      userRole: userRole.trim()
    };

    console.log('📊 Query params:', params);

    const result = await userService.getAllUsers(params);
    console.log(`✅ Found ${result.rows.length} users (total: ${result.total})`);
    
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
    console.error('❌ Error fetching users:', err);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: err.message
    });
  }
};

const getUserById = async (req, res) => {
  console.log('🔍 GET /api/setup/user/:id - Get user by ID');
  
  try {
    const { id } = req.params;
    console.log('📊 User ID:', id);

    const user = await userService.getUserById(id);
    
    if (!user) {
      console.log('⚠️ User not found');
      return res.status(404).json({
        error: 'User not found'
      });
    }

    console.log('✅ User found:', user.email);
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('❌ Error fetching user:', err);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: err.message
    });
  }
};

const updateUser = async (req, res) => {
  console.log('📝 PUT /api/setup/user/:id - Update user');
  
  try {
    const { id } = req.params;
    console.log('📊 User ID:', id);
    console.log('📊 Update data:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await userService.updateUser(id, req.body);
    
    if (!user) {
      console.log('⚠️ User not found');
      return res.status(404).json({
        error: 'User not found'
      });
    }

    console.log('✅ User updated successfully:', user.email);
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    res.status(500).json({
      error: 'Failed to update user',
      message: err.message
    });
  }
};

const deleteUser = async (req, res) => {
  console.log('🗑️ DELETE /api/setup/user/:id - Delete user');
  
  try {
    const { id } = req.params;
    console.log('📊 User ID:', id);

    const success = await userService.deleteUser(id);
    
    if (!success) {
      console.log('⚠️ User not found');
      return res.status(404).json({
        error: 'User not found'
      });
    }

    console.log('✅ User deleted successfully');
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    res.status(500).json({
      error: 'Failed to delete user',
      message: err.message
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};