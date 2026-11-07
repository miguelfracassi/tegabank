const { q, send, userId, wrap } = require('./_lib');
module.exports = wrap(async (req, res) => {
  const id = userId(req);
  if (!id) return send(res, 401, { error: 'Not signed in' });
  const r = await q('select id, email, full_name as name from users where id = $1', [id]);
  if (!r.rows[0]) return send(res, 401, { error: 'Not signed in' });
  send(res, 200, r.rows[0]);
});
