const service = require('./standards.service');
const { validationResult } = require('express-validator');

const getAllStandards = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', status = '' } = req.query;
    const params = { page: parseInt(page, 10), limit: parseInt(limit, 10), search: String(search || ''), status: String(status || '') };
    const result = await service.getAllStandards(params);
    res.json({ success: true, data: result.rows, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) } });
  } catch (err) { console.error('Error fetching standards:', err); res.status(500).json({ error: 'Failed to fetch standards', message: err.message }); }
};

const getStandardById = async (req, res) => {
  try { const row = await service.getStandardById(req.params.id); if (!row) return res.status(404).json({ error: 'Standard not found' }); res.json({ success: true, data: row }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch standard' }); }
};

const createStandard = async (req, res) => {
  try { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ error:'Validation failed', errors: errors.array() }); const row = await service.createStandard(req.body); res.status(201).json({ success:true, data: row }); }
  catch (err) { console.error('Error creating standard:', err); res.status(500).json({ error:'Failed to create standard', message: err.message }); }
};

const updateStandard = async (req, res) => {
  try { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ error:'Validation failed', errors: errors.array() }); const updated = await service.updateStandard(req.params.id, req.body); if (!updated) return res.status(404).json({ error:'Standard not found' }); res.json({ success:true, data: updated }); }
  catch (err) { console.error(err); res.status(500).json({ error:'Failed to update standard', message: err.message }); }
};

const deleteStandard = async (req, res) => {
  try { const ok = await service.deleteStandard(req.params.id); if (!ok) return res.status(404).json({ error:'Standard not found' }); res.json({ success:true }); }
  catch (err) { console.error(err); res.status(500).json({ error:'Failed to delete standard', message: err.message }); }
};

module.exports = { getAllStandards, getStandardById, createStandard, updateStandard, deleteStandard };