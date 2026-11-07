const $app = document.getElementById('app');
async function api(path, method = 'GET', body) {
  const r = await fetch(path, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong.');
  return d;
}
const ic = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  pay: '<path d="M4 12h14M13 6l6 6-6 6"/>',
  hist: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  out: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>'
};
const svg = n => `<svg viewBox="0 0 24 24">${ic[n]}</svg>`;
const gbp = n => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
const split = n => { const [a, b] = Math.abs(n).toFixed(2).split('.'); return `${n < 0 ? '-' : ''}£${(+a).toLocaleString('en-GB')}<span>.${b}</span>`; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dotc = t => t.status === 'declined' ? 'var(--bad)' : t.status === 'pending' ? 'var(--warn)' : t.amount > 0 ? 'var(--ok)' : 'var(--blue)';

function totals(tx) {
  const d = tx.filter(t => t.status === 'completed');
  const inn = d.filter(t => t.amount > 0).reduce((a, t) => a + +t.amount, 0);
  const out = d.filter(t => t.amount < 0).reduce((a, t) => a - +t.amount, 0);
  return { inn, out, bal: inn - out };
}
function timeline(list, canDelete) {
  if (!list.length) return '<div class="empty">Nothing here yet.</div>';
  return `<div class="tl">${list.map(t => `<div class="row"><span class="dot" style="background:${dotc(t)}"></span>
  <div><b>${esc(t.title)}</b><small>${when(t.created_at)} · ${esc(t.category)}${t.status !== 'completed' ? ' · ' + t.status[0].toUpperCase() + t.status.slice(1) : ''}</small></div>
  <div class="amt ${t.amount > 0 ? 'in' : ''} ${t.status === 'declined' ? 'x' : ''}">${t.amount > 0 ? '+' : ''}${gbp(t.amount)}${canDelete ? `<button data-del="${t.id}">Delete</button>` : ''}</div></div>`).join('')}</div>`;
}
function header(sub, name) {
  const ini = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `<div class="top"><div class="av">${ini}</div><div><p class="mute">${sub}</p><h1>${esc(name)}</h1></div><div class="sp"></div>
  <button class="ib" id="logout" aria-label="Sign out">${svg('out')}</button></div>`;
}
function nav(active) {
  return `<nav class="nav"><a class="brand" href="/" style="padding:4px 12px 26px;color:var(--ink)"><img src="/favicon.svg" alt="">Tega Bank</a>${[['home', 'Home', 'home'], ['payments', 'Payments', 'pay'], ['historico', 'History', 'hist']]
    .map(([h, l, i]) => `<a href="/${h}" class="${active === h ? 'on' : ''}">${svg(i)}${l}</a>`).join('')}</nav>`;
}
const loadTx = () => api('/api/transactions');

// Protege a página: sem login volta para /login; com login chama page({ user, name, tx })
async function boot(active, page) {
  let me;
  try { me = await api('/api/me'); } catch { location.replace('/login'); return; }
  const ctx = { user: me, name: me.name || me.email, tx: await loadTx() };
  const render = async () => {
    ctx.tx = await loadTx();
    $app.innerHTML = '<main class="page">' + page(ctx) + '</main>' + nav(active);
    animateNums();
    document.getElementById('logout').onclick = async () => { await api('/api/logout', 'POST'); location.href = '/'; };
    if (window.bind) window.bind(ctx, render);
  };
  await render();
}
function animateNums() {
  document.querySelectorAll('[data-n]').forEach(el => {
    const n = +el.dataset.n, t0 = performance.now();
    (function f(t) { const p = Math.min(1, (t - t0) / 1100); el.innerHTML = split(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
  });
}
