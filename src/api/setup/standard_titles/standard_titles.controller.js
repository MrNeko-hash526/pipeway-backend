const service = require('./standard_titles.service');
const { validationResult } = require('express-validator');

const createTitle = async (req, res) => {
  try { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ error:'Validation failed', errors: errors.array() });
    const row = await service.createTitle(req.body); res.status(201).json({ success: true, data: row });
  } catch (err) { console.error('Error creating title:', err); if (err.name === 'SequelizeUniqueConstraintError' || err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Title exists' }); res.status(500).json({ error: 'Failed to create title', message: err.message }); }
};

const getAllTitles = async (req, res) => {
  try { const params = { page: parseInt(req.query.page||1,10), limit: parseInt(req.query.limit||100,10), search: req.query.search||'', status: req.query.status||'' }; const result = await service.getAllTitles(params); res.json({ success:true, data: result.rows, pagination: { total: result.total, page: result.page, limit: result.limit } }); }
  catch (err) { console.error('Error fetching titles:', err); res.status(500).json({ error: 'Failed to fetch titles', message: err.message }); }
};

const getTitleById = async (req, res) => {
  try { const row = await service.getTitleById(req.params.id); if (!row) return res.status(404).json({ error: 'Title not found' }); res.json({ success: true, data: row }); }
  catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch title' }); }
};

const updateTitle = async (req, res) => {
  try { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ error:'Validation failed', errors: errors.array() }); const updated = await service.updateTitle(req.params.id, req.body); if (!updated) return res.status(404).json({ error:'Title not found' }); res.json({ success:true, data: updated }); }
  catch (err) { console.error(err); if (err.name === 'SequelizeUniqueConstraintError' || err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Title exists' }); res.status(500).json({ error: 'Failed to update title' }); }
};

const deleteTitle = async (req, res) => {
  try { const ok = await service.deleteTitle(req.params.id); if (!ok) return res.status(404).json({ error:'Title not found' }); res.json({ success:true }); } catch (err) { console.error(err); res.status(500).json({ error:'Failed to delete title' }); }
};

module.exports = { createTitle, getAllTitles, getTitleById, updateTitle, deleteTitle };