const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No autorizado: token requerido' });

  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Formato de token inválido' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Si es admin o superadmin, puede delegar en una sede específica vía header
    if (payload.role === 'ADMIN_TENANT' || payload.role === 'SUPERADMIN') {
      const headerSedeId = req.headers['x-sede-id'];
      if (headerSedeId && headerSedeId !== 'null' && headerSedeId !== 'undefined') {
        payload.sedeId = parseInt(headerSedeId, 10);
      }
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado: Rol insuficiente' });
    }
    next();
  };
}

module.exports = { auth: authMiddleware, requireRole };
