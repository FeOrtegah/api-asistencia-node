const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');

router.get('/', asistenciaController.obtenerAsistencias);
router.get('/:id', asistenciaController.obtenerAsistenciaPorId);
router.post('/', asistenciaController.guardarAsistencia);
router.put('/:id', asistenciaController.modificarAsistencia);
router.delete('/:id', asistenciaController.borrarAsistencia);

module.exports = router;
