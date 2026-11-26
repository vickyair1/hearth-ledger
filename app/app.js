/* HearthLedger — routing, month math, all 7 views, SVG charts, persistence.
   Everything is computed from the TRANSACTIONS array in data.js.
   Edits (transactions, budgets, goals, bills) live in localStorage under
   "hearthledger-v1" and "Reset demo data" restores the seed. */

"use strict";

/* ---------- state ---------- */
const STORE_KEY = "hearthledger-v1";

function defaultState() {
  return {
    transactions: JSON.parse(JSON.stringify(TRANSACTIONS)),
    budgets: Object.assign({}, BUDGETS),
    goals: JSON.parse(JSON.stringify(GOALS)),
    bills: JSON.parse(JSON.stringify(BILLS)),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    if (!s.transactions || !s.budgets || !s.goals || !s.bills) return defaultState();
    return s;
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
}

const state = loadState();

/* ---------- filters (declared before any render runs) ---------- */
let txFilter = { month: "2026-11", category: "all", type: "all", q: "" };

/* ---------- formatting helpers ---------- */
function money(n) {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function money0(n) {
  return "$" + Math.round(Number(n)).toLocaleString("en-US");
}
function pct(n, d) {
  return d ? ((n / d) * 100).toFixed(1) + "%" : "—";
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function shortDate(iso) {
  const parts = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[Number(parts[1]) - 1] + " " + Number(parts[2]);
}
function finishIn(goal) {
  const left = goal.target - goal.saved;
  if (left <= 0) return "Done";
  if (!goal.monthly || goal.monthly <= 0) return "—";
  const m = Math.ceil(left / goal.monthly);
  return m + (m === 1 ? " mo" : " mos");
}

/* ---------- month math (the single source of truth) ---------- */
function monthRows(ym) {
  return state.transactions.filter(function (t) { return t.date.slice(0, 7) === ym; });
}
function computeMonth(ym) {
  const rows = monthRows(ym);
  let income = 0, spent = 0;
  const byCat = {};
  CATEGORIES.forEach(function (c) { byCat[c] = 0; });
  rows.forEach(function (t) {
    if (t.type === "income") income += t.amount;
    else {
      spent += t.amount;
      if (byCat[t.category] !== undefined) byCat[t.category] += t.amount;
    }
  });
  const saved = income - spent;
  return {
    rows: rows, income: income, spent: spent, saved: saved,
    rate: income ? (saved / income) * 100 : 0, byCat: byCat,
  };
}
function totalBudget() {
  return CATEGORIES.reduce(function (s, c) { return s + (state.budgets[c] || 0); }, 0);
}
function topMerchants(ym, limit) {
  const map = {};
  monthRows(ym).forEach(function (t) {
    if (t.type !== "expense") return;
    map[t.merchant] = (map[t.merchant] || 0) + t.amount;
  });
  return Object.keys(map).map(function (k) { return { name: k, total: map[k] }; })
    .sort(function (a, b) { return b.total - a.total; }).slice(0, limit);
}
function memberSpend(ym) {
  const out = {};
  MEMBERS.forEach(function (m) { out[m.name] = 0; });
  let shared = 0;
  monthRows(ym).forEach(function (t) {
    if (t.type !== "expense") return;
    if (t.member === "Shared") shared += t.amount;
    else if (out[t.member] !== undefined) out[t.member] += t.amount;
  });
  return { per: out, shared: shared };
}

/* ---------- tiny SVG chart helpers (hand-rolled, no libs) ---------- */
const PALETTE = ["#2f5d50", "#c05621", "#2b6cb0", "#b7791f", "#975a16", "#6b7c59",
  "#8a5a83", "#4a6b6b", "#a34a3a", "#7a6a53", "#3d7a5e", "#9c6644"];

function donutChart(parts, size) {
  /* parts: [{label, value, color}] — returns an SVG donut + legend. */
  const total = parts.reduce(function (s, p) { return s + p.value; }, 0) || 1;
  const r = 62, cx = 80, cy = 80, circ = 2 * Math.PI * r;
  let offset = 0;
  const rings = parts.map(function (p) {
    const frac = p.value / total;
    const dash = frac * circ;
    const el = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' +
      p.color + '" stroke-width="26" stroke-dasharray="' + dash.toFixed(1) + " " +
      (circ - dash).toFixed(1) + '" stroke-dashoffset="' + (-offset).toFixed(1) + '"/>';
    offset += dash;
    return el;
  }).join("");
  const legend = parts.map(function (p) {
    return '<div><i style="background:' + p.color + '"></i>' + esc(p.label) + " — " +
      money(p.value) + " (" + pct(p.value, total) + ")</div>";
  }).join("");
  return '<div style="display:flex;gap:18px;flex-wrap:wrap;align-items:center">' +
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 160 160" role="img" aria-label="Spending by category">' +
    '<circle cx="80" cy="80" r="62" fill="none" stroke="#efe7d6" stroke-width="26"/>' + rings +
    '<text x="80" y="76" text-anchor="middle" font-size="15" font-weight="700" fill="#2b2620">' + money(total) + '</text>' +
    '<text x="80" y="94" text-anchor="middle" font-size="11" fill="#6b6257">spent in Nov</text></svg>' +
    '<div class="legend" style="flex-direction:column;gap:4px">' + legend + "</div></div>";
}

function vbarChart(series, height) {
  /* series: [{label, a, b}] grouped bars: a = income, b = spent. */
  const max = Math.max.apply(null, series.map(function (s) { return Math.max(s.a, s.b); })) || 1;
  const w = 420, h = height || 220, pad = 34, bw = 34, gap = 26;
  const y = function (v) { return h - pad - (v / max) * (h - pad - 30); };
  let bars = "";
  series.forEach(function (s, i) {
    const x = pad + i * (bw * 2 + gap) + 8;
    bars += '<rect x="' + x + '" y="' + y(s.a) + '" width="' + bw + '" height="' + (h - pad - y(s.a)) +
      '" rx="3" fill="#2f5d50"/>';
    bars += '<rect x="' + (x + bw + 4) + '" y="' + y(s.b) + '" width="' + bw + '" height="' + (h - pad - y(s.b)) +
      '" rx="3" fill="#c05621"/>';
    bars += '<text x="' + (x + bw) + '" y="' + (h - 12) + '" text-anchor="middle" font-size="12" fill="#6b6257">' + esc(s.label) + "</text>";
    bars += '<text x="' + (x + bw) + '" y="' + (y(s.a) - 5) + '" text-anchor="middle" font-size="11" fill="#2f5d50">' + money0(s.a) + "</text>";
    bars += '<text x="' + (x + bw) + '" y="' + (y(s.b) - 5) + '" text-anchor="middle" font-size="11" fill="#c05621">' + money0(s.b) + "</text>";
  });
  return '<svg width="100%" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="Income versus spending">' + bars +
    '<line x1="' + pad + '" y1="' + (h - pad) + '" x2="' + w + '" y2="' + (h - pad) + '" stroke="#e7dcc8"/></svg>' +
    '<div class="legend"><span><i style="background:#2f5d50"></i>Income</span><span><i style="background:#c05621"></i>Spent</span></div>';
}

function hbarChart(parts) {
  /* parts: [{label, value}] — horizontal bars, used for the trend view. */
  const max = Math.max.apply(null, parts.map(function (p) { return p.value; })) || 1;
  return parts.map(function (p, i) {
    const w = Math.max(2, (p.value / max) * 100);
    return '<div style="display:grid;grid-template-columns:110px 1fr 90px;gap:10px;align-items:center;margin:7px 0">' +
      "<div>" + esc(p.label) + "</div>" +
      '<div class="bar-track"><div class="bar-fill" style="width:' + w.toFixed(1) + "%;background:" + PALETTE[i % PALETTE.length] + '"></div></div>' +
      '<div class="right num">' + money(p.value) + "</div></div>";
  }).join("");
}

/* ---------- router ---------- */
function currentRoute() {
  const h = location.hash.replace(/^#\/?/, "");
  return h.split("/")[0] || "";
}

function render() {
  const route = currentRoute();
  document.querySelectorAll("#nav a").forEach(function (a) {
    a.classList.toggle("active", a.getAttribute("data-route") === route);
  });
  const view = document.getElementById("view");
  if (route === "transactions") view.innerHTML = viewTransactions();
  else if (route === "budget") view.innerHTML = viewBudget();
  else if (route === "goals") view.innerHTML = viewGoals();
  else if (route === "bills") view.innerHTML = viewBills();
  else if (route === "reports") view.innerHTML = viewReports();
  else if (route === "household") view.innerHTML = viewHousehold();
  else view.innerHTML = viewDashboard();
  window.scrollTo(0, 0);
  bindView(route);
}

window.addEventListener("hashchange", render);

/* ---------- dashboard ---------- */
function viewDashboard() {
  const nov = computeMonth("2026-11");
  const sep = computeMonth("2026-09");
  const oct = computeMonth("2026-10");
  const over = CATEGORIES.filter(function (c) { return nov.byCat[c] > (state.budgets[c] || 0); });
  const topCat = CATEGORIES.slice().sort(function (a, b) { return nov.byCat[b] - nov.byCat[a]; })[0];
  const unpaid = state.bills.filter(function (b) { return !b.paid; })
    .sort(function (a, b) { return a.due - b.due; }).slice(0, 5);
  const latest = state.transactions.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 8);
  const donutParts = CATEGORIES.map(function (c, i) {
    return { label: c, value: nov.byCat[c], color: PALETTE[i % PALETTE.length] };
  }).filter(function (p) { return p.value > 0; })
    .sort(function (a, b) { return b.value - a.value; }).slice(0, 8);
  const insight = nov.rate >= 20
    ? "November is on track: the family saved " + pct(nov.saved, nov.income) + " of income, above the 20% target. " +
      "Biggest spend was " + topCat + " at " + money(nov.byCat[topCat]) + ". " +
      (over.length ? over.length + " categor" + (over.length === 1 ? "y is" : "ies are") + " over budget: " + over.join(", ") + "." : "No category is over budget.")
    : "November savings are below the 20% target — review " + topCat + " first, it took " + money(nov.byCat[topCat]) + " this month.";

  return '' +
    "<h2>November 2026 at a glance</h2>" +
    '<p class="sub">Income, spending and saving for the Hartono household — computed live from the ledger.</p>' +
    '<div class="grid stats">' +
    '<div class="card stat good"><div class="label">Income</div><div class="value">' + money(nov.income) + '</div><div class="note">4 paydays &amp; inflows</div></div>' +
    '<div class="card stat"><div class="label">Spent</div><div class="value">' + money(nov.spent) + '</div><div class="note">' + nov.rows.filter(function (t) { return t.type === "expense"; }).length + ' expense rows</div></div>' +
    '<div class="card stat good"><div class="label">Saved</div><div class="value">' + money(nov.saved) + '</div><div class="note">Income minus spending</div></div>' +
    '<div class="card stat ' + (nov.rate >= 20 ? "good" : "warn") + '"><div class="label">Savings rate</div><div class="value">' + nov.rate.toFixed(1) + '%</div><div class="note">Target: 20% of income</div></div>' +
    "</div>" +
    '<p class="insight">' + esc(insight) + "</p>" +
    '<div class="grid two">' +
    '<div class="card"><h3>Income vs spending</h3>' + vbarChart([
      { label: "Sep", a: sep.income, b: sep.spent },
      { label: "Oct", a: oct.income, b: oct.spent },
      { label: "Nov", a: nov.income, b: nov.spent },
    ]) + "</div>" +
    '<div class="card"><h3>Where November money went</h3>' + donutChart(donutParts, 160) + "</div>" +
    "</div>" +
    '<div class="grid two">' +
    '<div class="card"><h3>Spending trend <span class="hint">Sep &ndash; Nov</span></h3>' + hbarChart([
      { label: "September", value: sep.spent },
      { label: "October", value: oct.spent },
      { label: "November", value: nov.spent },
    ]) + '<p class="small muted">Spending is drifting up as the holidays approach — November is the highest of the three months.</p></div>' +
    '<div class="card"><h3>Budget health <span class="hint">November</span></h3>' +
    CATEGORIES.map(function (c) {
      const spent = nov.byCat[c], bud = state.budgets[c] || 0;
      const overBy = spent > bud;
      return '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)">' +
        "<span>" + esc(c) + '</span><span class="num">' + money(spent) + " / " + money(bud) + " " +
        '<span class="badge ' + (overBy ? "over" : "under") + '">' + (overBy ? "over " + money(spent - bud) : "under " + money(bud - spent)) + "</span></span></div>";
    }).join("") + "</div>" +
    "</div>" +
    '<div class="grid two">' +
    '<div class="card"><h3>Next bills to pay</h3>' +
    (unpaid.length ? unpaid.map(function (b) {
      return '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)">' +
        "<span>" + esc(b.name) + ' <span class="muted small">due Nov ' + b.due + "</span></span>" +
        '<span class="num">' + money(b.amount) + "</span></div>";
    }).join("") : "<p>All bills are paid.</p>") +
    '<p style="margin:12px 0 0"><a href="#/bills">See all 12 bills &rarr;</a></p></div>' +
    '<div class="card"><h3>Latest transactions</h3>' +
    latest.map(function (t) {
      return '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)">' +
        "<span>" + shortDate(t.date) + " &middot; " + esc(t.merchant) + '</span><span class="num ' + (t.type === "income" ? "pos" : "neg") + '">' +
        (t.type === "income" ? "+" : "−") + money(t.amount) + "</span></div>";
    }).join("") +
    '<p style="margin:12px 0 0"><a href="#/transactions">Open the full ledger &rarr;</a></p></div>' +
    "</div>";
}

/* ---------- transactions ---------- */
function filteredTx() {
  const q = txFilter.q.trim().toLowerCase();
  return state.transactions.filter(function (t) {
    if (txFilter.month !== "all" && t.date.slice(0, 7) !== txFilter.month) return false;
    if (txFilter.category !== "all" && t.category !== txFilter.category) return false;
    if (txFilter.type !== "all" && t.type !== txFilter.type) return false;
    if (q && (t.merchant + " " + t.member + " " + t.category).toLowerCase().indexOf(q) === -1) return false;
    return true;
  }).sort(function (a, b) { return b.date.localeCompare(a.date) || a.merchant.localeCompare(b.merchant); });
}

function viewTransactions() {
  const rows = filteredTx();
  let running = 0;
  let inc = 0, exp = 0;
  rows.forEach(function (t) {
    if (t.type === "income") inc += t.amount; else exp += t.amount;
  });
  /* running balance is computed oldest-first, then shown newest-first. */
  const oldestFirst = rows.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
  const balanceById = {};
  oldestFirst.forEach(function (t) {
    running += t.type === "income" ? t.amount : -t.amount;
    balanceById[t.id] = running;
  });
  const catOpts = ['<option value="all">All categories</option>']
    .concat(CATEGORIES.map(function (c) {
      return '<option value="' + esc(c) + '"' + (txFilter.category === c ? " selected" : "") + ">" + esc(c) + "</option>";
    })).join("");
  const monthOpts = ['<option value="all">All months</option>'].concat(MONTHS.map(function (m) {
    return '<option value="' + m + '"' + (txFilter.month === m ? " selected" : "") + ">" + MONTH_LABELS[m] + "</option>";
  })).join("");

  return '' +
    "<h2>Transactions</h2>" +
    '<p class="sub">The full household ledger — ' + state.transactions.length + ' rows, September to November 2026. Add, edit or delete any row; every total on the site updates.</p>' +
    '<div class="card"><div class="filters">' +
    '<div><label>Month</label><select id="f-month">' + monthOpts + "</select></div>" +
    '<div><label>Category</label><select id="f-cat">' + catOpts + "</select></div>" +
    '<div><label>Type</label><select id="f-type"><option value="all">All</option>' +
    '<option value="income"' + (txFilter.type === "income" ? " selected" : "") + '>Income</option>' +
    '<option value="expense"' + (txFilter.type === "expense" ? " selected" : "") + '>Expense</option></select></div>' +
    '<div><label>Search</label><input type="text" id="f-q" placeholder="merchant, member…" value="' + esc(txFilter.q) + '"></div>' +
    '<div><label>&nbsp;</label><button id="f-clear" class="ghost">Clear</button></div>' +
    "</div>" +
    '<form id="add-tx"><div class="form-row">' +
    '<div><label>Date</label><input type="date" id="n-date" value="2026-11-30" required></div>' +
    '<div><label>Merchant / description</label><input type="text" id="n-merchant" placeholder="e.g. Sunday market" required></div>' +
    '<div><label>Category</label><select id="n-cat">' + CATEGORIES.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") + "</select></div>" +
    '<div><label>Type</label><select id="n-type"><option value="expense">Expense</option><option value="income">Income</option></select></div>' +
    '<div><label>Amount ($)</label><input type="number" id="n-amount" min="0.01" step="0.01" placeholder="0.00" required></div>' +
    '<div><label>Member</label><select id="n-member">' + MEMBERS.map(function (m) { return "<option>" + esc(m.name) + "</option>"; }).join("") + '<option>Shared</option></select></div>' +
    '<div><label>&nbsp;</label><button type="submit">Add transaction</button></div>' +
    "</div></form></div>" +
    '<div class="card table-scroll"><table><thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Member</th><th class="right">Amount</th><th class="right">Balance</th><th></th></tr></thead><tbody>' +
    rows.map(function (t) {
      return '<tr><td class="num">' + esc(t.date) + "</td><td>" + esc(t.merchant) + "</td><td>" + esc(t.category) +
        '</td><td>' + esc(t.member) + '</td><td class="right num ' + (t.type === "income" ? "pos" : "neg") + '">' +
        (t.type === "income" ? "+" : "−") + money(t.amount) + '</td><td class="right num">' + money(balanceById[t.id]) + "</td>" +
        '<td class="right"><button class="small ghost" data-edit="' + esc(t.id) + '">Edit</button> ' +
        '<button class="small danger" data-del="' + esc(t.id) + '">Delete</button></td></tr>';
    }).join("") +
    "</tbody><tfoot><tr><td colspan=\"4\">" + rows.length + " rows shown</td>" +
    '<td class="right">Income ' + money(inc) + "<br>Spent " + money(exp) + "</td>" +
    '<td class="right">Net ' + money(inc - exp) + "</td><td></td></tr></tfoot></table></div>";
}

/* ---------- budget ---------- */
function viewBudget() {
  const nov = computeMonth("2026-11");
  const totalBud = totalBudget();
  const needs = nov.byCat.Housing + nov.byCat.Utilities + nov.byCat.Groceries + nov.byCat.Transport + nov.byCat.Health;
  const wants = nov.byCat.Dining + nov.byCat.Entertainment + nov.byCat.Shopping + nov.byCat.Kids + nov.byCat.Subscriptions;
  const future = nov.byCat.Education + nov.byCat.Misc;
  const rule = function (label, spent, targetPct) {
    const p = nov.income ? (spent / nov.income) * 100 : 0;
    const ok = p <= targetPct;
    return '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between"><span><strong>' + label +
      '</strong> <span class="muted small">target ' + targetPct + '%</span></span><span class="num">' + money(spent) + " (" + p.toFixed(1) + "%) " +
      '<span class="badge ' + (ok ? "under" : "over") + '">' + (ok ? "on track" : "over") + "</span></span></div>" +
      '<div class="bar-track" style="margin-top:6px"><div class="bar-fill ' + (ok ? "" : "over") + '" style="width:' + Math.min(100, (p / targetPct) * 100).toFixed(1) + '%"></div></div></div>';
  };
  const verdict = (needs / nov.income) * 100 <= 50 && (wants / nov.income) * 100 <= 30
    ? "November fits the 50/30/20 rule: needs and wants are both inside their bands, leaving " + pct(nov.saved, nov.income) + " for savings."
    : "November breaks the 50/30/20 rule somewhere — check needs first, then wants.";

  return '' +
    "<h2>Budget — November 2026</h2>" +
    '<p class="sub">12 category budgets against real November spending. Click any budget amount to change it; the bars and badges update at once.</p>' +
    '<div class="grid two"><div class="card"><h3>Category budgets <span class="hint">total ' + money(totalBud) + " / month</span></h3>" +
    CATEGORIES.map(function (c) {
      const spent = nov.byCat[c], bud = state.budgets[c] || 0;
      const use = bud ? Math.min(100, (spent / bud) * 100) : 0;
      const overBy = spent > bud;
      return '<div class="budget-row"><div class="budget-head"><span><strong>' + esc(c) + "</strong></span>" +
        '<span class="num"><span class="amount" data-budget="' + esc(c) + '" title="Click to edit">' + money(bud) + "</span> budget &middot; " + money(spent) + " spent " +
        '<span class="badge ' + (overBy ? "over" : "under") + '">' + (overBy ? "over " + money(spent - bud) : "under " + money(bud - spent)) + "</span></span></div>" +
        '<div class="bar-track" style="margin-top:7px"><div class="bar-fill ' + (overBy ? "over" : (use > 85 ? "amber" : "")) + '" style="width:' + use.toFixed(1) + '%"></div></div>' +
        '<div class="goal-bar"><span>' + use.toFixed(0) + "% used</span><span>" + (bud ? pct(spent, bud) : "—") + " of budget</span></div></div>";
    }).join("") + "</div>" +
    '<div><div class="card"><h3>The 50/30/20 rule <span class="hint">computed from real income</span></h3>' +
    rule("Needs — housing, utilities, groceries, transport, health", needs, 50) +
    rule("Wants — dining, fun, shopping, kids, subscriptions", wants, 30) +
    rule("Future — education &amp; everything else", future, 20) +
    '<p style="margin:12px 0 0">' + esc(verdict) + "</p></div>" +
    '<div class="card"><h3>How November compares</h3>' +
    "<p>Total budgeted: <strong>" + money(totalBud) + "</strong>. Total actually spent: <strong>" + money(nov.spent) + "</strong>. " +
    "That leaves <strong>" + money(totalBud - nov.spent) + "</strong> of budget headroom — money the family did not need this month.</p>" +
    "<p>Two categories ran over: <strong>Housing</strong> (insurance landed in the same month as rent) and <strong>Misc</strong> (a plumber call-out). " +
    "Everything else came in under its budget.</p>" +
    '<p class="small muted">Tip: click a budget amount on the left to raise or lower it — for example, give Housing a little more room next month and trim Shopping to match.</p></div>' +
    "</div></div>";
}

/* ---------- goals ---------- */
function viewGoals() {
  const totalSaved = state.goals.reduce(function (s, g) { return s + g.saved; }, 0);
  const totalTarget = state.goals.reduce(function (s, g) { return s + g.target; }, 0);
  return '' +
    "<h2>Savings goals</h2>" +
    '<p class="sub">' + state.goals.length + " goals, " + money(totalSaved) + " saved of " + money(totalTarget) + " (" + pct(totalSaved, totalTarget) + "). " +
    "Contribute to any goal — finish months are computed from your monthly amount.</p>" +
    '<div class="grid two">' +
    state.goals.map(function (g) {
      const use = Math.min(100, (g.saved / g.target) * 100);
      const left = Math.max(0, g.target - g.saved);
      return '<div class="card"><h3>' + esc(g.name) + ' <span class="hint">' + pct(g.saved, g.target) + "</span></h3>" +
        '<p class="small muted" style="margin:0 0 10px">' + esc(g.note) + "</p>" +
        '<div class="bar-track"><div class="bar-fill" style="width:' + use.toFixed(1) + '%"></div></div>' +
        '<div class="goal-bar"><span>' + money(g.saved) + " of " + money(g.target) + "</span>" +
        '<span data-togo="' + esc(g.id) + '">' + money(left) + " to go</span></div>" +
        '<div class="goal-bar"><span>Monthly: ' + money(g.monthly) + "</span><span>Finish in: <strong>" + finishIn(g) + "</strong></span></div>" +
        '<div class="goal-actions"><button class="small" data-give="' + esc(g.id) + '" data-amt="50">+$50</button>' +
        '<button class="small" data-give="' + esc(g.id) + '" data-amt="100">+$100</button>' +
        '<input type="number" min="1" step="1" placeholder="Custom $" data-custom="' + esc(g.id) + '">' +
        '<button class="small ghost" data-give-custom="' + esc(g.id) + '">Add</button></div></div>';
    }).join("") +
    "</div>" +
    '<div class="card"><h3>Add a new goal</h3>' +
    '<form id="add-goal"><div class="form-row">' +
    '<div><label>Goal name</label><input type="text" id="g-name" placeholder="e.g. New laptop" required></div>' +
    '<div><label>Target ($)</label><input type="number" id="g-target" min="1" step="1" required></div>' +
    '<div><label>Already saved ($)</label><input type="number" id="g-saved" min="0" step="1" value="0"></div>' +
    '<div><label>Monthly ($)</label><input type="number" id="g-monthly" min="0" step="1" value="100"></div>' +
    '<div><label>&nbsp;</label><button type="submit">Add goal</button></div>' +
    "</div></form></div>";
}

/* ---------- bills ---------- */
function viewBills() {
  const paid = state.bills.filter(function (b) { return b.paid; });
  const unpaid = state.bills.filter(function (b) { return !b.paid; });
  const paidTotal = paid.reduce(function (s, b) { return s + b.amount; }, 0);
  const dueTotal = state.bills.reduce(function (s, b) { return s + b.amount; }, 0);
  const byDue = {};
  state.bills.forEach(function (b) { byDue[b.due] = b; });
  const firstDow = new Date(2026, 10, 1).getDay(); /* Nov 2026 starts on a Sunday */
  let cells = "";
  for (let i = 0; i < firstDow; i++) cells += '<div class="day empty"></div>';
  for (let d = 1; d <= 30; d++) {
    const b = byDue[d];
    cells += '<div class="day' + (d === 27 ? " today" : "") + '"><span class="n">' + d + "</span>" +
      (b ? '<span class="mark' + (b.paid ? " paid-mark" : "") + '">' + (b.paid ? "✓ " : "• ") + esc(b.name) + "</span>" : "") + "</div>";
  }
  return '' +
    "<h2>Bills — November 2026</h2>" +
    '<p class="sub">12 bills, ' + paid.length + ' paid. Toggle any bill to Paid and the summary below updates.</p>' +
    '<div class="grid stats">' +
    '<div class="card stat"><div class="label">Bills this month</div><div class="value">' + state.bills.length + '</div><div class="note">due in November</div></div>' +
    '<div class="card stat good"><div class="label">Paid</div><div class="value" data-paid-count>' + paid.length + '</div><div class="note">bills settled</div></div>' +
    '<div class="card stat"><div class="label">Paid total</div><div class="value" data-paid-total>' + money(paidTotal) + '</div><div class="note">of ' + money(dueTotal) + " due</div></div>" +
    '<div class="card stat"><div class="label">Still to pay</div><div class="value">' + money(dueTotal - paidTotal) + '</div><div class="note">' + unpaid.length + " bills left</div></div>" +
    "</div>" +
    '<div class="grid two"><div class="card"><h3>November calendar</h3>' +
    '<div class="cal"><div class="dow">Sun</div><div class="dow">Mon</div><div class="dow">Tue</div><div class="dow">Wed</div><div class="dow">Thu</div><div class="dow">Fri</div><div class="dow">Sat</div>' + cells + "</div>" +
    '<p class="small muted">Today is marked — 27 November. Green marks are paid, orange marks are still due.</p></div>' +
    '<div class="card"><h3>All bills</h3>' +
    state.bills.slice().sort(function (a, b) { return a.due - b.due; }).map(function (b) {
      return '<div class="bill-row"><div><strong>' + esc(b.name) + "</strong>" +
        '<div class="small muted">Due Nov ' + b.due + (b.autopay ? ' &middot; <span class="badge auto">Autopay</span>' : "") + "</div></div>" +
        '<div style="display:flex;gap:10px;align-items:center"><span class="num">' + money(b.amount) + "</span>" +
        '<button class="small ' + (b.paid ? "ghost" : "") + '" data-bill="' + esc(b.id) + '">' + (b.paid ? "Paid ✓" : "Mark paid") + "</button></div></div>";
    }).join("") + "</div></div>";
}

/* ---------- reports ---------- */
function viewReports() {
  const sep = computeMonth("2026-09");
  const oct = computeMonth("2026-10");
  const nov = computeMonth("2026-11");
  const top5 = topMerchants("2026-11", 5);
  const worstCat = CATEGORIES.slice().sort(function (a, b) { return (nov.byCat[b] - (state.budgets[b] || 0)) - (nov.byCat[a] - (state.budgets[a] || 0)); })[0];
  const bestCat = CATEGORIES.slice().sort(function (a, b) { return ((state.budgets[a] || 0) - nov.byCat[a]) - ((state.budgets[b] || 0) - nov.byCat[b]); })[0];
  const trend = nov.spent > oct.spent
    ? "Spending rose " + money(nov.spent - oct.spent) + " from October to November (" + pct(nov.spent - oct.spent, oct.spent) + "), mostly in " + worstCat + "."
    : "Spending fell " + money(oct.spent - nov.spent) + " from October to November — good control.";
  const insights = [
    "Savings rate: " + nov.rate.toFixed(1) + "% in November — " + (nov.rate >= 20 ? "above the 20% target." : "below the 20% target."),
    trend,
    "Biggest single category in November: " + topCatName(nov) + " at " + money(Math.max.apply(null, CATEGORIES.map(function (c) { return nov.byCat[c]; }))) + ".",
    "Best-controlled category: " + bestCat + " came in " + money((state.budgets[bestCat] || 0) - nov.byCat[bestCat]) + " under budget.",
  ];
  const row3 = function (label, a, b, c) {
    return "<tr><td>" + label + "</td><td class=\"right num\">" + money(a) + "</td><td class=\"right num\">" + money(b) + "</td><td class=\"right num\">" + money(c) + "</td></tr>";
  };
  return '' +
    "<h2>Reports</h2>" +
    '<p class="sub">September vs October vs November, top merchants, and what the numbers say. Export the ledger or print this page.</p>' +
    '<div class="card no-print" style="display:flex;gap:10px;flex-wrap:wrap"><button id="export-csv">Export CSV</button><button id="print-page" class="ghost">Print report</button></div>' +
    '<div class="grid two"><div class="card"><h3>Three-month comparison</h3><div class="table-scroll"><table>' +
    "<thead><tr><th></th><th class=\"right\">September</th><th class=\"right\">October</th><th class=\"right\">November</th></tr></thead><tbody>" +
    row3("Income", sep.income, oct.income, nov.income) +
    row3("Spent", sep.spent, oct.spent, nov.spent) +
    row3("Saved", sep.saved, oct.saved, nov.saved) +
    "</tbody></table></div></div>" +
    '<div class="card"><h3>Income vs spending</h3>' + vbarChart([
      { label: "Sep", a: sep.income, b: sep.spent },
      { label: "Oct", a: oct.income, b: oct.spent },
      { label: "Nov", a: nov.income, b: nov.spent },
    ]) + "</div></div>" +
    '<div class="grid two"><div class="card"><h3>Top 5 merchants — November</h3>' +
    top5.map(function (m, i) {
      return '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)"><span>' + (i + 1) + ". " + esc(m.name) + '</span><span class="num">' + money(m.total) + "</span></div>";
    }).join("") + "</div>" +
    '<div class="card"><h3>Category trend — spending by month</h3>' +
    CATEGORIES.slice(0, 6).map(function (c) {
      return "<p style=\"margin:6px 0\"><strong>" + esc(c) + ":</strong> " + money(sep.byCat[c]) + " &rarr; " + money(oct.byCat[c]) + " &rarr; <strong>" + money(nov.byCat[c]) + "</strong></p>";
    }).join("") + '<p class="small muted">Top 6 categories shown; the full split is on the Budget page.</p></div></div>' +
    '<div class="card"><h3>Auto insights</h3><ul style="margin:0;padding-left:20px">' +
    insights.map(function (s) { return "<li style=\"margin:6px 0\">" + esc(s) + "</li>"; }).join("") + "</ul></div>";
}

function topCatName(m) {
  return CATEGORIES.slice().sort(function (a, b) { return m.byCat[b] - m.byCat[a]; })[0];
}

/* ---------- household ---------- */
function viewHousehold() {
  const nov = computeMonth("2026-11");
  const ms = memberSpend("2026-11");
  const totalPersonal = MEMBERS.reduce(function (s, m) { return s + ms.per[m.name]; }, 0);
  const sharedPct = nov.spent ? (ms.shared / nov.spent) * 100 : 0;
  return '' +
    "<h2>Household</h2>" +
    '<p class="sub">Four people, one budget. Personal spending is tracked per member; rent, utilities and groceries count as shared.</p>' +
    '<div class="grid two"><div class="card"><h3>Members &amp; personal budgets</h3>' +
    MEMBERS.map(function (m) {
      const spent = ms.per[m.name];
      const overBy = spent > m.personalBudget;
      return '<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between">' +
        '<span><span class="member-dot" style="background:' + m.color + '"></span><strong>' + esc(m.name) + "</strong> <span class=\"muted small\">" + esc(m.role) + ", " + m.age + "</span></span>" +
        '<span class="num">' + money(spent) + " / " + money(m.personalBudget) + ' <span class="badge ' + (overBy ? "over" : "under") + '">' + (overBy ? "over" : "within") + "</span></span></div>" +
        '<div class="bar-track" style="margin-top:6px"><div class="bar-fill ' + (overBy ? "over" : "") + '" style="width:' + Math.min(100, (spent / m.personalBudget) * 100).toFixed(1) + "%;background:" + m.color + '"></div></div></div>';
    }).join("") + "</div>" +
    '<div><div class="card"><h3>Shared vs personal <span class="hint">November spending</span></h3>' +
    '<div class="split-bar"><div style="width:' + sharedPct.toFixed(1) + '%;background:#2f5d50"></div><div style="width:' + (100 - sharedPct).toFixed(1) + '%;background:#c05621"></div></div>' +
    '<div class="legend"><span><i style="background:#2f5d50"></i>Shared ' + money(ms.shared) + " (" + sharedPct.toFixed(1) + '%)</span>' +
    '<span><i style="background:#c05621"></i>Personal ' + money(totalPersonal) + " (" + (100 - sharedPct).toFixed(1) + "%)</span></div>" +
    "<p>Shared covers the roof over everyone: rent, insurance, utilities and the weekly shop. " +
    "Personal spending is everything tied to one person — petrol, lunches, clothes, school and fun.</p></div>" +
    '<div class="card"><h3>Per-member spending — November</h3><div class="table-scroll"><table>' +
    "<thead><tr><th>Member</th><th class=\"right\">Spent</th><th class=\"right\">Share of month</th><th class=\"right\">Personal budget</th></tr></thead><tbody>" +
    MEMBERS.map(function (m) {
      return "<tr><td>" + esc(m.name) + "</td><td class=\"right num\">" + money(ms.per[m.name]) + "</td><td class=\"right num\">" + pct(ms.per[m.name], nov.spent) + "</td><td class=\"right num\">" + money(m.personalBudget) + "</td></tr>";
    }).join("") +
    "<tr><td><strong>Shared</strong></td><td class=\"right num\"><strong>" + money(ms.shared) + "</strong></td><td class=\"right num\"><strong>" + pct(ms.shared, nov.spent) + "</strong></td><td class=\"right num\">—</td></tr>" +
    "</tbody></table></div></div></div></div>";
}

/* ---------- event wiring ---------- */
function bindView(route) {
  if (route === "transactions") bindTransactions();
  else if (route === "budget") bindBudget();
  else if (route === "goals") bindGoals();
  else if (route === "bills") bindBills();
  else if (route === "reports") bindReports();
}

function rerender() { render(); }

function bindTransactions() {
  const set = function (id, ev, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(ev, fn);
  };
  set("f-month", "change", function (e) { txFilter.month = e.target.value; rerender(); });
  set("f-cat", "change", function (e) { txFilter.category = e.target.value; rerender(); });
  set("f-type", "change", function (e) { txFilter.type = e.target.value; rerender(); });
  set("f-q", "input", function (e) { txFilter.q = e.target.value; rerender(); });
  set("f-clear", "click", function () {
    txFilter = { month: "2026-11", category: "all", type: "all", q: "" };
    rerender();
  });
  set("add-tx", "submit", function (e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("n-amount").value);
    const date = document.getElementById("n-date").value;
    if (!amount || amount <= 0 || !date) return;
    state.transactions.push({
      id: "tx-user-" + Date.now(),
      date: date,
      merchant: document.getElementById("n-merchant").value.trim() || "Untitled",
      category: document.getElementById("n-cat").value,
      type: document.getElementById("n-type").value,
      amount: round2(amount),
      member: document.getElementById("n-member").value,
    });
    saveState();
    rerender();
  });
  document.querySelectorAll("[data-del]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.transactions = state.transactions.filter(function (t) { return t.id !== btn.getAttribute("data-del"); });
      saveState();
      rerender();
    });
  });
  document.querySelectorAll("[data-edit]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const t = state.transactions.find(function (x) { return x.id === btn.getAttribute("data-edit"); });
      if (!t) return;
      const amount = window.prompt("New amount for “" + t.merchant + "” ($):", t.amount.toFixed(2));
      if (amount === null) return;
      const v = parseFloat(amount);
      if (!isNaN(v) && v > 0) { t.amount = round2(v); saveState(); rerender(); }
    });
  });
}

