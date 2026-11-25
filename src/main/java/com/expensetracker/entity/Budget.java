package com.expensetracker.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "budgets", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "budget_month" }))
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "budget_month", nullable = false, length = 7)
    private String budgetMonth;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyLimit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Long getId() {
        return id;
    }

    public String getBudgetMonth() {
        return budgetMonth;
    }

    public void setBudgetMonth(String budgetMonth) {
        this.budgetMonth = budgetMonth;
    }

    public BigDecimal getMonthlyLimit() {
        return monthlyLimit;
    }

    public void setMonthlyLimit(BigDecimal monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
