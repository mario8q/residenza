const router = require('express').Router();
const { verifyToken, requireRol } = require('../middlewares/auth');
const { setTenant } = require('../middlewares/tenant');

// ── Helper: Obtener o crear período ────────────────────────────
async function getOrCreatePeriodo(tenantQuery, anio, mes, cuotaBase) {
  // Intentar obtener el período
  let result = await tenantQuery(
    `SELECT id FROM periodos WHERE anio = $1 AND mes = $2`,
    [anio, mes]
  );

  if (result.rows.length > 0) {
    return result.rows[0].id;
  }

  // Si no existe, crear uno
  // Calcular fecha de vencimiento (último día del mes)
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const fechaVence = `${anio}-${String(mes).padStart(2, '0')}-${ultimoDia}`;

  const createResult = await tenantQuery(
    `INSERT INTO periodos (anio, mes, cuota_base, fecha_vence, tasa_mora)
     VALUES ($1, $2, $3, $4, 0.015)
     RETURNING id`,
    [anio, mes, cuotaBase, fechaVence]
  );

  return createResult.rows[0].id;
}

// ── Helper: Obtener o crear obligación ────────────────────────
async function getOrCreateObligacion(tenantQuery, periodoId, apartamentoId, montoBasse) {
  // Intentar obtener la obligación
  let result = await tenantQuery(
    `SELECT id FROM obligaciones WHERE periodo_id = $1 AND apartamento_id = $2`,
    [periodoId, apartamentoId]
  );

  if (result.rows.length > 0) {
    return result.rows[0].id;
  }

  // Si no existe, crear una
  const createResult = await tenantQuery(
    `INSERT INTO obligaciones (periodo_id, apartamento_id, monto_base, interes_mora)
     VALUES ($1, $2, $3, 0)
     RETURNING id`,
    [periodoId, apartamentoId, montoBasse]
  );

  return createResult.rows[0].id;
}

