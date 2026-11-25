/**
 * SpendWise — Personal Expense Tracker
 * Client-Side LocalStorage DataStore Engine
 * Zero backend required, 100% Vercel & Browser ready.
 */

// ==========================================
// 1. LocalStorage Keys & DataStore Helper
// ==========================================
const DB_KEYS = {
    USERS: 'spendwise_users',
    SESSION: 'spendwise_session',
    CATEGORIES: 'spendwise_categories',
    INCOMES: 'spendwise_incomes',
    EXPENSES: 'spendwise_expenses',
    BUDGETS: 'spendwise_budgets'
};

const DB = {
    get(key, fallback = []) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

// ==========================================
// 2. Application State & Helpers
// ==========================================
const state = {
    user: null,
    categories: [],
    incomes: [],
    expenses: [],
    currentReportPeriod: 'MONTHLY',
    charts: {}
};

const currency = (value) =>
    '₹' + Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function showToast(message, variant = 'success') {
    const container = document.getElementById('toastContainer');
    const id = 't-' + Date.now();
    container.insertAdjacentHTML('beforeend', `
        <div id="${id}" class="toast align-items-center text-bg-${variant} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${escapeHtml(message)}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `);
    const el = document.getElementById(id);
    const toast = new bootstrap.Toast(el, { delay: 3000 });
    toast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function currentMonthStr() {
    return new Date().toISOString().slice(0, 7);
}

// ==========================================
// 3. Demo Data Seeder
// ==========================================
function seedDefaultData() {
    let users = DB.get(DB_KEYS.USERS, []);
    const demoEmail = 'demo@expensetracker.com';
    let demoUser = users.find(u => u.email.toLowerCase() === demoEmail);

    if (!demoUser) {
        demoUser = {
            id: 1,
            fullName: 'Aarav Sharma (Demo)',
            email: demoEmail,
            password: 'demo1234',
            createdAt: new Date().toISOString()
        };
        users.push(demoUser);
        DB.set(DB_KEYS.USERS, users);
    }

    let categories = DB.get(DB_KEYS.CATEGORIES, []);
    if (categories.length === 0) {
        categories = [
            { id: 1, userId: 1, name: 'Salary', type: 'INCOME' },
            { id: 2, userId: 1, name: 'Freelancing', type: 'INCOME' },
            { id: 3, userId: 1, name: 'Scholarship', type: 'INCOME' },
            { id: 4, userId: 1, name: 'Investments', type: 'INCOME' },
            { id: 5, userId: 1, name: 'Other Income', type: 'INCOME' },
            { id: 6, userId: 1, name: 'Food & Dining', type: 'EXPENSE' },
            { id: 7, userId: 1, name: 'Shopping', type: 'EXPENSE' },
            { id: 8, userId: 1, name: 'Housing & Rent', type: 'EXPENSE' },
            { id: 9, userId: 1, name: 'Transportation', type: 'EXPENSE' },
            { id: 10, userId: 1, name: 'Education', type: 'EXPENSE' },
            { id: 11, userId: 1, name: 'Entertainment', type: 'EXPENSE' },
            { id: 12, userId: 1, name: 'Utilities & Bills', type: 'EXPENSE' },
            { id: 13, userId: 1, name: 'Healthcare', type: 'EXPENSE' },
            { id: 14, userId: 1, name: 'Others', type: 'EXPENSE' }
        ];
        DB.set(DB_KEYS.CATEGORIES, categories);
    }

    let incomes = DB.get(DB_KEYS.INCOMES, []);
    let expenses = DB.get(DB_KEYS.EXPENSES, []);
    let budgets = DB.get(DB_KEYS.BUDGETS, []);

    if (incomes.length === 0 && expenses.length === 0) {
        const now = new Date();
        const year = now.getFullYear();
        const monthNum = now.getMonth() + 1;
        const mm = String(monthNum).padStart(2, '0');
        const prevMm = String(monthNum === 1 ? 12 : monthNum - 1).padStart(2, '0');
        const prevYear = monthNum === 1 ? year - 1 : year;

        // Current month incomes
        incomes.push(
            { id: 1, userId: 1, source: 'Tech Corp Salary', amount: 65000, categoryId: 1, incomeDate: `${year}-${mm}-01`, description: 'Monthly primary job salary' },
            { id: 2, userId: 1, source: 'Web Consulting Gig', amount: 18000, categoryId: 2, incomeDate: `${year}-${mm}-10`, description: 'UI redesign freelance project' },
            { id: 3, userId: 1, source: 'Previous Month Salary', amount: 65000, categoryId: 1, incomeDate: `${prevYear}-${prevMm}-01`, description: 'Last month salary' }
        );

        // Current month expenses
        expenses.push(
            { id: 1, userId: 1, title: 'Apartment Rent', amount: 18500, categoryId: 8, expenseDate: `${year}-${mm}-02`, description: 'Monthly flat rent' },
            { id: 2, userId: 1, title: 'Supermarket Groceries', amount: 4800, categoryId: 6, expenseDate: `${year}-${mm}-05`, description: 'Weekly organic groceries' },
            { id: 3, userId: 1, title: 'High-speed Fiber Internet', amount: 1299, categoryId: 12, expenseDate: `${year}-${mm}-08`, description: 'Airtel broadband bill' },
            { id: 4, userId: 1, title: 'Dinner with Team', amount: 2450, categoryId: 6, expenseDate: `${year}-${mm}-12`, description: 'Weekend social dinner' },
            { id: 5, userId: 1, title: 'Metro & Cab Travel', amount: 1650, categoryId: 9, expenseDate: `${year}-${mm}-15`, description: 'Commute expenses' },
            { id: 6, userId: 1, title: 'Online Books & Courses', amount: 1999, categoryId: 10, expenseDate: `${year}-${mm}-18`, description: 'Cloud architecture course' },
            { id: 7, userId: 1, title: 'Clothing Sale Shopping', amount: 3800, categoryId: 7, expenseDate: `${year}-${mm}-20`, description: 'Winter wear purchase' }
        );

        // Previous month expenses
        expenses.push(
            { id: 8, userId: 1, title: 'Last Month Rent', amount: 18500, categoryId: 8, expenseDate: `${prevYear}-${prevMm}-02`, description: 'Rent' },
            { id: 9, userId: 1, title: 'Last Month Food', amount: 8400, categoryId: 6, expenseDate: `${prevYear}-${prevMm}-15`, description: 'Food and dining' }
        );

        // Current month budget
        budgets.push({
            id: 1,
            userId: 1,
            budgetMonth: `${year}-${mm}`,
            monthlyLimit: 40000
        });

        DB.set(DB_KEYS.INCOMES, incomes);
        DB.set(DB_KEYS.EXPENSES, expenses);
        DB.set(DB_KEYS.BUDGETS, budgets);
    }
}

// ==========================================
// 4. Client-Side Authentication API
// ==========================================
const AuthAPI = {
    getCurrentUser() {
        return DB.get(DB_KEYS.SESSION, null);
    },
    login(email, password) {
        const users = DB.get(DB_KEYS.USERS, []);
        const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user || user.password !== password) {
            throw new Error('Invalid email or password');
        }
        const session = { id: user.id, fullName: user.fullName, email: user.email };
        DB.set(DB_KEYS.SESSION, session);
        return session;
    },
    register(fullName, email, password) {
        const users = DB.get(DB_KEYS.USERS, []);
        if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
            throw new Error('An account with this email already exists');
        }
        const newUser = {
            id: Date.now(),
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        DB.set(DB_KEYS.USERS, users);

        // Seed default categories for new user
        const categories = DB.get(DB_KEYS.CATEGORIES, []);
        const defaults = [
            { name: 'Salary', type: 'INCOME' },
            { name: 'Freelancing', type: 'INCOME' },
            { name: 'Scholarship', type: 'INCOME' },
            { name: 'Investments', type: 'INCOME' },
            { name: 'Other Income', type: 'INCOME' },
            { name: 'Food & Dining', type: 'EXPENSE' },
            { name: 'Shopping', type: 'EXPENSE' },
            { name: 'Housing & Rent', type: 'EXPENSE' },
            { name: 'Transportation', type: 'EXPENSE' },
            { name: 'Education', type: 'EXPENSE' },
            { name: 'Entertainment', type: 'EXPENSE' },
            { name: 'Utilities & Bills', type: 'EXPENSE' },
            { name: 'Healthcare', type: 'EXPENSE' },
            { name: 'Others', type: 'EXPENSE' }
        ];
        defaults.forEach((def, idx) => {
            categories.push({ id: Date.now() + idx, userId: newUser.id, name: def.name, type: def.type });
        });
        DB.set(DB_KEYS.CATEGORIES, categories);

        const session = { id: newUser.id, fullName: newUser.fullName, email: newUser.email };
        DB.set(DB_KEYS.SESSION, session);
        return session;
    },
    logout() {
        localStorage.removeItem(DB_KEYS.SESSION);
    },
    updateProfile(fullName) {
        const session = this.getCurrentUser();
        if (!session) throw new Error('Not logged in');
        const users = DB.get(DB_KEYS.USERS, []);
        const user = users.find(u => u.id === session.id);
        if (user) {
            user.fullName = fullName.trim();
            DB.set(DB_KEYS.USERS, users);
        }
        session.fullName = fullName.trim();
        DB.set(DB_KEYS.SESSION, session);
        return session;
    }
};

// ==========================================
// 5. Client-Side Data Services
// ==========================================
const CategoryService = {
    getAll(userId) {
        const all = DB.get(DB_KEYS.CATEGORIES, []);
        return all.filter(c => c.userId === userId);
    },
    create(userId, name, type) {
        const all = DB.get(DB_KEYS.CATEGORIES, []);
        if (all.some(c => c.userId === userId && c.name.toLowerCase() === name.trim().toLowerCase() && c.type === type)) {
            throw new Error('Category already exists');
        }
        const cat = { id: Date.now(), userId, name: name.trim(), type };
        all.push(cat);
        DB.set(DB_KEYS.CATEGORIES, all);
        return cat;
    }
};

const IncomeService = {
    getAll(userId) {
        const incomes = DB.get(DB_KEYS.INCOMES, []).filter(i => i.userId === userId);
        const categories = CategoryService.getAll(userId);
        const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

        return incomes
            .map(i => ({ ...i, categoryName: catMap[i.categoryId] || 'Income' }))
            .sort((a, b) => new Date(b.incomeDate) - new Date(a.incomeDate) || b.id - a.id);
    },
    create(userId, data) {
        const incomes = DB.get(DB_KEYS.INCOMES, []);
        const item = {
            id: Date.now(),
            userId,
            source: data.source.trim(),
            amount: Number(data.amount),
            categoryId: Number(data.categoryId),
            incomeDate: data.incomeDate,
            description: (data.description || '').trim()
        };
        incomes.push(item);
        DB.set(DB_KEYS.INCOMES, incomes);
        return item;
    },
    update(userId, id, data) {
        const incomes = DB.get(DB_KEYS.INCOMES, []);
        const item = incomes.find(i => i.id === Number(id) && i.userId === userId);
        if (!item) throw new Error('Income record not found');
        item.source = data.source.trim();
        item.amount = Number(data.amount);
        item.categoryId = Number(data.categoryId);
        item.incomeDate = data.incomeDate;
        item.description = (data.description || '').trim();
        DB.set(DB_KEYS.INCOMES, incomes);
        return item;
    },
    delete(userId, id) {
        let incomes = DB.get(DB_KEYS.INCOMES, []);
        incomes = incomes.filter(i => !(i.id === Number(id) && i.userId === userId));
        DB.set(DB_KEYS.INCOMES, incomes);
    }
};

const ExpenseService = {
    getAll(userId) {
        const expenses = DB.get(DB_KEYS.EXPENSES, []).filter(e => e.userId === userId);
        const categories = CategoryService.getAll(userId);
        const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

        return expenses
            .map(e => ({ ...e, categoryName: catMap[e.categoryId] || 'Expense' }))
            .sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate) || b.id - a.id);
    },
    create(userId, data) {
        const expenses = DB.get(DB_KEYS.EXPENSES, []);
        const item = {
            id: Date.now(),
            userId,
            title: data.title.trim(),
            amount: Number(data.amount),
            categoryId: Number(data.categoryId),
            expenseDate: data.expenseDate,
            description: (data.description || '').trim()
        };
        expenses.push(item);
        DB.set(DB_KEYS.EXPENSES, expenses);
        return item;
    },
    update(userId, id, data) {
        const expenses = DB.get(DB_KEYS.EXPENSES, []);
        const item = expenses.find(e => e.id === Number(id) && e.userId === userId);
        if (!item) throw new Error('Expense record not found');
        item.title = data.title.trim();
        item.amount = Number(data.amount);
        item.categoryId = Number(data.categoryId);
        item.expenseDate = data.expenseDate;
        item.description = (data.description || '').trim();
        DB.set(DB_KEYS.EXPENSES, expenses);
        return item;
    },
    delete(userId, id) {
        let expenses = DB.get(DB_KEYS.EXPENSES, []);
        expenses = expenses.filter(e => !(e.id === Number(id) && e.userId === userId));
        DB.set(DB_KEYS.EXPENSES, expenses);
    }
};

