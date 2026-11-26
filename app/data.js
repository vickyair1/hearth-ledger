/* HearthLedger — seed data for the Hartono family budget (Sep–Nov 2026).
   Every figure on the site is computed from TRANSACTIONS below, so the
   dashboard, budget, reports and household pages can never disagree.
   November is exact by construction: income $6,850.00, spent $4,912.00,
   saved $1,938.00, savings rate 28.3%. September and October are built
   from the same November template with a scale factor and a seeded
   jitter, so the trend stays plausible without hand-typing 120 rows. */

const MONTHS = ["2026-09", "2026-10", "2026-11"];

const MONTH_LABELS = {
  "2026-09": "September 2026",
  "2026-10": "October 2026",
  "2026-11": "November 2026",
};

const CATEGORIES = [
  "Housing", "Groceries", "Transport", "Dining", "Utilities",
  "Entertainment", "Shopping", "Health", "Education", "Kids",
  "Subscriptions", "Misc",
];

/* Monthly budget per category (November). Total $5,005. */
const BUDGETS = {
  Housing: 1700, Groceries: 850, Transport: 600, Dining: 240,
  Utilities: 300, Entertainment: 110, Shopping: 350, Health: 200,
  Education: 320, Kids: 140, Subscriptions: 35, Misc: 160,
};

const MEMBERS = [
  { name: "Daniel", role: "Dad", age: 38, personalBudget: 400, color: "#2f5d50" },
  { name: "Maya", role: "Mum", age: 36, personalBudget: 350, color: "#c05621" },
  { name: "Leo", role: "Son", age: 12, personalBudget: 120, color: "#2b6cb0" },
  { name: "Sofia", role: "Daughter", age: 9, personalBudget: 100, color: "#975a16" },
];

const GOALS = [
  { id: "g1", name: "Emergency fund", target: 10000, saved: 6200, monthly: 400, note: "6 months of expenses, kept in a separate account." },
  { id: "g2", name: "Family holiday", target: 3200, saved: 1400, monthly: 200, note: "Bali in the June school holidays — flights, hotel, food." },
  { id: "g3", name: "New car", target: 8500, saved: 2100, monthly: 300, note: "Deposit for a used Avanza to replace the 2012 one." },
  { id: "g4", name: "Home deposit", target: 25000, saved: 4800, monthly: 500, note: "Long-term deposit for a bigger house near the kids' school." },
  { id: "g5", name: "Kids' education", target: 6000, saved: 2750, monthly: 250, note: "Leo's high-school fund and Sofia's English course." },
  { id: "g6", name: "New fridge", target: 1400, saved: 950, monthly: 150, note: "The old fridge hums all night — replace it before it dies." },
];

const BILLS = [
  { id: "b1", name: "House rent", amount: 1548.50, due: 1, autopay: true, paid: true },
  { id: "b2", name: "Fitness First gym", amount: 45.00, due: 3, autopay: true, paid: true },
  { id: "b3", name: "PLN electricity", amount: 142.60, due: 5, autopay: true, paid: true },
  { id: "b4", name: "IndiHome internet", amount: 79.00, due: 7, autopay: true, paid: true },
  { id: "b5", name: "Netflix", amount: 15.99, due: 9, autopay: false, paid: true },
  { id: "b6", name: "Phone — Telkomsel", amount: 68.00, due: 10, autopay: true, paid: false },
  { id: "b7", name: "PDAM water", amount: 38.45, due: 12, autopay: false, paid: false },
  { id: "b8", name: "Spotify Family", amount: 10.99, due: 14, autopay: false, paid: false },
  { id: "b9", name: "Car loan instalment", amount: 320.00, due: 15, autopay: true, paid: false },
  { id: "b10", name: "Home insurance", amount: 185.00, due: 18, autopay: true, paid: false },
  { id: "b11", name: "Google One cloud", amount: 9.99, due: 20, autopay: false, paid: false },
  { id: "b12", name: "Kompas digital", amount: 12.00, due: 25, autopay: false, paid: false },
];

