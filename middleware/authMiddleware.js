const {
  verifyAuthToken,
  getAuthenticatedUserById,
  getUserPermissionCodes,
  isAdminUser,
  normalizeRole
} = require('../config/auth');

function getBearerToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function authenticate(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const payload = verifyAuthToken(token);
    if (!payload || !payload.sub) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const user = await getAuthenticatedUserById(payload.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const status = String(user.status || '').trim().toUpperCase();
    if (status !== '' && !['ACTIVE', 'ENABLED'].includes(status)) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive.'
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error: ' + err.message
    });
  }
}

function requireAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Administrator access required.'
      });
    }
    return next();
  });
}

function requireExactAdmin(req, res, next) {
  authenticate(req, res, () => {
    const role = normalizeRole(req.user ? req.user.role : '');
    if (role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only the main ADMIN can access this module.'
      });
    }
    return next();
  });
}

function requirePermission(permissionCode) {
  return async (req, res, next) => {
    try {
      let authDone = false;
      await new Promise((resolve) => {
        authenticate(req, res, () => {
          authDone = true;
          resolve();
        });
      });

      if (!authDone || res.headersSent) {
        return;
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      if (isAdminUser(req.user)) {
        return next();
      }

      const permissions = await getUserPermissionCodes(req.user);
      const code = String(permissionCode || '').trim().toLowerCase();

      if (!permissions.includes(code)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action.'
        });
      }

      return next();
    } catch (err) {
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Permission middleware error: ' + err.message
        });
      }
    }
  };
}

module.exports = {
  authenticate,
  requireAdmin,
  requireExactAdmin,
  requirePermission,
};
