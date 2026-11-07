const $app = document.getElementById('app');
const EXP = ['Food', 'Eating out', 'Bills', 'Subscriptions', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Travel', 'Education', 'Gifts', 'Other'];
const INC = ['Income', 'Transfer', 'Gift', 'Refund'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- tema (claro / escuro) ----------
const getTheme = () => { try { return localStorage.getItem('tega-theme'); } catch { return null; } };
const curTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
document.documentElement.dataset.theme = getTheme() === 'dark' ? 'dark' : 'light';

function paintTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('tega-theme', t); } catch {}
  document.querySelectorAll('[data-th]').forEach(b => b.classList.toggle('on', b.dataset.th === t));
  document.querySelectorAll('#theme').forEach(b => { b.innerHTML = svg(t === 'dark' ? 'sun' : 'moon'); b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); });
}
// troca o tema na hora (sem recarregar nada), com um círculo que se abre a partir do botão
function setTheme(t, ev) {
  if (t === curTheme()) return;
  const el = ev && (ev.currentTarget || ev.target), r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  const x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : 0;
  if (document.startViewTransition && !reduce) {
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.classList.add('theming');
    const vt = document.startViewTransition(() => paintTheme(t));
    vt.ready.then(() => document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
    vt.finished.finally(() => document.documentElement.classList.remove('theming'));
  } else {
    document.documentElement.classList.add('tt'); paintTheme(t);
    setTimeout(() => document.documentElement.classList.remove('tt'), 600);
  }
}

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
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>'
};
const svg = n => `<svg viewBox="0 0 24 24">${ic[n]}</svg>`;
const gbp = n => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
const split = n => { const [a, b] = Math.abs(n).toFixed(2).split('.'); return `${n < 0 ? '-' : ''}£${(+a).toLocaleString('en-GB')}<span>.${b}</span>`; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const ymd = d => { d = new Date(d); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dotc = t => t.status === 'declined' ? 'var(--bad)' : t.status === 'pending' ? 'var(--warn)' : t.amount > 0 ? 'var(--ok)' : 'var(--blue)';
const thisMonth = () => new Date().toISOString().slice(0, 7);
const isOn = x => x.active !== false;

function totals(tx) {
  const d = tx.filter(t => t.status === 'completed' && isOn(t));
  const inn = d.filter(t => t.amount > 0).reduce((a, t) => a + +t.amount, 0);
  const out = d.filter(t => t.amount < 0).reduce((a, t) => a - +t.amount, 0);
  return { inn, out, bal: inn - out };
}
// gasto do mês por categoria (ignora transações desativadas)
function spentByCat(tx) {
  const m = {}; tx.filter(t => t.status === 'completed' && isOn(t) && t.amount < 0 && t.created_at.slice(0, 7) === thisMonth()).forEach(t => m[t.category] = (m[t.category] || 0) - t.amount);
  return m;
}
// interruptor animado (ativar / desativar)
const sw = (attr, id, on, labels = ['Active', 'Disabled']) =>
  `<button class="sw${on ? ' on' : ''}" ${attr}="${esc(id)}" role="switch" aria-checked="${on}" aria-label="${on ? 'Disable' : 'Enable'}"><i></i></button><span class="swl">${on ? labels[0] : labels[1]}</span>`;

function timeline(list, manage) {
  if (!list.length) return '<div class="empty">Nothing here yet.</div>';
  return `<div class="tl">${list.map((t, i) => { const on = isOn(t); return `<div class="row${on ? '' : ' off'}" style="--i:${Math.min(i, 12)}"><span class="dot" style="background:${dotc(t)}"></span>
  <div><b>${esc(t.title)}</b><small>${when(t.created_at)} · ${esc(t.category)}${t.status !== 'completed' ? ' · ' + t.status[0].toUpperCase() + t.status.slice(1) : ''}${on ? '' : ' · Disabled'}</small></div>
  <div class="amt ${t.amount > 0 ? 'in' : ''} ${t.status === 'declined' || !on ? 'x' : ''}">${t.amount > 0 ? '+' : ''}${gbp(t.amount)}</div>
  ${manage ? `<div class="acts">${sw('data-tog', t.id, on)}<span class="sp"></span><button class="txt" data-edit="${t.id}">${svg('edit')}Edit</button><button class="txt bad" data-del="${t.id}">${svg('trash')}Delete</button></div>` : ''}</div>`; }).join('')}</div>`;
}
function progress(p, kind) { return `<div class="pg"><i class="${kind || ''}" style="width:${Math.max(2, Math.min(100, p))}%"></i></div>`; }
const tools = (fx) => `<div class="tools${fx ? ' fx' : ''}"><button class="ib" id="theme" aria-label="Switch theme">${svg(curTheme() === 'dark' ? 'sun' : 'moon')}</button>${fx ? '' : `<button class="ib" id="logout" aria-label="Sign out">${svg('out')}</button>`}</div>`;
function header(sub, name) {
  const ini = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `<div class="top"><div class="av">${esc(ini)}</div><div><p class="mute">${sub}</p><h1>${esc(name)}</h1></div><div class="sp"></div>
  <button class="ib" id="theme" aria-label="Switch theme">${svg(curTheme() === 'dark' ? 'sun' : 'moon')}</button>
  <button class="ib" id="logout" aria-label="Sign out">${svg('out')}</button></div>`;
}
function nav(active) {
  return `<nav class="nav"><a class="brand" href="/" style="color:var(--ink)"><img src="/favicon.svg" alt="">Penny Bank</a>${[['home', 'Home', 'home'], ['payments', 'Pay', 'pay'], ['plans', 'Plans', 'plan'], ['historico', 'History', 'hist'], ['settings', 'Settings', 'set']]
    .map(([h, l, i]) => `<a href="/${h}" class="${active === h ? 'on' : ''}">${svg(i)}${l}</a>`).join('')}</nav>`;
}

// ---------- janelas, avisos e animações ----------
function layer(html, setup) {
  return new Promise(resolve => {
    const d = document.createElement('div'); d.className = 'modal'; d.innerHTML = html; document.body.appendChild(d);
    let done = false;
    const key = e => { if (e.key === 'Escape') close(null); };
    const close = v => { if (done) return; done = true; document.removeEventListener('keydown', key); d.classList.add('out'); setTimeout(() => d.remove(), 200); resolve(v); };
    document.addEventListener('keydown', key);
    d.onclick = e => { if (e.target === d) close(null); };
    setup(d, close);
  });
}
function modal(title, fields, ok = 'Save') {
  const field = f => `<label>${esc(f.label)}</label>` + (f.options
    ? `<select name="${f.name}">${f.options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(f.value) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`
    : `<input name="${f.name}" type="${f.type || 'text'}" ${f.step ? `step="${f.step}" min="0.01"` : ''} ${f.max ? `max="${f.max}"` : ''} value="${esc(f.value ?? '')}" placeholder="${esc(f.ph || '')}" autocomplete="off" required>`);
  return layer(`<form class="sheet"><h2>${esc(title)}</h2>${fields.map(field).join('')}<div class="two"><button type="button" class="cta ghost" data-x>Cancel</button><button class="cta">${esc(ok)}</button></div></form>`, (d, close) => {
    d.querySelector('[data-x]').onclick = () => close(null);
    d.querySelector('form').onsubmit = e => { e.preventDefault(); close(Object.fromEntries(new FormData(e.target))); };
    const first = d.querySelector('input,select'); if (first) first.focus();
  });
}
// confirmação em vidro (no lugar do confirm() do navegador)
function ask(title, text, ok = 'Delete', danger = true) {
  return layer(`<div class="sheet"><h2>${esc(title)}</h2><p class="mute" style="margin-bottom:22px">${esc(text)}</p><div class="two"><button class="cta ghost" data-x>Cancel</button><button class="cta${danger ? ' danger' : ''}" data-ok>${esc(ok)}</button></div></div>`, (d, close) => {
    d.querySelector('[data-x]').onclick = () => close(false);
    const b = d.querySelector('[data-ok]'); b.onclick = () => close(true); b.focus();
  }).then(v => !!v);
}
function toast(msg, bad) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 2400);
}
// faz o item sumir deslizando antes de apagar de verdade
const leave = el => new Promise(r => {
  if (!el || reduce) return r();
  el.style.height = el.offsetHeight + 'px'; void el.offsetHeight; el.classList.add('leave'); setTimeout(r, 380);
});
// onda ao tocar (feedback de clique)
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.cta,.mini,.chip,.add,.seg button,.quick button,.txt,.ib,.nav a'); if (!el || reduce || el.disabled) return;
  const r = el.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2, d = document.createElement('span');
  d.className = 'rp'; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  el.classList.add('rph'); el.appendChild(d); setTimeout(() => d.remove(), 650);
});

