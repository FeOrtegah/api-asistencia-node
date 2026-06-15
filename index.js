const express = require('express');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const inicializarDB = require('./db/init');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ mensaje: 'funcionando asistencia' });
});

app.get('/fix-sequence', async (req, res) => {
    const pool = require('./db/conexion');
    await pool.query(`SELECT setval(pg_get_serial_sequence('asistencia.asistencia', 'id'), (SELECT MAX(id) FROM asistencia.asistencia))`);
    res.json({ ok: true });
});

app.use('/api/v1/asistencias', asistenciaRoutes);

inicializarDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`servidor corriendo en el puerto ${port}`);
    });
  })
  .catch(err => {
    console.error('Error al inicializar DB:', err.message);
    process.exit(1);
  });
