package com.expensetracker.service;

import com.expensetracker.dto.TransactionDtos.IncomeRequest;
import com.expensetracker.dto.TransactionDtos.IncomeResponse;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.CategoryType;
import com.expensetracker.entity.Income;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.IncomeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final CategoryService categoryService;
    private final AuthService authService;

    public IncomeService(IncomeRepository incomeRepository, CategoryService categoryService, AuthService authService) {
        this.incomeRepository = incomeRepository;
        this.categoryService = categoryService;
        this.authService = authService;
    }

    public List<IncomeResponse> listAll() {
        User user = authService.requireCurrentUser();
        return incomeRepository.findByUserIdOrderByIncomeDateDescIdDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public IncomeResponse create(IncomeRequest request) {
        User user = authService.requireCurrentUser();
        Category category = categoryService.resolveOwnedOrGlobalCategory(
                request.categoryId(), user.getId(), CategoryType.INCOME);

        Income income = new Income();
        applyFields(income, request, category, user);
        return toResponse(incomeRepository.save(income));
    }

    public IncomeResponse update(Long id, IncomeRequest request) {
        User user = authService.requireCurrentUser();
        Income income = incomeRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Income record not found"));
        Category category = categoryService.resolveOwnedOrGlobalCategory(
                request.categoryId(), user.getId(), CategoryType.INCOME);

        applyFields(income, request, category, user);
        return toResponse(incomeRepository.save(income));
    }

    public void delete(Long id) {
        User user = authService.requireCurrentUser();
        Income income = incomeRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Income record not found"));
        incomeRepository.delete(income);
    }

    private void applyFields(Income income, IncomeRequest request, Category category, User user) {
        income.setAmount(request.amount());
        income.setSource(request.source().trim());
        income.setDescription(request.description() == null ? "" : request.description().trim());
        income.setIncomeDate(request.incomeDate());
        income.setCategory(category);
        income.setUser(user);
    }

    private IncomeResponse toResponse(Income i) {
        return new IncomeResponse(
                i.getId(),
                i.getAmount(),
                i.getSource(),
                i.getDescription(),
                i.getIncomeDate(),
                i.getCategory().getId(),
                i.getCategory().getName()
        );
    }
}

