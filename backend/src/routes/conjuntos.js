const router = require('express').Router();
const { verifyToken } = require('../middlewares/auth');
const { query } = require('../config/database');

// GET /api/conjuntos - Obtener datos del conjunto del admin actual
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { conjuntoId } = req.user;

    if (!conjuntoId) {
      return res.status(400).json({ error: 'Usuario sin conjunto asignado.' });
    }

    const result = await query(
      `SELECT id, nombre, nit, ciudad, direccion, telefono, 
              cuota_base AS cuotaBase, num_torres AS torres, 
              num_aptos AS aptos
       FROM public.conjuntos 
       WHERE id = $1 AND activo = TRUE`,
      [conjuntoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conjunto no encontrado.' });
    }

    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;