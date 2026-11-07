const { q, send, userId, wrap } = require('./_lib');
module.exports = wrap(async (req, res) => {
  const id = userId(req);
  if (!id) return send(res, 401, { error: 'Not signed in' });
  if (req.method === 'GET') {
    const r = await q('select id, category, amount::float8 as amount, active from budgets where user_id = $1 order by category', [id]);
    return send(res, 200, r.rows);
  }
  if (req.method === 'POST') {
    const b = req.body || {};
    if (b.action === 'toggle') {
      await q('update budgets set active = $1 where user_id = $2 and category = $3', [!!b.active, id, String(b.category || '')]);
      return send(res, 200, { ok: true });
    }
    const cat = String(b.category || '').trim().slice(0, 40), amt = Math.round(Number(b.amount) * 100) / 100;
    if (!cat || !Number.isFinite(amt) || amt <= 0 || amt > 1e9) return send(res, 400, { error: 'Pick a category and a limit above zero.' });
    if (b.action === 'edit') {
      try {
        const r = await q('update budgets set category = $1, amount = $2 where user_id = $3 and category = $4', [cat, amt, id, String(b.old || '')]);
        return r.rowCount ? send(res, 200, { ok: true }) : send(res, 404, { error: 'Budget not found.' });
      } catch (e) { if (e.code === '23505') return send(res, 409, { error: 'You already have a budget for that category.' }); throw e; }
    }
    await q('insert into budgets (user_id, category, amount) values ($1,$2,$3) on conflict (user_id, category) do update set amount = excluded.amount', [id, cat, amt]);
    return send(res, 200, { ok: true });
  }
  if (req.method === 'DELETE') {
    await q('delete from budgets where user_id = $1 and category = $2', [id, String(req.query.category || '')]);
    return send(res, 200, { ok: true });
  }
  send(res, 405, { error: 'Method not allowed' });
});
