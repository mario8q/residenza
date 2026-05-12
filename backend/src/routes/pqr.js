const router = require('express').Router();
const { verifyToken, requireRol } = require('../middlewares/auth');
const { setTenant } = require('../middlewares/tenant');

// GET /api/pqr - Listar PQRs
router.get('/', verifyToken, setTenant, async (req, res, next) => {
  try {
    const result = await req.tenantQuery(
      `SELECT p.id, p.radicado, p.tipo, p.asunto, p.descripcion, p.prioridad, 
              p.estado, p.created_at AS fecha, a.codigo AS apto
       FROM pqr p
       LEFT JOIN apartamentos a ON a.id = p.apartamento_id
       ORDER BY p.created_at DESC`
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

// POST /api/pqr - Crear PQR
router.post('/', verifyToken, setTenant, async (req, res, next) => {
  try {
    const { tipo, asunto, descripcion, prioridad, apto_codigo } = req.body;

    if (!tipo || !asunto) {
      return res.status(400).json({ error: 'Tipo y asunto son requeridos.' });
    }

    // Obtener apartamento por código
    const aptRes = await req.tenantQuery(
      `SELECT id FROM apartamentos WHERE codigo = $1`,
      [apto_codigo.toUpperCase()]
    );

    if (aptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Apartamento no encontrado.' });
    }

    const apartamento_id = aptRes.rows[0].id;

    // Obtener próximo radicado
    const radicadoRes = await req.tenantQuery(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(radicado, 2) AS INTEGER)), 0) + 1 AS next_num FROM pqr`
    );
    const nextNum = radicadoRes.rows[0].next_num;
    const radicado = `#${String(nextNum).padStart(3, '0')}`;

    // Crear PQR
    const result = await req.tenantQuery(
      `INSERT INTO pqr (radicado, apartamento_id, tipo, asunto, descripcion, prioridad, estado, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'Abierto', NOW())
       RETURNING id, radicado, tipo, asunto, descripcion, prioridad, estado, created_at AS fecha`,
      [radicado, apartamento_id, tipo, asunto, descripcion || null, prioridad || 'Baja']
    );

    res.status(201).json({ 
      data: result.rows[0],
      message: `PQR radicada como ${radicado}`
    });
  } catch (err) { next(err); }
});

// PUT /api/pqr/:id - Cambiar estado (solo admin)
router.put('/:id', verifyToken, requireRol('admin'), setTenant, async (req, res, next) => {
  try {
    const { estado } = req.body;
    const id = parseInt(req.params.id);

    if (!['Abierto', 'En proceso', 'Cerrado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido.' });
    }

    const result = await req.tenantQuery(
      `UPDATE pqr SET estado = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PQR no encontrado.' });
    }

    res.json({ data: result.rows[0], message: 'PQR actualizada' });
  } catch (err) { next(err); }
});

module.exports = router;