const { UserService } = require('./user.service');
const { validationResult } = require('express-validator');

const userService = new UserService();

// Get all users with pagination and filters
const getAllUsers = async (req, res) => {
  console.log('📋 GET /api/setup/user - Get all users');
  console.log('📊 Query params:', req.query);
  
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      status = '', 
      userType = '', 
      userRole = '', 
      includeDeleted = false 
    } = req.query;
    
    const result = await userService.getAllUsers({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: search.toString(),
      status: status.toString(),
      userType: userType.toString(),
      userRole: userRole.toString(),
      includeDeleted: includeDeleted === 'true'
    });
    
    console.log('✅ Users retrieved successfully');
    res.json(result);
  } catch (err) {
    console.error('❌ Error getting users:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get users', 
      message: err.message 
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  console.log('🔍 GET /api/setup/user/:id - Get user by ID');
  console.log('📊 User ID:', req.params.id);
  
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;
    
    const user = await userService.getUserById(
      parseInt(id, 10), 
      includeDeleted === 'true'
    );
    
    if (!user) {
      console.log('⚠️ User not found');
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    console.log('✅ User retrieved successfully');
    res.json({ 
      success: true, 
      data: user 
    });
  } catch (err) {
    console.error('❌ Error getting user:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user', 
      message: err.message 
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  console.log('📝 POST /api/setup/user - Create user');
  console.log('📊 Request body:', req.body);
  
  try {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const user = await userService.createUser(req.body);
    
    console.log('✅ User created successfully');
    res.status(201).json({ 
      success: true, 
      data: user,
      message: 'User created successfully'
    });
  } catch (err) {
    console.error('❌ Error creating user:', err);
    
    // Handle specific error types
    if (err.message.includes('already registered') || 
        err.message.includes('already exists') ||
        err.message.includes('must be unique')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to create user', 
        message: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create user', 
      message: err.message 
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  console.log('📝 PUT /api/setup/user/:id - Update user');
  console.log('📊 User ID:', req.params.id);
  console.log('📊 Request body:', req.body);
  
  try {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const user = await userService.updateUser(parseInt(id, 10), req.body);
    
    if (!user) {
      console.log('⚠️ User not found for update');
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    console.log('✅ User updated successfully');
    res.json({ 
      success: true, 
      data: user,
      message: 'User updated successfully'
    });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    
    // Handle specific error types
    if (err.message.includes('already registered') || 
        err.message.includes('already exists') ||
        err.message.includes('must be unique')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to update user', 
        message: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update user', 
      message: err.message 
    });
  }
};

// Delete user (soft delete)
const deleteUser = async (req, res) => {
  console.log('🗑️ DELETE /api/setup/user/:id - Delete user');
  console.log('📊 User ID:', req.params.id);
  
  try {
    const { id } = req.params;
    const success = await userService.deleteUser(parseInt(id, 10));
    
    if (!success) {
      console.log('⚠️ User not found for deletion');
      return res.status(404).json({ 
        success: false, 
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
      success: false, 
      error: 'Failed to delete user', 
      message: err.message 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};