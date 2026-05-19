const router = require('express').Router();
const controller = require('../controllers/apartamentosController');
const { verifyToken, requireRol } = require('../middlewares/auth');
const { setTenant } = require('../middlewares/tenant');
const { conjuntoQuery, query } = require('../config/database');

// ════════════════════════════════════════════════════════════════
// RUTAS PÚBLICAS (para registro de residentes)
// ════════════════════════════════════════════════════════════════

// GET torres de un conjunto (sin autenticación)
router.get('/publicas/conjuntos/:conjuntoId/torres', async (req, res, next) => {
  try {
    const { conjuntoId } = req.params;

    const conjRes = await query(
      'SELECT id, schema_name FROM public.conjuntos WHERE id = $1 AND activo = TRUE',
      [parseInt(conjuntoId)]
    );

    if (conjRes.rows.length === 0) {
      return res.status(404).json({ error: 'Conjunto no encontrado.' });
    }

    const conjunto = conjRes.rows[0];

    const torresRes = await conjuntoQuery(
      conjunto.schema_name,
      `SELECT id, nombre, num_pisos FROM torres ORDER BY nombre ASC`
    );

    res.json({ data: torresRes.rows });
  } catch (err) { next(err); }
});

// GET apartamentos de una torre (sin autenticación)
router.get('/publicas/conjuntos/:conjuntoId/torres/:torreId/apartamentos', async (req, res, next) => {
  try {
    const { conjuntoId, torreId } = req.params;

    const conjRes = await query(
      'SELECT id, schema_name FROM public.conjuntos WHERE id = $1 AND activo = TRUE',
      [parseInt(conjuntoId)]
    );

    if (conjRes.rows.length === 0) {
      return res.status(404).json({ error: 'Conjunto no encontrado.' });
    }

    const conjunto = conjRes.rows[0];

    const aptRes = await conjuntoQuery(
      conjunto.schema_name,
      `SELECT 
        a.id, a.codigo, a.numero, a.piso, a.area_m2,
        t.nombre AS torre, t.id as torre_id
      FROM apartamentos a
      JOIN torres t ON t.id = a.torre_id
      WHERE a.torre_id = $1
        AND a.id NOT IN (SELECT apartamento_id FROM residentes WHERE activo = TRUE)
      ORDER BY a.piso ASC, a.numero ASC`,
      [parseInt(torreId)]
    );

    res.json({ data: aptRes.rows });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════
// RUTAS AUTENTICADAS (para admin)
// ════════════════════════════════════════════════════════════════

router.use(verifyToken, setTenant);

// Torres
router.get('/torres',            requireRol('admin'), controller.listTorres);
router.post('/torres',           requireRol('admin'), controller.createTorre);
router.delete('/torres/:id',     requireRol('admin'), controller.deleteTorre);

// Apartamentos
router.get('/',                  requireRol('admin'), controller.listApartamentos);
router.post('/',                 requireRol('admin'), controller.createApartamento);
router.delete('/:id',            requireRol('admin'), controller.deleteApartamento);

// Disponibles
router.get('/disponibles', async (req, res, next) => {
  try {
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