/**
 * routes/auth.js
 * POST /api/auth/login         → iniciar sesión
 * POST /api/auth/refresh       → renovar access token
 * POST /api/auth/logout        → cerrar sesión
 */
 
const router     = require('express').Router();
const controller = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
 
router.post('/login',   controller.login);
router.post('/login/residente', controller.loginResidente);
router.post('/register/residente',    controller.registerResidente);
router.post('/cambiar-password',      verifyToken, controller.cambiarPassword);
router.post('/refresh', controller.refresh);
router.post('/logout',  verifyToken, controller.logout);
router.get('/conjuntos/disponibles', async (req, res, next) => {
  try {
    const { query: dbQuery } = require('../config/database');
    const { rows } = await dbQuery(
      `SELECT id, nombre FROM public.conjuntos WHERE activo = TRUE ORDER BY nombre`
    );
    res.json({ data: rows });
  } catch (err) { next(err); }
});

module.exports = router;