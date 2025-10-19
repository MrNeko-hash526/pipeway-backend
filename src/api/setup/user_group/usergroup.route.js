const express = require('express');
const router = express.Router();
const userGroupController = require('./usergroup.controller');
const {
  createUserGroupValidation,
  updateUserGroupValidation,
  getUserGroupValidation,
  getAllUserGroupsValidation
} = require('./usergroup.validation');

// GET /api/setup/user-group - Get all user groups
router.get('/', getAllUserGroupsValidation, userGroupController.getAllUserGroups);

// GET /api/setup/user-group/:id - Get user group by ID
router.get('/:id', getUserGroupValidation, userGroupController.getUserGroupById);

// POST /api/setup/user-group - Create user group
router.post('/', createUserGroupValidation, userGroupController.createUserGroup);

// PUT /api/setup/user-group/:id - Update user group
router.put('/:id', updateUserGroupValidation, userGroupController.updateUserGroup);

// DELETE /api/setup/user-group/:id - Delete user group
router.delete('/:id', getUserGroupValidation, userGroupController.deleteUserGroup);

module.exports = router;