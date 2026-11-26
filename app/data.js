// HearthLedger seed data — the Hartono household (a fictional family, amounts in USD).
// One compact row per transaction: [date, description, category, amount, type, member, merchant].
// November 2026 is the default month: income $6,850, spending $4,912, saved $1,938 (28.3%).
// Every total on every view is computed from TRANSACTIONS by computeMonth() in app.js —
// no figure is written down twice, so the views can never disagree with the ledger.

// Each category carries its chart colour with it; the two exports below are derived from
// this one list so a category can never exist without a colour (or vice versa).
const CATEGORY_STYLE = [
  ['Housing', '#1d5c3f'], ['Groceries', '#2e8b57'], ['Utilities', '#d4a017'],
  ['Transport', '#3f7fbf'], ['Dining Out', '#c65d21'], ['Kids & School', '#7a5fc0'],
  ['Health', '#c0392b'], ['Entertainment', '#0e7490'], ['Subscriptions', '#64748b'],
  ['Personal', '#b45309'], ['Household', '#4d7c0f'], ['Other', '#94a3b8']
];

export const CATEGORIES = CATEGORY_STYLE.map(([name]) => name);
export const CATEGORY_COLORS = Object.fromEntries(CATEGORY_STYLE);

export const MONTHS = ['2026-09', '2026-10', '2026-11'];
const MONTH_NAMES = { '09': 'September', '10': 'October', '11': 'November' };
export const MONTH_LABELS = Object.fromEntries(
  MONTHS.map(m => [m, `${MONTH_NAMES[m.slice(5)]} ${m.slice(0, 4)}`])
);

export const TRANSACTIONS = [
// ---- NOVEMBER 2026 — income $6,850 ----
['2026-11-01', 'Monthly salary — Daniel', 'Income', 5400.00, 'income', 'Daniel', 'Hartono Engineering'],
['2026-11-14', 'Freelance design project — Maya', 'Income', 950.00, 'income', 'Maya', 'Bright Studio'],
['2026-11-20', 'Tax refund & bank interest', 'Income', 500.00, 'income', 'Daniel', 'City Bank'],
// ---- NOVEMBER 2026 — Housing $1,650 ----
['2026-11-01', 'Monthly rent — 2-bed apartment', 'Housing', 1650.00, 'expense', 'Daniel', 'Maple Court Rentals'],
// ---- NOVEMBER 2026 — Groceries $672.00 ----
['2026-11-03', 'Weekly groceries — Whole Foods', 'Groceries', 142.30, 'expense', 'Maya', 'Whole Foods Market'],
['2026-11-07', 'Weekly groceries — Trader Joe’s', 'Groceries', 118.75, 'expense', 'Maya', 'Trader Joe’s'],
['2026-11-12', 'Weekly groceries — Costco run', 'Groceries', 96.40, 'expense', 'Daniel', 'Costco'],
['2026-11-17', 'Weekly groceries — Fresh Mart', 'Groceries', 88.20, 'expense', 'Maya', 'Fresh Mart'],
['2026-11-22', 'Weekly groceries — Whole Foods', 'Groceries', 104.15, 'expense', 'Daniel', 'Whole Foods Market'],
['2026-11-27', 'Thanksgiving groceries', 'Groceries', 122.20, 'expense', 'Maya', 'Trader Joe’s'],
// ---- NOVEMBER 2026 — Utilities $236.00 ----
['2026-11-12', 'Electricity bill', 'Utilities', 96.40, 'expense', 'Daniel', 'City Power'],
['2026-11-15', 'Water bill', 'Utilities', 48.20, 'expense', 'Daniel', 'City Water'],
['2026-11-08', 'Home internet — 500 Mbps', 'Utilities', 59.99, 'expense', 'Maya', 'FiberNet'],
['2026-11-18', 'Mobile phone — Maya', 'Utilities', 31.41, 'expense', 'Maya', 'Metro Mobile'],
// ---- NOVEMBER 2026 — Transport $218.00 ----
['2026-11-02', 'Fuel — Shell station', 'Transport', 52.00, 'expense', 'Daniel', 'Shell'],
['2026-11-09', 'Fuel — BP station', 'Transport', 48.00, 'expense', 'Daniel', 'BP'],
['2026-11-16', 'Fuel — Shell station', 'Transport', 46.00, 'expense', 'Daniel', 'Shell'],
['2026-11-05', 'Bus passes — kids', 'Transport', 24.00, 'expense', 'Maya', 'City Transit'],
['2026-11-11', 'Downtown parking', 'Transport', 18.00, 'expense', 'Daniel', 'ParkEasy'],
['2026-11-21', 'Rideshare — airport run', 'Transport', 30.00, 'expense', 'Maya', 'RideGo'],
// ---- NOVEMBER 2026 — Dining Out $308.00 ----
['2026-11-04', 'Family dinner — Olive Garden', 'Dining Out', 42.50, 'expense', 'Daniel', 'Olive Garden'],
['2026-11-06', 'Lunch with colleagues', 'Dining Out', 38.75, 'expense', 'Daniel', 'Bistro 9'],
['2026-11-10', 'Pizza night — Domino’s', 'Dining Out', 64.20, 'expense', 'Maya', 'Domino’s'],
['2026-11-13', 'Coffee & pastries', 'Dining Out', 28.40, 'expense', 'Maya', 'Blue Bottle'],
['2026-11-19', 'Sushi dinner — family treat', 'Dining Out', 52.15, 'expense', 'Daniel', 'Sakura Sushi'],
['2026-11-24', 'Takeaway Thai food', 'Dining Out', 36.80, 'expense', 'Maya', 'Thai Orchid'],
['2026-11-28', 'Brunch — weekend café', 'Dining Out', 45.20, 'expense', 'Daniel', 'Sunrise Café'],
// ---- NOVEMBER 2026 — Kids & School $412.00 ----
['2026-11-02', 'School lunch — Leo & Sofia', 'Kids & School', 85.00, 'expense', 'Maya', 'Greenwood School'],
['2026-11-05', 'Leo’s new school shoes', 'Kids & School', 68.50, 'expense', 'Maya', 'Kids Foot Locker'],
['2026-11-09', 'Sofia’s story books', 'Kids & School', 42.30, 'expense', 'Maya', 'Book Barn'],
['2026-11-14', 'Swimming lessons — both kids', 'Kids & School', 75.00, 'expense', 'Daniel', 'Aqua Swim Club'],
['2026-11-18', 'School field trip — Leo', 'Kids & School', 96.20, 'expense', 'Maya', 'Greenwood School'],
['2026-11-23', 'Board games & toys', 'Kids & School', 45.00, 'expense', 'Daniel', 'Toy World'],
// ---- NOVEMBER 2026 — Health $188.00 ----
['2026-11-03', 'Pharmacy — cold medicine', 'Health', 34.60, 'expense', 'Maya', 'CVS Pharmacy'],
['2026-11-11', 'Dentist check-up — Sofia', 'Health', 89.00, 'expense', 'Maya', 'Bright Smile Dental'],
['2026-11-06', 'Gym membership — Daniel', 'Health', 42.00, 'expense', 'Daniel', 'FitLife Gym'],
['2026-11-16', 'Vitamins & supplements', 'Health', 22.40, 'expense', 'Maya', 'CVS Pharmacy'],
// ---- NOVEMBER 2026 — Entertainment $164.00 ----
['2026-11-07', 'Cinema — family movie night', 'Entertainment', 38.00, 'expense', 'Daniel', 'Cineplex'],
['2026-11-15', 'Concert tickets — jazz night', 'Entertainment', 86.00, 'expense', 'Maya', 'City Hall Live'],
['2026-11-26', 'Board game — Catan', 'Entertainment', 40.00, 'expense', 'Daniel', 'Game Stop'],
// ---- NOVEMBER 2026 — Subscriptions $94.00 ----
['2026-11-03', 'Netflix — standard plan', 'Subscriptions', 15.49, 'expense', 'Maya', 'Netflix'],
['2026-11-10', 'Spotify Family', 'Subscriptions', 11.99, 'expense', 'Maya', 'Spotify'],
['2026-11-13', 'Disney+ — kids', 'Subscriptions', 13.99, 'expense', 'Daniel', 'Disney+'],
['2026-11-05', 'iCloud storage 200 GB', 'Subscriptions', 2.99, 'expense', 'Daniel', 'Apple'],
['2026-11-17', 'YouTube Premium', 'Subscriptions', 13.99, 'expense', 'Maya', 'YouTube'],
['2026-11-19', 'Audible — audiobooks', 'Subscriptions', 14.95, 'expense', 'Daniel', 'Audible'],
['2026-11-21', 'News subscription — Daily Post', 'Subscriptions', 20.60, 'expense', 'Maya', 'Daily Post'],
// ---- NOVEMBER 2026 — Personal $262.00 ----
['2026-11-04', 'Haircut — Daniel', 'Personal', 45.00, 'expense', 'Daniel', 'Sharp Cuts'],
['2026-11-12', 'Haircut & styling — Maya', 'Personal', 38.00, 'expense', 'Maya', 'Salon Belle'],
['2026-11-16', 'Winter jacket — Maya', 'Personal', 96.50, 'expense', 'Maya', 'H&M'],
['2026-11-20', 'Cosmetics & skincare', 'Personal', 42.50, 'expense', 'Maya', 'Sephora'],
['2026-11-25', 'Books — Daniel', 'Personal', 40.00, 'expense', 'Daniel', 'Book Barn'],
// ---- NOVEMBER 2026 — Household $238.00 ----
['2026-11-06', 'Cleaning supplies', 'Household', 64.20, 'expense', 'Maya', 'Target'],
['2026-11-10', 'Hardware — shelves & hooks', 'Household', 58.40, 'expense', 'Daniel', 'Home Depot'],
['2026-11-14', 'Laundry service', 'Household', 32.90, 'expense', 'Maya', 'Fresh Laundry'],
['2026-11-22', 'New curtains — living room', 'Household', 82.50, 'expense', 'Maya', 'IKEA'],
// ---- NOVEMBER 2026 — Other $470.00 ----
['2026-11-08', 'Car repair — brake pads', 'Other', 320.00, 'expense', 'Daniel', 'AutoCare Garage'],
['2026-11-17', 'Birthday gift — Grandma', 'Other', 86.00, 'expense', 'Maya', 'Gift Gallery'],
['2026-11-25', 'Bank fees', 'Other', 14.00, 'expense', 'Daniel', 'City Bank'],
['2026-11-28', 'Miscellaneous — stationery', 'Other', 50.00, 'expense', 'Maya', 'Office Depot'],
// ---- OCTOBER 2026 — income $6,700 ----
['2026-10-01', 'Monthly salary — Daniel', 'Income', 5400.00, 'income', 'Daniel', 'Hartono Engineering'],
['2026-10-15', 'Freelance design project — Maya', 'Income', 850.00, 'income', 'Maya', 'Bright Studio'],
['2026-10-22', 'Sold old bicycle', 'Income', 450.00, 'income', 'Daniel', 'Facebook Marketplace'],
// ---- OCTOBER 2026 — Housing $1,650 ----
['2026-10-01', 'Monthly rent — 2-bed apartment', 'Housing', 1650.00, 'expense', 'Daniel', 'Maple Court Rentals'],
// ---- OCTOBER 2026 — Groceries $640.00 ----
['2026-10-03', 'Weekly groceries — Whole Foods', 'Groceries', 138.20, 'expense', 'Maya', 'Whole Foods Market'],
['2026-10-08', 'Weekly groceries — Trader Joe’s', 'Groceries', 121.45, 'expense', 'Maya', 'Trader Joe’s'],
['2026-10-13', 'Weekly groceries — Costco run', 'Groceries', 98.60, 'expense', 'Daniel', 'Costco'],
['2026-10-18', 'Weekly groceries — Fresh Mart', 'Groceries', 92.15, 'expense', 'Maya', 'Fresh Mart'],
['2026-10-23', 'Weekly groceries — Whole Foods', 'Groceries', 104.80, 'expense', 'Daniel', 'Whole Foods Market'],
['2026-10-29', 'Halloween groceries & snacks', 'Groceries', 84.80, 'expense', 'Maya', 'Trader Joe’s'],
// ---- OCTOBER 2026 — Utilities $228.00 ----
['2026-10-12', 'Electricity bill', 'Utilities', 92.30, 'expense', 'Daniel', 'City Power'],
['2026-10-15', 'Water bill', 'Utilities', 46.80, 'expense', 'Daniel', 'City Water'],
['2026-10-08', 'Home internet — 500 Mbps', 'Utilities', 59.99, 'expense', 'Maya', 'FiberNet'],
['2026-10-18', 'Mobile phone — Maya', 'Utilities', 28.91, 'expense', 'Maya', 'Metro Mobile'],
// ---- OCTOBER 2026 — Transport $205.00 ----
['2026-10-02', 'Fuel — Shell station', 'Transport', 48.00, 'expense', 'Daniel', 'Shell'],
['2026-10-10', 'Fuel — BP station', 'Transport', 52.00, 'expense', 'Daniel', 'BP'],
['2026-10-19', 'Fuel — Shell station', 'Transport', 44.00, 'expense', 'Daniel', 'Shell'],
['2026-10-06', 'Bus passes — kids', 'Transport', 21.00, 'expense', 'Maya', 'City Transit'],
['2026-10-14', 'Downtown parking', 'Transport', 16.00, 'expense', 'Daniel', 'ParkEasy'],
['2026-10-26', 'Rideshare — evening out', 'Transport', 24.00, 'expense', 'Maya', 'RideGo'],
// ---- OCTOBER 2026 — Dining Out $286.00 ----
['2026-10-04', 'Family dinner — Olive Garden', 'Dining Out', 40.50, 'expense', 'Daniel', 'Olive Garden'],
['2026-10-07', 'Lunch with colleagues', 'Dining Out', 36.25, 'expense', 'Daniel', 'Bistro 9'],
['2026-10-11', 'Pizza night — Domino’s', 'Dining Out', 58.40, 'expense', 'Maya', 'Domino’s'],
['2026-10-15', 'Coffee & pastries', 'Dining Out', 26.80, 'expense', 'Maya', 'Blue Bottle'],
['2026-10-20', 'Sushi dinner — family treat', 'Dining Out', 48.90, 'expense', 'Daniel', 'Sakura Sushi'],
['2026-10-25', 'Takeaway Thai food', 'Dining Out', 34.15, 'expense', 'Maya', 'Thai Orchid'],
['2026-10-30', 'Halloween brunch — café', 'Dining Out', 41.00, 'expense', 'Daniel', 'Sunrise Café'],
// ---- OCTOBER 2026 — Kids & School $385.00 ----
['2026-10-02', 'School lunch — Leo & Sofia', 'Kids & School', 85.00, 'expense', 'Maya', 'Greenwood School'],
['2026-10-06', 'Leo’s new trainers', 'Kids & School', 62.40, 'expense', 'Maya', 'Kids Foot Locker'],
['2026-10-10', 'Sofia’s art supplies', 'Kids & School', 38.75, 'expense', 'Maya', 'Book Barn'],
['2026-10-14', 'Swimming lessons — both kids', 'Kids & School', 72.00, 'expense', 'Daniel', 'Aqua Swim Club'],
['2026-10-21', 'School book fair — Leo', 'Kids & School', 84.85, 'expense', 'Maya', 'Greenwood School'],
['2026-10-27', 'Halloween costumes', 'Kids & School', 42.00, 'expense', 'Daniel', 'Toy World'],
// ---- OCTOBER 2026 — Health $172.00 ----
['2026-10-03', 'Pharmacy — vitamins', 'Health', 28.40, 'expense', 'Maya', 'CVS Pharmacy'],
['2026-10-12', 'Dentist check-up — Leo', 'Health', 79.00, 'expense', 'Maya', 'Bright Smile Dental'],
['2026-10-06', 'Gym membership — Daniel', 'Health', 42.00, 'expense', 'Daniel', 'FitLife Gym'],
['2026-10-17', 'Vitamins & supplements', 'Health', 22.60, 'expense', 'Maya', 'CVS Pharmacy'],
// ---- OCTOBER 2026 — Entertainment $148.00 ----
['2026-10-09', 'Cinema — family movie night', 'Entertainment', 32.00, 'expense', 'Daniel', 'Cineplex'],
['2026-10-16', 'Theatre tickets — musical', 'Entertainment', 76.00, 'expense', 'Maya', 'City Hall Live'],
['2026-10-24', 'Board game — Ticket to Ride', 'Entertainment', 40.00, 'expense', 'Daniel', 'Game Stop'],
// ---- OCTOBER 2026 — Subscriptions $94.00 ----
['2026-10-03', 'Netflix — standard plan', 'Subscriptions', 15.49, 'expense', 'Maya', 'Netflix'],
['2026-10-10', 'Spotify Family', 'Subscriptions', 11.99, 'expense', 'Maya', 'Spotify'],
['2026-10-13', 'Disney+ — kids', 'Subscriptions', 13.99, 'expense', 'Daniel', 'Disney+'],
['2026-10-05', 'iCloud storage 200 GB', 'Subscriptions', 2.99, 'expense', 'Daniel', 'Apple'],
['2026-10-17', 'YouTube Premium', 'Subscriptions', 13.99, 'expense', 'Maya', 'YouTube'],
['2026-10-19', 'Audible — audiobooks', 'Subscriptions', 14.95, 'expense', 'Daniel', 'Audible'],
['2026-10-21', 'News subscription — Daily Post', 'Subscriptions', 20.60, 'expense', 'Maya', 'Daily Post'],
// ---- OCTOBER 2026 — Personal $241.00 ----
['2026-10-05', 'Haircut — Daniel', 'Personal', 42.00, 'expense', 'Daniel', 'Sharp Cuts'],
['2026-10-13', 'Haircut & styling — Maya', 'Personal', 36.00, 'expense', 'Maya', 'Salon Belle'],
['2026-10-17', 'Autumn coat — Daniel', 'Personal', 88.50, 'expense', 'Daniel', 'H&M'],
['2026-10-22', 'Cosmetics & skincare', 'Personal', 38.50, 'expense', 'Maya', 'Sephora'],
['2026-10-28', 'Books — Maya', 'Personal', 36.00, 'expense', 'Maya', 'Book Barn'],
// ---- OCTOBER 2026 — Household $212.00 ----
['2026-10-07', 'Cleaning supplies', 'Household', 58.30, 'expense', 'Maya', 'Target'],
['2026-10-11', 'Hardware — garden tools', 'Household', 52.40, 'expense', 'Daniel', 'Home Depot'],
['2026-10-15', 'Laundry service', 'Household', 29.80, 'expense', 'Maya', 'Fresh Laundry'],
['2026-10-24', 'Bedding set — kids room', 'Household', 71.50, 'expense', 'Maya', 'IKEA'],
// ---- OCTOBER 2026 — Other $419.00 ----
['2026-10-09', 'Car service — oil change', 'Other', 285.00, 'expense', 'Daniel', 'AutoCare Garage'],
['2026-10-18', 'Birthday gift — Uncle Ray', 'Other', 78.00, 'expense', 'Maya', 'Gift Gallery'],
['2026-10-25', 'Bank fees', 'Other', 12.00, 'expense', 'Daniel', 'City Bank'],
['2026-10-29', 'Miscellaneous — stationery', 'Other', 44.00, 'expense', 'Maya', 'Office Depot'],
// ---- SEPTEMBER 2026 — income $6,400 ----
['2026-09-01', 'Monthly salary — Daniel', 'Income', 5400.00, 'income', 'Daniel', 'Hartono Engineering'],
['2026-09-16', 'Freelance design project — Maya', 'Income', 700.00, 'income', 'Maya', 'Bright Studio'],
['2026-09-24', 'Sold old tablet', 'Income', 300.00, 'income', 'Daniel', 'Facebook Marketplace'],
// ---- SEPTEMBER 2026 — Housing $1,650 ----
['2026-09-01', 'Monthly rent — 2-bed apartment', 'Housing', 1650.00, 'expense', 'Daniel', 'Maple Court Rentals'],
// ---- SEPTEMBER 2026 — Groceries $612.00 ----
['2026-09-03', 'Weekly groceries — Whole Foods', 'Groceries', 132.40, 'expense', 'Maya', 'Whole Foods Market'],
['2026-09-08', 'Weekly groceries — Trader Joe’s', 'Groceries', 118.60, 'expense', 'Maya', 'Trader Joe’s'],
['2026-09-13', 'Weekly groceries — Costco run', 'Groceries', 94.30, 'expense', 'Daniel', 'Costco'],
['2026-09-18', 'Weekly groceries — Fresh Mart', 'Groceries', 88.90, 'expense', 'Maya', 'Fresh Mart'],
['2026-09-23', 'Weekly groceries — Whole Foods', 'Groceries', 102.10, 'expense', 'Daniel', 'Whole Foods Market'],
['2026-09-28', 'Back-to-school snacks', 'Groceries', 75.70, 'expense', 'Maya', 'Trader Joe’s'],
// ---- SEPTEMBER 2026 — Utilities $221.00 ----
['2026-09-12', 'Electricity bill', 'Utilities', 88.60, 'expense', 'Daniel', 'City Power'],
['2026-09-15', 'Water bill', 'Utilities', 45.20, 'expense', 'Daniel', 'City Water'],
['2026-09-08', 'Home internet — 500 Mbps', 'Utilities', 59.99, 'expense', 'Maya', 'FiberNet'],
['2026-09-18', 'Mobile phone — Maya', 'Utilities', 27.21, 'expense', 'Maya', 'Metro Mobile'],
// ---- SEPTEMBER 2026 — Transport $196.00 ----
['2026-09-02', 'Fuel — Shell station', 'Transport', 46.00, 'expense', 'Daniel', 'Shell'],
['2026-09-10', 'Fuel — BP station', 'Transport', 50.00, 'expense', 'Daniel', 'BP'],
['2026-09-19', 'Fuel — Shell station', 'Transport', 42.00, 'expense', 'Daniel', 'Shell'],
['2026-09-06', 'Bus passes — kids', 'Transport', 20.00, 'expense', 'Maya', 'City Transit'],
['2026-09-14', 'Downtown parking', 'Transport', 14.00, 'expense', 'Daniel', 'ParkEasy'],
['2026-09-26', 'Rideshare — evening out', 'Transport', 24.00, 'expense', 'Maya', 'RideGo'],
// ---- SEPTEMBER 2026 — Dining Out $264.00 ----
['2026-09-04', 'Family dinner — Olive Garden', 'Dining Out', 38.40, 'expense', 'Daniel', 'Olive Garden'],
['2026-09-07', 'Lunch with colleagues', 'Dining Out', 34.60, 'expense', 'Daniel', 'Bistro 9'],
['2026-09-11', 'Pizza night — Domino’s', 'Dining Out', 55.20, 'expense', 'Maya', 'Domino’s'],
['2026-09-15', 'Coffee & pastries', 'Dining Out', 24.80, 'expense', 'Maya', 'Blue Bottle'],
['2026-09-20', 'Sushi dinner — family treat', 'Dining Out', 46.50, 'expense', 'Daniel', 'Sakura Sushi'],
['2026-09-25', 'Takeaway Thai food', 'Dining Out', 32.40, 'expense', 'Maya', 'Thai Orchid'],
['2026-09-30', 'Brunch — weekend café', 'Dining Out', 32.10, 'expense', 'Daniel', 'Sunrise Café'],
// ---- SEPTEMBER 2026 — Kids & School $368.00 ----
['2026-09-02', 'School lunch — Leo & Sofia', 'Kids & School', 85.00, 'expense', 'Maya', 'Greenwood School'],
['2026-09-06', 'Leo’s school bag', 'Kids & School', 58.20, 'expense', 'Maya', 'Kids Foot Locker'],
['2026-09-10', 'Sofia’s crayons & paper', 'Kids & School', 36.40, 'expense', 'Maya', 'Book Barn'],
['2026-09-14', 'Swimming lessons — both kids', 'Kids & School', 70.00, 'expense', 'Daniel', 'Aqua Swim Club'],
['2026-09-21', 'School supplies — new term', 'Kids & School', 76.40, 'expense', 'Maya', 'Greenwood School'],
['2026-09-27', 'Board games & toys', 'Kids & School', 42.00, 'expense', 'Daniel', 'Toy World'],
// ---- SEPTEMBER 2026 — Health $158.00 ----
['2026-09-03', 'Pharmacy — allergy relief', 'Health', 26.80, 'expense', 'Maya', 'CVS Pharmacy'],
['2026-09-12', 'Dentist check-up — Daniel', 'Health', 68.00, 'expense', 'Daniel', 'Bright Smile Dental'],
['2026-09-06', 'Gym membership — Daniel', 'Health', 42.00, 'expense', 'Daniel', 'FitLife Gym'],
['2026-09-17', 'Vitamins & supplements', 'Health', 21.20, 'expense', 'Maya', 'CVS Pharmacy'],
// ---- SEPTEMBER 2026 — Entertainment $132.00 ----
['2026-09-09', 'Cinema — family movie night', 'Entertainment', 30.00, 'expense', 'Daniel', 'Cineplex'],
['2026-09-16', 'Zoo tickets — family day', 'Entertainment', 62.00, 'expense', 'Maya', 'City Zoo'],
['2026-09-24', 'Board game — Uno & puzzles', 'Entertainment', 40.00, 'expense', 'Daniel', 'Game Stop'],
// ---- SEPTEMBER 2026 — Subscriptions $94.00 ----
['2026-09-03', 'Netflix — standard plan', 'Subscriptions', 15.49, 'expense', 'Maya', 'Netflix'],
['2026-09-10', 'Spotify Family', 'Subscriptions', 11.99, 'expense', 'Maya', 'Spotify'],
['2026-09-13', 'Disney+ — kids', 'Subscriptions', 13.99, 'expense', 'Daniel', 'Disney+'],
['2026-09-05', 'iCloud storage 200 GB', 'Subscriptions', 2.99, 'expense', 'Daniel', 'Apple'],
['2026-09-17', 'YouTube Premium', 'Subscriptions', 13.99, 'expense', 'Maya', 'YouTube'],
['2026-09-19', 'Audible — audiobooks', 'Subscriptions', 14.95, 'expense', 'Daniel', 'Audible'],
['2026-09-21', 'News subscription — Daily Post', 'Subscriptions', 20.60, 'expense', 'Maya', 'Daily Post'],
// ---- SEPTEMBER 2026 — Personal $228.00 ----
['2026-09-05', 'Haircut — Daniel', 'Personal', 40.00, 'expense', 'Daniel', 'Sharp Cuts'],
['2026-09-13', 'Haircut & styling — Maya', 'Personal', 34.00, 'expense', 'Maya', 'Salon Belle'],
['2026-09-17', 'School shoes — Sofia', 'Personal', 82.40, 'expense', 'Maya', 'H&M'],
['2026-09-22', 'Cosmetics & skincare', 'Personal', 36.60, 'expense', 'Maya', 'Sephora'],
['2026-09-28', 'Books — Daniel', 'Personal', 35.00, 'expense', 'Daniel', 'Book Barn'],
// ---- SEPTEMBER 2026 — Household $198.00 ----
['2026-09-07', 'Cleaning supplies', 'Household', 54.60, 'expense', 'Maya', 'Target'],
['2026-09-11', 'Hardware — light bulbs', 'Household', 48.20, 'expense', 'Daniel', 'Home Depot'],
['2026-09-15', 'Laundry service', 'Household', 28.40, 'expense', 'Maya', 'Fresh Laundry'],
['2026-09-24', 'Kitchen towels & mats', 'Household', 66.80, 'expense', 'Maya', 'IKEA'],
// ---- SEPTEMBER 2026 — Other $396.00 ----
['2026-09-09', 'Car tyres — two new', 'Other', 262.00, 'expense', 'Daniel', 'AutoCare Garage'],
['2026-09-18', 'Birthday gift — Aunt Lily', 'Other', 74.00, 'expense', 'Maya', 'Gift Gallery'],
['2026-09-25', 'Bank fees', 'Other', 12.00, 'expense', 'Daniel', 'City Bank'],
['2026-09-29', 'Miscellaneous — stationery', 'Other', 48.00, 'expense', 'Maya', 'Office Depot'],
];

// Monthly category budgets (November is the month the app opens on; every month's
// budget is editable in the app, and edits are kept in localStorage, not here).
// Written as one row per month so a new month is a single added line.
const BUDGET_ROWS = [
  ['2026-09', { 'Housing': 1650, 'Groceries': 620, 'Utilities': 230, 'Transport': 200, 'Dining Out': 280, 'Kids & School': 380, 'Health': 180, 'Entertainment': 140, 'Subscriptions': 100, 'Personal': 240, 'Household': 210, 'Other': 350 }],
  ['2026-10', { 'Housing': 1650, 'Groceries': 640, 'Utilities': 235, 'Transport': 210, 'Dining Out': 290, 'Kids & School': 390, 'Health': 190, 'Entertainment': 150, 'Subscriptions': 100, 'Personal': 250, 'Household': 220, 'Other': 380 }],
  ['2026-11', { 'Housing': 1650, 'Groceries': 650, 'Utilities': 240, 'Transport': 220, 'Dining Out': 300, 'Kids & School': 400, 'Health': 200, 'Entertainment': 150, 'Subscriptions': 100, 'Personal': 250, 'Household': 230, 'Other': 400 }]
];
export const BUDGETS = Object.fromEntries(BUDGET_ROWS);

// Savings goals. `saved` moves when the family contributes in the app; `monthly` is the
// planned contribution, used to work out the finish month shown on each goal card.
export const GOALS = [
  { name: 'Emergency fund', target: 10000, saved: 6200, monthly: 400, icon: '🛟', note: 'Six months of essentials, kept in a high-yield savings account.' },
  { name: 'Family holiday', target: 3200, saved: 1850, monthly: 250, icon: '🏖️', note: 'A week at the coast next summer — flights, stay and meals.' },
  { name: 'New car', target: 8500, saved: 2300, monthly: 300, icon: '🚗', note: 'Replace the 2012 sedan before the next big repair bill.' },
  { name: 'Home deposit', target: 25000, saved: 9400, monthly: 500, icon: '🏠', note: 'Saving towards a 10% deposit on a three-bedroom house.' },
  { name: 'Kids’ education', target: 6000, saved: 2100, monthly: 200, icon: '🎓', note: 'Leo and Sofia’s school fees and activity fund.' },
  { name: 'New fridge', target: 1400, saved: 950, monthly: 150, icon: '🧊', note: 'Energy-efficient fridge to replace the noisy 15-year-old one.' }
];

// Recurring bills for November 2026. `day` is the due day of the month; `paid` is the
// state the demo opens with — five bills already settled, seven still to pay.
export const BILLS = [
  { name: 'Rent — Maple Court', amount: 1650.00, day: 1, autopay: true, paid: true, category: 'Housing' },
  { name: 'Car loan', amount: 310.00, day: 5, autopay: true, paid: true, category: 'Transport' },
  { name: 'Gym — FitLife', amount: 42.00, day: 7, autopay: true, paid: true, category: 'Health' },
  { name: 'Home internet — FiberNet', amount: 59.99, day: 8, autopay: true, paid: true, category: 'Utilities' },
  { name: 'Spotify Family', amount: 11.99, day: 10, autopay: true, paid: true, category: 'Subscriptions' },
  { name: 'Electricity — City Power', amount: 96.40, day: 12, autopay: false, paid: false, category: 'Utilities' },
  { name: 'Netflix', amount: 15.49, day: 13, autopay: true, paid: false, category: 'Subscriptions' },
  { name: 'Water — City Water', amount: 48.20, day: 15, autopay: false, paid: false, category: 'Utilities' },
  { name: 'Mobile — Metro Mobile', amount: 31.41, day: 18, autopay: true, paid: false, category: 'Subscriptions' },
  { name: 'Car insurance', amount: 128.00, day: 20, autopay: false, paid: false, category: 'Transport' },
  { name: 'Disney+', amount: 13.99, day: 23, autopay: true, paid: false, category: 'Subscriptions' },
  { name: 'YouTube Premium', amount: 13.99, day: 27, autopay: true, paid: false, category: 'Subscriptions' }
];

// Household members. `personal` is each person's own monthly budget; `color` is their
// avatar colour on the Household page. Kids & School spending is split between Leo and Sofia.
export const MEMBERS = [
  { name: 'Daniel Hartono', role: 'Dad · Software engineer', age: 38, personal: 150, color: '#1d5c3f', note: 'Brings home the salary and handles rent, transport and the car.' },
  { name: 'Maya Hartono', role: 'Mum · Freelance designer', age: 36, personal: 150, color: '#b45309', note: 'Freelance income, groceries, kids’ activities and the household shop.' },
  { name: 'Leo Hartono', role: 'Son · 4th grade', age: 9, personal: 40, color: '#3f7fbf', note: 'School lunches, swimming lessons and his weekly allowance.' },
  { name: 'Sofia Hartono', role: 'Daughter · 1st grade', age: 6, personal: 25, color: '#7a5fc0', note: 'Books, art supplies and her weekly allowance.' }
];
