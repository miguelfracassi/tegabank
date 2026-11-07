const { q, send, userId, wrap } = require('./_lib');
const STATUS = ['completed', 'pending', 'declined'];

function clean(t) {
  const title = String(t.title || '').trim().slice(0, 120);
  const amount = Math.round(Number(t.amount) * 100) / 100;
  if (!title || !Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1e9) return null;
  const d = t.created_at ? new Date(t.created_at) : new Date();
  if (isNaN(d)) return null;
  return { title, amount, status: STATUS.includes(t.status) ? t.status : 'completed',
    category: String(t.category || 'Other').trim().slice(0, 40) || 'Other', created_at: d.toISOString() };
}

module.exports = wrap(async (req, res) => {
  const id = userId(req);
  if (!id) return send(res, 401, { error: 'Not signed in' });

  if (req.method === 'GET') {
    const r = await q(`select id, title, amount::float8 as amount, category, status, created_at
      from transactions where user_id = $1 order by created_at desc limit 1000`, [id]);
    return send(res, 200, r.rows);
  }
  if (req.method === 'POST') {
    const body = req.body || {};
    const batch = Array.isArray(body.items);
    const rows = (batch ? body.items.slice(0, 50) : [body]).map(clean);
    if (!rows.length || rows.some(r => !r)) return send(res, 400, { error: 'Invalid transaction.' });
    if (!batch && rows[0].amount < 0 && rows[0].status === 'completed') {
      const b = await q(`select coalesce(sum(amount),0)::float8 as b from transactions where user_id = $1 and status = 'completed'`, [id]);
      if (b.rows[0].b + rows[0].amount < 0) return send(res, 400, { error: 'Not enough balance for this payment.' });
    }
    await q(`insert into transactions (user_id, title, amount, category, status, created_at)
      select $1, * from unnest($2::text[], $3::numeric[], $4::text[], $5::text[], $6::timestamptz[])`,
      [id, rows.map(r => r.title), rows.map(r => r.amount), rows.map(r => r.category), rows.map(r => r.status), rows.map(r => r.created_at)]);
    return send(res, 200, { ok: true });
  }
  if (req.method === 'DELETE') {
    if (req.query.all === '1') { await q('delete from transactions where user_id = $1', [id]); return send(res, 200, { ok: true }); }
    const tid = String(req.query.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(tid)) return send(res, 400, { error: 'Invalid id.' });
    await q('delete from transactions where id = $1 and user_id = $2', [tid, id]);
    return send(res, 200, { ok: true });
  }
  send(res, 405, { error: 'Method not allowed' });
});