// GET /api/cuotas - Listar pagos (solo admin)
router.get('/', verifyToken, setTenant, async (req, res, next) => {
  try {
    const result = await req.tenantQuery(
      `SELECT p.id, p.monto, p.medio_pago AS medio, p.referencia AS ref, p.fecha_pago AS fecha,
              p.numero_recibo AS recibo, a.codigo AS apto,
              (SELECT nombre FROM residentes WHERE apartamento_id = a.id LIMIT 1) AS residente
       FROM pagos p
       LEFT JOIN apartamentos a ON a.id = p.apartamento_id
       ORDER BY p.created_at DESC`
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

// GET /api/cuotas/residente/mis-cuotas - Mis cuotas (para residentes)
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

// POST /api/cuotas - Registrar pago (solo admin)
router.post('/', verifyToken, requireRol('admin'), setTenant, async (req, res, next) => {
  try {
    const { apto_codigo, monto, medio_pago, fecha_pago, referencia } = req.body;

    if (!apto_codigo || !monto || !fecha_pago) {
      return res.status(400).json({ error: 'Campos requeridos: apto_codigo, monto, fecha_pago.' });
    }

    if (Number(monto) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
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

    // Obtener la cuota base del conjunto (viene del token)
    const cuotaBase = req.user.cuotaBase || 210000;

    // Extraer año y mes de fecha_pago (formato: YYYY-MM-DD)
    const [anio, mes] = fecha_pago.split('-').map(Number);

    // Obtener o crear período
    const periodoId = await getOrCreatePeriodo(req.tenantQuery, anio, mes, cuotaBase);

    // Obtener o crear obligación
    const obligacionId = await getOrCreateObligacion(req.tenantQuery, periodoId, apartamento_id, cuotaBase);

    // Generar número de recibo
    const reciboRes = await req.tenantQuery(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(numero_recibo, 5) AS INTEGER)), 0) + 1 AS next_num FROM pagos`
    );
    const nextNum = reciboRes.rows[0].next_num;
    const numero_recibo = `REC-${String(nextNum).padStart(4, '0')}`;

    // Registrar pago
    const result = await req.tenantQuery(
      `INSERT INTO pagos (obligacion_id, apartamento_id, monto, medio_pago, referencia, fecha_pago, numero_recibo, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, monto, medio_pago AS medio, referencia AS ref, fecha_pago AS fecha, numero_recibo AS recibo`,
      [obligacionId, apartamento_id, monto, medio_pago || 'Transferencia', referencia || null, fecha_pago, numero_recibo]
    );

    res.status(201).json({ 
      data: result.rows[0],
      message: `Pago registrado. Recibo: ${numero_recibo}`
    });
  } catch (err) { next(err); }
});

// POST /api/cuotas/residente/pagar - Residentes registran su propio pago
router.post('/residente/pagar', verifyToken, setTenant, async (req, res, next) => {
  try {
    const residenteId = req.user.id;
    const { monto, medio_pago, referencia, fecha_pago } = req.body;

    if (!monto || !fecha_pago) {
      return res.status(400).json({ error: 'Campos requeridos: monto, fecha_pago.' });
    }

    if (Number(monto) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
    }

    // Obtener apartamento del residente
    const resRes = await req.tenantQuery(
      `SELECT apartamento_id FROM residentes WHERE id = $1`,
      [residenteId]
    );

    if (resRes.rows.length === 0) {
      return res.status(404).json({ error: 'Residente no encontrado.' });
    }

    const apartamento_id = resRes.rows[0].apartamento_id;

    // Obtener la cuota base del conjunto (viene del token o usa default)
    const cuotaBase = req.user.cuotaBase || 210000;

    // Extraer año y mes de fecha_pago
    const [anio, mes] = fecha_pago.split('-').map(Number);

    // Obtener o crear período
    const periodoId = await getOrCreatePeriodo(req.tenantQuery, anio, mes, cuotaBase);

    // Obtener o crear obligación
    const obligacionId = await getOrCreateObligacion(req.tenantQuery, periodoId, apartamento_id, cuotaBase);

    // Generar número de recibo
    const reciboRes = await req.tenantQuery(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(numero_recibo, 5) AS INTEGER)), 0) + 1 AS next_num FROM pagos`
    );
    const nextNum = reciboRes.rows[0].next_num;
    const numero_recibo = `REC-${String(nextNum).padStart(4, '0')}`;

    // Registrar pago
    const result = await req.tenantQuery(
      `INSERT INTO pagos (obligacion_id, apartamento_id, monto, medio_pago, referencia, fecha_pago, numero_recibo, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, monto, medio_pago AS medio, referencia AS ref, fecha_pago AS fecha, numero_recibo AS recibo`,
      [obligacionId, apartamento_id, Number(monto), medio_pago || 'Transferencia', referencia || null, fecha_pago, numero_recibo]
    );

    res.status(201).json({
      data: result.rows[0],
      message: `¡Pago registrado exitosamente! Recibo: ${numero_recibo}`
    });
  } catch (err) { next(err); }
});

// GET /api/cuotas/estado/admin - Estado actual de todos los residentes (ADMIN)
router.get('/estado/admin', verifyToken, requireRol('admin'), setTenant, async (req, res, next) => {
  try {
    // Obtener mes y año actual
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const mesFull = `${anio}-${mes}`;

    const result = await req.tenantQuery(
      `SELECT 
        a.id,
        a.codigo AS apto,
        r.nombre,
        p.cuota_base,
        COALESCE(SUM(pag.monto), 0)::NUMERIC(12,2) AS pagado,
        (p.cuota_base - COALESCE(SUM(pag.monto), 0))::NUMERIC(12,2) AS saldo,
        CASE 
          WHEN COALESCE(SUM(pag.monto), 0) >= p.cuota_base THEN 'Pagado'
          WHEN COALESCE(SUM(pag.monto), 0) > 0 THEN 'Parcial'
          ELSE 'Pendiente'
        END AS estado
       FROM apartamentos a
       LEFT JOIN residentes r ON r.apartamento_id = a.id
       LEFT JOIN periodos p ON p.anio = $1 AND LPAD(p.mes::TEXT, 2, '0') = $2
       LEFT JOIN obligaciones o ON o.apartamento_id = a.id AND o.periodo_id = p.id
       LEFT JOIN pagos pag ON pag.obligacion_id = o.id
       WHERE p.id IS NOT NULL
       GROUP BY a.id, a.codigo, r.nombre, p.cuota_base
       ORDER BY a.codigo ASC`,
      [anio, mes]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

// GET /api/cuotas/estado/residente - Mi estado actual (RESIDENTE)
router.get('/estado/residente', verifyToken, setTenant, async (req, res, next) => {
  try {
    const residenteId = req.user.id;
    
    // Obtener mes y año actual
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');

    const result = await req.tenantQuery(
      `SELECT 
        a.codigo AS apto,
        r.nombre,
        p.cuota_base,
        COALESCE(SUM(pag.monto), 0)::NUMERIC(12,2) AS pagado,
        (p.cuota_base - COALESCE(SUM(pag.monto), 0))::NUMERIC(12,2) AS saldo,
        CASE 
          WHEN COALESCE(SUM(pag.monto), 0) >= p.cuota_base THEN 'Pagado'
          WHEN COALESCE(SUM(pag.monto), 0) > 0 THEN 'Parcial'
          ELSE 'Pendiente'
        END AS estado
       FROM residentes r
       LEFT JOIN apartamentos a ON r.apartamento_id = a.id
       LEFT JOIN periodos p ON p.anio = $1 AND LPAD(p.mes::TEXT, 2, '0') = $2
       LEFT JOIN obligaciones o ON o.apartamento_id = a.id AND o.periodo_id = p.id
       LEFT JOIN pagos pag ON pag.obligacion_id = o.id
       WHERE r.id = $3 AND p.id IS NOT NULL
       GROUP BY r.id, a.codigo, r.nombre, p.cuota_base`,
      [anio, mes, residenteId]
    );
    
    res.json({ data: result.rows[0] || null });
  } catch (err) { next(err); }
});

module.exports = router;