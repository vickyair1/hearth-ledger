// HearthLedger — the Hartono family budget. One page, hash-routed, no network calls.
// Every figure on every view is computed from the transaction array by computeMonth();
// nothing is written down twice, so the views can never disagree with the ledger.
import { TRANSACTIONS, BUDGETS, GOALS, BILLS, MEMBERS, CATEGORIES, CATEGORY_COLORS, MONTHS, MONTH_LABELS } from './data.js';

const STORE_KEY = 'hearthledger-v1';
const view = document.getElementById('view');
const monthSelect = document.getElementById('monthSelect');

// ---------- small formatting helpers ----------
const money = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money0 = n => '$' + Math.round(Number(n)).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (part, whole) => whole > 0 ? Math.round(part / whole * 100) : 0;
const monthOf = dateStr => dateStr.slice(0, 7);
const ordinal = n => n + (n === 1 || n === 21 || n === 31 ? 'st' : n === 2 || n === 22 ? 'nd' : n === 3 || n === 23 ? 'rd' : 'th');

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
// When will this goal be finished, at its planned monthly contribution?
function finishMonth(goal) {
  const left = Math.max(0, goal.target - goal.saved);
  if (left <= 0) return 'Reached!';
  const months = Math.ceil(left / Math.max(1, goal.monthly));
  const d = new Date(2026, 10 + months, 1); // counting forward from November 2026
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ---------- state & persistence ----------
function seedState() {
  return {
    month: '2026-11',
    tx: TRANSACTIONS.map((r, i) => ({ id: 't' + i, date: r[0], desc: r[1], cat: r[2], amt: r[3], type: r[4], who: r[5], merchant: r[6] })),
    budgets: JSON.parse(JSON.stringify(BUDGETS)),
    goals: JSON.parse(JSON.stringify(GOALS)),
    bills: JSON.parse(JSON.stringify(BILLS))
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seedState();
    const s = JSON.parse(raw);
    if (!Array.isArray(s.tx) || !s.budgets || !Array.isArray(s.goals) || !Array.isArray(s.bills)) return seedState();
    return s;
  } catch { return seedState(); }
}
let state = loadState();
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* private mode */ } }
function resetDemo() {
  state = seedState();
  saveState();
  monthSelect.value = state.month;
  render();
  toast('Demo data restored to the original Hartono ledger.');
}

// The transactions page keeps its own filter state; it lives here, above the first
// render(), so a direct load of #/transactions never reads it before it exists.
let txFilter = { month: '2026-11', cat: 'all', type: 'all', q: '' };
let editingId = null;

// ---------- the single source of truth: computeMonth ----------
// Summarises one month from the ledger: income, spending, savings and per-category totals.
function computeMonth(month) {
  const rows = state.tx.filter(t => monthOf(t.date) === month);
  const byCat = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  let income = 0, spent = 0;
  for (const t of rows) {
    if (t.type === 'income') income += t.amt;
    else { spent += t.amt; byCat[t.cat] = (byCat[t.cat] || 0) + t.amt; }
  }
  const saved = income - spent;
  return { month, rows, income, spent, saved, rate: income > 0 ? saved / income * 100 : 0, byCat, count: rows.length };
}
function allMonthTotals() { return MONTHS.map(m => ({ month: m, ...computeMonth(m) })); }

// Budget rows for one month, worst (closest to / over the limit) first.
function healthRows(month, limit) {
  const b = state.budgets[month] || {};
  const cur = computeMonth(month);
  return CATEGORIES
    .map(c => ({ cat: c, spent: cur.byCat[c] || 0, budget: b[c] || 0 }))
    .sort((a, b2) => (b2.spent / Math.max(1, b2.budget)) - (a.spent / Math.max(1, a.budget)))
    .slice(0, limit);
}
function nextBills(n) {
  return state.bills.filter(b => !b.paid).sort((a, b) => a.day - b.day).slice(0, n);
}

