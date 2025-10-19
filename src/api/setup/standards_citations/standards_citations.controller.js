const service = require('./standards_citations.service');
const { validationResult } = require('express-validator');

const createCitation = async (req, res) => {
  try { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ error:'Validation failed', errors: errors.array() });
    const row = await service.createCitation(req.body); res.status(201).json({ success:true, data: row });
  } catch (err) { console.error('Error creating citation:', err); if (err.name==='SequelizeUniqueConstraintError' || err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error:'Citation exists' }); res.status(500).json({ error:'Failed to create citation', message: err.message }); }
};

const getAllCitations = async (req, res) => {
  try { const params = { page: parseInt(req.query.page||1,10), limit: parseInt(req.query.limit||100,10), search: req.query.search||'', status: req.query.status||'' }; const result = await service.getAllCitations(params); res.json({ success:true, data: result.rows, pagination:{ total: result.total, page: result.page, limit: result.limit } }); }
  catch (err) { console.error('Error fetching citations:', err); res.status(500).json({ error:'Failed to fetch citations', message: err.message }); }
};

const getCitationById = async (req, res) => {
  try { const row = await service.getCitationById(req.params.id); if (!row) return res.status(404).json({ error:'Citation not found' }); res.json({ success:true, data: row }); }
  catch (err) { console.error(err); res.status(500).json({ error:'Failed to fetch citation' }); }
};

const updateCitation = async (req, res) => {
  try { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ error:'Validation failed', errors: errors.array() }); const updated = await service.updateCitation(req.params.id, req.body); if (!updated) return res.status(404).json({ error:'Citation not found' }); res.json({ success:true, data: updated }); }
  catch (err) { console.error(err); if (err.name==='SequelizeUniqueConstraintError' || err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error:'Citation exists' }); res.status(500).json({ error:'Failed to update citation' }); }
};

const deleteCitation = async (req, res) => {
  try { const ok = await service.deleteCitation(req.params.id); if (!ok) return res.status(404).json({ error:'Citation not found' }); res.json({ success:true }); } catch (err) { console.error(err); res.status(500).json({ error:'Failed to delete citation' }); }
};

module.exports = { createCitation, getAllCitations, getCitationById, updateCitation, deleteCitation };