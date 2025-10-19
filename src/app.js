const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const vendorRouter = require('./api/setup/vendor/vendor.route');
const userRouter = require('./api/setup/user/user.route');
const userGroupRouter = require('./api/setup/user_group/usergroup.route');

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
app.use('/api/setup/user', userRouter); // ← Add this line
app.use('/api/setup/user-group', userGroupRouter);

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