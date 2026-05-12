const router = require('express').Router();
const { query } = require('../config/database');

// Obtener apartamentos disponibles (sin residente asignado)
router.get('/disponibles', async (req, res, next) => {
  try {
    const conjuntosRes = await query(
      'SELECT id, schema_name FROM public.conjuntos WHERE activo = TRUE'
    );
    const conjuntos = conjuntosRes.rows;

    let apartamentos = [];

    for (const conjunto of conjuntos) {
      const { conjuntoQuery } = require('../config/database');
      const aptRes = await conjuntoQuery(
        conjunto.schema_name,
        `SELECT a.id, a.codigo, t.nombre AS torre_nombre, a.piso
         FROM apartamentos a
         JOIN torres t ON t.id = a.torre_id
         WHERE a.id NOT IN (SELECT apartamento_id FROM residentes WHERE activo = TRUE)
         ORDER BY a.codigo`
      );

      apartamentos.push(...aptRes.rows);
    }

    res.json({ data: apartamentos });
  } catch (err) {
    next(err);
  }
});

module.exports = router;