const BudgetService = {
    getStatus(userId, month) {
        const targetMonth = month || currentMonthStr();
        const budgets = DB.get(DB_KEYS.BUDGETS, []);
        const budget = budgets.find(b => b.userId === userId && b.budgetMonth === targetMonth);
        const limit = budget ? Number(budget.monthlyLimit) : 0;

        const expenses = DB.get(DB_KEYS.EXPENSES, []).filter(e => e.userId === userId && e.expenseDate.startsWith(targetMonth));
        const spent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const remaining = limit - spent;
        const usage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

        let alertLevel = 'NORMAL';
        if (limit > 0) {
            if (usage >= 100) alertLevel = 'EXCEEDED_100';
            else if (usage >= 80) alertLevel = 'WARNING_80';
        }

        return {
            budgetMonth: targetMonth,
            monthlyLimit: limit,
            spentThisMonth: spent,
            remainingBudget: remaining,
            usagePercentage: usage,
            alertLevel
        };
    },
    setBudget(userId, month, limit) {
        const budgets = DB.get(DB_KEYS.BUDGETS, []);
        let budget = budgets.find(b => b.userId === userId && b.budgetMonth === month);
        if (budget) {
            budget.monthlyLimit = Number(limit);
        } else {
            budget = { id: Date.now(), userId, budgetMonth: month, monthlyLimit: Number(limit) };
            budgets.push(budget);
        }
        DB.set(DB_KEYS.BUDGETS, budgets);
        return this.getStatus(userId, month);
    }
};

const DashboardService = {
    getSummary(userId) {
        const curMonth = currentMonthStr();
        const allIncomes = IncomeService.getAll(userId);
        const allExpenses = ExpenseService.getAll(userId);

        const totalIncome = allIncomes.reduce((s, i) => s + Number(i.amount), 0);
        const totalExpenses = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const totalSavings = totalIncome - totalExpenses;

        const expensePercentage = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
        const savingsPercentage = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

        const monthlyIncome = allIncomes
            .filter(i => i.incomeDate.startsWith(curMonth))
            .reduce((s, i) => s + Number(i.amount), 0);

        const budgetStatus = BudgetService.getStatus(userId, curMonth);

        // Unified recent transactions
        const unified = [
            ...allIncomes.map(i => ({ id: i.id, type: 'INCOME', title: i.source, amount: i.amount, date: i.incomeDate, categoryName: i.categoryName, description: i.description })),
            ...allExpenses.map(e => ({ id: e.id, type: 'EXPENSE', title: e.title, amount: e.amount, date: e.expenseDate, categoryName: e.categoryName, description: e.description }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id).slice(0, 8);

        return {
            totalIncome,
            totalExpenses,
            totalSavings,
            expensePercentage,
            savingsPercentage,
            currentMonth: curMonth,
            monthlyIncome,
            monthlyBudget: budgetStatus.monthlyLimit,
            remainingBudget: budgetStatus.remainingBudget,
            budgetUsagePercentage: budgetStatus.usagePercentage,
            budgetAlertLevel: budgetStatus.alertLevel,
            recentTransactions: unified
        };
    },
    getTransactions(userId, filters = {}) {
        const allIncomes = IncomeService.getAll(userId);
        const allExpenses = ExpenseService.getAll(userId);

        let unified = [];
        const type = (filters.type || 'ALL').toUpperCase();
        if (type === 'ALL' || type === 'INCOME') {
            unified.push(...allIncomes.map(i => ({ id: i.id, type: 'INCOME', title: i.source, amount: i.amount, date: i.incomeDate, categoryName: i.categoryName, description: i.description })));
        }
        if (type === 'ALL' || type === 'EXPENSE') {
            unified.push(...allExpenses.map(e => ({ id: e.id, type: 'EXPENSE', title: e.title, amount: e.amount, date: e.expenseDate, categoryName: e.categoryName, description: e.description })));
        }

        const q = (filters.search || '').trim().toLowerCase();
        const cat = filters.category || 'ALL';
        const from = filters.fromDate;
        const to = filters.toDate;

        return unified
            .filter(item => cat === 'ALL' || item.categoryName.toLowerCase() === cat.toLowerCase())
            .filter(item => !from || item.date >= from)
            .filter(item => !to || item.date <= to)
            .filter(item => !q || item.title.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q)) || item.categoryName.toLowerCase().includes(q))
            .sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
    },
    getReports(userId, period = 'MONTHLY') {
        const today = new Date();
        const allIncomes = IncomeService.getAll(userId);
        const allExpenses = ExpenseService.getAll(userId);

        let filteredIncomes = allIncomes;
        let filteredExpenses = allExpenses;

        if (period === 'DAILY') {
            const dStr = todayStr();
            filteredIncomes = allIncomes.filter(i => i.incomeDate === dStr);
            filteredExpenses = allExpenses.filter(e => e.expenseDate === dStr);
        } else if (period === 'WEEKLY') {
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 6);
            const wStr = weekAgo.toISOString().slice(0, 10);
            filteredIncomes = allIncomes.filter(i => i.incomeDate >= wStr);
            filteredExpenses = allExpenses.filter(e => e.expenseDate >= wStr);
        } else if (period === 'MONTHLY') {
            const mStr = currentMonthStr();
            filteredIncomes = allIncomes.filter(i => i.incomeDate.startsWith(mStr));
            filteredExpenses = allExpenses.filter(e => e.expenseDate.startsWith(mStr));
        }

        const periodIncome = filteredIncomes.reduce((s, i) => s + Number(i.amount), 0);
        const periodExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const periodSavings = periodIncome - periodExpenses;

        // Categories breakdown
        const expensesByCategory = {};
        filteredExpenses.forEach(e => {
            expensesByCategory[e.categoryName] = (expensesByCategory[e.categoryName] || 0) + Number(e.amount);
        });

        // 6-Month Comparison Points
        const monthlyComparison = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const ym = d.toISOString().slice(0, 7);
            const inc = allIncomes.filter(x => x.incomeDate.startsWith(ym)).reduce((s, x) => s + Number(x.amount), 0);
            const exp = allExpenses.filter(x => x.expenseDate.startsWith(ym)).reduce((s, x) => s + Number(x.amount), 0);
            monthlyComparison.push({ month: ym, income: inc, expenses: exp });
        }

        // Spending Trend (daily totals)
        const dailyMap = {};
        filteredExpenses.forEach(e => {
            dailyMap[e.expenseDate] = (dailyMap[e.expenseDate] || 0) + Number(e.amount);
        });
        const spendingTrend = Object.keys(dailyMap).sort().map(date => ({ date, amount: dailyMap[date] }));

        return {
            period,
            periodIncome,
            periodExpenses,
            periodSavings,
            expensesByCategory,
            monthlyComparison,
            spendingTrend
        };
    }
};