function exportCsv(tx) {
  if (!tx.length) return toast('No transactions to export yet.');
  const cell = v => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = ['Date,Title,Category,Status,Active,Amount (GBP)', ...tx.map(t => [t.created_at.slice(0, 10), t.title, t.category, t.status, isOn(t) ? 'yes' : 'no', t.amount].map(cell).join(','))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
  a.download = 'penny-bank-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); URL.revokeObjectURL(a.href);
}

const loadTx = () => api('/api/transactions');
function skeleton(active) {
  const s = (st) => `<div class="sk" style="${st}"></div>`;
  return `<main class="page" id="main">${s('width:46%;height:30px')}${s('width:30%;height:14px;margin:10px 0 24px')}${s('height:170px;border-radius:26px;margin-bottom:16px')}${s('height:110px;border-radius:26px;margin-bottom:16px')}${s('height:110px;border-radius:26px')}</main>` + nav(active);
}
// Protege a página: sem login volta para /login; com login chama page({ user, name, tx, goals, budgets })
// render()      -> busca os dados de novo e redesenha
// render(true) -> só redesenha com os dados que já estão na tela (instantâneo)
async function boot(active, page) {
  $app.innerHTML = skeleton(active);
  let me;
  try { me = await api('/api/me'); } catch { location.replace('/login'); return; }
  const ctx = { user: me, name: me.name || me.email, tx: [], goals: [], budgets: [] };
  const main = document.getElementById('main');
  let first = true;
  const draw = still => {
    const html = page(ctx), y = scrollY;
    main.className = 'page' + (first ? ' enter' : '') + (still ? ' still' : '');
    main.innerHTML = (html.includes('id="theme"') ? '' : tools()) + html;
    first = false;
    if (!still) animateNums();
    // botões do topo: cada um só é ligado se existir na página
    const lo = document.getElementById('logout'); if (lo) lo.onclick = async () => { try { await api('/api/logout', 'POST'); } catch {} location.href = '/'; };
    const th = document.getElementById('theme'); if (th) th.onclick = e => setTheme(curTheme() === 'dark' ? 'light' : 'dark', e);
    if (window.bind) window.bind(ctx, render);
    scrollTo(0, y);
  };
  const render = async local => {
    if (!local) {
      const [tx, goals, budgets] = await Promise.all([loadTx(), api('/api/goals').catch(() => []), api('/api/budgets').catch(() => [])]);
      Object.assign(ctx, { tx, goals, budgets });
    }
    draw(!!local);
  };
  try { await render(); } catch (e) { main.innerHTML = `<div class="empty">Could not load your data.<br>${esc(e.message)}</div>`; }
}
function animateNums() {
  document.querySelectorAll('[data-n]').forEach(el => {
    const n = +el.dataset.n, f = el.dataset.f || 'split';
    const fmt = v => f === 'gbp' ? gbp(v) : f === 'pct' ? Math.round(v) + '%' : f === 'int' ? String(Math.round(v)) : split(v);
    if (reduce) { el.innerHTML = fmt(n); return; }
    const t0 = performance.now();
    (function s(t) { const p = Math.min(1, (t - t0) / 1100); el.innerHTML = fmt(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(s); })(t0);
  });
}