function bindBudget() {
  document.querySelectorAll("[data-budget]").forEach(function (el) {
    el.addEventListener("click", function () {
      const cat = el.getAttribute("data-budget");
      const v = window.prompt("Monthly budget for " + cat + " ($):", (state.budgets[cat] || 0).toFixed(2));
      if (v === null) return;
      const n = parseFloat(v);
      if (!isNaN(n) && n >= 0) { state.budgets[cat] = round2(n); saveState(); rerender(); }
    });
  });
}

function bindGoals() {
  document.querySelectorAll("[data-give]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const g = state.goals.find(function (x) { return x.id === btn.getAttribute("data-give"); });
      if (!g) return;
      g.saved = round2(Math.min(g.target, g.saved + parseFloat(btn.getAttribute("data-amt"))));
      saveState();
      rerender();
    });
  });
  document.querySelectorAll("[data-give-custom]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-give-custom");
      const input = document.querySelector('[data-custom="' + id + '"]');
      const g = state.goals.find(function (x) { return x.id === id; });
      const v = input ? parseFloat(input.value) : NaN;
      if (!g || isNaN(v) || v <= 0) return;
      g.saved = round2(Math.min(g.target, g.saved + v));
      saveState();
      rerender();
    });
  });
  const form = document.getElementById("add-goal");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("g-name").value.trim();
    const target = parseFloat(document.getElementById("g-target").value);
    if (!name || isNaN(target) || target <= 0) return;
    state.goals.push({
      id: "g-user-" + Date.now(),
      name: name,
      target: round2(target),
      saved: round2(parseFloat(document.getElementById("g-saved").value) || 0),
      monthly: round2(parseFloat(document.getElementById("g-monthly").value) || 0),
      note: "Added by the family.",
    });
    saveState();
    rerender();
  });
}

