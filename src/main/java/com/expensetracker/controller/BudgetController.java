package com.expensetracker.controller;

import com.expensetracker.dto.BudgetDtos.BudgetRequest;
import com.expensetracker.dto.BudgetDtos.BudgetStatusResponse;
import com.expensetracker.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @PostMapping
    public BudgetStatusResponse saveOrUpdate(@Valid @RequestBody BudgetRequest request) {
        return budgetService.saveOrUpdate(request);
    }

    @GetMapping("/current")
    public BudgetStatusResponse getForMonth(@RequestParam(required = false) String month) {
        return budgetService.getForMonth(month);
    }

    @GetMapping
    public List<BudgetStatusResponse> listAll() {
        return budgetService.listAll();
    }
}
