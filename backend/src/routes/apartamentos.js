const router = require('express').Router();
const controller = require('../controllers/apartamentosController');
const { verifyToken, requireRol } = require('../middlewares/auth');
const { setTenant } = require('../middlewares/tenant');

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

// ── Disponibles (sin protección de rol) ────────────
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