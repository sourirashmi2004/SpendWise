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

async function api(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data.errors
            ? Object.values(data.errors).join(', ')
            : (data.message || `Request failed (${res.status})`);
        throw new Error(msg);
    }
    return data;
}

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

async function init() {
    document.getElementById('incomeDate').value = todayStr();
    document.getElementById('expenseDate').value = todayStr();
    document.getElementById('budgetMonth').value = currentMonthStr();

    bindEvents();
    const session = await api('/api/auth/me');
    if (session.authenticated) {
        onAuthenticated(session);
    } else {
        showAuthScreen();
    }
}

function showAuthScreen() {
    document.getElementById('authSection').classList.remove('d-none');
    document.getElementById('appShell').classList.add('d-none');
}

async function onAuthenticated(user) {
    state.user = user;
    document.getElementById('authSection').classList.add('d-none');
    document.getElementById('appShell').classList.remove('d-none');
    document.getElementById('sidebarUserName').textContent = user.fullName;
    document.getElementById('sidebarUserEmail').textContent = user.email;
    document.getElementById('profileName').value = user.fullName;
    document.getElementById('profileEmail').value = user.email;

    await loadCategories();
    await switchView('dashboard');
}

async function switchView(viewName) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.add('d-none'));
    document.getElementById(`view-${viewName}`).classList.remove('d-none');

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

    if (viewName === 'dashboard') await loadDashboard();
    if (viewName === 'income') await loadIncomes();
    if (viewName === 'expenses') await loadExpenses();
    if (viewName === 'transactions') await loadTransactions();
    if (viewName === 'budgets') await loadBudgetStatus();
    if (viewName === 'reports') await loadReports(state.currentReportPeriod);
}

async function loadCategories() {
    state.categories = await api('/api/categories');
    const incomeSelect = document.getElementById('incomeCategory');
    const expenseSelect = document.getElementById('expenseCategory');
    const filterSelect = document.getElementById('filterCategory');

    const incCats = state.categories.filter(c => c.type === 'INCOME');
    const expCats = state.categories.filter(c => c.type === 'EXPENSE');

    incomeSelect.innerHTML = incCats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    expenseSelect.innerHTML = expCats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

    const uniqueNames = [...new Set(state.categories.map(c => c.name))];
    filterSelect.innerHTML = '<option value="ALL">All</option>' +
        uniqueNames.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
}

