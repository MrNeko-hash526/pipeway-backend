const express = require('express');
const router = express.Router();
const ctrl = require('./standard_titles.controller');
const { createTitleValidation, updateTitleValidation, getTitleValidation, getAllTitlesValidation } = require('./standard_titles.validation');

router.get('/', getAllTitlesValidation, ctrl.getAllTitles);
router.get('/:id', getTitleValidation, ctrl.getTitleById);
router.post('/', createTitleValidation, ctrl.createTitle);
router.put('/:id', updateTitleValidation, ctrl.updateTitle);
router.delete('/:id', getTitleValidation, ctrl.deleteTitle);

module.exports = router;