const asistenciaModel = require('../models/asistenciaModel');

const validarCampos = ({ estudiante_id, curso_id, profesor_id, fecha, estado }) => {
  const errores = [];
  if (!estudiante_id) errores.push('estudiante_id es requerido');
  if (!curso_id)      errores.push('curso_id es requerido');
  if (!profesor_id)   errores.push('profesor_id es requerido');
  if (!fecha)         errores.push('fecha es requerida');
  if (!estado)        errores.push('estado es requerido');
  const estadosValidos = ['PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO'];
  if (estado && !estadosValidos.includes(estado.toUpperCase())) {
    errores.push(`estado debe ser uno de: ${estadosValidos.join(', ')}`);
  }
  return errores;
};

const obtenerAsistencias = async (req, res) => {
  try {
    const { cursoId, fecha, asignaturaId } = req.query;
    if (asignaturaId && fecha) {
      const asistencias = await asistenciaModel.obtenerAsistenciasPorAsignaturaYFecha(asignaturaId, fecha);
      return res.status(200).json(asistencias);
    }
    if (cursoId && fecha) {
      const asistencias = await asistenciaModel.obtenerAsistenciasPorCursoYFecha(cursoId, fecha);
      return res.status(200).json(asistencias);
    }
    const asistencias = await asistenciaModel.obtenerTodasLasAsistencias();
    res.status(200).json(asistencias);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};

const obtenerAsistenciaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ mensaje: 'El id debe ser un número' });
    const asistencia = await asistenciaModel.obtenerAsistenciaPorId(id);
    if (!asistencia) return res.status(404).json({ mensaje: 'Asistencia no encontrada' });
    res.status(200).json(asistencia);
  } catch (error) {
    console.error('Error al obtener asistencia por id:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};

const guardarAsistencia = async (req, res) => {
  try {
    const errores = validarCampos(req.body);
    if (errores.length > 0) {
      return res.status(400).json({ mensaje: 'Datos inválidos', errores });
    }
    const nuevaAsistencia = await asistenciaModel.crearAsistencia(req.body);
    res.status(201).json({ mensaje: 'Asistencia registrada', data: nuevaAsistencia });
  } catch (error) {
    console.error('Error al guardar asistencia:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};

const modificarAsistencia = async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ mensaje: 'El id debe ser un número' });
    const errores = validarCampos(req.body);
    if (errores.length > 0) {
      return res.status(400).json({ mensaje: 'Datos inválidos', errores });
    }
    const actualizada = await asistenciaModel.actualizarAsistencia(id, req.body);
    if (!actualizada) return res.status(404).json({ mensaje: 'Asistencia no encontrada' });
    res.status(200).json({ mensaje: 'Asistencia actualizada', data: actualizada });
  } catch (error) {
    console.error('Error al actualizar asistencia:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};

const borrarAsistencia = async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ mensaje: 'El id debe ser un número' });
    const eliminada = await asistenciaModel.eliminarAsistencia(id);
    if (!eliminada) return res.status(404).json({ mensaje: 'Asistencia no encontrada' });
    res.status(200).json({ mensaje: 'Asistencia eliminada' });
  } catch (error) {
    console.error('Error al eliminar asistencia:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};

module.exports = {
  obtenerAsistencias,
  obtenerAsistenciaPorId,
  guardarAsistencia,
  modificarAsistencia,
  borrarAsistencia
};
