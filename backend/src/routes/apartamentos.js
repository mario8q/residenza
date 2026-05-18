const router = require('express').Router();
const controller = require('../controllers/apartamentosController');
const { verifyToken, requireRol } = require('../middlewares/auth');
const { setTenant } = require('../middlewares/tenant');
const { conjuntoQuery, query } = require('../config/database');

// ════════════════════════════════════════════════════════════════
// RUTAS PÚBLICAS (para registro de residentes)
// ════════════════════════════════════════════════════════════════

// GET /api/apartamentos/publicas/conjuntos/:conjuntoId/torres
// Obtener torres disponibles de un conjunto (sin autenticación)
router.get('/publicas/conjuntos/:conjuntoId/torres', async (req, res, next) => {
  try {
    const { conjuntoId } = req.params;

    // Validar que el conjunto existe y obtener su schema
    const conjRes = await query(
      'SELECT id, schema_name FROM public.conjuntos WHERE id = $1 AND activo = TRUE',
      [parseInt(conjuntoId)]
    );

    if (conjRes.rows.length === 0) {
      return res.status(404).json({ error: 'Conjunto no encontrado.' });
    }

    const conjunto = conjRes.rows[0];

    // Obtener torres del conjunto
    const torresRes = await conjuntoQuery(
      conjunto.schema_name,
      `SELECT id, nombre, num_pisos FROM torres ORDER BY nombre ASC`
    );

    res.json({ data: torresRes.rows });
  } catch (err) { next(err); }
});

// GET /api/apartamentos/publicas/conjuntos/:conjuntoId/torres/:torreId/apartamentos
// Obtener apartamentos disponibles de una torre (sin autenticación)
router.get('/publicas/conjuntos/:conjuntoId/torres/:torreId/apartamentos', async (req, res, next) => {
  try {
    const { conjuntoId, torreId } = req.params;

    // Validar que el conjunto existe
    const conjRes = await query(
      'SELECT id, schema_name FROM public.conjuntos WHERE id = $1 AND activo = TRUE',
      [parseInt(conjuntoId)]
    );

    if (conjRes.rows.length === 0) {
      return res.status(404).json({ error: 'Conjunto no encontrado.' });
    }

    const conjunto = conjRes.rows[0];

    // Obtener apartamentos disponibles de la torre
    const aptRes = await conjuntoQuery(
      conjunto.schema_name,
      `SELECT 
        a.id, a.codigo, a.numero, a.piso, a.area_m2,
        t.nombre AS torre, t.id as torre_id
      FROM apartamentos a
      JOIN torres t ON t.id = a.torre_id
      WHERE a.torre_id = $1
        AND a.id NOT IN (SELECT apartamento_id FROM residentes WHERE activo = TRUE)
      ORDER BY a.piso, a.numero`,
      [parseInt(torreId)]
    );

    res.json({ data: aptRes.rows });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════
// RUTAS AUTENTICADAS (para admin)
// ════════════════════════════════════════════════════════════════

// Todas las rutas requieren autenticación
router.use(verifyToken, setTenant);

// ── TORRES ─────────────────────────────────────────
router.get('/torres',            requireRol('admin'), controller.listTorres);
router.post('/torres',           requireRol('admin'), controller.createTorre);
router.delete('/torres/:id',     requireRol('admin'), controller.deleteTorre);

// ── APARTAMENTOS ───────────────────────────────────
router.get('/',                  requireRol('admin'), controller.listApartamentos);
router.post('/',                 requireRol('admin'), controller.createApartamento);
router.delete('/:id',            requireRol('admin'), controller.deleteApartamento);

// ── Disponibles (con autenticación) ────────────────
router.get('/disponibles', async (req, res, next) => {
  try {
    const { conjuntoQuery } = require('../config/database');
    const aptRes = await conjuntoQuery(
      req.tenantSchema,
      `SELECT a.id, a.codigo, t.nombre AS torre_nombre, a.piso
       FROM apartamentos a
       JOIN torres t ON t.id = a.torre_id
       WHERE a.id NOT IN (SELECT apartamento_id FROM residentes WHERE activo = TRUE)
       ORDER BY a.codigo`
    );
    res.json({ data: aptRes.rows });
  } catch (err) { next(err); }
});

module.exports = router;