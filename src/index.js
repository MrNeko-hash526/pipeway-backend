require('dotenv').config();

const app = require('./app'); // app with mounted routes
const { connect } = require('../config/config');

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  try {
    await connect();
    app.listen(PORT, () => {
      console.log(`✅ Server listening on http://localhost:${PORT}`);
      console.log(`✅ Vendor API: http://localhost:${PORT}/api/setup/vendor`);
      console.log(`✅ User API: http://localhost:${PORT}/api/setup/user`);
      console.log(`✅ User-Group API: http://localhost:${PORT}/api/setup/user-group`);
      console.log(`✅ Standards Citations API: http://localhost:${PORT}/api/setup/standards-citations`);
      console.log(`✅ Risk API: http://localhost:${PORT}/api/setup/risk`);
      console.log(`✅ setup-dashbaord API: http://localhost:${PORT}/api/setup-dashboard`);


    });
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
}

start();