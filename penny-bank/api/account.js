const bcrypt = require('bcryptjs');
const { q, send, userId, clearSession, wrap } = require('./_lib');
module.exports = wrap(async (req, res) => {
  const id = userId(req);
  if (!id) return send(res, 401, { error: 'Not signed in' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const { action, name, current, password } = req.body || {};
  if (action === 'name') {
    const nm = String(name || '').trim().slice(0, 80);
    if (!nm) return send(res, 400, { error: 'Enter your name.' });
    await q('update users set full_name = $1 where id = $2', [nm, id]);
    return send(res, 200, { ok: true });
  }
  const u = (await q('select password_hash from users where id = $1', [id])).rows[0];
  if (!u) return send(res, 401, { error: 'Not signed in' });
  if (!(await bcrypt.compare(String(current || ''), u.password_hash))) return send(res, 401, { error: 'Current password is wrong.' });
  if (action === 'password') {
    if (typeof password !== 'string' || password.length < 8 || password.length > 100) return send(res, 400, { error: 'New password must have at least 8 characters.' });
    await q('update users set password_hash = $1 where id = $2', [await bcrypt.hash(password, 10), id]);
    return send(res, 200, { ok: true });
  }
  if (action === 'delete') { await q('delete from users where id = $1', [id]); clearSession(res); return send(res, 200, { ok: true }); }
  send(res, 400, { error: 'Unknown action.' });
});
