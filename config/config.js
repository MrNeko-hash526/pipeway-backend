const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { Sequelize } = require('sequelize');

const DB_URL = process.env.DATABASE_URL;

const sequelize = DB_URL
  ? new Sequelize(DB_URL, {
      dialect: 'mysql',
      logging: process.env.DB_LOG === 'true' ? console.log : false,
      define: { underscored: true, timestamps: true },
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: process.env.DB_LOG === 'true' ? console.log : false,
        define: { underscored: true, timestamps: true },
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
      }
    );

async function connect() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected');
  } catch (err) {
    console.error('❌ Unable to connect to MySQL:', err);
    throw err;
  }
}

module.exports = { sequelize, Sequelize, connect };