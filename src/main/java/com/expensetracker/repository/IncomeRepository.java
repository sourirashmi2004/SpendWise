package com.expensetracker.repository;

import com.expensetracker.entity.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IncomeRepository extends JpaRepository<Income, Long> {
    List<Income> findByUserIdOrderByIncomeDateDescIdDesc(Long userId);

    Optional<Income> findByIdAndUserId(Long id, Long userId);

    List<Income> findByUserIdAndIncomeDateBetweenOrderByIncomeDateDescIdDesc(Long userId, LocalDate start,
            LocalDate end);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Income i WHERE i.user.id = :userId")
    BigDecimal sumTotalByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Income i WHERE i.user.id = :userId AND i.incomeDate BETWEEN :start AND :end")
    BigDecimal sumByUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end);
}
