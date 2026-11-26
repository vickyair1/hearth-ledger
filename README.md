[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/competitions/best-household-budget-site-20261126-1457)
[![make.fun rank](https://make.fun/badge/best-household-budget-site-20261126-1457/vickyair1/hearth-ledger/rank.svg)](https://make.fun/competitions/best-household-budget-site-20261126-1457)
[![make.fun reward](https://make.fun/badge/best-household-budget-site-20261126-1457/vickyair1/hearth-ledger/reward.svg)](https://make.fun/competitions/best-household-budget-site-20261126-1457)

# HearthLedger — The Hartono Family Budget

HearthLedger is a household budget site for the fictional Hartono family (Daniel, Maya, and kids Leo and Sofia). It runs entirely offline from static files — no network requests, no libraries, no web fonts — and every figure on every page is computed from the same 180-transaction ledger (September–November 2026), so the dashboard, budget, reports and household pages can never disagree with each other.

November 2026 at a glance: **$6,850 income, $4,912 spent, $1,938 saved (28.3%)**.

## What you can do here (all from the top nav)

- **Dashboard** — income / spent / saved / savings-rate stat cards, income-vs-expenses bar chart, spending-by-category donut, Sep–Nov spending trend, budget-health list, next unpaid bills, latest transactions, and a computed "this month" insight line.
- **Transactions** — the full ledger with month, category, type and text-search filters; an add-transaction form that really adds a row and updates every total; edit and delete per row; a running-balance column; footer totals for the filtered set.
- **Budget** — 12 category budgets with progress bars and over/under badges; click any budget amount to edit it inline. Includes a 50/30/20 rule panel computed from real income, with a verdict.
- **Goals** — 6 savings goals (emergency fund $10,000, family holiday $3,200, new car $8,500, home deposit $25,000, kids' education $6,000, new fridge $1,400) with progress, monthly contributions, computed finish months, +$50 / +$100 and custom-amount contributions, plus an add-goal form.
- **Bills** — a November 2026 calendar with due-date markers, a bill list (rent, utilities, internet, phone, insurance, car loan, subscriptions) with autopay badges and Paid toggles that update the paid total, and upcoming reminders.
- **Reports** — Sep vs Oct vs Nov comparison table and bar chart, category trend over the 3 months, top 5 merchants by spend, auto-computed insights, a working Export CSV button (downloads a real CSV of the ledger) and Print.
- **Household** — the four family members with roles and personal budgets, a shared-vs-personal spending split bar, and a per-member spending table (kids' school costs split between Leo and Sofia).

Edits (transactions, budgets, goal contributions, bill toggles) are saved in the browser's localStorage; **Reset demo data** in the footer restores the original seed.

## Running it locally

```sh
node serve.ts            # serves app/ at http://localhost:8080
# or: node serve.ts --port 8080
```

Open http://localhost:8080 and use the nav — or go straight to `#/transactions`, `#/budget`, `#/goals`, `#/bills`, `#/reports`, `#/household`. The layout is responsive: on a phone the nav collapses to a menu, tables scroll, and cards stack.

## How the code is organised

```
main.ts                      # hands the entry in: copies app/ + screenshots/ to /output, writes dossier.json
serve.ts                     # tiny static server for local testing
LICENSE                      # MIT
vendor/makefun-frontend.ts   # make.fun dossier library (unchanged from the kit)
app/
  index.html                 # shell: header, nav, month picker, footer
  style.css                  # all styling, incl. phone breakpoints and print
  data.js                    # seed data: 180 transactions, budgets, goals, bills, members
  app.js                     # routing, computeMonth(), all 7 views, SVG charts, persistence
shots.json                   # the 4 screenshots to take (cover, transactions, budget, phone)
screenshots/                 # 1-cover.jpg, 2-transactions.jpg, 3-budget-goals.jpg, 4-phone.jpg
```

## Notes

- Original fictional family, original design and text; no branding, text or images copied from any real site.
- No external requests of any kind: system font stack, hand-rolled inline SVG charts, zero dependencies.
- Re-authored 27 Nov 2026 in a fresh session after the competition opened, with the 4 screenshots re-taken in that session.
