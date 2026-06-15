// tests/asistencia.test.js
// ─────────────────────────────────────────────────────────────────────────────
// Tests para api-asistencia-node
// Usa node:test (nativo de Node.js) + mock del modelo para no depender de DB
// Ejecutar con: npm test
// ─────────────────────────────────────────────────────────────────────────────
 
const { test, describe, before, mock } = require('node:test');
const assert = require('node:assert/strict');
 
// ── 1. MOCKEAR el pool de DB ANTES de cargar cualquier módulo del proyecto ───
// (igual que User-Service mockea el controller antes de cargar la app)
const mockPool = {
  query: mock.fn(),
  connect: mock.fn(() => Promise.resolve()),
};
 
// Reemplazamos el módulo de conexión en el registro de módulos
require.cache[require.resolve('../db/conexion')] = {
  id: require.resolve('../db/conexion'),
  filename: require.resolve('../db/conexion'),
  loaded: true,
  exports: mockPool,
};
 
// También mockeamos inicializarDB para que no intente conectar a postgres real
require.cache[require.resolve('../db/init')] = {
  id: require.resolve('../db/init'),
  filename: require.resolve('../db/init'),
  loaded: true,
  exports: async () => {},
};
 
// ── 2. Ahora sí cargamos la app ───────────────────────────────────────────────
// Como index.js llama inicializarDB() y app.listen(), creamos una mini-app
// que reutilice las rutas sin levantar el servidor.
const express = require('express');
const asistenciaRoutes = require('../routes/asistenciaRoutes');
 
const app = express();
app.use(express.json());
app.use('/api/v1/asistencias', asistenciaRoutes);
 
// Helper: hace peticiones HTTP directamente a la app sin network
// (simula lo que supertest hace; usa http nativo para no añadir dependencias)
const http = require('http');
 
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const bodyStr = body ? JSON.stringify(body) : '';
      const options = {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          server.close();
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : {},
          });
        });
      });
      req.on('error', (e) => { server.close(); reject(e); });
      req.write(bodyStr);
      req.end();
    });
  });
}
 
// ── Datos de ejemplo que el "modelo" devolvería ───────────────────────────────
const asistenciaEjemplo = {
  id: 1,
  estudiante_id: 10,
  curso_id: 5,
  profesor_id: 3,
  asignatura_id: 2,
  fecha: '2024-06-01',
  estado: 'PRESENTE',
  observaciones: null,
  created_at: new Date().toISOString(),
};
 
const bodyValido = {
  estudiante_id: 10,
  curso_id: 5,
  profesor_id: 3,
  fecha: '2024-06-01',
  estado: 'PRESENTE',
};
 
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/asistencias  — obtenerAsistencias
// ─────────────────────────────────────────────────────────────────────────────
 
describe('GET /api/v1/asistencias', () => {
 
  test('debe retornar todas las asistencias (200)', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [asistenciaEjemplo] })
    );
 
    const res = await request('GET', '/api/v1/asistencias', null);
 
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].estado, 'PRESENTE');
  });
 
  test('filtra por cursoId y fecha (200)', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [asistenciaEjemplo] })
    );
 
    const res = await request('GET', '/api/v1/asistencias?cursoId=5&fecha=2024-06-01', null);
 
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });
 
  test('filtra por asignaturaId y fecha (200)', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [asistenciaEjemplo] })
    );
 
    const res = await request('GET', '/api/v1/asistencias?asignaturaId=2&fecha=2024-06-01', null);
 
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });
 
  test('retorna 500 si la base de datos falla', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.reject(new Error('DB error'))
    );
 
    const res = await request('GET', '/api/v1/asistencias', null);
 
    assert.equal(res.status, 500);
    assert.ok(res.body.mensaje);
  });
 
});
 
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/asistencias/:id  — obtenerAsistenciaPorId
// ─────────────────────────────────────────────────────────────────────────────
 