// ==========================================
// 6. UI Controller & View Navigation
// ==========================================
async function init() {
    seedDefaultData();

    document.getElementById('incomeDate').value = todayStr();
    document.getElementById('expenseDate').value = todayStr();
    document.getElementById('budgetMonth').value = currentMonthStr();

    bindEvents();

    const session = AuthAPI.getCurrentUser();
    if (session) {
        onAuthenticated(session);
    } else {
        showAuthScreen();
    }
}

function showAuthScreen() {
    document.getElementById('authSection').classList.remove('d-none');
    document.getElementById('appShell').classList.add('d-none');
}

function onAuthenticated(user) {
    state.user = user;
    document.getElementById('authSection').classList.add('d-none');
    document.getElementById('appShell').classList.remove('d-none');
    document.getElementById('sidebarUserName').textContent = user.fullName;
    document.getElementById('sidebarUserEmail').textContent = user.email;
    document.getElementById('profileName').value = user.fullName;
    document.getElementById('profileEmail').value = user.email;

    loadCategories();
    switchView('dashboard');
}

function switchView(viewName) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.add('d-none'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('d-none');

    document.querySelectorAll('.sidebar-link').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    const titles = {
        dashboard: 'Dashboard',
        income: 'Income Management',
        expenses: 'Expense Management',
        transactions: 'Transaction History',
        budgets: 'Budget Management',
        reports: 'Financial Reports',
        profile: 'Profile & Categories'
    };
    document.getElementById('pageTitle').textContent = titles[viewName] || 'Dashboard';
    document.getElementById('sidebar').classList.remove('open');

    if (viewName === 'dashboard') loadDashboard();
    if (viewName === 'income') loadIncomes();
    if (viewName === 'expenses') loadExpenses();
    if (viewName === 'transactions') loadTransactions();
    if (viewName === 'budgets') loadBudgetStatus();
    if (viewName === 'reports') loadReports(state.currentReportPeriod);
}

