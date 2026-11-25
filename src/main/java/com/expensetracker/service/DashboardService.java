package com.expensetracker.service;

import com.expensetracker.dto.BudgetDtos.BudgetStatusResponse;
import com.expensetracker.dto.DashboardDtos.*;
import com.expensetracker.dto.TransactionDtos.UnifiedTransactionItem;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.Income;
import com.expensetracker.entity.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.IncomeRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
public class DashboardService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetService budgetService;
    private final AuthService authService;

    public DashboardService(IncomeRepository incomeRepository,
            ExpenseRepository expenseRepository,
            BudgetService budgetService,
            AuthService authService) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.budgetService = budgetService;
        this.authService = authService;
    }

    public SummaryResponse getSummary() {
        User user = authService.requireCurrentUser();
        BigDecimal totalIncome = incomeRepository.sumTotalByUserId(user.getId());
        BigDecimal totalExpenses = expenseRepository.sumTotalByUserId(user.getId());
        BigDecimal totalSavings = totalIncome.subtract(totalExpenses);

        double expensePct = safePercentage(totalExpenses, totalIncome);
        double savingsPct = safePercentage(totalSavings, totalIncome);

        YearMonth currentYm = YearMonth.now();
        LocalDate monthStart = currentYm.atDay(1);
        LocalDate monthEnd = currentYm.atEndOfMonth();

        BigDecimal monthlyIncome = incomeRepository.sumByUserIdAndDateBetween(user.getId(), monthStart, monthEnd);
        BudgetStatusResponse budget = budgetService.getForMonth(currentYm.toString());

        List<UnifiedTransactionItem> recent = getTransactions(null, null, null, null, null)
                .stream()
                .limit(8)
                .toList();

        return new SummaryResponse(
                totalIncome,
                totalExpenses,
                totalSavings,
                expensePct,
                savingsPct,
                currentYm.toString(),
                monthlyIncome,
                budget.spentThisMonth(),
                budget.monthlyLimit(),
                budget.remainingBudget(),
                budget.usagePercentage(),
                budget.alertLevel(),
                recent);
    }

    public List<UnifiedTransactionItem> getTransactions(String type,
            String category,
            String search,
            LocalDate fromDate,
            LocalDate toDate) {
        User user = authService.requireCurrentUser();
        List<UnifiedTransactionItem> items = new ArrayList<>();

        boolean includeIncome = type == null || type.isBlank() || "ALL".equalsIgnoreCase(type)
                || "INCOME".equalsIgnoreCase(type);
        boolean includeExpense = type == null || type.isBlank() || "ALL".equalsIgnoreCase(type)
                || "EXPENSE".equalsIgnoreCase(type);

        if (includeIncome) {
            for (Income i : incomeRepository.findByUserIdOrderByIncomeDateDescIdDesc(user.getId())) {
                items.add(new UnifiedTransactionItem(
                        i.getId(),
                        "INCOME",
                        i.getSource(),
                        i.getDescription(),
                        i.getAmount(),
                        i.getIncomeDate(),
                        i.getCategory().getName()));
            }
        }

        if (includeExpense) {
            for (Expense e : expenseRepository.findByUserIdOrderByExpenseDateDescIdDesc(user.getId())) {
                items.add(new UnifiedTransactionItem(
                        e.getId(),
                        "EXPENSE",
                        e.getTitle(),
                        e.getDescription(),
                        e.getAmount(),
                        e.getExpenseDate(),
                        e.getCategory().getName()));
            }
        }

        String q = (search == null) ? "" : search.trim().toLowerCase();
        return items.stream()
                .filter(item -> category == null || category.isBlank() || "ALL".equalsIgnoreCase(category)
                        || item.categoryName().equalsIgnoreCase(category))
                .filter(item -> fromDate == null || !item.date().isBefore(fromDate))
                .filter(item -> toDate == null || !item.date().isAfter(toDate))
                .filter(item -> q.isEmpty()
                        || item.title().toLowerCase().contains(q)
                        || (item.description() != null && item.description().toLowerCase().contains(q))
                        || item.categoryName().toLowerCase().contains(q))
                .sorted(Comparator.comparing(UnifiedTransactionItem::date).reversed()
                        .thenComparing(UnifiedTransactionItem::id, Comparator.reverseOrder()))
                .toList();
    }

    public ReportsResponse getReports(String period, LocalDate fromDate, LocalDate toDate) {
        User user = authService.requireCurrentUser();
        LocalDate today = LocalDate.now();
        String normalizedPeriod = (period == null || period.isBlank()) ? "MONTHLY" : period.toUpperCase();

        LocalDate start = fromDate;
        LocalDate end = toDate;
        if (start == null || end == null) {
            switch (normalizedPeriod) {
                case "DAILY" -> {
                    start = today;
                    end = today;
                }
                case "WEEKLY" -> {
                    start = today.minusDays(6);
                    end = today;
                }
                case "ALL" -> {
                    start = LocalDate.of(2000, 1, 1);
                    end = LocalDate.of(2100, 12, 31);
                }
                default -> {
                    normalizedPeriod = "MONTHLY";
                    YearMonth ym = YearMonth.from(today);
                    start = ym.atDay(1);
                    end = ym.atEndOfMonth();
                }
            }
        }

        List<Income> periodIncomes = incomeRepository
                .findByUserIdAndIncomeDateBetweenOrderByIncomeDateDescIdDesc(user.getId(), start, end);
        List<Expense> periodExpenses = expenseRepository
                .findByUserIdAndExpenseDateBetweenOrderByExpenseDateDescIdDesc(user.getId(), start, end);

        BigDecimal periodIncomeSum = periodIncomes.stream()
                .map(Income::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal periodExpenseSum = periodExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> byCategory = new LinkedHashMap<>();
        for (Expense e : periodExpenses) {
            byCategory.merge(e.getCategory().getName(), e.getAmount(), BigDecimal::add);
        }

        List<MonthlyComparisonPoint> monthlyPoints = new ArrayList<>();
        YearMonth currentYm = YearMonth.from(today);
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = currentYm.minusMonths(i);
            BigDecimal mInc = incomeRepository.sumByUserIdAndDateBetween(user.getId(), ym.atDay(1), ym.atEndOfMonth());
            BigDecimal mExp = expenseRepository.sumByUserIdAndDateBetween(user.getId(), ym.atDay(1), ym.atEndOfMonth());
            monthlyPoints.add(new MonthlyComparisonPoint(ym.toString(), mInc, mExp));
        }

        Map<LocalDate, BigDecimal> dailyTotals = new TreeMap<>();
        for (Expense e : periodExpenses) {
            dailyTotals.merge(e.getExpenseDate(), e.getAmount(), BigDecimal::add);
        }
        List<DailyTrendPoint> trend = dailyTotals.entrySet().stream()
                .map(entry -> new DailyTrendPoint(entry.getKey().toString(), entry.getValue()))
                .toList();

        return new ReportsResponse(
                normalizedPeriod,
                periodIncomeSum,
                periodExpenseSum,
                periodIncomeSum.subtract(periodExpenseSum),
                byCategory,
                monthlyPoints,
                trend);
    }

    private double safePercentage(BigDecimal part, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        return part.multiply(BigDecimal.valueOf(100))
                .divide(total, 2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
