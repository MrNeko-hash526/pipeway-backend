const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const {
  createUserValidation,
  updateUserValidation,
  getUserValidation,
  getAllUsersValidation
} = require('./user.validation');

// GET /api/setup/user - Get all users
router.get('/', getAllUsersValidation, userController.getAllUsers);

// GET /api/setup/user/:id - Get user by ID
router.get('/:id', getUserValidation, userController.getUserById);

// POST /api/setup/user - Create user
router.post('/', createUserValidation, userController.createUser);

// PUT /api/setup/user/:id - Update user
router.put('/:id', updateUserValidation, userController.updateUser);

// DELETE /api/setup/user/:id - Delete user
router.delete('/:id', getUserValidation, userController.deleteUser);

module.exports = router;