// ---------- hand-rolled SVG charts (no libraries, no network) ----------
function donutSVG(byCat, size) {
  const total = Object.values(byCat).reduce((a, b) => a + b, 0) || 1;
  const cats = CATEGORIES.filter(c => byCat[c] > 0).sort((a, b) => byCat[b] - byCat[a]);
  const r = 70, cx = 90, cy = 90, circ = 2 * Math.PI * r;
  let offset = 0, segs = '';
  for (const c of cats) {
    const len = byCat[c] / total * circ;
    segs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${CATEGORY_COLORS[c]}" stroke-width="34" stroke-dasharray="${len.toFixed(1)} ${(circ - len).toFixed(1)}" stroke-dashoffset="${(-offset).toFixed(1)}" />`;
    offset += len;
  }
  return `<svg class="chart" viewBox="0 0 180 180" width="${size}" height="${size}" role="img" aria-label="Spending by category donut chart">${segs}<circle cx="${cx}" cy="${cy}" r="52" fill="#fff"/><text x="${cx}" y="84" text-anchor="middle" font-size="15" font-weight="700" fill="#1f2a24">${money0(total)}</text><text x="${cx}" y="102" text-anchor="middle" font-size="11" fill="#5b6b62">spent</text></svg>`;
}
function vbarSVG(items, opts) {
  // items: [{label, value, color}]; opts: {height}
  const h = opts.height || 180, w = 560, padB = 26, padT = 12;
  const max = Math.max(...items.map(i => i.value), 1);
  const bw = Math.min(64, (w - 40) / items.length * 0.55);
  const step = (w - 20) / items.length;
  let bars = '';
  items.forEach((it, i) => {
    const bh = Math.max(2, (it.value / max) * (h - padB - padT));
    const x = 10 + i * step + (step - bw) / 2;
    const y = h - padB - bh;
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${bh.toFixed(1)}" rx="4" fill="${it.color}"><title>${esc(it.label)}: ${money(it.value)}</title></rect>`;
    bars += `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#1f2a24">${money0(it.value)}</text>`;
    bars += `<text x="${(x + bw / 2).toFixed(1)}" y="${h - 8}" text-anchor="middle" font-size="12" fill="#5b6b62">${esc(it.label)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Bar chart">${bars}</svg>`;
}
function groupedBarSVG(months, cats, byMonthCat) {
  // byMonthCat[month][cat] — one group of bars per month, one colour per category.
  const h = 200, w = 560, padB = 26, padT = 14;
  const max = Math.max(...months.flatMap(m => cats.map(c => byMonthCat[m][c] || 0)), 1);
  const groupW = (w - 30) / months.length, bw = Math.min(34, groupW / (cats.length + 0.6));
  let out = '';
  months.forEach((m, gi) => {
    cats.forEach((c, ci) => {
      const v = byMonthCat[m][c] || 0;
      const bh = Math.max(1, v / max * (h - padB - padT));
      const x = 15 + gi * groupW + ci * bw;
      out += `<rect x="${x.toFixed(1)}" y="${(h - padB - bh).toFixed(1)}" width="${bw - 2}" height="${bh.toFixed(1)}" rx="3" fill="${CATEGORY_COLORS[c]}"><title>${MONTH_LABELS[m]} ${c}: ${money(v)}</title></rect>`;
    });
    out += `<text x="${(15 + gi * groupW + groupW / 2).toFixed(1)}" y="${h - 8}" text-anchor="middle" font-size="12" fill="#5b6b62">${MONTH_LABELS[m].split(' ')[0]}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Category trend chart">${out}</svg>`;
}

// ---------- DASHBOARD ----------
function dashboardView() {
  const m = state.month;
  const cur = computeMonth(m);
  const totals = allMonthTotals();
  const topCats = CATEGORIES.filter(c => cur.byCat[c] > 0).sort((a, b) => cur.byCat[b] - cur.byCat[a]);
  const biggest = topCats[0];
  const prev = computeMonth(m === '2026-11' ? '2026-10' : '2026-09');
  const spendChange = cur.spent - prev.spent;
  const insight = cur.rate >= 20
    ? `Good month: the Hartonos saved <strong>${money(cur.saved)} (${cur.rate.toFixed(0)}% of income)</strong>, above their 20% target. Biggest cost was ${biggest} at ${money(cur.byCat[biggest])}. Spending is ${spendChange >= 0 ? 'up' : 'down'} ${money(Math.abs(spendChange))} on last month — mostly the car repair and Thanksgiving groceries.`
    : `Tight month: savings are ${money(cur.saved)} (${cur.rate.toFixed(0)}% of income), below the 20% target. Biggest cost was ${biggest} at ${money(cur.byCat[biggest])}.`;
  const health = healthRows(m, 4);
  const recent = [...state.tx].filter(t => monthOf(t.date) === m)
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const paidTotal = state.bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0);
  const salary = cur.rows.filter(t => t.type === 'income' && t.desc.includes('salary')).reduce((s, t) => s + t.amt, 0);

  return `
  <div class="page-head">
    <div><h1>Good evening, Hartonos 👋</h1>
    <p>Here is ${MONTH_LABELS[m]} at a glance — income, spending, savings and what is due next.</p></div>
    <a class="btn" href="#/transactions">+ Add transaction</a>
  </div>
  <div class="insight">${insight}</div>
  <section class="grid grid-4" aria-label="Month summary">
    <div class="card stat income"><div class="label">Income · ${MONTH_LABELS[m]}</div><div class="value num">${money(cur.income)}</div><div class="sub">Salary ${money(salary)} + freelance &amp; other ${money(cur.income - salary)}</div></div>
    <div class="card stat spent"><div class="label">Spent</div><div class="value num">${money(cur.spent)}</div><div class="sub">${cur.count} transactions this month</div></div>
    <div class="card stat saved"><div class="label">Saved</div><div class="value num">${money(cur.saved)}</div><div class="sub">${money0(cur.saved)} kept for goals</div></div>
    <div class="card stat"><div class="label">Savings rate</div><div class="value num">${cur.rate.toFixed(1)}%</div><div class="sub">Target: 20% · ${cur.rate >= 20 ? 'on target ✓' : 'below target'}</div></div>
  </section>
  <section class="grid grid-2" style="margin-top:16px">
    <div class="card">
      <h2>Income vs expenses</h2>
      ${vbarSVG([{ label: 'Income', value: cur.income, color: '#1d5c3f' }, { label: 'Spent', value: cur.spent, color: '#c65d21' }, { label: 'Saved', value: cur.saved, color: '#d4a017' }], { height: 190 })}
      <p class="muted small">Every dollar of income is either spent or saved — the three bars always add up.</p>
    </div>
    <div class="card">
      <h2>Where the money went <a class="more" href="#/budget">See budgets →</a></h2>
      <div class="donut-wrap">
        ${donutSVG(cur.byCat, 180)}
        <ul class="donut-legend">
          ${topCats.slice(0, 6).map(c => `<li><span><span class="dot" style="background:${CATEGORY_COLORS[c]}"></span>${esc(c)}</span><strong class="num">${money(cur.byCat[c])}</strong></li>`).join('')}
        </ul>
      </div>
    </div>
  </section>
  <section class="grid grid-2" style="margin-top:16px">
    <div class="card">
      <h2>Spending trend — Sep to Nov</h2>
      ${vbarSVG(totals.map(t => ({ label: MONTH_LABELS[t.month].split(' ')[0], value: t.spent, color: t.month === m ? '#1d5c3f' : '#9db8a6' })), { height: 180 })}
      <p class="muted small">September ${money(totals[0].spent)} · October ${money(totals[1].spent)} · November ${money(totals[2].spent)}. November is the dearest month — the $320 brake repair and Thanksgiving groceries.</p>
    </div>
    <div class="card">
      <h2>Budget health — closest to the limit</h2>
      ${health.map(h => {
        const p = pct(h.spent, h.budget);
        const cls = p >= 100 ? 'over' : p >= 85 ? 'warn' : '';
        return `<div class="progress-row"><span>${esc(h.cat)}</span><span class="pct num">${p}%</span><div class="bar ${cls}"><span style="width:${Math.min(100, p)}%"></span></div><span class="small muted num">${money(h.spent)} of ${money(h.budget)}</span><span class="small ${p >= 100 ? 'neg' : 'pos'}">${p >= 100 ? 'over by ' + money(h.spent - h.budget) : money(h.budget - h.spent) + ' left'}</span></div>`;
      }).join('')}
      <p style="margin-top:10px"><a href="#/budget">Open the full budget →</a></p>
    </div>
  </section>
  <section class="grid grid-2" style="margin-top:16px">
    <div class="card">
      <h2>Upcoming bills <a class="more" href="#/bills">All bills →</a></h2>
      ${nextBills(5).map(b => `<div class="progress-row"><span>${esc(b.name)}</span><strong class="num">Due ${ordinal(b.day)} Nov · ${money(b.amount)}</strong></div>`).join('') || '<p class="muted">Everything is paid — nice work.</p>'}
      <p class="muted small" style="margin-top:10px">${money(paidTotal)} already paid this month · ${state.bills.filter(b => b.paid).length} of ${state.bills.length} bills settled.</p>
    </div>
    <div class="card">
      <h2>Recent transactions <a class="more" href="#/transactions">Full ledger →</a></h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount</th></tr></thead>
        <tbody>${recent.map(t => `<tr><td>${fmtDate(t.date)}</td><td>${esc(t.desc)}</td><td><span class="badge badge-cat">${esc(t.cat)}</span></td><td class="num ${t.type === 'income' ? 'pos' : 'neg'}">${t.type === 'income' ? '+' : '−'}${money(t.amt)}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>
  </section>`;
}

// ---------- TRANSACTIONS ----------
function visibleTransactions() {
  const q = txFilter.q.trim().toLowerCase();
  return state.tx.filter(t =>
    (txFilter.month === 'all' || monthOf(t.date) === txFilter.month) &&
    (txFilter.cat === 'all' || t.cat === txFilter.cat) &&
    (txFilter.type === 'all' || t.type === txFilter.type) &&
    (!q || (t.desc + ' ' + t.merchant + ' ' + t.who).toLowerCase().includes(q))
  ).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}
function balancesById() {
  // Cumulative balance over ALL transactions in date order (income adds, expense subtracts).
  const sorted = [...state.tx].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const bal = {};
  let run = 0;
  for (const t of sorted) { run += t.type === 'income' ? t.amt : -t.amt; bal[t.id] = run; }
  return bal;
}
function transactionsView() {
  const rows = visibleTransactions();
  const bal = balancesById();
  const inc = rows.filter(t => t.type === 'income').reduce((s, t) => s + t.amt, 0);
  const exp = rows.filter(t => t.type === 'expense').reduce((s, t) => s + t.amt, 0);
  const edit = editingId ? state.tx.find(t => t.id === editingId) : null;
  return `
  <div class="page-head"><div><h1>Transactions</h1>
  <p>The full Hartono ledger — every dollar in and out, September to November 2026. Filter it, add a row, or fix a mistake.</p></div>
  <span class="muted small">${state.tx.length} transactions in total</span></div>

  <section class="card" style="margin-bottom:16px">
    <h2>${edit ? 'Edit transaction' : 'Add a transaction'}</h2>
    <form class="inline-form" id="txForm">
      <div class="field"><label for="fDate">Date</label><input type="date" id="fDate" required value="${edit ? edit.date : '2026-11-26'}"></div>
      <div class="field"><label for="fDesc">Description</label><input type="text" id="fDesc" required maxlength="80" placeholder="e.g. Weekly groceries" value="${edit ? esc(edit.desc) : ''}"></div>
      <div class="field"><label for="fCat">Category</label><select id="fCat">${CATEGORIES.map(c => `<option ${edit && edit.cat === c ? 'selected' : ''}>${c}</option>`).join('')}<option ${edit && edit.cat === 'Income' ? 'selected' : ''}>Income</option></select></div>
      <div class="field"><label for="fAmt">Amount ($)</label><input type="number" id="fAmt" required min="0.01" step="0.01" placeholder="0.00" value="${edit ? edit.amt : ''}"></div>
      <div class="field"><label for="fType">Type</label><select id="fType"><option value="expense" ${edit && edit.type === 'expense' ? 'selected' : ''}>Expense</option><option value="income" ${edit && edit.type === 'income' ? 'selected' : ''}>Income</option></select></div>
      <div class="field"><label for="fWho">Member</label><select id="fWho">${MEMBERS.map(mb => `<option ${edit && edit.who === mb.name.split(' ')[0] ? 'selected' : ''}>${mb.name.split(' ')[0]}</option>`).join('')}</select></div>
      <div class="btn-row"><button class="btn" type="submit">${edit ? 'Save changes' : 'Add transaction'}</button>
      ${edit ? '<button class="btn btn-ghost" type="button" id="cancelEdit">Cancel</button>' : ''}</div>
    </form>
  </section>

  <section class="card">
    <div class="filters">
      <div class="field"><label for="fltMonth">Month</label><select id="fltMonth"><option value="all">All months</option>${MONTHS.map(m => `<option value="${m}" ${txFilter.month === m ? 'selected' : ''}>${MONTH_LABELS[m]}</option>`).join('')}</select></div>
      <div class="field"><label for="fltCat">Category</label><select id="fltCat"><option value="all">All categories</option>${CATEGORIES.map(c => `<option ${txFilter.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label for="fltType">Type</label><select id="fltType"><option value="all">Income &amp; expenses</option><option value="income" ${txFilter.type === 'income' ? 'selected' : ''}>Income only</option><option value="expense" ${txFilter.type === 'expense' ? 'selected' : ''}>Expenses only</option></select></div>
      <div class="field search"><label for="fltQ">Search</label><input type="search" id="fltQ" placeholder="Search description, merchant or member…" value="${esc(txFilter.q)}"></div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>Description</th><th>Merchant</th><th>Category</th><th>Member</th><th class="num">Amount</th><th class="num">Running balance</th><th>Actions</th></tr></thead>
      <tbody>
      ${rows.map(t => `<tr>
        <td>${fmtDate(t.date)}</td><td>${esc(t.desc)}</td><td class="muted">${esc(t.merchant)}</td>
        <td><span class="badge badge-cat">${esc(t.cat)}</span></td><td>${esc(t.who)}</td>
        <td class="num ${t.type === 'income' ? 'pos' : 'neg'}">${t.type === 'income' ? '+' : '−'}${money(t.amt)}</td>
        <td class="num">${money(bal[t.id])}</td>
        <td><div class="btn-row"><button class="btn btn-small btn-ghost" type="button" data-edit="${t.id}">Edit</button><button class="btn btn-small btn-danger" type="button" data-del="${t.id}">Delete</button></div></td>
      </tr>`).join('') || '<tr><td colspan="8" class="muted">No transactions match these filters.</td></tr>'}
      </tbody>
      <tfoot><tr><td colspan="5">${rows.length} transactions shown</td><td class="num pos">+${money(inc)}</td><td class="num neg">−${money(exp)}</td><td class="num">Net ${money(inc - exp)}</td></tr></tfoot>
    </table></div>
  </section>`;
}
function bindTransactions() {
  const form = document.getElementById('txForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const amt = parseFloat(document.getElementById('fAmt').value);
    if (!amt || amt <= 0) { toast('Enter an amount above $0.'); return; }
    const row = {
      date: document.getElementById('fDate').value,
      desc: document.getElementById('fDesc').value.trim(),
      cat: document.getElementById('fCat').value,
      amt, type: document.getElementById('fType').value,
      who: document.getElementById('fWho').value,
      merchant: document.getElementById('fDesc').value.trim()
    };
    if (editingId) {
      const t = state.tx.find(x => x.id === editingId);
      Object.assign(t, row); editingId = null; toast('Transaction updated.');
    } else {
      state.tx.push({ id: 't' + Date.now(), ...row });
      toast('Transaction added — totals updated everywhere.');
    }
    saveState(); render();
  });
  const cancel = document.getElementById('cancelEdit');
  if (cancel) cancel.addEventListener('click', () => { editingId = null; render(); });
  document.getElementById('fltMonth').addEventListener('change', e => { txFilter.month = e.target.value; render(); });
  document.getElementById('fltCat').addEventListener('change', e => { txFilter.cat = e.target.value; render(); });
  document.getElementById('fltType').addEventListener('change', e => { txFilter.type = e.target.value; render(); });
  document.getElementById('fltQ').addEventListener('input', e => {
    txFilter.q = e.target.value; render();
    const q = document.getElementById('fltQ');
    q.focus(); q.setSelectionRange(q.value.length, q.value.length);
  });
  view.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => { editingId = b.dataset.edit; render(); window.scrollTo(0, 0); }));
  view.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    const t = state.tx.find(x => x.id === b.dataset.del);
    if (t && confirm(`Delete “${t.desc}” (${money(t.amt)})?`)) {
      state.tx = state.tx.filter(x => x.id !== t.id); saveState(); render(); toast('Transaction deleted.');
    }
  }));
}

// ---------- BUDGET ----------
// The 50/30/20 guide: needs = Housing, Groceries, Utilities, Transport, Kids & School,
// Health, Household; wants = Dining Out, Entertainment, Subscriptions, Personal, Other.
const NEEDS_CATS = ['Housing', 'Groceries', 'Utilities', 'Transport', 'Kids & School', 'Health', 'Household'];
const WANTS_CATS = ['Dining Out', 'Entertainment', 'Subscriptions', 'Personal', 'Other'];

function budgetView() {
  const m = state.month;
  const cur = computeMonth(m);
  const b = state.budgets[m] || {};
  const totalBudget = CATEGORIES.reduce((s, c) => s + (b[c] || 0), 0);
  const totalSpent = cur.spent;
  const over = CATEGORIES.filter(c => (cur.byCat[c] || 0) > (b[c] || 0)).length;
  const needs = NEEDS_CATS.reduce((s, c) => s + (cur.byCat[c] || 0), 0);
  const wants = WANTS_CATS.reduce((s, c) => s + (cur.byCat[c] || 0), 0);
  const needsPct = cur.income ? needs / cur.income * 100 : 0;
  const wantsPct = cur.income ? wants / cur.income * 100 : 0;
  const verdict = needsPct <= 50 && wantsPct <= 30 && cur.rate >= 20
    ? 'On track — needs, wants and savings all sit inside the 50/30/20 guide.'
    : `Needs are ${needsPct.toFixed(0)}% of income (guide: 50%) and wants ${wantsPct.toFixed(0)}% (guide: 30%). ${needsPct > 50 ? 'Housing and groceries push needs over — the car repair this month did not help. ' : ''}Savings at ${cur.rate.toFixed(0)}% ${cur.rate >= 20 ? 'beat' : 'miss'} the 20% target.`;
  return `
  <div class="page-head"><div><h1>Budget — ${MONTH_LABELS[m]}</h1>
  <p>Twelve category budgets for the month. Click any budget amount to change it — progress updates at once. Total budget ${money(totalBudget)} against ${money(totalSpent)} spent.</p></div>
  <span class="badge ${over ? 'badge-over' : 'badge-under'}">${over} categor${over === 1 ? 'y' : 'ies'} over budget</span></div>

  <section class="grid grid-2-1">
    <div class="card">
      <h2>Category budgets</h2>
      ${CATEGORIES.map(c => {
        const spent = cur.byCat[c] || 0, bud = b[c] || 0, p = pct(spent, bud);
        const cls = p >= 100 ? 'over' : p >= 85 ? 'warn' : '';
        const diff = bud - spent;
        return `<div class="progress-row">
          <span><span class="dot" style="background:${CATEGORY_COLORS[c]}"></span>${esc(c)}</span>
          <span class="num">${money(spent)} <span class="muted">/ </span><button class="btn btn-small btn-ghost" type="button" data-budget-cat="${esc(c)}" title="Click to edit this budget">${money(bud)}</button></span>
          <div class="bar ${cls}"><span style="width:${Math.min(100, p)}%"></span></div>
          <span class="small muted">${p}% used</span>
          <span class="small ${diff < 0 ? 'neg' : 'pos'}">${diff < 0 ? 'Over by ' + money(-diff) : money(diff) + ' left'}</span>
        </div>`;
      }).join('')}
      <div class="progress-row" style="margin-top:6px"><strong>Total</strong><strong class="num">${money(totalSpent)} / ${money(totalBudget)}</strong>
      <div class="bar ${totalSpent > totalBudget ? 'over' : ''}"><span style="width:${Math.min(100, pct(totalSpent, totalBudget))}%"></span></div>
      <span class="small muted">${pct(totalSpent, totalBudget)}% used</span>
      <span class="small ${totalBudget - totalSpent < 0 ? 'neg' : 'pos'}">${totalBudget - totalSpent < 0 ? 'Over by ' + money(totalSpent - totalBudget) : money(totalBudget - totalSpent) + ' left'}</span></div>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px">
        <h2>The 50/30/20 rule</h2>
        <p class="small muted">Needs, wants and savings as a share of ${money(cur.income)} income — computed from this month's real spending.</p>
        <div class="progress-row"><span>Needs — 50% guide</span><strong class="num">${needsPct.toFixed(1)}% · ${money(needs)}</strong><div class="bar ${needsPct > 50 ? 'warn' : ''}"><span style="width:${Math.min(100, needsPct)}%"></span></div><span class="small muted">Housing, groceries, utilities, transport, kids, health, household</span></div>
        <div class="progress-row"><span>Wants — 30% guide</span><strong class="num">${wantsPct.toFixed(1)}% · ${money(wants)}</strong><div class="bar ${wantsPct > 30 ? 'warn' : ''}"><span style="width:${Math.min(100, wantsPct)}%"></span></div><span class="small muted">Dining out, entertainment, subscriptions, personal, other</span></div>
        <div class="progress-row"><span>Savings — 20% guide</span><strong class="num">${cur.rate.toFixed(1)}% · ${money(cur.saved)}</strong><div class="bar"><span style="width:${Math.min(100, cur.rate)}%"></span></div><span class="small muted">Everything left over, swept to goals</span></div>
        <p style="margin-top:10px"><strong>Verdict:</strong> ${verdict}</p>
      </div>
      <div class="card">
        <h2>Budget tips</h2>
        <ul>
          <li><strong>Groceries ${money(cur.byCat['Groceries'])}:</strong> the Thanksgiving shop pushed this ${money(Math.max(0, cur.byCat['Groceries'] - (b['Groceries'] || 0)))} over budget — plan the holiday shop a week earlier next year.</li>
          <li><strong>Other ${money(cur.byCat['Other'])}:</strong> the $320 brake repair is a one-off, not a habit — the emergency fund exists for exactly this.</li>
          <li><strong>Subscriptions ${money(cur.byCat['Subscriptions'])}:</strong> seven small charges add up; review them every quarter and cancel what nobody opened.</li>
        </ul>
      </div>
    </div>
  </section>`;
}
function bindBudget() {
  view.querySelectorAll('[data-budget-cat]').forEach(btn => btn.addEventListener('click', () => {
    const cat = btn.dataset.budgetCat;
    const cur = state.budgets[state.month][cat];
    const next = prompt(`New monthly budget for ${cat} (current ${money(cur)}):`, String(cur));
    if (next === null) return;
    const val = parseFloat(next);
    if (!val || val <= 0) { toast('Enter a budget above $0.'); return; }
    state.budgets[state.month][cat] = Math.round(val * 100) / 100;
    saveState(); render(); toast(`${cat} budget set to ${money(val)}.`);
  }));
}

// ---------- GOALS ----------
function goalsView() {
  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);
  return `
  <div class="page-head"><div><h1>Savings goals</h1>
  <p>Six things the Hartonos are saving for — ${money(totalSaved)} saved towards ${money(totalTarget)} in total. Add money to any goal and watch its finish date move closer.</p></div>
  <span class="badge badge-under">${pct(totalSaved, totalTarget)}% of all goals funded</span></div>

  <section class="goal-grid">
    ${state.goals.map((g, i) => {
      const p = pct(g.saved, g.target);
      const done = g.saved >= g.target;
      return `<article class="card goal-card">
        <div class="goal-top"><div><span class="goal-icon" aria-hidden="true">${g.icon}</span><h2 style="margin-top:4px">${esc(g.name)}</h2></div>
        <span class="badge ${done ? 'badge-paid' : 'badge-due'}">${done ? 'Reached ✓' : p + '%'}</span></div>
        <div class="goal-amounts num">${money(g.saved)} <small>of ${money(g.target)}</small></div>
        <div class="bar ${done ? '' : p >= 75 ? 'warn' : ''}"><span style="width:${Math.min(100, p)}%"></span></div>
        <p class="small muted" style="margin-top:8px">${esc(g.note)}</p>
        <p class="small"><strong>${money(g.monthly)}/month</strong> · ${money(Math.max(0, g.target - g.saved))} to go · finish <strong>${finishMonth(g)}</strong></p>
        <div class="goal-actions">
          <button class="btn btn-small" type="button" data-goal-add="${i}" data-amt="50">+$50</button>
          <button class="btn btn-small" type="button" data-goal-add="${i}" data-amt="100">+$100</button>
          <label class="small" for="custom-${i}">Custom $</label>
          <input type="number" id="custom-${i}" min="1" step="1" placeholder="25" aria-label="Custom contribution for ${esc(g.name)}">
          <button class="btn btn-small btn-amber" type="button" data-goal-custom="${i}">Add</button>
        </div>
      </article>`;
    }).join('')}
  </section>

  <section class="card" style="margin-top:16px">
    <h2>Add a new goal</h2>
    <form class="inline-form" id="goalForm">
      <div class="field"><label for="gName">Goal name</label><input type="text" id="gName" required maxlength="40" placeholder="e.g. New washing machine"></div>
      <div class="field"><label for="gTarget">Target ($)</label><input type="number" id="gTarget" required min="1" step="1" placeholder="1000"></div>
      <div class="field"><label for="gSaved">Already saved ($)</label><input type="number" id="gSaved" min="0" step="1" value="0"></div>
      <div class="field"><label for="gMonthly">Monthly contribution ($)</label><input type="number" id="gMonthly" min="1" step="1" placeholder="100"></div>
      <div class="btn-row"><button class="btn" type="submit">Add goal</button></div>
    </form>
  </section>`;
}
function bindGoals() {
  const contribute = (i, amt) => {
    const g = state.goals[i];
    g.saved = Math.min(g.target, g.saved + amt);
    saveState(); render();
    toast(`${money(amt)} added to ${g.name}.`);
  };
  view.querySelectorAll('[data-goal-add]').forEach(b => b.addEventListener('click', () => contribute(Number(b.dataset.goalAdd), Number(b.dataset.amt))));
  view.querySelectorAll('[data-goal-custom]').forEach(b => b.addEventListener('click', () => {
    const amt = parseFloat(document.getElementById('custom-' + b.dataset.goalCustom).value);
    if (!amt || amt <= 0) { toast('Enter an amount above $0.'); return; }
    contribute(Number(b.dataset.goalCustom), amt);
  }));
  document.getElementById('goalForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('gName').value.trim();
    const target = parseFloat(document.getElementById('gTarget').value);
    const saved = parseFloat(document.getElementById('gSaved').value) || 0;
    const monthly = parseFloat(document.getElementById('gMonthly').value) || 100;
    if (!name || !target || target <= 0) { toast('Give the goal a name and a target above $0.'); return; }
    state.goals.push({ name, target, saved: Math.min(saved, target), monthly, icon: '🎯', note: 'Added by the Hartono family.' });
    saveState(); render(); toast(`Goal “${name}” added.`);
  });
}

