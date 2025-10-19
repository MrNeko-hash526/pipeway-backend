const express = require('express');
const router = express.Router();

const controller = require('./standards.controller');
const {
  createStandardValidation,
  updateStandardValidation,
  getStandardValidation,
  getAllStandardsValidation
} = require('./standards.validation');

router.get('/', getAllStandardsValidation, controller.getAllStandards);
router.get('/:id', getStandardValidation, controller.getStandardById);
router.post('/', createStandardValidation, controller.createStandard);
router.put('/:id', updateStandardValidation, controller.updateStandard);
router.delete('/:id', getStandardValidation, controller.deleteStandard);

module.exports = router;