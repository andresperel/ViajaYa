const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'Se requiere un token de autenticacion.' });
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    return res.status(401).json({ mensaje: 'Se requiere un token de autenticacion.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'viajaya-api',
      audience: process.env.JWT_AUDIENCE || 'viajaya-mobile',
    });
    req.auth = { userId: Number(payload.sub), email: payload.email };
    return next();
  } catch (error) {
    return res.status(401).json({
      mensaje: error.name === 'TokenExpiredError'
        ? 'Tu sesion vencio. Inicia sesion nuevamente.'
        : 'Token invalido.',
    });
  }
}

module.exports = { requireAuth };
