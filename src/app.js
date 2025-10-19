const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const vendorRouter = require('./api/setup/vendor/vendor.route');
const userRouter = require('./api/setup/user/user.route');
const userGroupRouter = require('./api/setup/user_group/usergroup.route');

// standards routers (main + lookups)
const standardsRouter = require('./api/setup/standards/standards.route');
const standardCategoriesRouter = require('./api/setup/standard_categories/standard_categories.route');
const standardTitlesRouter = require('./api/setup/standard_titles/standard_titles.route');
const standardsCitationsRouter = require('./api/setup/standards_citations/standards_citations.route');

// risk management routers (only main one exists)
const riskManagementRouter = require('./api/setup/risk_management/risk_management.route');

const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// serve uploaded files if needed
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// mount API routers
app.use('/api/setup/vendor', vendorRouter);
app.use('/api/setup/user', userRouter);
app.use('/api/setup/user-group', userGroupRouter);

// standards endpoints
app.use('/api/setup/standards', standardsRouter);                     // main standards CRUD
app.use('/api/setup/standard-categories', standardCategoriesRouter);  // categories lookup
app.use('/api/setup/standard-titles', standardTitlesRouter);          // titles lookup
app.use('/api/setup/standards-citations', standardsCitationsRouter);  // citations lookup

// risk management endpoints - all handled by main controller
app.use('/api/setup/risk-management', riskManagementRouter);
app.use('/api/setup/rrm-criteria', riskManagementRouter); // reuse same router
app.use('/api/setup/rrm-levels', riskManagementRouter);   // reuse same router

// health check
app.get('/health', (req, res) => res.json({ ok: true }));

// generic 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;