/* November income — sums to exactly $6,850.00. */
const NOV_INCOME = [
  [1, "Salary — Daniel (PT Maju Bersama)", 5200.00, "Daniel"],
  [12, "Freelance design — Daniel", 950.00, "Daniel"],
  [20, "Part-time tutoring — Maya", 550.00, "Maya"],
  [30, "Bank interest — BCA", 150.00, "Daniel"],
];

/* November expenses — 56 rows, sums to exactly $4,912.00.
   Row shape: [day, merchant, category, amount, member]. */
const NOV_EXPENSES = [
  [1, "House rent — November", "Housing", 1548.50, "Shared"],
  [18, "Home insurance premium", "Housing", 185.00, "Shared"],
  [2, "Pasaraya Fresh Mart", "Groceries", 142.50, "Shared"],
  [5, "Super Indo weekly shop", "Groceries", 96.20, "Shared"],
  [9, "Pasaraya Fresh Mart", "Groceries", 118.75, "Shared"],
  [12, "Super Indo weekly shop", "Groceries", 87.40, "Shared"],
  [16, "Pasaraya Fresh Mart", "Groceries", 134.90, "Shared"],
  [19, "Super Indo weekly shop", "Groceries", 76.55, "Shared"],
  [23, "Pasaraya Fresh Mart", "Groceries", 109.30, "Shared"],
  [27, "Super Indo weekly shop", "Groceries", 49.85, "Shared"],
  [28, "Corner minimart snacks", "Groceries", 4.25, "Shared"],
  [3, "Shell petrol", "Transport", 68.40, "Daniel"],
  [10, "Shell petrol", "Transport", 54.25, "Daniel"],
  [17, "Shell petrol", "Transport", 61.80, "Maya"],
  [6, "Mall parking", "Transport", 12.00, "Maya"],
  [21, "Street parking", "Transport", 9.50, "Daniel"],
  [8, "Toll road top-up", "Transport", 22.30, "Daniel"],
  [14, "Bus fare — Maya", "Transport", 18.75, "Maya"],
  [24, "Car wash", "Transport", 15.00, "Daniel"],
  [15, "Car loan instalment", "Transport", 320.00, "Shared"],
  [4, "Warung Sate Pak Budi", "Dining", 48.60, "Daniel"],
  [7, "Kopi Kenangan", "Dining", 32.75, "Maya"],
  [11, "Pizza Hut family night", "Dining", 56.40, "Shared"],
  [15, "Bakso Malang Cak Man", "Dining", 24.90, "Leo"],
  [20, "Sushi Tei lunch", "Dining", 41.20, "Maya"],
  [26, "Nasi Padang Sederhana", "Dining", 18.50, "Daniel"],
  [29, "Kopi Kenangan", "Dining", 6.50, "Maya"],
  [5, "PLN electricity", "Utilities", 142.60, "Shared"],
  [12, "PDAM water", "Utilities", 38.45, "Shared"],
  [19, "PGN gas", "Utilities", 27.80, "Shared"],
  [7, "IndiHome internet", "Utilities", 79.00, "Shared"],
  [8, "Cinema XXI — family movie", "Entertainment", 36.00, "Shared"],
  [9, "Netflix subscription", "Entertainment", 15.99, "Shared"],
  [13, "Steam game — Leo", "Entertainment", 24.99, "Leo"],
  [22, "Gramedia bookstore", "Entertainment", 19.50, "Sofia"],
  [6, "Uniqlo — Daniel shirts", "Shopping", 89.90, "Daniel"],
  [10, "Skechers shoes — Maya", "Shopping", 64.00, "Maya"],
  [18, "IKEA home bits", "Shopping", 47.25, "Shared"],
  [25, "Tokopedia electronics", "Shopping", 129.99, "Daniel"],
  [30, "Stationery — Sofia", "Shopping", 8.75, "Sofia"],
  [9, "Apotek K-24 pharmacy", "Health", 28.40, "Maya"],
  [16, "Dentist — Leo checkup", "Health", 120.00, "Leo"],
  [3, "Fitness First gym", "Health", 45.00, "Daniel"],
  [2, "School fees — Leo & Sofia", "Education", 210.00, "Shared"],
  [11, "School books — Sofia", "Education", 38.60, "Sofia"],
  [20, "English course — Maya", "Education", 59.00, "Maya"],
  [7, "Toys Kingdom — Leo", "Kids", 32.50, "Leo"],
  [14, "Kids clothes — Sofia", "Kids", 41.75, "Sofia"],
  [21, "Swimming lessons — Leo", "Kids", 55.00, "Leo"],
  [9, "Spotify Family", "Subscriptions", 10.99, "Shared"],
  [14, "Google One cloud", "Subscriptions", 9.99, "Shared"],
  [25, "Kompas digital", "Subscriptions", 12.00, "Shared"],
  [13, "Birthday gift — Aunt Rina", "Misc", 45.00, "Maya"],
  [17, "Plumber — leaking tap", "Misc", 78.50, "Shared"],
  [23, "Charity — mosque donation", "Misc", 25.00, "Shared"],
  [28, "Laundry service", "Misc", 12.00, "Shared"],
];

/* September / October income — plausible, slightly below November. */
const SEP_INCOME = [
  [1, "Salary — Daniel (PT Maju Bersama)", 5200.00, "Daniel"],
  [11, "Freelance design — Daniel", 720.00, "Daniel"],
  [19, "Part-time tutoring — Maya", 550.00, "Maya"],
  [30, "Bank interest — BCA", 118.00, "Daniel"],
];
const OCT_INCOME = [
  [1, "Salary — Daniel (PT Maju Bersama)", 5200.00, "Daniel"],
  [13, "Freelance design — Daniel", 840.00, "Daniel"],
  [21, "Part-time tutoring — Maya", 550.00, "Maya"],
  [30, "Bank interest — BCA", 132.00, "Daniel"],
];

/* Deterministic PRNG so Sep/Oct rebuild identically on every load. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round2(n) { return Math.round(n * 100) / 100; }

function pad2(n) { return String(n).padStart(2, "0"); }

/* Build one month of transactions from the November template. */
function buildMonth(ym, scale, seed, incomeRows) {
  const rand = mulberry32(seed);
  const rows = [];
  let n = 0;
  incomeRows.forEach(function (r) {
    n += 1;
    rows.push({
      id: "tx-" + ym + "-" + String(n).padStart(3, "0"),
      date: ym + "-" + pad2(r[0]),
      merchant: r[1], category: "Income", type: "income",
      amount: r[2], member: r[3],
    });
  });
  NOV_EXPENSES.forEach(function (r) {
    n += 1;
    const jitter = 0.94 + rand() * 0.12;
    rows.push({
      id: "tx-" + ym + "-" + String(n).padStart(3, "0"),
      date: ym + "-" + pad2(Math.min(r[0], 28)),
      merchant: r[1], category: r[2], type: "expense",
      amount: round2(r[3] * scale * jitter), member: r[4],
    });
  });
  return rows;
}

function buildNovember() {
  const rows = [];
  let n = 0;
  NOV_INCOME.forEach(function (r) {
    n += 1;
    rows.push({
      id: "tx-2026-11-" + String(n).padStart(3, "0"),
      date: "2026-11-" + pad2(r[0]),
      merchant: r[1], category: "Income", type: "income",
      amount: r[2], member: r[3],
    });
  });
  NOV_EXPENSES.forEach(function (r) {
    n += 1;
    rows.push({
      id: "tx-2026-11-" + String(n).padStart(3, "0"),
      date: "2026-11-" + pad2(r[0]),
      merchant: r[1], category: r[2], type: "expense",
      amount: r[3], member: r[4],
    });
  });
  return rows;
}

/* The one ledger everything is computed from: 180 rows, 60 per month. */
const TRANSACTIONS = [].concat(
  buildMonth("2026-09", 0.94, 11, SEP_INCOME),
  buildMonth("2026-10", 0.97, 29, OCT_INCOME),
  buildNovember()
);
