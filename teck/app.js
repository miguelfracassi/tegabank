const $app = document.getElementById('app');
const EXP = ['Food', 'Eating out', 'Bills', 'Subscriptions', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Travel', 'Education', 'Gifts', 'Other'];
const INC = ['Income', 'Transfer', 'Gift', 'Refund'];

// tema (claro / escuro)
const getTheme = () => { try { return localStorage.getItem('tega-theme'); } catch { return null; } };
const setTheme = t => { document.documentElement.dataset.theme = t; try { localStorage.setItem('tega-theme', t); } catch {} };
document.documentElement.dataset.theme = getTheme() || 'light';

async function api(path, method = 'GET', body) {
  const r = await fetch(path, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong.');
  return d;
}
const ic = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  pay: '<path d="M4 12h14M13 6l6 6-6 6"/>',
  plan: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
  hist: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  set: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  out: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>'
};
const svg = n => `<svg viewBox="0 0 24 24">${ic[n]}</svg>`;
const gbp = n => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
const split = n => { const [a, b] = Math.abs(n).toFixed(2).split('.'); return `${n < 0 ? '-' : ''}£${(+a).toLocaleString('en-GB')}<span>.${b}</span>`; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dotc = t => t.status === 'declined' ? 'var(--bad)' : t.status === 'pending' ? 'var(--warn)' : t.amount > 0 ? 'var(--ok)' : 'var(--blue)';
const thisMonth = () => new Date().toISOString().slice(0, 7);

function totals(tx) {
  const d = tx.filter(t => t.status === 'completed');
  const inn = d.filter(t => t.amount > 0).reduce((a, t) => a + +t.amount, 0);
  const out = d.filter(t => t.amount < 0).reduce((a, t) => a - +t.amount, 0);
  return { inn, out, bal: inn - out };
}
// gasto do mês por categoria
function spentByCat(tx) {
  const m = {}; tx.filter(t => t.status === 'completed' && t.amount < 0 && t.created_at.slice(0, 7) === thisMonth()).forEach(t => m[t.category] = (m[t.category] || 0) - t.amount);
  return m;
}
function timeline(list, canDelete) {
  if (!list.length) return '<div class="empty">Nothing here yet.</div>';
  return `<div class="tl">${list.map(t => `<div class="row"><span class="dot" style="background:${dotc(t)}"></span>
  <div><b>${esc(t.title)}</b><small>${when(t.created_at)} · ${esc(t.category)}${t.status !== 'completed' ? ' · ' + t.status[0].toUpperCase() + t.status.slice(1) : ''}</small></div>
  <div class="amt ${t.amount > 0 ? 'in' : ''} ${t.status === 'declined' ? 'x' : ''}">${t.amount > 0 ? '+' : ''}${gbp(t.amount)}${canDelete ? `<button data-del="${t.id}">Delete</button>` : ''}</div></div>`).join('')}</div>`;
}
function progress(p, kind) { return `<div class="pg"><i class="${kind || ''}" style="width:${Math.max(2, Math.min(100, p))}%"></i></div>`; }
function header(sub, name) {
  const ini = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const dark = document.documentElement.dataset.theme === 'dark';
  return `<div class="top"><div class="av">${esc(ini)}</div><div><p class="mute">${sub}</p><h1>${esc(name)}</h1></div><div class="sp"></div>
  <button class="ib" id="theme" aria-label="Switch theme">${svg(dark ? 'sun' : 'moon')}</button>
  <button class="ib" id="logout" aria-label="Sign out">${svg('out')}</button></div>`;
}
function nav(active) {
  return `<nav class="nav"><a class="brand" href="/" style="color:var(--ink)"><img src="/favicon.svg" alt="">Tega Bank</a>${[['home', 'Home', 'home'], ['payments', 'Pay', 'pay'], ['plans', 'Plans', 'plan'], ['historico', 'History', 'hist'], ['settings', 'Settings', 'set']]
    .map(([h, l, i]) => `<a href="/${h}" class="${active === h ? 'on' : ''}">${svg(i)}${l}</a>`).join('')}</nav>`;
}

// janelas e avisos em vidro
function modal(title, fields, ok = 'Save') {
  return new Promise(resolve => {
    const d = document.createElement('div'); d.className = 'modal';
    d.innerHTML = `<form class="sheet"><h2>${esc(title)}</h2>${fields.map(f => `<label>${esc(f.label)}</label>` + (f.options
      ? `<select name="${f.name}">${f.options.map(o => `<option>${esc(o)}</option>`).join('')}</select>`
      : `<input name="${f.name}" type="${f.type || 'text'}" ${f.step ? `step="${f.step}" min="0.01"` : ''} value="${esc(f.value ?? '')}" placeholder="${esc(f.ph || '')}" autocomplete="off" required>`)).join('')}
      <div class="two"><button type="button" class="cta ghost" data-x>Cancel</button><button class="cta">${esc(ok)}</button></div></form>`;
    document.body.appendChild(d);
    const close = v => { d.remove(); resolve(v); };
    d.querySelector('[data-x]').onclick = () => close(null);
    d.onclick = e => { if (e.target === d) close(null); };
    d.querySelector('form').onsubmit = e => { e.preventDefault(); close(Object.fromEntries(new FormData(e.target))); };
    const first = d.querySelector('input,select'); if (first) first.focus();
  });
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}
function exportCsv(tx) {
  if (!tx.length) return toast('No transactions to export yet.');
  const cell = v => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = ['Date,Title,Category,Status,Amount (GBP)', ...tx.map(t => [t.created_at.slice(0, 10), t.title, t.category, t.status, t.amount].map(cell).join(','))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
  a.download = 'tega-bank-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); URL.revokeObjectURL(a.href);
}

const loadTx = () => api('/api/transactions');
// Protege a página: sem login volta para /login; com login chama page({ user, name, tx, goals, budgets })
async function boot(active, page) {
  let me;
  try { me = await api('/api/me'); } catch { location.replace('/login'); return; }
  const ctx = { user: me, name: me.name || me.email, tx: [], goals: [], budgets: [] };
  const render = async () => {
    const [tx, goals, budgets] = await Promise.all([loadTx(), api('/api/goals').catch(() => []), api('/api/budgets').catch(() => [])]);
    Object.assign(ctx, { tx, goals, budgets });
    $app.innerHTML = '<main class="page">' + page(ctx) + '</main>' + nav(active);
    animateNums();
    document.getElementById('logout').onclick = async () => { await api('/api/logout', 'POST'); location.href = '/'; };
    document.getElementById('theme').onclick = () => { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); render(); };
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
