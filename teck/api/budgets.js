const { q, send, userId, wrap } = require('./_lib');
module.exports = wrap(async (req, res) => {
  const id = userId(req);
  if (!id) return send(res, 401, { error: 'Not signed in' });
  if (req.method === 'GET') {
    const r = await q('select id, category, amount::float8 as amount from budgets where user_id = $1 order by category', [id]);
    return send(res, 200, r.rows);
  }
  if (req.method === 'POST') {
    const cat = String((req.body || {}).category || '').trim().slice(0, 40), amt = Math.round(Number((req.body || {}).amount) * 100) / 100;
    if (!cat || !Number.isFinite(amt) || amt <= 0 || amt > 1e9) return send(res, 400, { error: 'Pick a category and a limit above zero.' });
    await q('insert into budgets (user_id, category, amount) values ($1,$2,$3) on conflict (user_id, category) do update set amount = excluded.amount', [id, cat, amt]);
    return send(res, 200, { ok: true });
  }
  if (req.method === 'DELETE') {
    await q('delete from budgets where user_id = $1 and category = $2', [id, String(req.query.category || '')]);
    return send(res, 200, { ok: true });
  }
  send(res, 405, { error: 'Method not allowed' });
});