function bindBills() {
  document.querySelectorAll("[data-bill]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const b = state.bills.find(function (x) { return x.id === btn.getAttribute("data-bill"); });
      if (!b) return;
      b.paid = !b.paid;
      saveState();
      rerender();
    });
  });
}

function bindReports() {
  const csvBtn = document.getElementById("export-csv");
  if (csvBtn) csvBtn.addEventListener("click", function () {
    const lines = ['"date","merchant","category","member","type","amount"'];
    state.transactions.slice().sort(function (a, b) { return a.date.localeCompare(b.date); }).forEach(function (t) {
      lines.push('"' + t.date + '","' + t.merchant.replace(/"/g, '""') + '","' + t.category + '","' + t.member + '","' + t.type + '",' + t.amount.toFixed(2));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "hearthledger-transactions.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
  const printBtn = document.getElementById("print-page");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
}

/* ---------- footer reset + boot ---------- */
document.getElementById("reset-demo").addEventListener("click", function () {
  if (!window.confirm("Reset all demo data back to the original seed? Your edits will be lost.")) return;
  localStorage.removeItem(STORE_KEY);
  const fresh = defaultState();
  state.transactions = fresh.transactions;
  state.budgets = fresh.budgets;
  state.goals = fresh.goals;
  state.bills = fresh.bills;
  txFilter = { month: "2026-11", category: "all", type: "all", q: "" };
  render();
});

render();

/* ---------- search-box focus guard ----------
   The transactions search re-renders the table on every keystroke, which
   would destroy the input under the user's fingers. This capture-phase
   listener on the persistent #view wrapper intercepts typing first,
   re-renders, then hands focus and the caret back to the fresh input. */
document.getElementById("view").addEventListener("input", function (e) {
  if (e.target && e.target.id === "f-q") {
    e.stopPropagation();
    txFilter.q = e.target.value;
    render();
    const el = document.getElementById("f-q");
    if (el) {
      el.focus();
      try { el.setSelectionRange(el.value.length, el.value.length); } catch (err) { /* ignore */ }
    }
  }
}, true);

/* ---------- visual fixes, appended after first visual review ----------
   1. The dashboard donut showed only the top 8 categories, so its centre
      total ($4,492.79) disagreed with the $4,912.00 stat. The donut below
      uses all 12 categories, so centre and stat always agree.
   2. In the grouped bar chart the "spent" value label sat over the taller
      income bar. Each value label is now centred over its own bar. */

function vbarChart(series, height) {
  const max = Math.max.apply(null, series.map(function (s) { return Math.max(s.a, s.b); })) || 1;
  const w = 420, h = height || 220, pad = 34, bw = 34, gap = 26;
  const y = function (v) { return h - pad - (v / max) * (h - pad - 30); };
  let bars = "";
  series.forEach(function (s, i) {
    const x = pad + i * (bw * 2 + gap) + 8;
    bars += '<rect x="' + x + '" y="' + y(s.a) + '" width="' + bw + '" height="' + (h - pad - y(s.a)) +
      '" rx="3" fill="#2f5d50"/>';
    bars += '<rect x="' + (x + bw + 4) + '" y="' + y(s.b) + '" width="' + bw + '" height="' + (h - pad - y(s.b)) +
      '" rx="3" fill="#c05621"/>';
    bars += '<text x="' + (x + bw) + '" y="' + (h - 12) + '" text-anchor="middle" font-size="12" fill="#6b6257">' + esc(s.label) + "</text>";
    bars += '<text x="' + (x + bw / 2) + '" y="' + (y(s.a) - 5) + '" text-anchor="middle" font-size="11" fill="#2f5d50">' + money0(s.a) + "</text>";
    bars += '<text x="' + (x + bw + 4 + bw / 2) + '" y="' + (y(s.b) - 5) + '" text-anchor="middle" font-size="11" fill="#c05621">' + money0(s.b) + "</text>";
  });
  return '<svg width="100%" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="Income versus spending">' + bars +
    '<line x1="' + pad + '" y1="' + (h - pad) + '" x2="' + w + '" y2="' + (h - pad) + '" stroke="#e7dcc8"/></svg>' +
    '<div class="legend"><span><i style="background:#2f5d50"></i>Income</span><span><i style="background:#c05621"></i>Spent</span></div>';
}

function viewDashboard() {
  const nov = computeMonth("2026-11");
  const sep = computeMonth("2026-09");
  const oct = computeMonth("2026-10");
  const over = CATEGORIES.filter(function (c) { return nov.byCat[c] > (state.budgets[c] || 0); });
  const topCat = CATEGORIES.slice().sort(function (a, b) { return nov.byCat[b] - nov.byCat[a]; })[0];
  const unpaid = state.bills.filter(function (b) { return !b.paid; })
    .sort(function (a, b) { return a.due - b.due; }).slice(0, 5);
  const latest = state.transactions.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 8);
  /* All 12 categories, so the donut centre equals the spent stat. */
  const donutParts = CATEGORIES.map(function (c, i) {
    return { label: c, value: nov.byCat[c], color: PALETTE[i % PALETTE.length] };
  }).filter(function (p) { return p.value > 0; })
    .sort(function (a, b) { return b.value - a.value; });
  const insight = nov.rate >= 20
    ? "November is on track: the family saved " + pct(nov.saved, nov.income) + " of income, above the 20% target. " +
      "Biggest spend was " + topCat + " at " + money(nov.byCat[topCat]) + ". " +
      (over.length ? over.length + " categor" + (over.length === 1 ? "y is" : "ies are") + " over budget: " + over.join(", ") + "." : "No category is over budget.")
    : "November savings are below the 20% target — review " + topCat + " first, it took " + money(nov.byCat[topCat]) + " this month.";

  return '' +
    "<h2>November 2026 at a glance</h2>" +
    '<p class="sub">Income, spending and saving for the Hartono household — computed live from the ledger.</p>' +
    '<div class="grid stats">' +
    '<div class="card stat good"><div class="label">Income</div><div class="value">' + money(nov.income) + '</div><div class="note">4 paydays &amp; inflows</div></div>' +
    '<div class="card stat"><div class="label">Spent</div><div class="value">' + money(nov.spent) + '</div><div class="note">' + nov.rows.filter(function (t) { return t.type === "expense"; }).length + ' expense rows</div></div>' +
    '<div class="card stat good"><div class="label">Saved</div><div class="value">' + money(nov.saved) + '</div><div class="note">Income minus spending</div></div>' +
    '<div class="card stat ' + (nov.rate >= 20 ? "good" : "warn") + '"><div class="label">Savings rate</div><div class="value">' + nov.rate.toFixed(1) + '%</div><div class="note">Target: 20% of income</div></div>' +
    "</div>" +
    '<p class="insight">' + esc(insight) + "</p>" +
    '<div class="grid two">' +
    '<div class="card"><h3>Income vs spending</h3>' + vbarChart([
      { label: "Sep", a: sep.income, b: sep.spent },
      { label: "Oct", a: oct.income, b: oct.spent },
      { label: "Nov", a: nov.income, b: nov.spent },
    ]) + "</div>" +
    '<div class="card"><h3>Where November money went</h3>' + donutChart(donutParts, 160) + "</div>" +
    "</div>" +
    '<div class="grid two">' +
    '<div class="card"><h3>Spending trend <span class="hint">Sep &ndash; Nov</span></h3>' + hbarChart([
      { label: "September", value: sep.spent },
      { label: "October", value: oct.spent },
      { label: "November", value: nov.spent },
    ]) + '<p class="small muted">Spending is drifting up as the holidays approach — November is the highest of the three months.</p></div>' +
    '<div class="card"><h3>Budget health <span class="hint">November</span></h3>' +
    CATEGORIES.map(function (c) {
      const spent = nov.byCat[c], bud = state.budgets[c] || 0;
      const overBy = spent > bud;
      return '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)">' +
        "<span>" + esc(c) + '</span><span class="num">' + money(spent) + " / " + money(bud) + " " +
        '<span class="badge ' + (overBy ? "over" : "under") + '">' + (overBy ? "over " + money(spent - bud) : "under " + money(bud - spent)) + "</span></span></div>";
    }).join("") + "</div>" +
    "</div>" +
    '<div class="grid two">' +
    '<div class="card"><h3>Next bills to pay</h3>' +
    (unpaid.length ? unpaid.map(function (b) {
      return '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)">' +
        "<span>" + esc(b.name) + ' <span class="muted small">due Nov ' + b.due + "</span></span>" +
        '<span class="num">' + money(b.amount) + "</span></div>";
    }).join("") : "<p>All bills are paid.</p>") +
    '<p style="margin:12px 0 0"><a href="#/bills">See all 12 bills &rarr;</a></p></div>' +
    '<div class="card"><h3>Latest transactions</h3>' +
    latest.map(function (t) {
      return '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)">' +
        "<span>" + shortDate(t.date) + " &middot; " + esc(t.merchant) + '</span><span class="num ' + (t.type === "income" ? "pos" : "neg") + '">' +
        (t.type === "income" ? "+" : "−") + money(t.amount) + "</span></div>";
    }).join("") +
    '<p style="margin:12px 0 0"><a href="#/transactions">Open the full ledger &rarr;</a></p></div>' +
    "</div>";
}
