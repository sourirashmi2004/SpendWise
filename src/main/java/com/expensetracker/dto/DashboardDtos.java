package com.expensetracker.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardDtos {

        public record SummaryResponse(
                        BigDecimal totalIncome,
                        BigDecimal totalExpenses,
                        BigDecimal totalSavings,
                        double expensePercentage,
                        double savingsPercentage,
                        String currentMonth,
                        BigDecimal monthlyIncome,
                        BigDecimal monthlyExpenses,
                        BigDecimal monthlyBudget,
                        BigDecimal remainingBudget,
                        double budgetUsagePercentage,
                        String budgetAlertLevel,
                        List<TransactionDtos.UnifiedTransactionItem> recentTransactions) {
        }

        public record MonthlyComparisonPoint(
                        String month,
                        BigDecimal income,
                        BigDecimal expenses) {
        }

        public record DailyTrendPoint(
                        String date,
                        BigDecimal amount) {
        }

        public record ReportsResponse(
                        String period,
                        BigDecimal periodIncome,
                        BigDecimal periodExpenses,
                        BigDecimal periodSavings,
                        Map<String, BigDecimal> expensesByCategory,
                        List<MonthlyComparisonPoint> monthlyComparison,
                        List<DailyTrendPoint> spendingTrend) {
        }
}