function loadCategories() {
    state.categories = CategoryService.getAll(state.user.id);
    const incomeSelect = document.getElementById('incomeCategory');
    const expenseSelect = document.getElementById('expenseCategory');
    const filterSelect = document.getElementById('filterCategory');

    const incCats = state.categories.filter(c => c.type === 'INCOME');
    const expCats = state.categories.filter(c => c.type === 'EXPENSE');

    incomeSelect.innerHTML = incCats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    expenseSelect.innerHTML = expCats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

    const uniqueNames = [...new Set(state.categories.map(c => c.name))];
    filterSelect.innerHTML = '<option value="ALL">All Categories</option>' +
        uniqueNames.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
}

function loadDashboard() {
    const summary = DashboardService.getSummary(state.user.id);
    const report = DashboardService.getReports(state.user.id, 'MONTHLY');

    document.getElementById('kpiTotalIncome').textContent = currency(summary.totalIncome);
    document.getElementById('kpiMonthlyIncome').textContent = `This month: ${currency(summary.monthlyIncome)}`;
    document.getElementById('kpiTotalExpenses').textContent = currency(summary.totalExpenses);
    document.getElementById('kpiExpensePct').textContent = `${summary.expensePercentage}% of income`;
    document.getElementById('kpiTotalSavings').textContent = currency(summary.totalSavings);
    document.getElementById('kpiSavingsPct').textContent = `${summary.savingsPercentage}% saved`;
    document.getElementById('kpiRemainingBudget').textContent = currency(summary.remainingBudget);
    document.getElementById('kpiBudgetMeta').textContent = summary.monthlyBudget > 0
        ? `Limit: ${currency(summary.monthlyBudget)} (${summary.budgetUsagePercentage}% used)`
        : 'No monthly budget set';

    const banner = document.getElementById('budgetAlertBanner');
    banner.className = 'alert mb-4';
    if (summary.budgetAlertLevel === 'EXCEEDED_100') {
        banner.classList.remove('d-none');
        banner.classList.add('alert-danger');
        banner.innerHTML = `<i class="bi bi-exclamation-octagon-fill me-2"></i><strong>Budget Exceeded!</strong> You have spent ${summary.budgetUsagePercentage}% of your ${summary.currentMonth} budget.`;
    } else if (summary.budgetAlertLevel === 'WARNING_80') {
        banner.classList.remove('d-none');
        banner.classList.add('alert-warning');
        banner.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i><strong>Budget Warning:</strong> You have reached ${summary.budgetUsagePercentage}% of your ${summary.currentMonth} budget.`;
    } else {
        banner.classList.add('d-none');
    }

    const tbody = document.getElementById('recentTransactionsBody');
    if (summary.recentTransactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No transactions recorded yet.</td></tr>`;
    } else {
        tbody.innerHTML = summary.recentTransactions.map(tx => `
            <tr>
                <td>${tx.date}</td>
                <td class="fw-medium">${escapeHtml(tx.title)}</td>
                <td><span class="badge text-bg-light border">${escapeHtml(tx.categoryName)}</span></td>
                <td><span class="badge ${tx.type === 'INCOME' ? 'text-bg-success-subtle text-success' : 'text-bg-danger-subtle text-danger'}">${tx.type}</span></td>
                <td class="text-end fw-semibold ${tx.type === 'INCOME' ? 'text-success' : 'text-danger'}">
                    ${tx.type === 'INCOME' ? '+' : '-'}${currency(tx.amount)}
                </td>
            </tr>
        `).join('');
    }

    renderPieChart('dashPieChart', report.expensesByCategory);
    renderBarChart('dashBarChart', report.monthlyComparison);
}

