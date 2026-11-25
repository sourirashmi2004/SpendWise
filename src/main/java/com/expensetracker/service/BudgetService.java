package com.expensetracker.service;

import com.expensetracker.dto.BudgetDtos.BudgetRequest;
import com.expensetracker.dto.BudgetDtos.BudgetStatusResponse;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.User;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final AuthService authService;

    public BudgetService(BudgetRepository budgetRepository, ExpenseRepository expenseRepository,
            AuthService authService) {
        this.budgetRepository = budgetRepository;
        this.expenseRepository = expenseRepository;
        this.authService = authService;
    }

    public BudgetStatusResponse saveOrUpdate(BudgetRequest request) {
        User user = authService.requireCurrentUser();
        Budget budget = budgetRepository.findByUserIdAndBudgetMonth(user.getId(), request.budgetMonth())
                .orElseGet(Budget::new);
        budget.setUser(user);
        budget.setBudgetMonth(request.budgetMonth());
        budget.setMonthlyLimit(request.monthlyLimit());
        Budget saved = budgetRepository.save(budget);
        return computeStatus(user.getId(), saved);
    }

    public BudgetStatusResponse getForMonth(String month) {
        User user = authService.requireCurrentUser();
        String targetMonth = (month == null || month.isBlank()) ? YearMonth.now().toString() : month;
        return budgetRepository.findByUserIdAndBudgetMonth(user.getId(), targetMonth)
                .map(b -> computeStatus(user.getId(), b))
                .orElseGet(() -> {
                    YearMonth ym = YearMonth.parse(targetMonth);
                    BigDecimal spent = expenseRepository.sumByUserIdAndDateBetween(
                            user.getId(), ym.atDay(1), ym.atEndOfMonth());
                    return new BudgetStatusResponse(
                            null, targetMonth, BigDecimal.ZERO, spent, BigDecimal.ZERO.subtract(spent), 0.0, "NONE");
                });
    }

    public List<BudgetStatusResponse> listAll() {
        User user = authService.requireCurrentUser();
        return budgetRepository.findByUserIdOrderByBudgetMonthDesc(user.getId())
                .stream()
                .map(b -> computeStatus(user.getId(), b))
                .toList();
    }

    public BudgetStatusResponse computeStatus(Long userId, Budget budget) {
        YearMonth ym = YearMonth.parse(budget.getBudgetMonth());
        BigDecimal spent = expenseRepository.sumByUserIdAndDateBetween(
                userId, ym.atDay(1), ym.atEndOfMonth());
        BigDecimal limit = budget.getMonthlyLimit();
        BigDecimal remaining = limit.subtract(spent);

        double usagePct = 0.0;
        if (limit.compareTo(BigDecimal.ZERO) > 0) {
            usagePct = spent.multiply(BigDecimal.valueOf(100))
                    .divide(limit, 2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        String alertLevel = "NONE";
        if (limit.compareTo(BigDecimal.ZERO) > 0) {
            if (usagePct >= 100.0) {
                alertLevel = "EXCEEDED_100";
            } else if (usagePct >= 80.0) {
                alertLevel = "WARNING_80";
            }
        }

        return new BudgetStatusResponse(
                budget.getId(),
                budget.getBudgetMonth(),
                limit,
                spent,
                remaining,
                usagePct,
                alertLevel);
    }
}
