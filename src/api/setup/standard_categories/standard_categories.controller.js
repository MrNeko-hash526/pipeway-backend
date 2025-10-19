const service = require('./standard_categories.service');
const { validationResult } = require('express-validator');

const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    const row = await service.createCategory(req.body);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error('Error creating category:', err);
    if (err.name === 'SequelizeUniqueConstraintError' || err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Category name already exists' });
    res.status(500).json({ error: 'Failed to create category', message: err.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const params = { page: parseInt(req.query.page||1,10), limit: parseInt(req.query.limit||100,10), search: req.query.search||'', status: req.query.status||'' };
    const result = await service.getAllCategories(params);
    res.json({ success: true, data: result.rows, pagination: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) { console.error('Error fetching categories:', err); res.status(500).json({ error: 'Failed to fetch categories', message: err.message }); }
};

const getCategoryById = async (req, res) => {
  try { const row = await service.getCategoryById(req.params.id); if (!row) return res.status(404).json({ error: 'Category not found' }); res.json({ success: true, data: row }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch category' }); }
};

const updateCategory = async (req, res) => {
  try { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ error:'Validation failed', errors: errors.array() });
    const updated = await service.updateCategory(req.params.id, req.body); if (!updated) return res.status(404).json({ error:'Category not found' }); res.json({ success: true, data: updated });
  } catch (err) { console.error(err); if (err.name === 'SequelizeUniqueConstraintError' || err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Category name already exists' }); res.status(500).json({ error: 'Failed to update category' }); }
};

const deleteCategory = async (req, res) => {
  try { const ok = await service.deleteCategory(req.params.id); if (!ok) return res.status(404).json({ error:'Category not found' }); res.json({ success: true }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete category' }); }
};

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };