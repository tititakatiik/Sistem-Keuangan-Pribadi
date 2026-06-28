/* =========================================================
   SISTEM KEUANGAN PRIBADI v2 — SCRIPT.JS
   Struktur data:
   transaction: { id, type: "income"|"expense", title, amount, category, date }
   goal:        { id, title, targetAmount, savedAmount, deadline }
   categories:  { income: string[], expense: string[] }
   ========================================================= */

// ===================== STORAGE KEYS =====================
const STORAGE_KEYS = {
  transactions: "skp_transactions",
  goals: "skp_goals",
  categories: "skp_categories",
  theme: "skp_theme",
};

// ===================== DEFAULT CATEGORIES =====================
const DEFAULT_CATEGORIES = {
  expense: [
    "Food & Beverages", "Fee", "Rent", "Lifestyle", "Transportation",
    "Shopping", "Bills", "Entertainment", "Education", "Health",
    "Travel", "Investment", "Family", "Emergency",
  ],
  income: ["Salary", "Freelance", "Business", "Bonus", "Gift", "Investment Return"],
};

// ===================== STATE GLOBAL =====================
let transactions = [];
let goals = [];
let categories = { income: [], expense: [] };

let currentFormType = "income";
let deleteTargetId = null;
let deleteGoalTargetId = null;
let deleteCategoryTarget = null; // { type, name }

let barChart = null;
let lineChart = null;
let pieChart = null;
let trendChart = null;

// ===================== ELEMENT REFERENCES =====================
const els = {
  loadingOverlay: document.getElementById("loadingOverlay"),

  // sidebar / nav
  sidebar: document.getElementById("sidebar"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),
  navItems: document.querySelectorAll(".nav-item"),
  mobileViewTitle: document.getElementById("mobileViewTitle"),
  viewSections: document.querySelectorAll("[data-view-section]"),

  // dashboard
  statIncome: document.getElementById("statIncome"),
  statExpense: document.getElementById("statExpense"),
  statBalance: document.getElementById("statBalance"),
  statBalanceIcon: document.getElementById("statBalanceIcon"),
  statSavingsRate: document.getElementById("statSavingsRate"),
  statBalanceCard: document.querySelector(".stat-card--balance"),
  addTransactionTopBtn: document.getElementById("addTransactionTopBtn"),

  // filters
  monthFilter: document.getElementById("monthFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  typeFilter: document.getElementById("typeFilter"),
  dateFromFilter: document.getElementById("dateFromFilter"),
  dateToFilter: document.getElementById("dateToFilter"),
  resetFilterBtn: document.getElementById("resetFilterBtn"),
  exportBtn: document.getElementById("exportBtn"),

  // transaction form
  form: document.getElementById("transactionForm"),
  formType: document.getElementById("formType"),
  title: document.getElementById("title"),
  amount: document.getElementById("amount"),
  date: document.getElementById("date"),
  category: document.getElementById("category"),
  submitBtn: document.getElementById("submitBtn"),
  typeTabs: document.querySelectorAll(".type-tab"),

  // transaction list
  list: document.getElementById("transactionList"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),

  // edit modal
  editModal: document.getElementById("editModal"),
  editForm: document.getElementById("editForm"),
  editId: document.getElementById("editId"),
  editTitle: document.getElementById("editTitle"),
  editAmount: document.getElementById("editAmount"),
  editDate: document.getElementById("editDate"),
  editCategory: document.getElementById("editCategory"),
  editType: document.getElementById("editType"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),

  // delete transaction modal
  deleteModal: document.getElementById("deleteModal"),
  deleteTargetName: document.getElementById("deleteTargetName"),
  closeDeleteModalBtn: document.getElementById("closeDeleteModalBtn"),
  cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),

  // goals
  addGoalBtn: document.getElementById("addGoalBtn"),
  goalsList: document.getElementById("goalsList"),
  goalsEmptyState: document.getElementById("goalsEmptyState"),
  goalModal: document.getElementById("goalModal"),
  goalModalTitle: document.getElementById("goalModalTitle"),
  goalForm: document.getElementById("goalForm"),
  goalId: document.getElementById("goalId"),
  goalTitle: document.getElementById("goalTitle"),
  goalTarget: document.getElementById("goalTarget"),
  goalSaved: document.getElementById("goalSaved"),
  goalDeadline: document.getElementById("goalDeadline"),
  closeGoalModalBtn: document.getElementById("closeGoalModalBtn"),
  cancelGoalBtn: document.getElementById("cancelGoalBtn"),

  deleteGoalModal: document.getElementById("deleteGoalModal"),
  deleteGoalTargetName: document.getElementById("deleteGoalTargetName"),
  closeDeleteGoalModalBtn: document.getElementById("closeDeleteGoalModalBtn"),
  cancelDeleteGoalBtn: document.getElementById("cancelDeleteGoalBtn"),
  confirmDeleteGoalBtn: document.getElementById("confirmDeleteGoalBtn"),

  // financial health
  gaugeSvg: document.getElementById("gaugeSvg"),
  healthScoreValue: document.getElementById("healthScoreValue"),
  healthScoreLabel: document.getElementById("healthScoreLabel"),
  breakdownSavings: document.getElementById("breakdownSavings"),
  breakdownSavingsBar: document.getElementById("breakdownSavingsBar"),
  breakdownSpending: document.getElementById("breakdownSpending"),
  breakdownSpendingBar: document.getElementById("breakdownSpendingBar"),
  breakdownGoals: document.getElementById("breakdownGoals"),
  breakdownGoalsBar: document.getElementById("breakdownGoalsBar"),
  breakdownConsistency: document.getElementById("breakdownConsistency"),
  breakdownConsistencyBar: document.getElementById("breakdownConsistencyBar"),

  // cost analysis
  biggestCategoryName: document.getElementById("biggestCategoryName"),
  biggestCategoryAmount: document.getElementById("biggestCategoryAmount"),
  expenseRatioValue: document.getElementById("expenseRatioValue"),
  expenseRatioTag: document.getElementById("expenseRatioTag"),
  topCategoriesList: document.getElementById("topCategoriesList"),

  // categories view
  expenseCategoryList: document.getElementById("expenseCategoryList"),
  incomeCategoryList: document.getElementById("incomeCategoryList"),
  categoryModal: document.getElementById("categoryModal"),
  categoryModalTitle: document.getElementById("categoryModalTitle"),
  categoryForm: document.getElementById("categoryForm"),
  categoryOldName: document.getElementById("categoryOldName"),
  categoryType: document.getElementById("categoryType"),
  categoryName: document.getElementById("categoryName"),
  closeCategoryModalBtn: document.getElementById("closeCategoryModalBtn"),
  cancelCategoryBtn: document.getElementById("cancelCategoryBtn"),

  deleteCategoryModal: document.getElementById("deleteCategoryModal"),
  deleteCategoryTargetName: document.getElementById("deleteCategoryTargetName"),
  closeDeleteCategoryModalBtn: document.getElementById("closeDeleteCategoryModalBtn"),
  cancelDeleteCategoryBtn: document.getElementById("cancelDeleteCategoryBtn"),
  confirmDeleteCategoryBtn: document.getElementById("confirmDeleteCategoryBtn"),

  // misc
  darkModeToggle: document.getElementById("darkModeToggle"),
  darkModeToggleMobile: document.getElementById("darkModeToggleMobile"),
  themeIcon: document.getElementById("themeIcon"),
  themeLabel: document.getElementById("themeLabel"),
  toast: document.getElementById("toast"),
};

