require('dotenv').config();
const { Pool } = require('pg');

const sslConfig = process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: sslConfig
});

pool.connect()
  .then(() => console.log('Conexión a PostgreSQL establecida'))
  .catch(err => console.error('Error al conectar a PostgreSQL:', err.message));

module.exports = pool;