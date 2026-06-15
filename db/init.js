const pool = require('./conexion');
const inicializarDB = async () => {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS asistencia`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS asistencia.asistencia (
      id            SERIAL PRIMARY KEY,
      estudiante_id INTEGER NOT NULL,
      curso_id      INTEGER NOT NULL,
      profesor_id   INTEGER NOT NULL,
      asignatura_id INTEGER,
      fecha         DATE    NOT NULL,
      estado        VARCHAR(20) NOT NULL,
      observaciones TEXT,
      created_at    TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE asistencia.asistencia 
    ADD COLUMN IF NOT EXISTS asignatura_id INTEGER
  `);
  console.log('Schema y tabla asistencia verificados/creados');
};
module.exports = inicializarDB;