// ===================== UTIL =====================

function formatRupiah(value) {
  const num = Number(value) || 0;
  return "Rp " + num.toLocaleString("id-ID");
}

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function generateId(prefix) {
  return (prefix || "id") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  requestAnimationFrame(() => els.toast.classList.add("is-visible"));
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    els.toast.classList.remove("is-visible");
    setTimeout(() => { els.toast.hidden = true; }, 200);
  }, 2200);
}

// ===================== LOCAL STORAGE =====================

/** Simpan seluruh state (transactions, goals, categories) ke localStorage */
function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals));
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
}

/** Ambil seluruh state dari localStorage saat halaman dimuat, isi default jika kosong */
function loadFromLocalStorage() {
  const rawTxn = localStorage.getItem(STORAGE_KEYS.transactions);
  const rawGoals = localStorage.getItem(STORAGE_KEYS.goals);
  const rawCategories = localStorage.getItem(STORAGE_KEYS.categories);

  transactions = rawTxn ? JSON.parse(rawTxn) : [];
  goals = rawGoals ? JSON.parse(rawGoals) : [];
  categories = rawCategories
    ? JSON.parse(rawCategories)
    : { income: [...DEFAULT_CATEGORIES.income], expense: [...DEFAULT_CATEGORIES.expense] };
}

// ===================== CRUD TRANSAKSI =====================

function addTransaction(event) {
  event.preventDefault();

  const newTransaction = {
    id: generateId("txn"),
    type: currentFormType,
    title: els.title.value.trim(),
    amount: Number(els.amount.value),
    category: els.category.value,
    date: els.date.value,
  };

  if (!newTransaction.title || !newTransaction.amount || !newTransaction.date || !newTransaction.category) {
    showToast("Lengkapi semua field terlebih dahulu");
    return;
  }

  transactions.push(newTransaction);
  saveToLocalStorage();

  els.form.reset();
  setFormType(currentFormType);
  els.date.value = new Date().toISOString().slice(0, 10);

  refreshAll();
  showToast(newTransaction.type === "income" ? "Pemasukan berhasil ditambahkan" : "Pengeluaran berhasil ditambahkan");
}

function openEditModal(id) {
  const txn = transactions.find((t) => t.id === id);
  if (!txn) return;

  fillCategorySelect(els.editCategory, txn.type, txn.category);
  els.editId.value = txn.id;
  els.editTitle.value = txn.title;
  els.editAmount.value = txn.amount;
  els.editDate.value = txn.date;
  els.editCategory.value = txn.category;
  els.editType.value = txn.type;

  els.editModal.hidden = false;
}

function editTransaction(event) {
  event.preventDefault();

  const id = els.editId.value;
  const txn = transactions.find((t) => t.id === id);
  if (!txn) return;

  txn.title = els.editTitle.value.trim();
  txn.amount = Number(els.editAmount.value);
  txn.date = els.editDate.value;
  txn.category = els.editCategory.value;
  txn.type = els.editType.value;

  saveToLocalStorage();
  closeEditModal();
  refreshAll();
  showToast("Transaksi berhasil diperbarui");
}

function requestDeleteTransaction(id) {
  const txn = transactions.find((t) => t.id === id);
  if (!txn) return;
  deleteTargetId = id;
  els.deleteTargetName.textContent = `"${txn.title}"`;
  els.deleteModal.hidden = false;
}

function deleteTransaction() {
  if (!deleteTargetId) return;
  transactions = transactions.filter((t) => t.id !== deleteTargetId);
  saveToLocalStorage();
  deleteTargetId = null;
  closeDeleteModal();
  refreshAll();
  showToast("Transaksi berhasil dihapus");
}

// ===================== KALKULASI INTI =====================

/** Hitung total income, expense, dan saldo dari sebuah list transaksi */
function calculateBalance(list) {
  const totalIncome = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    count: list.length,
  };
}

/** Savings Rate = (Saved Balance / Total Income) x 100% */
function calculateSavingsRate(totalIncome, balance) {
  if (totalIncome <= 0) return 0;
  return (balance / totalIncome) * 100;
}

// ===================== FILTER SYSTEM =====================

/** Terapkan seluruh filter (bulan, kategori, jenis, rentang tanggal) ke list transaksi */
function filterTransactions(list) {
  const month = els.monthFilter.value;
  const category = els.categoryFilter.value;
  const type = els.typeFilter.value;
  const from = els.dateFromFilter.value;
  const to = els.dateToFilter.value;

  return list.filter((t) => {
    if (month !== "all" && t.date.slice(0, 7) !== month) return false;
    if (category !== "all" && t.category !== category) return false;
    if (type !== "all" && t.type !== type) return false;
    if (from && t.date < from) return false;
    if (to && t.date > to) return false;
    return true;
  });
}

function filterBySearch(list) {
  const keyword = els.searchInput.value.trim().toLowerCase();
  if (!keyword) return list;
  return list.filter((t) => t.title.toLowerCase().includes(keyword) || t.category.toLowerCase().includes(keyword));
}

function sortTransactions(list) {
  const mode = els.sortSelect.value;
  const sorted = [...list];
  switch (mode) {
    case "oldest": sorted.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
    case "highest": sorted.sort((a, b) => b.amount - a.amount); break;
    case "lowest": sorted.sort((a, b) => a.amount - b.amount); break;
    default: sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  return sorted;
}

/** Gabungan semua transaksi yang lolos filter dashboard (dipakai stats, chart, analysis) */
function getFilteredTransactions() {
  return filterTransactions(transactions);
}

/** Khusus untuk tampilan list di halaman Transaksi: filter dasbor + search + sort */
function getVisibleTransactionListItems() {
  let result = getFilteredTransactions();
  result = filterBySearch(result);
  result = sortTransactions(result);
  return result;
}

function resetFilters() {
  els.monthFilter.value = "all";
  els.categoryFilter.value = "all";
  els.typeFilter.value = "all";
  els.dateFromFilter.value = "";
  els.dateToFilter.value = "";
  refreshAll();
}

function populateFilterDropdowns() {
  // Bulan
  const months = new Set(transactions.map((t) => t.date.slice(0, 7)));
  const sortedMonths = Array.from(months).sort().reverse();
  const prevMonth = els.monthFilter.value;
  els.monthFilter.innerHTML = '<option value="all">Semua Bulan</option>';
  sortedMonths.forEach((m) => {
    const label = new Date(`${m}-01T00:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = label;
    els.monthFilter.appendChild(opt);
  });
  els.monthFilter.value = sortedMonths.includes(prevMonth) || prevMonth === "all" ? prevMonth : "all";

  // Kategori (gabungan income + expense yang sedang dipakai)
  const allCats = new Set([...categories.income, ...categories.expense]);
  const prevCat = els.categoryFilter.value;
  els.categoryFilter.innerHTML = '<option value="all">Semua Kategori</option>';
  Array.from(allCats).sort().forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    els.categoryFilter.appendChild(opt);
  });
  els.categoryFilter.value = allCats.has(prevCat) || prevCat === "all" ? prevCat : "all";
}

// ===================== RENDER: DASHBOARD =====================

/** Render seluruh dashboard summary (income, expense, balance, savings rate) */
function renderDashboard() {
  const filtered = getFilteredTransactions();
  const { totalIncome, totalExpense, balance } = calculateBalance(filtered);
  const savingsRate = calculateSavingsRate(totalIncome, balance);

  els.statIncome.textContent = formatRupiah(totalIncome);
  els.statExpense.textContent = formatRupiah(totalExpense);
  els.statBalance.textContent = formatRupiah(balance);
  els.statSavingsRate.textContent = (totalIncome > 0 ? savingsRate.toFixed(1) : "0") + "%";

  // Indikator warna saldo: hijau positif, merah negatif
  const isNegative = balance < 0;
  els.statBalanceCard.classList.toggle("is-negative", isNegative);
  els.statBalanceIcon.textContent = isNegative ? "↓" : "⚖";

  renderChart();
}

// ===================== RENDER: TRANSACTIONS =====================

function renderTransactions() {
  const visible = getVisibleTransactionListItems();
  els.list.innerHTML = "";

  if (visible.length === 0) {
    els.emptyState.hidden = false;
    els.list.hidden = true;
    return;
  }
  els.emptyState.hidden = true;
  els.list.hidden = false;

  visible.forEach((txn) => {
    const item = document.createElement("div");
    item.className = `transaction-item transaction-item--${txn.type}`;
    item.innerHTML = `
      <div class="transaction-item__badge">${txn.type === "income" ? "↑" : "↓"}</div>
      <div class="transaction-item__info">
        <p class="transaction-item__title">${escapeHTML(txn.title)}</p>
        <p class="transaction-item__meta">${escapeHTML(txn.category)}<span class="dot">•</span>${formatDate(txn.date)}</p>
      </div>
      <div class="transaction-item__amount">${txn.type === "income" ? "+" : "-"} ${formatRupiah(txn.amount)}</div>
      <div class="transaction-item__actions">
        <button type="button" data-action="edit" data-id="${txn.id}" aria-label="Edit transaksi" title="Edit">✏️</button>
        <button type="button" data-action="delete" data-id="${txn.id}" aria-label="Hapus transaksi" title="Hapus">🗑️</button>
      </div>
    `;
    els.list.appendChild(item);
  });
}

// ===================== CRUD GOALS =====================

function openAddGoalModal() {
  els.goalModalTitle.textContent = "Goal Baru";
  els.goalForm.reset();
  els.goalId.value = "";
  els.goalModal.hidden = false;
}

function openEditGoalModal(id) {
  const goal = goals.find((g) => g.id === id);
  if (!goal) return;
  els.goalModalTitle.textContent = "Edit Goal";
  els.goalId.value = goal.id;
  els.goalTitle.value = goal.title;
  els.goalTarget.value = goal.targetAmount;
  els.goalSaved.value = goal.savedAmount;
  els.goalDeadline.value = goal.deadline;
  els.goalModal.hidden = false;
}

/** Tambah goal baru jika form tanpa id, atau update goal lama jika ada id (dipanggil dari satu submit handler) */
function saveGoal(event) {
  event.preventDefault();
  const id = els.goalId.value;

  const data = {
    title: els.goalTitle.value.trim(),
    targetAmount: Number(els.goalTarget.value),
    savedAmount: Number(els.goalSaved.value),
    deadline: els.goalDeadline.value,
  };

  if (!data.title || !data.targetAmount || !data.deadline) {
    showToast("Lengkapi semua field goal");
    return;
  }

  if (id) {
    editGoal(id, data);
  } else {
    addGoal(data);
  }

  closeGoalModal();
  refreshAll();
}

/** Tambah goal baru ke daftar goals */
function addGoal(data) {
  goals.push({ id: generateId("goal"), ...data });
  saveToLocalStorage();
  showToast("Goal berhasil ditambahkan");
}

/** Edit goal yang sudah ada berdasarkan id */
function editGoal(id, data) {
  const goal = goals.find((g) => g.id === id);
  if (!goal) return;
  Object.assign(goal, data);
  saveToLocalStorage();
  showToast("Goal berhasil diperbarui");
}

function requestDeleteGoal(id) {
  const goal = goals.find((g) => g.id === id);
  if (!goal) return;
  deleteGoalTargetId = id;
  els.deleteGoalTargetName.textContent = `"${goal.title}"`;
  els.deleteGoalModal.hidden = false;
}

function deleteGoal() {
  if (!deleteGoalTargetId) return;
  goals = goals.filter((g) => g.id !== deleteGoalTargetId);
  saveToLocalStorage();
  deleteGoalTargetId = null;
  closeDeleteGoalModal();
  refreshAll();
  showToast("Goal berhasil dihapus");
}

/** Hitung progress (%), remaining amount, dan sisa hari untuk satu goal */
function calculateGoalProgress(goal) {
  const percent = goal.targetAmount > 0
    ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
    : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const deadline = new Date(goal.deadline + "T00:00:00");
  const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

  return { percent, remaining, daysRemaining };
}

function renderGoalTracker() {
  els.goalsList.innerHTML = "";

  if (goals.length === 0) {
    els.goalsEmptyState.hidden = false;
    els.goalsList.hidden = true;
    return;
  }
  els.goalsEmptyState.hidden = true;
  els.goalsList.hidden = false;

  goals.forEach((goal) => {
    const { percent, remaining, daysRemaining } = calculateGoalProgress(goal);
    const isComplete = percent >= 100;

    let daysClass = "is-ok";
    let daysLabel = `${daysRemaining} hari lagi`;
    if (daysRemaining < 0) { daysClass = "is-overdue"; daysLabel = `Lewat ${Math.abs(daysRemaining)} hari`; }
    else if (daysRemaining <= 14) { daysClass = "is-warning"; }

    const card = document.createElement("div");
    card.className = "goal-card glass";
    card.innerHTML = `
      <div class="goal-card__head">
        <span class="goal-card__title">${escapeHTML(goal.title)}</span>
        <div class="goal-card__actions">
          <button type="button" data-goal-action="edit" data-id="${goal.id}" title="Edit">✏️</button>
          <button type="button" data-goal-action="delete" data-id="${goal.id}" title="Hapus">🗑️</button>
        </div>
      </div>
      <span class="goal-card__percent">${percent.toFixed(0)}%</span>
      <div class="goal-card__progress-bar">
        <div class="goal-card__progress-fill ${isComplete ? "is-complete" : ""}" style="width:${percent}%"></div>
      </div>
      <div class="goal-card__row"><span>Terkumpul</span><strong>${formatRupiah(goal.savedAmount)} / ${formatRupiah(goal.targetAmount)}</strong></div>
      <div class="goal-card__row"><span>Sisa</span><strong>${formatRupiah(remaining)}</strong></div>
      <div class="goal-card__footer">
        <span class="goal-card__deadline">Deadline: ${formatDate(goal.deadline)}</span>
        <span class="goal-card__days ${daysClass}">${isComplete ? "Tercapai 🎉" : daysLabel}</span>
      </div>
    `;
    els.goalsList.appendChild(card);
  });
}

// ===================== FINANCIAL HEALTH =====================

/**
 * Hitung Health Score (0-100) dari 4 komponen berbobot:
 * 40% savings rate, 30% spending control, 20% goal progress, 10% expense consistency
 */
function calculateFinancialHealth() {
  const filtered = getFilteredTransactions();
  const { totalIncome, totalExpense, balance } = calculateBalance(filtered);

  // 1) Savings rate score: savings rate 0% -> 0 poin, 50%+ -> 100 poin (skala linear, dibatasi 0-100)
  const rawSavingsRate = totalIncome > 0 ? calculateSavingsRate(totalIncome, balance) : 0;
  const savingsScore = clamp((rawSavingsRate / 50) * 100, 0, 100);

  // 2) Spending control score: expense ratio rendah = kontrol bagus.
  //    ratio 0% -> 100 poin, ratio 100%+ -> 0 poin
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : (totalExpense > 0 ? 100 : 0);
  const spendingScore = clamp(100 - expenseRatio, 0, 100);

  // 3) Goal progress score: rata-rata persentase progres seluruh goal aktif
  let goalScore = 0;
  if (goals.length > 0) {
    const totalPercent = goals.reduce((sum, g) => sum + calculateGoalProgress(g).percent, 0);
    goalScore = totalPercent / goals.length;
  }

  // 4) Expense consistency score: makin rata pengeluaran tiap bulan, makin tinggi skor.
  //    Dihitung dari coefficient of variation (stddev / mean) pengeluaran per bulan -> dibalik jadi skor.
  const consistencyScore = calculateExpenseConsistency(filtered);

  const healthScore =
    savingsScore * 0.4 +
    spendingScore * 0.3 +
    goalScore * 0.2 +
    consistencyScore * 0.1;

  return {
    healthScore: clamp(healthScore, 0, 100),
    savingsScore,
    spendingScore,
    goalScore,
    consistencyScore,
  };
}

/** Bantu hitung skor konsistensi pengeluaran bulanan (0-100, makin stabil makin tinggi) */
function calculateExpenseConsistency(list) {
  const monthlyTotals = {};
  list.filter((t) => t.type === "expense").forEach((t) => {
    const month = t.date.slice(0, 7);
    monthlyTotals[month] = (monthlyTotals[month] || 0) + t.amount;
  });

  const values = Object.values(monthlyTotals);
  if (values.length < 2) return values.length === 1 ? 70 : 50; // data minim -> skor netral

  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return 100;

  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean; // 0 = sangat stabil, makin besar makin fluktuatif

  // CV 0 -> 100 poin, CV 1+ -> 0 poin
  return clamp(100 - coefficientOfVariation * 100, 0, 100);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getHealthCategory(score) {
  if (score <= 30) return { label: "Critical", color: "#8B4A3D" };
  if (score <= 50) return { label: "Poor", color: "#C9683F" };
  if (score <= 70) return { label: "Fair", color: "#D9954A" };
  if (score <= 85) return { label: "Good", color: "#E8B57A" };
  return { label: "Excellent", color: "#FFBE98" };
}

/** Render gauge SVG semi-circle + breakdown komponen skor */
function renderHealthMeter() {
  const { healthScore, savingsScore, spendingScore, goalScore, consistencyScore } = calculateFinancialHealth();
  const { label, color } = getHealthCategory(healthScore);

  els.healthScoreValue.textContent = Math.round(healthScore);
  els.healthScoreLabel.textContent = label;
  els.healthScoreLabel.style.color = color;

  drawGauge(healthScore, color);

  els.breakdownSavings.textContent = Math.round(savingsScore);
  els.breakdownSavingsBar.style.width = savingsScore + "%";
  els.breakdownSpending.textContent = Math.round(spendingScore);
  els.breakdownSpendingBar.style.width = spendingScore + "%";
  els.breakdownGoals.textContent = Math.round(goalScore);
  els.breakdownGoalsBar.style.width = goalScore + "%";
  els.breakdownConsistency.textContent = Math.round(consistencyScore);
  els.breakdownConsistencyBar.style.width = consistencyScore + "%";
}

/** Gambar semi-circle gauge meter (seperti meter oli mobil) menggunakan SVG arc */
function drawGauge(score, needleColor) {
  const cx = 120, cy = 120, r = 100;
  const startAngle = 180; // kiri (0 poin)
  const endAngle = 0;     // kanan (100 poin)

  const trackColor = getCSSVar("--color-border") || "#EAD6C6";

  // Background track (full semicircle)
  const trackPath = describeArc(cx, cy, r, startAngle, endAngle);

  // Colored zones (5 segmen sesuai kategori 0-30 / 31-50 / 51-70 / 71-85 / 86-100)
  const zones = [
    { from: 0, to: 30, color: "#8B4A3D" },
    { from: 30, to: 50, color: "#C9683F" },
    { from: 50, to: 70, color: "#D9954A" },
    { from: 70, to: 85, color: "#E8B57A" },
    { from: 85, to: 100, color: "#FFBE98" },
  ];

  const zoneArcs = zones.map((z) => {
    const a1 = 180 - (z.from / 100) * 180;
    const a2 = 180 - (z.to / 100) * 180;
    return `<path d="${describeArc(cx, cy, r, a1, a2)}" stroke="${z.color}" stroke-width="16" fill="none" stroke-linecap="butt" opacity="0.85"/>`;
  }).join("");

  // Needle: angle 180 (score 0) -> angle 0 (score 100)
  const needleAngleDeg = 180 - (score / 100) * 180;
  const needleAngleRad = (needleAngleDeg * Math.PI) / 180;
  const needleLength = r - 22;
  const needleX = cx + needleLength * Math.cos(needleAngleRad);
  const needleY = cy - needleLength * Math.sin(needleAngleRad);

  els.gaugeSvg.innerHTML = `
    <path d="${trackPath}" stroke="${trackColor}" stroke-width="18" fill="none" stroke-linecap="round"/>
    ${zoneArcs}
    <line x1="${cx}" y1="${cy}" x2="${needleX.toFixed(1)}" y2="${needleY.toFixed(1)}"
          stroke="${needleColor}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="7" fill="${needleColor}"/>
  `;
}

/** Helper menghasilkan path SVG arc dari sudut a1 ke a2 (derajat, 0 = kanan, 180 = kiri) */
function describeArc(cx, cy, r, a1, a2) {
  const start = polarToCartesian(cx, cy, r, a1);
  const end = polarToCartesian(cx, cy, r, a2);
  const largeArcFlag = Math.abs(a1 - a2) <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}
function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: (cx + r * Math.cos(angleRad)).toFixed(2), y: (cy - r * Math.sin(angleRad)).toFixed(2) };
}

// ===================== COST ANALYSIS =====================

function renderCostAnalysis() {
  const filtered = getFilteredTransactions();
  const expenses = filtered.filter((t) => t.type === "expense");
  const { totalIncome, totalExpense } = calculateBalance(filtered);

  // Expense by category (untuk pie chart)
  const byCategory = {};
  expenses.forEach((t) => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });

  // Biggest spending category
  let biggestName = "—", biggestAmount = 0;
  Object.entries(byCategory).forEach(([cat, amt]) => {
    if (amt > biggestAmount) { biggestAmount = amt; biggestName = cat; }
  });
  els.biggestCategoryName.textContent = biggestName;
  els.biggestCategoryAmount.textContent = formatRupiah(biggestAmount);

  // Expense ratio = Expense / Income
  const ratio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : (totalExpense > 0 ? 100 : 0);
  els.expenseRatioValue.textContent = ratio.toFixed(1) + "%";
  els.expenseRatioTag.classList.remove("is-healthy", "is-warning", "is-dangerous");
  if (ratio < 50) { els.expenseRatioTag.textContent = "Healthy"; els.expenseRatioTag.classList.add("is-healthy"); }
  else if (ratio <= 80) { els.expenseRatioTag.textContent = "Warning"; els.expenseRatioTag.classList.add("is-warning"); }
  else { els.expenseRatioTag.textContent = "Dangerous"; els.expenseRatioTag.classList.add("is-dangerous"); }

  // Top Spending Categories: kategori pengeluaran diurutkan dari yang paling besar
  renderTopCategories(byCategory, totalExpense);

  renderPieChart(byCategory);
  renderTrendChart(filtered);
}

/** Render daftar kategori pengeluaran terbesar (Top Spending Categories) */
function renderTopCategories(byCategory, totalExpense) {
  const ranked = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  els.topCategoriesList.innerHTML = "";

  if (ranked.length === 0) {
    els.topCategoriesList.innerHTML = `<p class="empty-state__text" style="text-align:left;padding:6px 0;">Belum ada pengeluaran tercatat.</p>`;
    return;
  }

  const highest = ranked[0][1];
  ranked.forEach(([cat, amount], i) => {
    const percentOfTotal = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
    const barWidth = highest > 0 ? (amount / highest) * 100 : 0;
    const row = document.createElement("div");
    row.className = "top-category-row";
    row.innerHTML = `
      <div class="top-category-row__head">
        <div class="top-category-row__name">
          <span class="top-category-row__rank">${i + 1}</span>
          <span>${escapeHTML(cat)}</span>
        </div>
        <span class="top-category-row__amount">${formatRupiah(amount)}</span>
      </div>
      <div class="top-category-row__bar"><div class="top-category-row__bar-fill" style="width:${barWidth}%"></div></div>
      <span class="top-category-row__percent">${percentOfTotal.toFixed(1)}% dari total pengeluaran</span>
    `;
    els.topCategoriesList.appendChild(row);
  });
}

function renderPieChart(byCategory) {
  const ctx = document.getElementById("pieChart").getContext("2d");
  const labels = Object.keys(byCategory);
  const data = Object.values(byCategory);
  const palette = ["#E07040", "#F4A46A", "#C87040", "#8B4A20", "#D98855", "#FABF78", "#C04848", "#A86035", "#DDB892", "#E8C89A", "#A85A50", "#F2D4B8", "#7A4520", "#EDA070"];
  const textColor = getCSSVar("--color-text-soft");

  const chartData = {
    labels: labels.length ? labels : ["Belum ada data"],
    datasets: [{
      data: data.length ? data : [1],
      backgroundColor: labels.length ? labels.map((_, i) => palette[i % palette.length]) : [getCSSVar("--color-border")],
      borderWidth: 0,
    }],
  };

  if (pieChart) {
    pieChart.data = chartData;
    pieChart.options.plugins.legend.labels.color = textColor;
    pieChart.update();
  } else {
    pieChart = new Chart(ctx, {
      type: "pie",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: textColor, boxWidth: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: (c) => `${c.label}: ${formatRupiah(c.raw)}` } },
        },
      },
    });
  }
}

function renderTrendChart(filtered) {
  const monthlyExpense = {};
  filtered.filter((t) => t.type === "expense").forEach((t) => {
    const m = t.date.slice(0, 7);
    monthlyExpense[m] = (monthlyExpense[m] || 0) + t.amount;
  });
  const sortedMonths = Object.keys(monthlyExpense).sort();
  const labels = sortedMonths.map((m) => new Date(m + "-01T00:00:00").toLocaleDateString("id-ID", { month: "short", year: "2-digit" }));
  const data = sortedMonths.map((m) => monthlyExpense[m]);

  const ctx = document.getElementById("trendChart").getContext("2d");
  const expenseColor = getCSSVar("--color-expense");
  const gridColor = getCSSVar("--color-border");
  const textColor = getCSSVar("--color-text-soft");

  const chartData = {
    labels: labels.length ? labels : ["Belum ada data"],
    datasets: [{
      label: "Pengeluaran (Rp)",
      data: data.length ? data : [0],
      borderColor: expenseColor,
      backgroundColor: expenseColor + "22",
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointBackgroundColor: expenseColor,
    }],
  };

  if (trendChart) {
    trendChart.data = chartData;
    trendChart.options.scales.x.ticks.color = textColor;
    trendChart.options.scales.y.ticks.color = textColor;
    trendChart.options.scales.x.grid.color = gridColor;
    trendChart.options.scales.y.grid.color = gridColor;
    trendChart.update();
  } else {
    trendChart = new Chart(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, callback: (v) => "Rp " + v.toLocaleString("id-ID") } },
        },
      },
    });
  }
}

// ===================== DASHBOARD MINI CHARTS =====================

function renderChart() {
  const filtered = getFilteredTransactions();
  const incomeColor = getCSSVar("--color-income");
  const expenseColor = getCSSVar("--color-expense");
  const balanceColor = getCSSVar("--color-balance");
  const gridColor = getCSSVar("--color-border");
  const textColor = getCSSVar("--color-text-soft");

  const { totalIncome, totalExpense } = calculateBalance(filtered);

  // Bar chart: total pemasukan vs pengeluaran
  const barCtx = document.getElementById("barChart").getContext("2d");
  const barData = {
    labels: ["Pemasukan", "Pengeluaran"],
    datasets: [{ label: "Total (Rp)", data: [totalIncome, totalExpense], backgroundColor: [incomeColor, expenseColor], borderRadius: 8, maxBarThickness: 70 }],
  };
  if (barChart) {
    barChart.data = barData;
    barChart.options.scales.x.ticks.color = textColor;
    barChart.options.scales.y.ticks.color = textColor;
    barChart.options.scales.x.grid.color = gridColor;
    barChart.options.scales.y.grid.color = gridColor;
    barChart.update();
  } else {
    barChart = new Chart(barCtx, {
      type: "bar",
      data: barData,
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, callback: (v) => "Rp " + v.toLocaleString("id-ID") } },
        },
      },
    });
  }

  // Line chart: tren saldo kumulatif berdasarkan tanggal
  const sortedByDate = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  const lineLabels = [];
  const lineData = [];
  sortedByDate.forEach((t) => {
    running += t.type === "income" ? t.amount : -t.amount;
    lineLabels.push(formatDate(t.date));
    lineData.push(running);
  });

  const lineCtx = document.getElementById("lineChart").getContext("2d");
  const lineDataset = {
    labels: lineLabels.length ? lineLabels : ["Belum ada data"],
    datasets: [{ label: "Saldo (Rp)", data: lineData.length ? lineData : [0], borderColor: balanceColor, backgroundColor: balanceColor + "22", tension: 0.35, fill: true, pointRadius: 3, pointBackgroundColor: balanceColor }],
  };
  if (lineChart) {
    lineChart.data = lineDataset;
    lineChart.options.scales.x.ticks.color = textColor;
    lineChart.options.scales.y.ticks.color = textColor;
    lineChart.options.scales.x.grid.color = gridColor;
    lineChart.options.scales.y.grid.color = gridColor;
    lineChart.update();
  } else {
    lineChart = new Chart(lineCtx, {
      type: "line",
      data: lineDataset,
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 0, autoSkip: true } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, callback: (v) => "Rp " + v.toLocaleString("id-ID") } },
        },
      },
    });
  }
}

/** Panggil seluruh render chart yang ada (dashboard mini chart + cost analysis chart) */
function renderCharts() {
  renderChart();
  renderCostAnalysis();
}

// ===================== CATEGORY MANAGEMENT =====================

/** Tambah kategori baru ke tipe income/expense */
function addCategory(type, name) {
  const trimmed = name.trim();
  if (!trimmed) { showToast("Nama kategori tidak boleh kosong"); return false; }
  if (categories[type].some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    showToast("Kategori sudah ada"); return false;
  }
  categories[type].push(trimmed);
  saveToLocalStorage();
  return true;
}

/** Edit nama kategori, dan ikut perbarui semua transaksi yang memakai kategori lama */
function editCategory(type, oldName, newName) {
  const trimmed = newName.trim();
  if (!trimmed) { showToast("Nama kategori tidak boleh kosong"); return false; }
  if (trimmed !== oldName && categories[type].some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    showToast("Kategori sudah ada"); return false;
  }
  const idx = categories[type].indexOf(oldName);
  if (idx === -1) return false;
  categories[type][idx] = trimmed;

  // Update transaksi yang memakai kategori lama
  transactions.forEach((t) => { if (t.type === type && t.category === oldName) t.category = trimmed; });

  saveToLocalStorage();
  return true;
}

/** Hapus kategori dari tipe income/expense */
function deleteCategory(type, name) {
  categories[type] = categories[type].filter((c) => c !== name);
  saveToLocalStorage();
}

function renderCategoryManagement() {
  renderCategoryChipList("expense");
  renderCategoryChipList("income");
}

function renderCategoryChipList(type) {
  const container = type === "expense" ? els.expenseCategoryList : els.incomeCategoryList;
  container.innerHTML = "";

  if (categories[type].length === 0) {
    container.innerHTML = `<p class="empty-state__text" style="text-align:left;">Belum ada kategori.</p>`;
    return;
  }

  categories[type].forEach((cat) => {
    const chip = document.createElement("div");
    chip.className = "category-chip";
    chip.innerHTML = `
      <span>${escapeHTML(cat)}</span>
      <button type="button" data-cat-action="edit" data-type="${type}" data-name="${escapeHTML(cat)}" title="Edit">✏️</button>
      <button type="button" class="is-delete" data-cat-action="delete" data-type="${type}" data-name="${escapeHTML(cat)}" title="Hapus">✕</button>
    `;
    container.appendChild(chip);
  });
}

/** Isi <select> kategori (form transaksi/edit) sesuai tipe transaksi yang dipilih */
function fillCategorySelect(selectEl, type, selectedValue) {
  selectEl.innerHTML = "";
  categories[type].forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    selectEl.appendChild(opt);
  });
  if (selectedValue && categories[type].includes(selectedValue)) selectEl.value = selectedValue;
}

// ===================== EXPORT JSON =====================

/** Export seluruh data (transactions, goals, categories) sebagai satu file JSON */
function exportJSON() {
  if (transactions.length === 0 && goals.length === 0) {
    showToast("Belum ada data untuk diexport");
    return;
  }

  const payload = { transactions, goals, categories, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `keuangan-pribadi-${today}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast("Data berhasil diexport");
}

// ===================== FORM TYPE TABS (income/expense) =====================

function setFormType(type) {
  currentFormType = type;
  els.formType.value = type;
  els.typeTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.type === type));
  els.submitBtn.textContent = type === "income" ? "Tambah Pemasukan" : "Tambah Pengeluaran";
  els.submitBtn.className = `btn ${type === "income" ? "btn--income" : "btn--expense"}`;
  fillCategorySelect(els.category, type);
}

// ===================== MODAL HANDLING =====================

function closeEditModal() { els.editModal.hidden = true; }
function closeDeleteModal() { els.deleteModal.hidden = true; deleteTargetId = null; }
function closeGoalModal() { els.goalModal.hidden = true; }
function closeDeleteGoalModal() { els.deleteGoalModal.hidden = true; deleteGoalTargetId = null; }
function closeCategoryModal() { els.categoryModal.hidden = true; }
function closeDeleteCategoryModal() { els.deleteCategoryModal.hidden = true; deleteCategoryTarget = null; }

function openAddCategoryModal(type) {
  els.categoryModalTitle.textContent = type === "income" ? "Tambah Kategori Pemasukan" : "Tambah Kategori Pengeluaran";
  els.categoryForm.reset();
  els.categoryOldName.value = "";
  els.categoryType.value = type;
  els.categoryModal.hidden = false;
}

function openEditCategoryModal(type, name) {
  els.categoryModalTitle.textContent = "Edit Kategori";
  els.categoryOldName.value = name;
  els.categoryType.value = type;
  els.categoryName.value = name;
  els.categoryModal.hidden = false;
}

function saveCategoryForm(event) {
  event.preventDefault();
  const type = els.categoryType.value;
  const oldName = els.categoryOldName.value;
  const newName = els.categoryName.value;

  const success = oldName ? editCategory(type, oldName, newName) : addCategory(type, newName);
  if (!success) return;

  closeCategoryModal();
  refreshAll();
  showToast(oldName ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan");
}

function requestDeleteCategory(type, name) {
  deleteCategoryTarget = { type, name };
  els.deleteCategoryTargetName.textContent = `"${name}"`;
  els.deleteCategoryModal.hidden = false;
}

function confirmDeleteCategory() {
  if (!deleteCategoryTarget) return;
  deleteCategory(deleteCategoryTarget.type, deleteCategoryTarget.name);
  closeDeleteCategoryModal();
  refreshAll();
  showToast("Kategori berhasil dihapus");
}

// ===================== NAVIGATION (SIDEBAR VIEWS) =====================

const VIEW_TITLES = {
  dashboard: "Dashboard",
  transactions: "Transaksi",
  categories: "Kategori",
};

function switchView(viewName) {
  els.viewSections.forEach((section) => {
    section.hidden = section.id !== `view-${viewName}`;
  });
  els.navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === viewName));
  els.mobileViewTitle.textContent = VIEW_TITLES[viewName] || "Dashboard";
  closeSidebar();

  // Render ulang chart pada view yang baru aktif (Chart.js butuh canvas yang visible untuk sizing benar)
  if (viewName === "dashboard") {
    renderChart();
    renderCostAnalysis();
    renderHealthMeter();
  }
}

function openSidebar() {
  els.sidebar.classList.add("is-open");
  els.sidebarBackdrop.classList.add("is-visible");
}
function closeSidebar() {
  els.sidebar.classList.remove("is-open");
  els.sidebarBackdrop.classList.remove("is-visible");
}

// ===================== DARK MODE =====================

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = theme === "dark" ? "☀️" : "🌙";
  els.themeIcon.textContent = icon;
  els.darkModeToggleMobile.textContent = icon;
  els.themeLabel.textContent = theme === "dark" ? "Mode Terang" : "Mode Gelap";
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  renderCharts();
  renderHealthMeter();
}

