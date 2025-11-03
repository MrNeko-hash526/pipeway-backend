const express = require('express');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

//set up dashboard router
const setupDashboardRouter = require('./api/setup/setup_dashboard/setup_dashboard.route');

const vendorRouter = require('./api/setup/vendor/vendor.route');
const userRouter = require('./api/setup/user/user.route');
const userGroupRouter = require('./api/setup/user_group/usergroup.route');

// standards routers (main + lookups)
const standardsRouter = require('./api/setup/standards/standards.route');
const standardCategoriesRouter = require('./api/setup/standard_categories/standard_categories.route');
const standardTitlesRouter = require('./api/setup/standard_titles/standard_titles.route');
const standardsCitationsRouter = require('./api/setup/standards_citations/standards_citations.route');

// manage-policies router
const attachmentsRouter = require('./api/manage-policies/attachment.route');
const policyRouter = require('./api/manage-policies/policy.route');

// risk management routers (only main one exists)
const riskManagementRouter = require('./api/setup/risk_management/risk_management.route');

// certificate files router
const certificatesRouter = require('./api/certificates/certificate.route');

const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// serve uploaded files at /uploads/*
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// serve uploads folder at /uploads so URLs like /uploads/vendor/<file> work
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads'), {
  maxAge: '1h'
}));

// safe streaming endpoint for vendor files (inline for PDF, attachment otherwise)
app.get('/files/vendor/:filename', (req, res) => {
  const filename = path.basename(req.params.filename || '')
  const filePath = path.resolve(process.cwd(), 'uploads', 'vendor', filename)
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'Not found' })
  const mimeType = mime.lookup(filePath) || 'application/octet-stream'
  const inline = mimeType === 'application/pdf'
  res.setHeader('Content-Type', mimeType)
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${path.basename(filePath)}"`)
  fs.createReadStream(filePath).on('error', () => res.sendStatus(500)).pipe(res)
});

//mount setup dashboard router
app.use('/api/setup/dashboard', setupDashboardRouter);

// mount API routers
app.use('/api/setup/vendor', vendorRouter);
app.use('/api/setup/user', userRouter);
app.use('/api/setup/user-group', userGroupRouter);

// standards endpoints
app.use('/api/setup/standards', standardsRouter);                     // main standards CRUD
app.use('/api/setup/standard-categories', standardCategoriesRouter);  // categories lookup
app.use('/api/setup/standard-titles', standardTitlesRouter);          // titles lookup
app.use('/api/setup/standards-citations', standardsCitationsRouter);  // citations lookup

// manage policies endpoints
app.use('/api/manage-policies', attachmentsRouter);
app.use('/api/manage-policies', policyRouter);

// certificate file endpoints (upload/list/get/delete/restore)
app.use('/api/certificates', certificatesRouter);

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