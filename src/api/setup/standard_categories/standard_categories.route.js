const express = require('express');
const router = express.Router();
const ctrl = require('./standard_categories.controller');
const { createCategoryValidation, updateCategoryValidation, getCategoryValidation, getAllCategoriesValidation } = require('./standard_categories.validation');

router.get('/', getAllCategoriesValidation, ctrl.getAllCategories);
router.get('/:id', getCategoryValidation, ctrl.getCategoryById);
router.post('/', createCategoryValidation, ctrl.createCategory);
router.put('/:id', updateCategoryValidation, ctrl.updateCategory);
router.delete('/:id', getCategoryValidation, ctrl.deleteCategory);

module.exports = router;