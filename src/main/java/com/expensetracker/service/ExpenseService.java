package com.expensetracker.service;

import com.expensetracker.dto.TransactionDtos.ExpenseRequest;
import com.expensetracker.dto.TransactionDtos.ExpenseResponse;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.CategoryType;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryService categoryService;
    private final AuthService authService;

    public ExpenseService(ExpenseRepository expenseRepository, CategoryService categoryService,
            AuthService authService) {
        this.expenseRepository = expenseRepository;
        this.categoryService = categoryService;
        this.authService = authService;
    }

    public List<ExpenseResponse> listAll() {
        User user = authService.requireCurrentUser();
        return expenseRepository.findByUserIdOrderByExpenseDateDescIdDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ExpenseResponse create(ExpenseRequest request) {
        User user = authService.requireCurrentUser();
        Category category = categoryService.resolveOwnedOrGlobalCategory(
                request.categoryId(), user.getId(), CategoryType.EXPENSE);

        Expense expense = new Expense();
        applyFields(expense, request, category, user);
        return toResponse(expenseRepository.save(expense));
    }

    public ExpenseResponse update(Long id, ExpenseRequest request) {
        User user = authService.requireCurrentUser();
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense record not found"));
        Category category = categoryService.resolveOwnedOrGlobalCategory(
                request.categoryId(), user.getId(), CategoryType.EXPENSE);

        applyFields(expense, request, category, user);
        return toResponse(expenseRepository.save(expense));
    }

    public void delete(Long id) {
        User user = authService.requireCurrentUser();
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense record not found"));
        expenseRepository.delete(expense);
    }

    private void applyFields(Expense expense, ExpenseRequest request, Category category, User user) {
        expense.setAmount(request.amount());
        expense.setTitle(request.title().trim());
        expense.setDescription(request.description() == null ? "" : request.description().trim());
        expense.setExpenseDate(request.expenseDate());
        expense.setCategory(category);
        expense.setUser(user);
    }

    private ExpenseResponse toResponse(Expense e) {
        return new ExpenseResponse(
                e.getId(),
                e.getAmount(),
                e.getTitle(),
                e.getDescription(),
                e.getExpenseDate(),
                e.getCategory().getId(),
                e.getCategory().getName());
    }
}
