/**
 * controllers/residentesController.js
 * GET    /api/residentes          → listar todos
 * GET    /api/residentes/:id      → obtener uno
 * POST   /api/residentes          → crear
 * PUT    /api/residentes/:id      → actualizar
 * DELETE /api/residentes/:id      → eliminar (soft delete)
 */

const Residente = require('../models/Residente');

// ── Listar ────────────────────────────────────────────────────
async function list(req, res, next) {
  try {
    const residentes = await Residente.findAll(req.tenantSchema);
    res.json({ data: residentes, total: residentes.length });
  } catch (err) { next(err); }
}

// ── Obtener uno ───────────────────────────────────────────────
async function getOne(req, res, next) {
  try {
    const residente = await Residente.findById(req.tenantSchema, req.params.id);
    if (!residente) return res.status(404).json({ error: 'Residente no encontrado.' });
    res.json({ data: residente });
  } catch (err) { next(err); }
}

// ── Crear ─────────────────────────────────────────────────────
async function create(req, res, next) {
  try {
    const { nombre, documento, tipo_documento, tipo_residente, telefono, email, fecha_ingreso, apto_codigo } = req.body;

    // Validaciones básicas
    if (!nombre || !documento || !email || !apto_codigo) {
      return res.status(400).json({ error: 'Campos requeridos: nombre, documento, email, apto_codigo.' });
    }

    // Validar formato email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido.' });
    }

    // Verificar que el documento no exista en el conjunto
    const duplicado = await Residente.findByDocumento(req.tenantSchema, documento);
    if (duplicado) {
      return res.status(409).json({ error: `Ya existe un residente con el documento ${documento} en este conjunto.` });
    }

    // Resolver el apartamento por código (ej: "A-101")
    const apto = await Residente.findApartamento(req.tenantSchema, apto_codigo);
    if (!apto) {
      return res.status(404).json({ error: `Apartamento ${apto_codigo} no encontrado en este conjunto.` });
    }

    const nuevo = await Residente.create(req.tenantSchema, {
      apartamento_id: apto.id,
      nombre, documento, tipo_documento, tipo_residente, telefono, email, fecha_ingreso,
    });

    res.status(201).json({ data: { ...nuevo, apto_codigo: apto.codigo }, message: 'Residente registrado correctamente.' });
  } catch (err) { next(err); }
}

// ── Actualizar ────────────────────────────────────────────────
async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { nombre, documento, tipo_documento, tipo_residente, telefono, email, fecha_ingreso, apto_codigo } = req.body;

    // Verificar que existe
    const existente = await Residente.findById(req.tenantSchema, id);
    if (!existente) return res.status(404).json({ error: 'Residente no encontrado.' });

    // Validar email si viene
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido.' });
    }

    // Validar documento único excluyendo el propio registro
    if (documento && documento !== existente.documento) {
      const duplicado = await Residente.findByDocumento(req.tenantSchema, documento, id);
      if (duplicado) {
        return res.status(409).json({ error: `Ya existe un residente con el documento ${documento} en este conjunto.` });
      }
    }

    // Resolver apartamento si cambió
    let apartamento_id;
    if (apto_codigo) {
      const apto = await Residente.findApartamento(req.tenantSchema, apto_codigo);
      if (!apto) return res.status(404).json({ error: `Apartamento ${apto_codigo} no encontrado.` });
      apartamento_id = apto.id;
    }

    const actualizado = await Residente.update(req.tenantSchema, id, {
      nombre, documento, tipo_documento, tipo_residente, telefono, email, fecha_ingreso,
      ...(apartamento_id && { apartamento_id }),
    });

    res.json({ data: actualizado, message: 'Residente actualizado correctamente.' });
  } catch (err) { next(err); }
}

// ── Eliminar (soft delete) ────────────────────────────────────
async function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const eliminado = await Residente.delete(req.tenantSchema, id);
    if (!eliminado) return res.status(404).json({ error: 'Residente no encontrado.' });
    res.json({ message: `Residente ${eliminado.nombre} eliminado correctamente.` });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };