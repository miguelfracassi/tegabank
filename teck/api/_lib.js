const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// DATABASE_URL e JWT_SECRET vêm das variáveis de ambiente da Vercel
const pool = global._pool || (global._pool = new Pool({
  connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1
}));
const q = (text, params) => pool.query(text, params);
const send = (res, code, obj) => res.status(code).json(obj);

function secret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return process.env.JWT_SECRET;
}
function cookies(header) {
  const out = {};
  (header || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = c.slice(i + 1).trim(); });
  return out;
}
function setSession(res, id) {
  const t = jwt.sign({ sub: id }, secret(), { expiresIn: '7d' });
  res.setHeader('Set-Cookie', `session=${t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
}
function clearSession(res) { res.setHeader('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'); }
function userId(req) {
  try { return jwt.verify(cookies(req.headers.cookie).session, secret()).sub; } catch { return null; }
}
const wrap = fn => async (req, res) => {
  try { await fn(req, res); } catch (e) { console.error(e); send(res, 500, { error: 'Server error: ' + String(e.message || 'unknown').slice(0, 200) }); }
};
module.exports = { pool, q, send, setSession, clearSession, userId, wrap };
