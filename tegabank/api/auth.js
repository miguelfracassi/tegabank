const bcrypt = require('bcryptjs');
const { q, send, setSession, wrap } = require('./_lib');

module.exports = wrap(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const { action, name, email, password } = req.body || {};
  const em = String(email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em) || em.length > 200) return send(res, 400, { error: 'Enter a valid email.' });
  if (typeof password !== 'string' || password.length < 8 || password.length > 100) return send(res, 400, { error: 'Password must have at least 8 characters.' });

  if (action === 'signup') {
    const nm = String(name || '').trim().slice(0, 80);
    if (!nm) return send(res, 400, { error: 'Enter your name.' });
    try {
      const hash = await bcrypt.hash(password, 10);
      const r = await q('insert into users (email, password_hash, full_name) values ($1,$2,$3) returning id', [em, hash, nm]);
      setSession(res, r.rows[0].id);
      return send(res, 200, { ok: true });
    } catch (e) {
      if (e.code === '23505') return send(res, 409, { error: 'This email is already registered.' });
      throw e;
    }
  }
  const r = await q('select id, password_hash from users where email = $1', [em]);
  const u = r.rows[0];
  if (!u || !(await bcrypt.compare(password, u.password_hash))) return send(res, 401, { error: 'Wrong email or password.' });
  setSession(res, u.id);
  send(res, 200, { ok: true });
});
