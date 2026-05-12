const router = require('express').Router();
const { verifyToken, requireRol } = require('../middlewares/auth');
const { setTenant } = require('../middlewares/tenant');

// GET /api/cuotas - Listar pagos
router.get('/', verifyToken, setTenant, async (req, res, next) => {
  try {
    const result = await req.tenantQuery(
      `SELECT p.id, p.monto, p.medio_pago AS medio, p.referencia AS ref, p.fecha_pago AS fecha,
              p.numero_recibo AS recibo, a.codigo AS apto, r.nombre AS residente
       FROM pagos p
       LEFT JOIN apartamentos a ON a.id = p.apartamento_id
       LEFT JOIN residentes r ON r.apartamento_id = a.id
       ORDER BY p.created_at DESC`
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

// GET /api/cuotas/residente - Mis cuotas (para residentes)
router.get('/residente/mis-cuotas', verifyToken, setTenant, async (req, res, next) => {
  try {
    const residenteId = req.user.id;

    const result = await req.tenantQuery(
      `SELECT p.id, p.monto, p.medio_pago AS medio, p.referencia AS ref, p.fecha_pago AS fecha,
              p.numero_recibo AS recibo, a.codigo AS apto
       FROM pagos p
       LEFT JOIN apartamentos a ON a.id = p.apartamento_id
       LEFT JOIN residentes r ON r.apartamento_id = a.id
       WHERE r.id = $1
       ORDER BY p.created_at DESC`,
      [residenteId]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

// POST /api/cuotas - Registrar pago
router.post('/', verifyToken, requireRol('admin'), setTenant, async (req, res, next) => {
  try {
    const { apto_codigo, monto, medio_pago, fecha_pago, referencia } = req.body;

    if (!apto_codigo || !monto || !fecha_pago) {
      return res.status(400).json({ error: 'Campos requeridos: apto_codigo, monto, fecha_pago.' });
    }

    // Obtener apartamento
    const aptRes = await req.tenantQuery(
      `SELECT id FROM apartamentos WHERE codigo = $1`,
      [apto_codigo.toUpperCase()]
    );

    if (aptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Apartamento no encontrado.' });
    }

    const apartamento_id = aptRes.rows[0].id;

    // Generar número de recibo
    const reciboRes = await req.tenantQuery(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(numero_recibo, 5) AS INTEGER)), 0) + 1 AS next_num FROM pagos`
    );
    const nextNum = reciboRes.rows[0].next_num;
    const numero_recibo = `REC-${String(nextNum).padStart(4, '0')}`;

    // Registrar pago
    const result = await req.tenantQuery(
      `INSERT INTO pagos (apartamento_id, monto, medio_pago, referencia, fecha_pago, numero_recibo, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, monto, medio_pago AS medio, referencia AS ref, fecha_pago AS fecha, numero_recibo AS recibo`,
      [apartamento_id, monto, medio_pago || 'Transferencia', referencia || null, fecha_pago, numero_recibo]
    );

    res.status(201).json({ 
      data: result.rows[0],
      message: `Pago registrado. Recibo: ${numero_recibo}`
    });
  } catch (err) { next(err); }
});

module.exports = router;