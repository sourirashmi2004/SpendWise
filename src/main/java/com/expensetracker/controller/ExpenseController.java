package com.expensetracker.controller;

import com.expensetracker.dto.TransactionDtos.ExpenseRequest;
import com.expensetracker.dto.TransactionDtos.ExpenseResponse;
import com.expensetracker.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public List<ExpenseResponse> listAll() {
        return expenseService.listAll();
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(@Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.create(request));
    }

    @PutMapping("/{id}")
    public ExpenseResponse update(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        return expenseService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        expenseService.delete(id);
    }
}
