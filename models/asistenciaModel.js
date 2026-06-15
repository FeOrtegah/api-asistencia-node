const pool = require('../db/conexion');

const obtenerTodasLasAsistencias = async () => {
  const resultado = await pool.query('SELECT * FROM asistencia.asistencia ORDER BY fecha DESC');
  return resultado.rows;
};

const obtenerAsistenciaPorId = async (id) => {
  const resultado = await pool.query(
    'SELECT * FROM asistencia.asistencia WHERE id = $1',
    [id]
  );
  return resultado.rows[0] || null;
};

const obtenerAsistenciasPorCursoYFecha = async (cursoId, fecha) => {
  const resultado = await pool.query(
    'SELECT * FROM asistencia.asistencia WHERE curso_id = $1 AND fecha = $2 ORDER BY estudiante_id',
    [cursoId, fecha]
  );
  return resultado.rows;
};

const obtenerAsistenciasPorAsignaturaYFecha = async (asignaturaId, fecha) => {
  const resultado = await pool.query(
    'SELECT * FROM asistencia.asistencia WHERE asignatura_id = $1 AND fecha = $2 ORDER BY estudiante_id',
    [asignaturaId, fecha]
  );
  return resultado.rows;
};


const crearAsistencia = async (datos) => {
  const { estudiante_id, curso_id, profesor_id, asignatura_id, fecha, estado, observaciones } = datos;
  const consulta = `
    INSERT INTO asistencia.asistencia (estudiante_id, curso_id, profesor_id, asignatura_id, fecha, estado, observaciones)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const resultado = await pool.query(consulta, [
    estudiante_id, curso_id, profesor_id, asignatura_id ?? null, fecha, estado, observaciones ?? null
  ]);
  return resultado.rows[0];
};

const actualizarAsistencia = async (id, datos) => {
  const { estudiante_id, curso_id, profesor_id, asignatura_id, fecha, estado, observaciones } = datos;
  const consulta = `
    UPDATE asistencia.asistencia
    SET estudiante_id = $1, curso_id = $2, profesor_id = $3,
        asignatura_id = $4, fecha = $5, estado = $6, observaciones = $7
    WHERE id = $8
    RETURNING *;
  `;
  const resultado = await pool.query(consulta, [
    estudiante_id, curso_id, profesor_id, asignatura_id ?? null, fecha, estado, observaciones ?? null, id
  ]);
  return resultado.rows[0] || null;
};

const eliminarAsistencia = async (id) => {
  const resultado = await pool.query(
    'DELETE FROM asistencia.asistencia WHERE id = $1 RETURNING id',
    [id]
  );
  return resultado.rows[0] || null;
};

module.exports = {
  obtenerTodasLasAsistencias,
  obtenerAsistenciaPorId,
  obtenerAsistenciasPorCursoYFecha,
  obtenerAsistenciasPorAsignaturaYFecha, 
  crearAsistencia,
  actualizarAsistencia,
  eliminarAsistencia
};
