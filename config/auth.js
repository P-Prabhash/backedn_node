const jwt = require('jsonwebtoken');
const { getPool } = require('./database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'gold_pawn_erp_secure_auth_secret_2026_change_this';
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '86400', 10);

function normalizeRole(role) {
  if (!role) return '';
  return String(role).trim().replace(/[- ]/g, '_').toUpperCase();
}

function createAuthToken(user) {
  const payload = {
    sub: parseInt(user.id || 0, 10),
    username: String(user.username || ''),
    role: normalizeRole(user.role || ''),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyAuthToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const trimmed = token.trim();
    if (!trimmed) return null;
    return jwt.verify(trimmed, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

async function getAuthenticatedUserById(userId) {
  if (!userId || userId <= 0) return null;
  const db = await getPool();
  const [rows] = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

async function getAllPermissionCodes() {
  const db = await getPool();
  const [rows] = await db.query('SELECT permission_code FROM permissions ORDER BY id ASC');
  const codes = [];
  for (const r of rows) {
    const code = String(r.permission_code || '').trim().toLowerCase();
    if (code && !codes.includes(code)) {
      codes.push(code);
    }
  }
  return codes;
}

async function getDirectUserPermissionCodes(userId) {
  if (!userId || userId <= 0) return [];
  const db = await getPool();
  const [rows] = await db.query(`
    SELECT DISTINCT p.permission_code, p.id
    FROM user_permissions up
    INNER JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = ?
    ORDER BY p.id ASC
  `, [userId]);

  const codes = [];
  for (const r of rows) {
    const code = String(r.permission_code || '').trim().toLowerCase();
    if (code && !codes.includes(code)) {
      codes.push(code);
    }
  }
  return codes;
}

async function getUserPermissionCodes(user) {
  if (!user || !user.id) return [];
  const role = normalizeRole(user.role);
  if (role === 'ADMIN') {
    return await getAllPermissionCodes();
  }
  return await getDirectUserPermissionCodes(user.id);
}

function isAdminUser(user) {
  return normalizeRole(user ? user.role : '') === 'ADMIN';
}

module.exports = {
  JWT_SECRET,
  normalizeRole,
  createAuthToken,
  verifyAuthToken,
  getAuthenticatedUserById,
  getAllPermissionCodes,
  getDirectUserPermissionCodes,
  getUserPermissionCodes,
  isAdminUser,
};