async function loadDashboard() {
    const [summary, report] = await Promise.all([
        api('/api/dashboard/summary'),
        api('/api/reports?period=MONTHLY')
    ]);

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
        banner.classList.add('alert-danger');
        banner.innerHTML = `<i class="bi bi-exclamation-octagon-fill me-2"></i><strong>Budget Exceeded!</strong> You have spent ${summary.budgetUsagePercentage}% of your ${summary.currentMonth} budget.`;
    } else if (summary.budgetAlertLevel === 'WARNING_80') {
        banner.classList.add('alert-warning');
        banner.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i><strong>Budget Warning:</strong> You have reached ${summary.budgetUsagePercentage}% of your ${summary.currentMonth} budget.`;
    } else {
        banner.classList.add('d-none');
    }

    const tbody = document.getElementById('recentTransactionsBody');
    if (summary.recentTransactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No transactions yet. Add your first income or expense!</td></tr>`;
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

async function loadIncomes() {
    state.incomes = await api('/api/incomes');
    const tbody = document.getElementById('incomeTableBody');
    if (state.incomes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No income records found.</td></tr>`;
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

async function loadExpenses() {
    state.expenses = await api('/api/expenses');
    const tbody = document.getElementById('expenseTableBody');
    if (state.expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No expenses recorded yet.</td></tr>`;
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

async function loadTransactions() {
    const params = buildTransactionQueryParams();
    const list = await api('/api/transactions?' + params.toString());
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

function buildTransactionQueryParams() {
    const params = new URLSearchParams();
    const search = document.getElementById('filterSearch').value.trim();
    const type = document.getElementById('filterType').value;
    const category = document.getElementById('filterCategory').value;
    const from = document.getElementById('filterFrom').value;
    const to = document.getElementById('filterTo').value;
    if (search) params.set('search', search);
    if (type && type !== 'ALL') params.set('type', type);
    if (category && category !== 'ALL') params.set('category', category);
    if (from) params.set('fromDate', from);
    if (to) params.set('toDate', to);
    return params;
}

async function loadBudgetStatus() {
    const month = document.getElementById('budgetMonth').value || currentMonthStr();
    const status = await api(`/api/budgets/current?month=${encodeURIComponent(month)}`);
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

async function loadReports(period) {
    state.currentReportPeriod = period;
    document.querySelectorAll('.report-period-btn').forEach(btn => {
        const active = btn.dataset.period === period;
        btn.classList.toggle('btn-primary', active);
        btn.classList.toggle('btn-outline-primary', !active);
    });

    const data = await api(`/api/reports?period=${period}`);
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

window.deleteIncome = async (id) => {
    try {
        await api(`/api/incomes/${id}`, { method: 'DELETE' });
        showToast('Income deleted');
        await loadIncomes();
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

window.deleteExpense = async (id) => {
    try {
        await api(`/api/expenses/${id}`, { method: 'DELETE' });
        showToast('Expense deleted');
        await loadExpenses();
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

function bindEvents() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const user = await api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: document.getElementById('loginEmail').value,
                    password: document.getElementById('loginPassword').value
                })
            });
            showToast('Welcome back!');
            await onAuthenticated(user);
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });

    document.getElementById('demoLoginBtn').addEventListener('click', async () => {
        try {
            const user = await api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: 'demo@expensetracker.com', password: 'demo1234' })
            });
            showToast('Signed in with Demo Account');
            await onAuthenticated(user);
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const user = await api('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    fullName: document.getElementById('regName').value,
                    email: document.getElementById('regEmail').value,
                    password: document.getElementById('regPassword').value
                })
            });
            showToast('Account created!');
            await onAuthenticated(user);
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
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

    document.getElementById('incomeForm').addEventListener('submit', async (e) => {
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
            await api(id ? `/api/incomes/${id}` : '/api/incomes', {
                method: id ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            showToast(id ? 'Income updated' : 'Income added');
            resetIncomeForm();
            await loadIncomes();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });
    document.getElementById('incomeCancelEditBtn').addEventListener('click', resetIncomeForm);

    document.getElementById('expenseForm').addEventListener('submit', async (e) => {
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
            await api(id ? `/api/expenses/${id}` : '/api/expenses', {
                method: id ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            showToast(id ? 'Expense updated' : 'Expense added');
            resetExpenseForm();
            await loadExpenses();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });
    document.getElementById('expenseCancelEditBtn').addEventListener('click', resetExpenseForm);

    ['filterSearch', 'filterType', 'filterCategory', 'filterFrom', 'filterTo'].forEach(id => {
        document.getElementById(id).addEventListener('input', loadTransactions);
    });

    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        const params = buildTransactionQueryParams();
        window.location.href = '/api/transactions/export?' + params.toString();
    });

    document.getElementById('budgetForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api('/api/budgets', {
                method: 'POST',
                body: JSON.stringify({
                    budgetMonth: document.getElementById('budgetMonth').value,
                    monthlyLimit: Number(document.getElementById('budgetLimit').value)
                })
            });
            showToast('Monthly budget saved');
            await loadBudgetStatus();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });
    document.getElementById('budgetMonth').addEventListener('change', loadBudgetStatus);

    document.querySelectorAll('.report-period-btn').forEach(btn => {
        btn.addEventListener('click', () => loadReports(btn.dataset.period));
    });

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const updated = await api('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ fullName: document.getElementById('profileName').value })
            });
            state.user = updated;
            document.getElementById('sidebarUserName').textContent = updated.fullName;
            showToast('Profile updated');
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });

    document.getElementById('customCategoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api('/api/categories', {
                method: 'POST',
                body: JSON.stringify({
                    name: document.getElementById('newCategoryName').value,
                    type: document.getElementById('newCategoryType').value
                })
            });
            document.getElementById('customCategoryForm').reset();
            await loadCategories();
            showToast('Custom category added');
        } catch (err) {
            showToast(err.message, 'danger');
        }
    });
}

document.addEventListener('DOMContentLoaded', init);

