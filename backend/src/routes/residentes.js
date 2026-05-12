const router = require('express').Router();
const controller = require('../controllers/residentesController');
const { verifyToken, requireRol } = require('../middlewares/auth');
const { setTenant } = require('../middlewares/tenant');

// Todas las rutas requieren autenticación
router.use(verifyToken, setTenant);

// GET - Listar residentes (solo admin)
router.get('/', requireRol('admin'), controller.list);

// GET - Obtener uno (admin o el residente de sí mismo)
router.get('/:id', async (req, res, next) => {
  const { user } = req;
  const residenteId = parseInt(req.params.id);
  
  // Admin puede ver cualquiera, residente solo a sí mismo
  if (user.rol === 'residente' && user.id !== residenteId) {
    return res.status(403).json({ error: 'No tienes permiso.' });
  }
  
  controller.getOne(req, res, next);
});

// POST - Crear residente (solo admin)
router.post('/', requireRol('admin'), controller.create);

// PUT - Actualizar (solo admin)
router.put('/:id', requireRol('admin'), controller.update);

// DELETE - Eliminar (solo admin)
router.delete('/:id', requireRol('admin'), controller.remove);

module.exports = router;