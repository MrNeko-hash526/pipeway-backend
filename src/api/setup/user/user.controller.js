const UserService = require('./user.service');
const { validationResult } = require('express-validator');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  createUser = async (req, res) => {
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

      const user = await this.userService.createUser(req.body);
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

  getAllUsers = async (req, res) => {
    console.log('📋 GET /api/setup/user - Get all users');
    
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        search: req.query.search || '',
        status: req.query.status || '',
        userType: req.query.userType || '',
        userRole: req.query.userRole || ''
      };

      console.log('📊 Query filters:', filters);

      const result = await this.userService.getAllUsers(filters);
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

  getUserById = async (req, res) => {
    console.log('🔍 GET /api/setup/user/:id - Get user by ID');
    
    try {
      const { id } = req.params;
      console.log('📊 User ID:', id);

      const user = await this.userService.getUserById(id);
      
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

  updateUser = async (req, res) => {
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

      const user = await this.userService.updateUser(id, req.body);
      
      console.log('✅ User updated successfully:', user.email);
      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (err) {
      console.error('❌ Error updating user:', err);
      
      if (err.message === 'User not found') {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      res.status(500).json({
        error: 'Failed to update user',
        message: err.message
      });
    }
  };

  deleteUser = async (req, res) => {
    console.log('🗑️ DELETE /api/setup/user/:id - Delete user');
    
    try {
      const { id } = req.params;
      console.log('📊 User ID:', id);

      const success = await this.userService.deleteUser(id);
      
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
}

module.exports = new UserController();