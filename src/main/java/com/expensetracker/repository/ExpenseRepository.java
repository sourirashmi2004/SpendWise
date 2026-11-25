package com.expensetracker.repository;

import com.expensetracker.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserIdOrderByExpenseDateDescIdDesc(Long userId);

    Optional<Expense> findByIdAndUserId(Long id, Long userId);

    List<Expense> findByUserIdAndExpenseDateBetweenOrderByExpenseDateDescIdDesc(Long userId, LocalDate start,
            LocalDate end);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.user.id = :userId")
    BigDecimal sumTotalByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.user.id = :userId AND e.expenseDate BETWEEN :start AND :end")
    BigDecimal sumByUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end);
}