describe('GET /api/v1/asistencias/:id', () => {
 
  test('retorna una asistencia existente (200)', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [asistenciaEjemplo] })
    );
 
    const res = await request('GET', '/api/v1/asistencias/1', null);
 
    assert.equal(res.status, 200);
    assert.equal(res.body.id, 1);
  });
 
  test('retorna 404 si no existe la asistencia', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [] })
    );
 
    const res = await request('GET', '/api/v1/asistencias/999', null);
 
    assert.equal(res.status, 404);
    assert.ok(res.body.mensaje);
  });
 
  test('retorna 400 si el id no es un número', async () => {
    const res = await request('GET', '/api/v1/asistencias/abc', null);
 
    assert.equal(res.status, 400);
    assert.equal(res.body.mensaje, 'El id debe ser un número');
  });
 
  test('retorna 500 si la DB falla', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.reject(new Error('DB error'))
    );
 
    const res = await request('GET', '/api/v1/asistencias/1', null);
 
    assert.equal(res.status, 500);
  });
 
});
 
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/asistencias  — guardarAsistencia
// ─────────────────────────────────────────────────────────────────────────────
 
describe('POST /api/v1/asistencias', () => {
 
  test('crea asistencia con datos válidos (201)', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [asistenciaEjemplo] })
    );
 
    const res = await request('POST', '/api/v1/asistencias', bodyValido);
 
    assert.equal(res.status, 201);
    assert.equal(res.body.mensaje, 'Asistencia registrada');
    assert.ok(res.body.data);
  });
 
  test('rechaza si falta estudiante_id (400)', async () => {
    const { estudiante_id, ...sinEstudiante } = bodyValido;
 
    const res = await request('POST', '/api/v1/asistencias', sinEstudiante);
 
    assert.equal(res.status, 400);
    assert.ok(res.body.errores.includes('estudiante_id es requerido'));
  });
 
  test('rechaza si falta curso_id (400)', async () => {
    const { curso_id, ...sinCurso } = bodyValido;
 
    const res = await request('POST', '/api/v1/asistencias', sinCurso);
 
    assert.equal(res.status, 400);
    assert.ok(res.body.errores.includes('curso_id es requerido'));
  });
 
  test('rechaza si falta profesor_id (400)', async () => {
    const { profesor_id, ...sinProfesor } = bodyValido;
 
    const res = await request('POST', '/api/v1/asistencias', sinProfesor);
 
    assert.equal(res.status, 400);
    assert.ok(res.body.errores.includes('profesor_id es requerido'));
  });
 
  test('rechaza si falta fecha (400)', async () => {
    const { fecha, ...sinFecha } = bodyValido;
 
    const res = await request('POST', '/api/v1/asistencias', sinFecha);
 
    assert.equal(res.status, 400);
    assert.ok(res.body.errores.includes('fecha es requerida'));
  });
 
  test('rechaza si falta estado (400)', async () => {
    const { estado, ...sinEstado } = bodyValido;
 
    const res = await request('POST', '/api/v1/asistencias', sinEstado);
 
    assert.equal(res.status, 400);
    assert.ok(res.body.errores.includes('estado es requerido'));
  });
 
  test('rechaza si estado no es válido (400)', async () => {
    const res = await request('POST', '/api/v1/asistencias', {
      ...bodyValido,
      estado: 'INVENTADO',
    });
 
    assert.equal(res.status, 400);
    assert.ok(res.body.errores.some((e) => e.includes('estado debe ser uno de')));
  });
 
  test('acepta estado en minúsculas (case-insensitive)', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [{ ...asistenciaEjemplo, estado: 'AUSENTE' }] })
    );
 
    const res = await request('POST', '/api/v1/asistencias', {
      ...bodyValido,
      estado: 'ausente',
    });
 
    assert.equal(res.status, 201);
  });
 
  test('acepta todos los estados válidos: AUSENTE, TARDANZA, JUSTIFICADO', async () => {
    for (const estado of ['AUSENTE', 'TARDANZA', 'JUSTIFICADO']) {
      mockPool.query.mock.mockImplementationOnce(() =>
        Promise.resolve({ rows: [{ ...asistenciaEjemplo, estado }] })
      );
 
      const res = await request('POST', '/api/v1/asistencias', { ...bodyValido, estado });
 
      assert.equal(res.status, 201, `Falló para estado: ${estado}`);
    }
  });
 
  test('acepta asignatura_id y observaciones opcionales (201)', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [{ ...asistenciaEjemplo, asignatura_id: 7, observaciones: 'llegó tarde' }] })
    );
 
    const res = await request('POST', '/api/v1/asistencias', {
      ...bodyValido,
      asignatura_id: 7,
      observaciones: 'llegó tarde',
    });
 
    assert.equal(res.status, 201);
    assert.equal(res.body.data.asignatura_id, 7);
  });
 
  test('retorna 500 si la DB falla', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.reject(new Error('DB error'))
    );
 
    const res = await request('POST', '/api/v1/asistencias', bodyValido);
 
    assert.equal(res.status, 500);
  });
 
});
 
// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/asistencias/:id  — modificarAsistencia
// ─────────────────────────────────────────────────────────────────────────────
 
describe('PUT /api/v1/asistencias/:id', () => {
 
  test('actualiza asistencia existente (200)', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [{ ...asistenciaEjemplo, estado: 'AUSENTE' }] })
    );
 
    const res = await request('PUT', '/api/v1/asistencias/1', {
      ...bodyValido,
      estado: 'AUSENTE',
    });
 
    assert.equal(res.status, 200);
    assert.equal(res.body.mensaje, 'Asistencia actualizada');
    assert.equal(res.body.data.estado, 'AUSENTE');
  });
 
  test('retorna 404 si la asistencia no existe', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [] })
    );
 
    const res = await request('PUT', '/api/v1/asistencias/999', bodyValido);
 
    assert.equal(res.status, 404);
    assert.equal(res.body.mensaje, 'Asistencia no encontrada');
  });
 
  test('retorna 400 si el id no es un número', async () => {
    const res = await request('PUT', '/api/v1/asistencias/abc', bodyValido);
 
    assert.equal(res.status, 400);
    assert.equal(res.body.mensaje, 'El id debe ser un número');
  });
 
  test('valida campos obligatorios igual que el POST (400)', async () => {
    const { estudiante_id, ...sinEstudiante } = bodyValido;
 
    const res = await request('PUT', '/api/v1/asistencias/1', sinEstudiante);
 
    assert.equal(res.status, 400);
    assert.ok(res.body.errores.includes('estudiante_id es requerido'));
  });
 
  test('retorna 500 si la DB falla', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.reject(new Error('DB error'))
    );
 
    const res = await request('PUT', '/api/v1/asistencias/1', bodyValido);
 
    assert.equal(res.status, 500);
  });
 
});
 
// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/asistencias/:id  — borrarAsistencia
// ─────────────────────────────────────────────────────────────────────────────
 
describe('DELETE /api/v1/asistencias/:id', () => {
 
  test('elimina asistencia existente (200)', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [{ id: 1 }] })
    );
 
    const res = await request('DELETE', '/api/v1/asistencias/1', null);
 
    assert.equal(res.status, 200);
    assert.equal(res.body.mensaje, 'Asistencia eliminada');
  });
 
  test('retorna 404 si la asistencia no existe', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.resolve({ rows: [] })
    );
 
    const res = await request('DELETE', '/api/v1/asistencias/999', null);
 
    assert.equal(res.status, 404);
    assert.equal(res.body.mensaje, 'Asistencia no encontrada');
  });
 
  test('retorna 400 si el id no es un número', async () => {
    const res = await request('DELETE', '/api/v1/asistencias/abc', null);
 
    assert.equal(res.status, 400);
    assert.equal(res.body.mensaje, 'El id debe ser un número');
  });
 
  test('retorna 500 si la DB falla', async () => {
    mockPool.query.mock.mockImplementationOnce(() =>
      Promise.reject(new Error('DB error'))
    );
 
    const res = await request('DELETE', '/api/v1/asistencias/1', null);
 
    assert.equal(res.status, 500);
  });
 
});
 
// ─────────────────────────────────────────────────────────────────────────────
// Tests unitarios del helper interno: validarCampos
// (lo probamos indirectamente a través del endpoint)
// ─────────────────────────────────────────────────────────────────────────────
 
describe('validarCampos — múltiples errores simultáneos', () => {
 
  test('devuelve todos los errores cuando el body está vacío', async () => {
    const res = await request('POST', '/api/v1/asistencias', {});
 
    assert.equal(res.status, 400);
    // Debe reportar los 5 campos obligatorios faltantes
    assert.ok(res.body.errores.length >= 5);
  });
 
});