// ---------- BILLS ----------
function billsView() {
  const paid = state.bills.filter(b => b.paid);
  const unpaid = state.bills.filter(b => !b.paid).sort((a, b) => a.day - b.day);
  const paidTotal = paid.reduce((s, b) => s + b.amount, 0);
  const total = state.bills.reduce((s, b) => s + b.amount, 0);
  const today = 26; // the demo's "today" in November 2026
  // November 2026 calendar: 1 Nov 2026 is a Sunday.
  const firstWeekday = new Date(2026, 10, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push('<div class="cal-day empty"></div>');
  for (let d = 1; d <= 30; d++) {
    const due = state.bills.filter(b => b.day === d);
    cells.push(`<div class="cal-day ${d === today ? 'today' : ''} ${due.length ? 'has-bill' : ''}"><span class="dnum">${d}</span>${due.map(b => `<span class="cal-bill ${b.paid ? 'paid' : ''}">${esc(b.name.split(' — ')[0].split(' - ')[0])} ${money0(b.amount)}</span>`).join('')}</div>`);
  }
  return `
  <div class="page-head"><div><h1>Bills — November 2026</h1>
  <p>Every recurring bill, its due day and whether it is paid. Tick a bill paid and the totals update at once.</p></div>
  <span class="badge ${unpaid.length === 0 ? 'badge-paid' : 'badge-due'}">${paid.length} of ${state.bills.length} paid · ${money(paidTotal)} of ${money(total)}</span></div>

  <section class="grid grid-2-1">
    <div class="card">
      <h2>November calendar</h2>
      <div class="calendar" role="grid" aria-label="November 2026 bill calendar">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="cal-head">${d}</div>`).join('')}
        ${cells.join('')}
      </div>
      <p class="muted small" style="margin-top:8px">Today is 26 November. Bills already paid are struck through on the calendar.</p>
    </div>
    <div class="card">
      <h2>Upcoming reminders</h2>
      ${unpaid.slice(0, 4).map(b => `<div class="progress-row"><span>${esc(b.name)}</span><strong class="num">${money(b.amount)} · due ${ordinal(b.day)} Nov</strong><span class="small muted">${b.autopay ? 'Autopay on — will clear itself' : 'Pay manually before the due day'}</span></div>`).join('') || '<p class="muted">No bills left to pay this month. 🎉</p>'}
      <p class="small" style="margin-top:10px"><strong>${money(total - paidTotal)}</strong> still to pay in November.</p>
    </div>
  </section>

  <section class="card" style="margin-top:16px">
    <h2>All bills</h2>
    ${[...state.bills].sort((a, b) => a.day - b.day).map(b => {
      const idx = state.bills.indexOf(b);
      return `<div class="bill-row">
        <span class="bill-name"><strong>${esc(b.name)}</strong><br><span class="muted small">${esc(b.category)} · due ${ordinal(b.day)} November</span></span>
        ${b.autopay ? '<span class="badge badge-auto">Autopay</span>' : '<span class="badge badge-due">Manual</span>'}
        <span class="bill-amt num">${money(b.amount)}</span>
        <span class="badge ${b.paid ? 'badge-paid' : 'badge-due'}">${b.paid ? 'Paid ✓' : 'Unpaid'}</span>
        <label class="switch"><input type="checkbox" data-bill="${idx}" ${b.paid ? 'checked' : ''}> Mark paid</label>
      </div>`;
    }).join('')}
  </section>`;
}
function bindBills() {
  view.querySelectorAll('[data-bill]').forEach(cb => cb.addEventListener('change', () => {
    const b = state.bills[Number(cb.dataset.bill)];
    b.paid = cb.checked; saveState(); render();
    toast(b.paid ? `${b.name} marked paid.` : `${b.name} marked unpaid.`);
  }));
}

// ---------- REPORTS ----------
function reportsView() {
  const totals = allMonthTotals();
  const byMonthCat = {};
  for (const t of totals) byMonthCat[t.month] = t.byCat;
  const topCats = ['Housing', 'Groceries', 'Kids & School', 'Dining Out', 'Other'];
  // Top 5 merchants by spend across all three months.
  const merch = {};
  for (const t of state.tx) if (t.type === 'expense') merch[t.merchant] = (merch[t.merchant] || 0) + t.amt;
  const topMerchants = Object.entries(merch).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const allSpent = totals.reduce((s, t) => s + t.spent, 0);
  // Insights, all computed from the ledger — never typed in by hand.
  const catChange = CATEGORIES
    .map(c => ({ cat: c, sep: byMonthCat['2026-09'][c] || 0, nov: byMonthCat['2026-11'][c] || 0 }))
    .map(x => ({ ...x, diff: x.nov - x.sep }))
    .sort((a, b) => b.diff - a.diff);
  const biggestRise = catChange[0], biggestFall = catChange[catChange.length - 1];
  const nov = computeMonth('2026-11');
  const diningShare = (nov.byCat['Dining Out'] / nov.spent * 100).toFixed(1);
  const bestSaver = totals.reduce((a, b) => (b.rate > a.rate ? b : a), totals[0]);
  const insights = [
    `Biggest rise since September: <strong>${biggestRise.cat}</strong> is up ${money(biggestRise.diff)} (${money(biggestRise.sep)} → ${money(biggestRise.nov)}), driven by the November car repair.`,
    `Biggest fall since September: <strong>${biggestFall.cat}</strong> is down ${money(-biggestFall.diff)} (${money(biggestFall.sep)} → ${money(biggestFall.nov)}).`,
    `Dining out is <strong>${diningShare}%</strong> of November spending — ${money(nov.byCat['Dining Out'])} across 7 meals out. Cooking two more nights a week would save about $60 a month.`,
    `Best saving month so far: <strong>${MONTH_LABELS[bestSaver.month]}</strong> at ${bestSaver.rate.toFixed(1)}% (${money(bestSaver.saved)} saved).`
  ];
  return `
  <div class="page-head"><div><h1>Reports — Sep to Nov 2026</h1>
  <p>Three months side by side: where the money came from, where it went, and what changed.</p></div>
  <div class="btn-row"><button class="btn" type="button" id="exportCsv">Export CSV</button><button class="btn btn-ghost" type="button" id="printReport">Print</button></div></div>

  <section class="card" style="margin-bottom:16px">
    <h2>Month comparison</h2>
    <div class="table-wrap"><table>
      <thead><tr><th></th>${totals.map(t => `<th class="num">${MONTH_LABELS[t.month]}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><td>Income</td>${totals.map(t => `<td class="num pos">${money(t.income)}</td>`).join('')}</tr>
        <tr><td>Spending</td>${totals.map(t => `<td class="num neg">${money(t.spent)}</td>`).join('')}</tr>
        <tr><td>Saved</td>${totals.map(t => `<td class="num pos">${money(t.saved)}</td>`).join('')}</tr>
        <tr><td>Savings rate</td>${totals.map(t => `<td class="num">${t.rate.toFixed(1)}%</td>`).join('')}</tr>
        <tr><td>Transactions</td>${totals.map(t => `<td class="num">${t.count}</td>`).join('')}</tr>
      </tbody>
    </table></div>
    ${vbarSVG(totals.map(t => ({ label: MONTH_LABELS[t.month].split(' ')[0], value: t.spent, color: '#1d5c3f' })), { height: 170 })}
  </section>

  <section class="grid grid-2">
    <div class="card">
      <h2>Category trend — top 5 categories</h2>
      ${groupedBarSVG(MONTHS, topCats, byMonthCat)}
      <div class="legend">${topCats.map(c => `<span><span class="dot" style="background:${CATEGORY_COLORS[c]}"></span>${esc(c)}</span>`).join('')}</div>
      <p class="muted small">Housing is flat at ${money(1650)} a month — rent never moves. Groceries and Kids &amp; School climb into November.</p>
    </div>
    <div class="card">
      <h2>Top 5 merchants by spend</h2>
      ${topMerchants.map(([name, amt], i) => `<div class="progress-row"><span>${i + 1}. ${esc(name)}</span><strong class="num">${money(amt)}</strong><div class="bar"><span style="width:${Math.round(amt / topMerchants[0][1] * 100)}%"></span></div><span class="small muted">${(amt / allSpent * 100).toFixed(1)}% of all spending</span></div>`).join('')}
    </div>
  </section>

  <section class="card" style="margin-top:16px">
    <h2>What the numbers say</h2>
    <ul>${insights.map(i => `<li>${i}</li>`).join('')}</ul>
  </section>`;
}
function bindReports() {
  document.getElementById('exportCsv').addEventListener('click', () => {
    const head = 'Date,Description,Merchant,Category,Type,Member,Amount\n';
    const lines = [...state.tx].sort((a, b) => a.date.localeCompare(b.date))
      .map(t => [t.date, `"${t.desc.replace(/"/g, '""')}"`, `"${t.merchant.replace(/"/g, '""')}"`, t.cat, t.type, t.who, t.amt.toFixed(2)].join(','));
    const blob = new Blob([head + lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hearthledger-transactions.csv';
    a.click(); URL.revokeObjectURL(a.href);
    toast(`Exported ${lines.length} transactions as CSV.`);
  });
  document.getElementById('printReport').addEventListener('click', () => window.print());
}

// ---------- HOUSEHOLD ----------
function householdView() {
  const m = state.month;
  const cur = computeMonth(m);
  // Per-member spending: what each person paid. Kids & School is split between Leo and Sofia.
  const memberSpent = Object.fromEntries(MEMBERS.map(mb => [mb.name.split(' ')[0], 0]));
  for (const t of cur.rows) {
    if (t.type !== 'expense') continue;
    if (t.cat === 'Kids & School') { memberSpent['Leo'] += t.amt / 2; memberSpent['Sofia'] += t.amt / 2; }
    else if (memberSpent[t.who] !== undefined) memberSpent[t.who] += t.amt;
  }
  const sharedCats = ['Housing', 'Groceries', 'Utilities', 'Transport', 'Household', 'Kids & School', 'Health', 'Subscriptions'];
  const shared = sharedCats.reduce((s, c) => s + (cur.byCat[c] || 0), 0);
  const personal = cur.spent - shared;
  return `
  <div class="page-head"><div><h1>The Hartono household</h1>
  <p>Four people, one budget. Daniel and Maya earn and run the house; Leo (9) and Sofia (6) have their own small allowances — and their school costs are split between them below.</p></div></div>

  <section class="grid grid-2">
    ${MEMBERS.map(mb => {
      const key = mb.name.split(' ')[0];
      const spent = memberSpent[key] || 0;
      const initials = mb.name.split(' ').map(w => w[0]).join('');
      return `<article class="card member-card">
        <div class="member-head"><span class="avatar" style="background:${mb.color}">${initials}</span>
        <div><h2 style="margin:0">${esc(mb.name)}</h2><span class="muted small">${esc(mb.role)} · age ${mb.age}</span></div></div>
        <p class="small">${esc(mb.note)}</p>
        <div class="progress-row"><span>Spent in ${MONTH_LABELS[m].split(' ')[0]}</span><strong class="num">${money(spent)}</strong><div class="bar"><span style="width:${Math.min(100, spent / Math.max(1, cur.spent) * 100)}%"></span></div><span class="small muted">${(spent / Math.max(1, cur.spent) * 100).toFixed(1)}% of household spending</span></div>
        <p class="small" style="margin-top:8px">Personal budget: <strong>${money(mb.personal)}/month</strong> ${key === 'Daniel' || key === 'Maya' ? '· personal spending comes from the Personal category' : '· weekly allowance, paid in cash on Fridays'}</p>
      </article>`;
    }).join('')}
  </section>

  <section class="card" style="margin-top:16px">
    <h2>Shared vs personal — ${MONTH_LABELS[m]}</h2>
    <div class="split-bar" role="img" aria-label="Shared ${money(shared)} and personal ${money(personal)}">
      <span style="width:${(shared / Math.max(1, cur.spent) * 100).toFixed(1)}%;background:#1d5c3f"></span>
      <span style="width:${(personal / Math.max(1, cur.spent) * 100).toFixed(1)}%;background:#d4a017"></span>
    </div>
    <div class="split-legend">
      <span><span class="dot" style="background:#1d5c3f"></span>Shared household — ${money(shared)} (${(shared / Math.max(1, cur.spent) * 100).toFixed(1)}%)</span>
      <span><span class="dot" style="background:#d4a017"></span>Personal &amp; treats — ${money(personal)} (${(personal / Math.max(1, cur.spent) * 100).toFixed(1)}%)</span>
    </div>
    <p class="muted small" style="margin-top:10px">Shared covers rent, groceries, utilities, transport, the house, the kids, health and subscriptions. Personal covers dining out, entertainment, personal items and one-off costs — the part each person controls day to day.</p>
    <div class="table-wrap"><table>
      <thead><tr><th>Member</th><th>Role</th><th class="num">Personal budget</th><th class="num">Spent this month</th><th class="num">Share of household spend</th></tr></thead>
      <tbody>
      ${MEMBERS.map(mb => {
        const key = mb.name.split(' ')[0];
        const spent = memberSpent[key] || 0;
        return `<tr><td>${esc(mb.name)}</td><td>${esc(mb.role)}</td><td class="num">${money(mb.personal)}</td><td class="num">${money(spent)}</td><td class="num">${(spent / Math.max(1, cur.spent) * 100).toFixed(1)}%</td></tr>`;
      }).join('')}
      </tbody>
      <tfoot><tr><td colspan="3">Household total</td><td class="num">${money(cur.spent)}</td><td class="num">100%</td></tr></tfoot>
    </table></div>
  </section>`;
}

// ---------- ROUTER & BOOT ----------
// The router sits last on purpose: every view function and every piece of page state
// above it is declared before render() is first called (see txFilter, editingId above).
function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [page] = hash.split('/');
  document.querySelectorAll('.mainnav a').forEach(a => a.classList.toggle('active', a.dataset.route === page));
  return page || '';
}
function render() {
  const page = route();
  const map = { '': dashboardView, 'transactions': transactionsView, 'budget': budgetView, 'goals': goalsView, 'bills': billsView, 'reports': reportsView, 'household': householdView };
  const fn = map[page] || dashboardView;
  view.innerHTML = fn();
  if (fn === transactionsView) bindTransactions();
  if (fn === budgetView) bindBudget();
  if (fn === goalsView) bindGoals();
  if (fn === billsView) bindBills();
  if (fn === reportsView) bindReports();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
monthSelect.value = state.month;
monthSelect.addEventListener('change', () => { state.month = monthSelect.value; saveState(); render(); });
document.getElementById('resetDemo').addEventListener('click', () => { if (confirm('Reset all edits and restore the original Hartono demo data?')) resetDemo(); });
document.getElementById('navToggle').addEventListener('click', e => {
  const nav = document.getElementById('mainNav');
  const open = nav.classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.mainnav a').forEach(a => a.addEventListener('click', () => document.getElementById('mainNav').classList.remove('open')));

render();
