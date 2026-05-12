/**
 * middlewares/auth.js
 * verifyToken  → valida el access token en cada request protegido
 * requireRol   → restringe acceso por rol (uso: requireRol('admin'))
 */

const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token requerido.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, nombre, rol, conjuntoId }
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Token expirado.'
      : 'Token inválido.';
    return res.status(401).json({ error: msg });
  }
}

function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción.' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRol };