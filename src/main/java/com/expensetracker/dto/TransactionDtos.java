package com.expensetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class TransactionDtos {

        public record IncomeRequest(
                        @NotNull(message = "Amount is required") @DecimalMin(value = "0.01", message = "Amount must be greater than zero") BigDecimal amount,

                        @NotBlank(message = "Source is required") @Size(max = 120, message = "Source cannot exceed 120 characters") String source,

                        @Size(max = 255, message = "Description cannot exceed 255 characters") String description,

                        @NotNull(message = "Date is required") LocalDate incomeDate,

                        @NotNull(message = "Category is required") Long categoryId) {
        }

        public record IncomeResponse(
                        Long id,
                        BigDecimal amount,
                        String source,
                        String description,
                        LocalDate incomeDate,
                        Long categoryId,
                        String categoryName) {
        }

        public record ExpenseRequest(
                        @NotNull(message = "Amount is required") @DecimalMin(value = "0.01", message = "Amount must be greater than zero") BigDecimal amount,

                        @NotBlank(message = "Title is required") @Size(max = 120, message = "Title cannot exceed 120 characters") String title,

                        @Size(max = 255, message = "Description cannot exceed 255 characters") String description,

                        @NotNull(message = "Date is required") LocalDate expenseDate,

                        @NotNull(message = "Category is required") Long categoryId) {
        }

        public record ExpenseResponse(
                        Long id,
                        BigDecimal amount,
                        String title,
                        String description,
                        LocalDate expenseDate,
                        Long categoryId,
                        String categoryName) {
        }

        public record CategoryRequest(
                        @NotBlank(message = "Category name is required") @Size(max = 80) String name,

                        @NotBlank(message = "Category type is required (INCOME or EXPENSE)") String type) {
        }

        public record CategoryResponse(
                        Long id,
                        String name,
                        String type,
                        boolean custom) {
        }

        public record UnifiedTransactionItem(
                        Long id,
                        String type,
                        String title,
                        String description,
                        BigDecimal amount,
                        LocalDate date,
                        String categoryName) {
        }
}
