const express = require('express');
const router = express.Router();
const ctrl = require('./standards_citations.controller');
const { createCitationValidation, updateCitationValidation, getCitationValidation, getAllCitationsValidation } = require('./standards_citations.validation');

router.get('/', getAllCitationsValidation, ctrl.getAllCitations);
router.get('/:id', getCitationValidation, ctrl.getCitationById);
router.post('/', createCitationValidation, ctrl.createCitation);
router.put('/:id', updateCitationValidation, ctrl.updateCitation);
router.delete('/:id', getCitationValidation, ctrl.deleteCitation);

module.exports = router;