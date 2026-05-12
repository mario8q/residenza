const router = require('express').Router();
const { verifyToken, requireRol } = require('../middlewares/auth');
const { setTenant } = require('../middlewares/tenant');

// GET /api/comunicados - Listar comunicados
router.get('/', verifyToken, setTenant, async (req, res, next) => {
  try {
    const result = await req.tenantQuery(
      `SELECT id, asunto, mensaje, destinatarios, prioridad, 
              COALESCE(num_enviados, 0) AS enviados,
              COALESCE(num_lecturas, 0) AS lecturas,
              created_at AS fecha
       FROM comunicados
       ORDER BY created_at DESC`
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

// POST /api/comunicados - Crear comunicado (solo admin)
router.post('/', verifyToken, requireRol('admin'), setTenant, async (req, res, next) => {
  try {
    const { asunto, mensaje, destinatarios, prioridad } = req.body;

    if (!asunto || !mensaje) {
      return res.status(400).json({ error: 'Asunto y mensaje son requeridos.' });
    }

    const result = await req.tenantQuery(
      `INSERT INTO comunicados (asunto, mensaje, destinatarios, prioridad, num_enviados, num_lecturas, created_at)
       VALUES ($1, $2, $3, $4, 0, 0, NOW())
       RETURNING id, asunto, mensaje, destinatarios, prioridad, 
                 COALESCE(num_enviados, 0) AS enviados,
                 COALESCE(num_lecturas, 0) AS lecturas,
                 created_at AS fecha`,
      [asunto, mensaje, destinatarios || 'General', prioridad || 'Normal']
    );

    res.status(201).json({ 
      data: result.rows[0],
      message: `Comunicado "${asunto}" enviado.`
    });
  } catch (err) { next(err); }
});

module.exports = router;