function toggleDarkMode() {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(current);
}

// ===================== REFRESH GABUNGAN =====================

/** Panggil semua fungsi render yang relevan setiap kali ada perubahan data/filter */
function refreshAll() {
  populateFilterDropdowns();
  renderDashboard();
  renderTransactions();
  renderGoalTracker();
  renderHealthMeter();
  renderCostAnalysis();
  renderCategoryManagement();
}

// ===================== EVENT LISTENERS =====================

function initEventListeners() {
  // Sidebar navigation
  els.navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
  els.sidebarToggle.addEventListener("click", openSidebar);
  els.sidebarBackdrop.addEventListener("click", closeSidebar);
  els.addTransactionTopBtn.addEventListener("click", () => switchView("transactions"));

  // Transaction form
  els.form.addEventListener("submit", addTransaction);
  els.typeTabs.forEach((tab) => tab.addEventListener("click", () => setFormType(tab.dataset.type)));

  // Transaction list delegation
  els.list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "edit") openEditModal(id);
    if (action === "delete") requestDeleteTransaction(id);
  });

  // Edit transaction modal
  els.editForm.addEventListener("submit", editTransaction);
  els.closeModalBtn.addEventListener("click", closeEditModal);
  els.cancelEditBtn.addEventListener("click", closeEditModal);
  els.editModal.addEventListener("click", (e) => { if (e.target === els.editModal) closeEditModal(); });
  els.editType.addEventListener("change", () => fillCategorySelect(els.editCategory, els.editType.value));

  // Delete transaction modal
  els.closeDeleteModalBtn.addEventListener("click", closeDeleteModal);
  els.cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  els.confirmDeleteBtn.addEventListener("click", deleteTransaction);
  els.deleteModal.addEventListener("click", (e) => { if (e.target === els.deleteModal) closeDeleteModal(); });

  // Filters -> trigger full refresh (dashboard, charts, analysis ikut filter)
  [els.monthFilter, els.categoryFilter, els.typeFilter, els.dateFromFilter, els.dateToFilter].forEach((el) => {
    el.addEventListener("change", refreshAll);
  });
  els.resetFilterBtn.addEventListener("click", resetFilters);

  // Search & sort (hanya pengaruhi list transaksi)
  els.searchInput.addEventListener("input", renderTransactions);
  els.sortSelect.addEventListener("change", renderTransactions);

  // Export
  els.exportBtn.addEventListener("click", exportJSON);

  // Goals
  els.addGoalBtn.addEventListener("click", openAddGoalModal);
  els.goalForm.addEventListener("submit", saveGoal);
  els.closeGoalModalBtn.addEventListener("click", closeGoalModal);
  els.cancelGoalBtn.addEventListener("click", closeGoalModal);
  els.goalModal.addEventListener("click", (e) => { if (e.target === els.goalModal) closeGoalModal(); });

  els.goalsList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-goal-action]");
    if (!btn) return;
    const { goalAction, id } = btn.dataset;
    if (goalAction === "edit") openEditGoalModal(id);
    if (goalAction === "delete") requestDeleteGoal(id);
  });

  els.closeDeleteGoalModalBtn.addEventListener("click", closeDeleteGoalModal);
  els.cancelDeleteGoalBtn.addEventListener("click", closeDeleteGoalModal);
  els.confirmDeleteGoalBtn.addEventListener("click", deleteGoal);
  els.deleteGoalModal.addEventListener("click", (e) => { if (e.target === els.deleteGoalModal) closeDeleteGoalModal(); });

  // Categories
  document.querySelectorAll("[data-add-category]").forEach((btn) => {
    btn.addEventListener("click", () => openAddCategoryModal(btn.dataset.addCategory));
  });
  els.categoryForm.addEventListener("submit", saveCategoryForm);
  els.closeCategoryModalBtn.addEventListener("click", closeCategoryModal);
  els.cancelCategoryBtn.addEventListener("click", closeCategoryModal);
  els.categoryModal.addEventListener("click", (e) => { if (e.target === els.categoryModal) closeCategoryModal(); });

  [els.expenseCategoryList, els.incomeCategoryList].forEach((list) => {
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-cat-action]");
      if (!btn) return;
      const { catAction, type, name } = btn.dataset;
      if (catAction === "edit") openEditCategoryModal(type, name);
      if (catAction === "delete") requestDeleteCategory(type, name);
    });
  });

  els.closeDeleteCategoryModalBtn.addEventListener("click", closeDeleteCategoryModal);
  els.cancelDeleteCategoryBtn.addEventListener("click", closeDeleteCategoryModal);
  els.confirmDeleteCategoryBtn.addEventListener("click", confirmDeleteCategory);
  els.deleteCategoryModal.addEventListener("click", (e) => { if (e.target === els.deleteCategoryModal) closeDeleteCategoryModal(); });

  // Escape menutup semua modal
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeEditModal(); closeDeleteModal(); closeGoalModal();
    closeDeleteGoalModal(); closeCategoryModal(); closeDeleteCategoryModal();
  });

  // Dark mode
  els.darkModeToggle.addEventListener("click", toggleDarkMode);
  els.darkModeToggleMobile.addEventListener("click", toggleDarkMode);

  // Resize -> redraw gauge agar tetap proporsional jika dashboard sedang aktif
  window.addEventListener("resize", () => {
    if (!document.getElementById("view-dashboard").hidden) renderHealthMeter();
  });
}

// ===================== INIT =====================

function init() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", savedTheme);
  const icon = savedTheme === "dark" ? "☀️" : "🌙";
  els.themeIcon.textContent = icon;
  els.darkModeToggleMobile.textContent = icon;
  els.themeLabel.textContent = savedTheme === "dark" ? "Mode Terang" : "Mode Gelap";

  els.date.value = new Date().toISOString().slice(0, 10);

  loadFromLocalStorage();
  setFormType("income");
  initEventListeners();
  refreshAll();

  // Sembunyikan loading overlay setelah render pertama selesai
  requestAnimationFrame(() => {
    setTimeout(() => els.loadingOverlay.classList.add("is-hidden"), 250);
  });
}

document.addEventListener("DOMContentLoaded", init);