function loadIncomes() {
    state.incomes = IncomeService.getAll(state.user.id);
    const tbody = document.getElementById('incomeTableBody');
    if (state.incomes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No income records found. Add your first income!</td></tr>`;
        return;
    }
    tbody.innerHTML = state.incomes.map(i => `
        <tr>
            <td>${i.incomeDate}</td>
            <td>
                <div class="fw-medium">${escapeHtml(i.source)}</div>
                <small class="text-muted">${escapeHtml(i.description || '')}</small>
            </td>
            <td><span class="badge text-bg-success-subtle text-success">${escapeHtml(i.categoryName)}</span></td>
            <td class="text-end fw-semibold text-success">${currency(i.amount)}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editIncome(${i.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteIncome(${i.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function loadExpenses() {
    state.expenses = ExpenseService.getAll(state.user.id);
    const tbody = document.getElementById('expenseTableBody');
    if (state.expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No expenses recorded yet. Add your first expense!</td></tr>`;
        return;
    }
    tbody.innerHTML = state.expenses.map(e => `
        <tr>
            <td>${e.expenseDate}</td>
            <td>
                <div class="fw-medium">${escapeHtml(e.title)}</div>
                <small class="text-muted">${escapeHtml(e.description || '')}</small>
            </td>
            <td><span class="badge text-bg-light border">${escapeHtml(e.categoryName)}</span></td>
            <td class="text-end fw-semibold text-danger">${currency(e.amount)}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editExpense(${e.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${e.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function loadTransactions() {
    const filters = {
        search: document.getElementById('filterSearch').value,
        type: document.getElementById('filterType').value,
        category: document.getElementById('filterCategory').value,
        fromDate: document.getElementById('filterFrom').value,
        toDate: document.getElementById('filterTo').value
    };
    const list = DashboardService.getTransactions(state.user.id, filters);
    const tbody = document.getElementById('allTransactionsBody');
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No matching transactions.</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(tx => `
        <tr>
            <td>${tx.date}</td>
            <td class="fw-medium">${escapeHtml(tx.title)}</td>
            <td class="text-muted small">${escapeHtml(tx.description || '-')}</td>
            <td><span class="badge text-bg-light border">${escapeHtml(tx.categoryName)}</span></td>
            <td><span class="badge ${tx.type === 'INCOME' ? 'text-bg-success-subtle text-success' : 'text-bg-danger-subtle text-danger'}">${tx.type}</span></td>
            <td class="text-end fw-semibold ${tx.type === 'INCOME' ? 'text-success' : 'text-danger'}">
                ${tx.type === 'INCOME' ? '+' : '-'}${currency(tx.amount)}
            </td>
        </tr>
    `).join('');
}

function loadBudgetStatus() {
    const month = document.getElementById('budgetMonth').value || currentMonthStr();
    const status = BudgetService.getStatus(state.user.id, month);
    if (status.monthlyLimit > 0) {
        document.getElementById('budgetLimit').value = status.monthlyLimit;
    }

    const barColor = status.alertLevel === 'EXCEEDED_100' ? 'bg-danger'
        : status.alertLevel === 'WARNING_80' ? 'bg-warning' : 'bg-success';
    const pctClamped = Math.min(100, Math.max(0, status.usagePercentage));

    document.getElementById('budgetStatusCard').innerHTML = `
        <div class="d-flex justify-content-between mb-2">
            <span class="fw-semibold">Month: ${status.budgetMonth}</span>
            <span class="badge ${barColor}">${status.usagePercentage}% Used</span>
        </div>
        <div class="progress mb-3" style="height: 14px;">
            <div class="progress-bar ${barColor}" style="width: ${pctClamped}%"></div>
        </div>
        <div class="row text-center g-2">
            <div class="col-4">
                <div class="p-2 bg-light rounded-3">
                    <small class="text-muted d-block">Limit</small>
                    <strong>${currency(status.monthlyLimit)}</strong>
                </div>
            </div>
            <div class="col-4">
                <div class="p-2 bg-light rounded-3">
                    <small class="text-muted d-block">Spent</small>
                    <strong class="text-danger">${currency(status.spentThisMonth)}</strong>
                </div>
            </div>
            <div class="col-4">
                <div class="p-2 bg-light rounded-3">
                    <small class="text-muted d-block">Remaining</small>
                    <strong class="${status.remainingBudget < 0 ? 'text-danger' : 'text-success'}">${currency(status.remainingBudget)}</strong>
                </div>
            </div>
        </div>
    `;
}

function loadReports(period) {
    state.currentReportPeriod = period;
    document.querySelectorAll('.report-period-btn').forEach(btn => {
        const active = btn.dataset.period === period;
        btn.classList.toggle('btn-primary', active);
        btn.classList.toggle('btn-outline-primary', !active);
    });

    const data = DashboardService.getReports(state.user.id, period);
    document.getElementById('repIncome').textContent = currency(data.periodIncome);
    document.getElementById('repExpenses').textContent = currency(data.periodExpenses);
    document.getElementById('repSavings').textContent = currency(data.periodSavings);

    renderPieChart('repPieChart', data.expensesByCategory);
    renderLineChart('repLineChart', data.spendingTrend);
}

function destroyChart(id) {
    if (state.charts[id]) {
        state.charts[id].destroy();
        delete state.charts[id];
    }
}

function renderPieChart(canvasId, categoryMap) {
    destroyChart(canvasId);
    const labels = Object.keys(categoryMap || {});
    const values = Object.values(categoryMap || {});
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    state.charts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['No Expenses'],
            datasets: [{
                data: values.length ? values : [1],
                backgroundColor: values.length
                    ? ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b']
                    : ['#e2e8f0']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderBarChart(canvasId, points) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    state.charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: points.map(p => p.month),
            datasets: [
                { label: 'Income', data: points.map(p => p.income), backgroundColor: '#10b981', borderRadius: 6 },
                { label: 'Expenses', data: points.map(p => p.expenses), backgroundColor: '#2563eb', borderRadius: 6 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderLineChart(canvasId, points) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    state.charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: points.map(p => p.date),
            datasets: [{
                label: 'Daily Spending (₹)',
                data: points.map(p => p.amount),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Global actions for inline buttons
window.editIncome = (id) => {
    const item = state.incomes.find(i => i.id === id);
    if (!item) return;
    document.getElementById('incomeId').value = item.id;
    document.getElementById('incomeSource').value = item.source;
    document.getElementById('incomeAmount').value = item.amount;
    document.getElementById('incomeCategory').value = item.categoryId;
    document.getElementById('incomeDate').value = item.incomeDate;
    document.getElementById('incomeDescription').value = item.description || '';
    document.getElementById('incomeFormTitle').textContent = 'Edit Income';
    document.getElementById('incomeCancelEditBtn').classList.remove('d-none');
};

window.deleteIncome = (id) => {
    try {
        IncomeService.delete(state.user.id, id);
        showToast('Income deleted');
        loadIncomes();
        loadCategories();
    } catch (err) {
        showToast(err.message, 'danger');
    }
};

window.editExpense = (id) => {
    const item = state.expenses.find(e => e.id === id);
    if (!item) return;
    document.getElementById('expenseId').value = item.id;
    document.getElementById('expenseTitle').value = item.title;
    document.getElementById('expenseAmount').value = item.amount;
    document.getElementById('expenseCategory').value = item.categoryId;
    document.getElementById('expenseDate').value = item.expenseDate;
    document.getElementById('expenseDescription').value = item.description || '';
    document.getElementById('expenseFormTitle').textContent = 'Edit Expense';
    document.getElementById('expenseCancelEditBtn').classList.remove('d-none');
};

window.deleteExpense = (id) => {
    try {
        ExpenseService.delete(state.user.id, id);
        showToast('Expense deleted');
        loadExpenses();
        loadCategories();
    } catch (err) {
        showToast(err.message, 'danger');
    }
};

function resetIncomeForm() {
    document.getElementById('incomeForm').reset();
    document.getElementById('incomeId').value = '';
    document.getElementById('incomeDate').value = todayStr();
    document.getElementById('incomeFormTitle').textContent = 'Add Income';
    document.getElementById('incomeCancelEditBtn').classList.add('d-none');
}

function resetExpenseForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('expenseDate').value = todayStr();
    document.getElementById('expenseFormTitle').textContent = 'Add Expense';
    document.getElementById('expenseCancelEditBtn').classList.add('d-none');
}

// Client-Side CSV Exporter
function exportTransactionsCsv() {
    const filters = {
        search: document.getElementById('filterSearch').value,
        type: document.getElementById('filterType').value,
        category: document.getElementById('filterCategory').value,
        fromDate: document.getElementById('filterFrom').value,
        toDate: document.getElementById('filterTo').value
    };
    const rows = DashboardService.getTransactions(state.user.id, filters);

    let csvContent = 'Date,Type,Category,Title,Description,Amount\n';
    rows.forEach(r => {
        const desc = (r.description || '').replace(/"/g, '""');
        const title = (r.title || '').replace(/"/g, '""');
        const cat = (r.categoryName || '').replace(/"/g, '""');
        csvContent += `${r.date},${r.type},"${cat}","${title}","${desc}",${r.amount}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expense-tracker-report-${todayStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report downloaded!');
}

// ==========================================
// 7. Event Listeners Binding
// ==========================================
function bindEvents() {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const user = AuthAPI.login(
                document.getElementById('loginEmail').value,
                document.getElementById('loginPassword').value
            );
            showToast('Welcome back, ' + user.fullName + '!');
            onAuthenticated(user);
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });

    document.getElementById('demoLoginBtn').addEventListener('click', () => {
        try {
            const user = AuthAPI.login('demo@expensetracker.com', 'demo1234');
            showToast('Signed in with Demo Account');
            onAuthenticated(user);
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });

    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const user = AuthAPI.register(
                document.getElementById('regName').value,
                document.getElementById('regEmail').value,
                document.getElementById('regPassword').value
            );
            showToast('Account created successfully!');
            onAuthenticated(user);
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        AuthAPI.logout();
        state.user = null;
        showAuthScreen();
        showToast('Logged out');
    });

    document.querySelectorAll('.sidebar-link').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    document.querySelectorAll('[data-quick-nav]').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.quickNav));
    });

    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    document.getElementById('incomeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('incomeId').value;
        const payload = {
            source: document.getElementById('incomeSource').value,
            amount: Number(document.getElementById('incomeAmount').value),
            categoryId: Number(document.getElementById('incomeCategory').value),
            incomeDate: document.getElementById('incomeDate').value,
            description: document.getElementById('incomeDescription').value
        };
        try {
            if (id) {
                IncomeService.update(state.user.id, id, payload);
                showToast('Income updated');
            } else {
                IncomeService.create(state.user.id, payload);
                showToast('Income added');
            }
            resetIncomeForm();
            loadIncomes();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });
    document.getElementById('incomeCancelEditBtn').addEventListener('click', resetIncomeForm);

    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('expenseId').value;
        const payload = {
            title: document.getElementById('expenseTitle').value,
            amount: Number(document.getElementById('expenseAmount').value),
            categoryId: Number(document.getElementById('expenseCategory').value),
            expenseDate: document.getElementById('expenseDate').value,
            description: document.getElementById('expenseDescription').value
        };
        try {
            if (id) {
                ExpenseService.update(state.user.id, id, payload);
                showToast('Expense updated');
            } else {
                ExpenseService.create(state.user.id, payload);
                showToast('Expense added');
            }
            resetExpenseForm();
            loadExpenses();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });
    document.getElementById('expenseCancelEditBtn').addEventListener('click', resetExpenseForm);

    document.getElementById('filterSearch').addEventListener('input', loadTransactions);
    ['filterType', 'filterCategory', 'filterFrom', 'filterTo'].forEach(id => {
        document.getElementById(id).addEventListener('change', loadTransactions);
    });

    document.getElementById('exportCsvBtn').addEventListener('click', exportTransactionsCsv);

    document.getElementById('budgetForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            BudgetService.setBudget(
                state.user.id,
                document.getElementById('budgetMonth').value,
                Number(document.getElementById('budgetLimit').value)
            );
            showToast('Monthly budget saved');
            loadBudgetStatus();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });
    document.getElementById('budgetMonth').addEventListener('change', loadBudgetStatus);

    document.querySelectorAll('.report-period-btn').forEach(btn => {
        btn.addEventListener('click', () => loadReports(btn.dataset.period));
    });

    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const updated = AuthAPI.updateProfile(document.getElementById('profileName').value);
            state.user = updated;
            document.getElementById('sidebarUserName').textContent = updated.fullName;
            showToast('Profile updated');
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });

    document.getElementById('customCategoryForm').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            CategoryService.create(
                state.user.id,
                document.getElementById('newCategoryName').value,
                document.getElementById('newCategoryType').value
            );
            document.getElementById('customCategoryForm').reset();
            loadCategories();
            showToast('Custom category added');
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
