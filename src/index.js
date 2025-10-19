require('dotenv').config();
const path = require('path');
const fs = require('fs');

const app = require('./app'); // ← import the app from app.js (has vendor routes)
const { sequelize, Sequelize, connect } = require('../config/config');

// load all models from /model and run associations
const modelsDir = path.join(__dirname, '..', 'model');
const models = {};

fs.readdirSync(modelsDir)
  .filter(f => f.endsWith('.js'))
  .forEach(file => {
    const modelDef = require(path.join(modelsDir, file));
    if (typeof modelDef === 'function') {
      const model = modelDef(sequelize, Sequelize.DataTypes || Sequelize);
      models[model.name] = model;
    }
  });

// run associations if defined
Object.values(models).forEach(m => { 
  if (typeof m.associate === 'function') m.associate(models); 
});

// add legacy dashboard route (or move to app.js routes folder)
app.get('/dashboards', async (req, res) => {
  try {
    const Dashboard = models.Dashboard;
    if (!Dashboard) return res.status(404).json({ error: 'Dashboard model not found' });
    const rows = await Dashboard.findAll({ limit: 100 });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  try {
    await connect();
    app.listen(PORT, () => {
      console.log(`✅ Server listening on http://localhost:${PORT}`);
      console.log(`✅ Vendor API: http://localhost:${PORT}/api/setup/vendor`);
      console.log(`✅ User API: http://localhost:${PORT}/api/setup/user`);
      console.log(`✅ User-Group API: http://localhost:${PORT}/api/setup/user-group`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
}

start();