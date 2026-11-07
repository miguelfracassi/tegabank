const { pool, q, send, userId, wrap } = require('./_lib');
const money = v => Math.round(Number(v) * 100) / 100;

module.exports = wrap(async (req, res) => {
  const id = userId(req);
  if (!id) return send(res, 401, { error: 'Not signed in' });

  if (req.method === 'GET') {
    const r = await q('select id, name, target::float8 as target, saved::float8 as saved, active from goals where user_id = $1 order by created_at desc', [id]);
    return send(res, 200, r.rows);
  }
  if (req.method === 'POST') {
    const { action, name, target, amount, id: gid } = req.body || {};
    if (action === 'create') {
      const nm = String(name || '').trim().slice(0, 60), t = money(target);
      if (!nm || !Number.isFinite(t) || t <= 0 || t > 1e9) return send(res, 400, { error: 'Enter a name and a target above zero.' });
      await q('insert into goals (user_id, name, target) values ($1,$2,$3)', [id, nm, t]);
      return send(res, 200, { ok: true });
    }
    if (action === 'edit') {
      const nm = String(name || '').trim().slice(0, 60), t = money(target);
      if (!nm || !Number.isFinite(t) || t <= 0 || t > 1e9) return send(res, 400, { error: 'Enter a name and a target above zero.' });
      const r = await q('update goals set name = $1, target = $2 where id = $3 and user_id = $4', [nm, t, gid, id]);
      return r.rowCount ? send(res, 200, { ok: true }) : send(res, 404, { error: 'Goal not found.' });
    }
    if (action === 'toggle') {
      const r = await q('update goals set active = $1 where id = $2 and user_id = $3', [!!(req.body || {}).active, gid, id]);
      return r.rowCount ? send(res, 200, { ok: true }) : send(res, 404, { error: 'Goal not found.' });
    }
    if (action === 'move') {
      const amt = money(amount);
      if (!Number.isFinite(amt) || amt === 0 || Math.abs(amt) > 1e9) return send(res, 400, { error: 'Enter a valid amount.' });
      const c = await pool.connect();
      try {
        await c.query('begin');
        const g = (await c.query('select name, saved::float8 as saved, active from goals where id = $1 and user_id = $2 for update', [gid, id])).rows[0];
        if (!g) { await c.query('rollback'); return send(res, 404, { error: 'Goal not found.' }); }
        if (!g.active) { await c.query('rollback'); return send(res, 400, { error: 'This goal is disabled. Turn it on to move money.' }); }
        if (amt > 0) {
          const b = (await c.query(`select coalesce(sum(amount),0)::float8 as b from transactions where user_id = $1 and status = 'completed' and active`, [id])).rows[0].b;
          if (b < amt) { await c.query('rollback'); return send(res, 400, { error: 'Not enough balance for this.' }); }
        } else if (g.saved + amt < 0) { await c.query('rollback'); return send(res, 400, { error: 'You cannot withdraw more than is saved.' }); }
        await c.query('update goals set saved = saved + $1 where id = $2', [amt, gid]);
        await c.query(`insert into transactions (user_id, title, amount, category, status) values ($1,$2,$3,'Savings','completed')`,
          [id, (amt > 0 ? 'Saved to ' : 'Withdrawn from ') + g.name, -amt]);
        await c.query('commit');
        return send(res, 200, { ok: true });
      } catch (e) { await c.query('rollback').catch(() => {}); throw e; } finally { c.release(); }
    }
    return send(res, 400, { error: 'Unknown action.' });
  }
  if (req.method === 'DELETE') {
    const gid = String(req.query.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(gid)) return send(res, 400, { error: 'Invalid id.' });
    const c = await pool.connect();
    try {
      await c.query('begin');
      const g = (await c.query('select name, saved::float8 as saved from goals where id = $1 and user_id = $2 for update', [gid, id])).rows[0];
      if (!g) { await c.query('rollback'); return send(res, 404, { error: 'Goal not found.' }); }
      if (g.saved > 0) await c.query(`insert into transactions (user_id, title, amount, category, status) values ($1,$2,$3,'Savings','completed')`, [id, 'Returned from ' + g.name, g.saved]);
      await c.query('delete from goals where id = $1', [gid]);
      await c.query('commit');
      return send(res, 200, { ok: true });
    } catch (e) { await c.query('rollback').catch(() => {}); throw e; } finally { c.release(); }
  }
  send(res, 405, { error: 'Method not allowed' });
});
