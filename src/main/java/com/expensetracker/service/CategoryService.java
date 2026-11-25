package com.expensetracker.service;

import com.expensetracker.dto.TransactionDtos.CategoryRequest;
import com.expensetracker.dto.TransactionDtos.CategoryResponse;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.CategoryType;
import com.expensetracker.entity.User;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final AuthService authService;

    public CategoryService(CategoryRepository categoryRepository, AuthService authService) {
        this.categoryRepository = categoryRepository;
        this.authService = authService;
    }

    public List<CategoryResponse> listCategories(String type) {
        User user = authService.requireCurrentUser();
        List<Category> categories = (type == null || type.isBlank())
                ? categoryRepository.findAllAvailableForUser(user.getId())
                : categoryRepository.findAvailableByUserAndType(user.getId(), parseType(type));

        return categories.stream()
                .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getType().name(), c.getUser() != null))
                .toList();
    }

    public CategoryResponse createCategory(CategoryRequest request) {
        User user = authService.requireCurrentUser();
        CategoryType categoryType = parseType(request.type());
        String trimmedName = request.name().trim();

        boolean duplicate = categoryRepository.findAvailableByUserAndType(user.getId(), categoryType)
                .stream()
                .anyMatch(c -> c.getName().equalsIgnoreCase(trimmedName));
        if (duplicate) {
            throw new BadRequestException("Category '" + trimmedName + "' already exists for " + categoryType);
        }

        Category saved = categoryRepository.save(new Category(trimmedName, categoryType, user));
        return new CategoryResponse(saved.getId(), saved.getName(), saved.getType().name(), true);
    }

    public Category resolveOwnedOrGlobalCategory(Long categoryId, Long userId, CategoryType expectedType) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (category.getUser() != null && !category.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Category not found");
        }
        if (category.getType() != expectedType) {
            throw new BadRequestException("Selected category must be of type " + expectedType);
        }
        return category;
    }

    private CategoryType parseType(String value) {
        try {
            return CategoryType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Category type must be INCOME or EXPENSE");
        }
    }
}

