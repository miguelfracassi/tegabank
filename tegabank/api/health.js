// Diagnóstico temporário. Abra /api/health e depois APAGUE este arquivo.
const { q, send } = require('./_lib');
module.exports = async (req, res) => {
  const out = { DATABASE_URL: !!process.env.DATABASE_URL, JWT_SECRET: !!process.env.JWT_SECRET };
  if (out.DATABASE_URL) {
    try { const u = new URL(process.env.DATABASE_URL); out.host = u.hostname; out.port = u.port; out.user = u.username; out.database = u.pathname; }
    catch (e) { out.url_error = 'DATABASE_URL nao e uma URL valida (cuidado com # ou @ na senha: use %23 e %40)'; }
  }
  try {
    await q('select 1'); out.db = 'connected';
    out.tables = (await q("select to_regclass('public.users') as users, to_regclass('public.transactions') as transactions")).rows[0];
  } catch (e) { out.db = 'error: ' + e.message; }
  send(res, 200, out);
};
