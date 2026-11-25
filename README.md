# SpendWise — Personal Expense Tracker (Vercel Ready)

A modern, responsive, and full-featured **Personal Expense Tracker** built with **HTML5, CSS3, JavaScript, Bootstrap 5, and Chart.js**. 

It uses browser **LocalStorage** for secure client-side data persistence — **zero backend or database configuration required**, meaning it deploys to **Vercel** with one click!

---

## ✨ Features

- 🔐 **User Authentication**: Register, Login, Profile updates, and Logout with local session management.
- ⚡ **Instant Demo Account**: One-click test account (`demo@expensetracker.com` / `demo1234`) with pre-seeded transactions and budgets.
- 📊 **Financial Dashboard**:
  - Real-time KPI Cards: Total Income, Total Expenses, Net Savings, and Remaining Monthly Budget.
  - Smart 80% & 100% budget warning and alert banners.
  - Recent transactions table.
- 💵 **Income Management**: Add, Edit, Delete, and Categorize incomes (Salary, Freelance, Scholarship, Investments, etc.).
- 🛒 **Expense Management**: Add, Edit, Delete, and Categorize expenses with dates and descriptions.
- 🎯 **Monthly Budgeting**: Set monthly spending limits per month (`YYYY-MM`) with live progress bar and usage breakdown.
- 📈 **Interactive Charts (Chart.js)**:
  - Doughnut / Pie chart for category spending distribution.
  - Multi-bar chart comparing 6-month Income vs. Expenses.
  - Interactive Line chart showing daily spending trends.
- 🔍 **Transaction Filtering & Search**:
  - Filter by search keyword, transaction type (Income/Expense), category, and date range.
- 📥 **CSV Export**: Direct one-click download of all filtered transactions to a `.csv` file directly from the browser.
- 🎨 **Responsive UI**: Clean, modern financial design inspired by top fintech apps, mobile sidebar drawer, and toast notifications.

---

## 🚀 How to Deploy on Vercel in 1 Minute

### Method 1: Using the Vercel Dashboard (Easiest)

1. Push your repository to **GitHub**:
   ```bash
   git add .
   git commit -m "Vercel-ready personal expense tracker"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **Add New...** → **Project**.
4. Select your GitHub repository.
5. Leave all build settings at their defaults (Vercel will automatically detect `index.html`).
6. Click **Deploy**! 🚀 Your app will be live immediately at `https://your-project.vercel.app`.

### Method 2: Using the Vercel CLI

```bash
npx vercel
```

---

## 💻 How to Run Locally

Because this is a pure client-side application, you can run it in multiple easy ways:

### Option 1: Just Double-Click
Double-click `index.html` to open it directly in any browser (Chrome, Edge, Firefox, Safari).

### Option 2: Using VS Code Live Server
Right-click `index.html` in VS Code and choose **Open with Live Server**.

### Option 3: Using Node.js
```bash
npx serve .
```

---

## 📁 Project Structure

```
├── index.html        # Main single-page application markup
├── css/
│   └── styles.css    # Modern custom CSS styling
├── js/
│   └── app.js        # LocalStorage data engine, Chart.js logic & UI controller
├── package.json      # NPM scripts (for Vercel build compatibility)
├── vercel.json       # Vercel deployment configuration
├── .gitignore        # Ignored files
└── README.md         # Documentation
```

---

## 🔑 Demo Account Credentials

| Email | Password |
|---|---|
| `demo@expensetracker.com` | `demo1234` |
*(Or simply click the **"Try Demo Account"** button on the login screen.)*
