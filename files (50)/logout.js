const { send, clearSession, wrap } = require('./_lib');
module.exports = wrap(async (req, res) => { clearSession(res); send(res, 200, { ok: true }); });
