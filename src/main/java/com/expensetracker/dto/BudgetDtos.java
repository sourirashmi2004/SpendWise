package com.expensetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public class BudgetDtos {

        public record BudgetRequest(
                        @NotBlank(message = "Month is required (YYYY-MM)") @Pattern(regexp = "\\d{4}-\\d{2}", message = "Month must follow YYYY-MM format") String budgetMonth,

                        @NotNull(message = "Monthly limit is required") @DecimalMin(value = "1.00", message = "Monthly limit must be at least 1.00") BigDecimal monthlyLimit) {
        }

        public record BudgetStatusResponse(
                        Long id,
                        String budgetMonth,
                        BigDecimal monthlyLimit,
                        BigDecimal spentThisMonth,
                        BigDecimal remainingBudget,
                        double usagePercentage,
                        String alertLevel) {
        }
}
