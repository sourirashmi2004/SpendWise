package com.expensetracker.repository;

import com.expensetracker.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    Optional<Budget> findByUserIdAndBudgetMonth(Long userId, String budgetMonth);

    List<Budget> findByUserIdOrderByBudgetMonthDesc(Long userId);
}
