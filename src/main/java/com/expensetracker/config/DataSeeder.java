package com.expensetracker.config;

import com.expensetracker.entity.*;
import com.expensetracker.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(CategoryRepository categoryRepository,
                      UserRepository userRepository,
                      IncomeRepository incomeRepository,
                      ExpenseRepository expenseRepository,
                      BudgetRepository budgetRepository,
                      PasswordEncoder passwordEncoder) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.budgetRepository = budgetRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedDefaultCategories();
        seedDemoUser();
    }

    private void seedDefaultCategories() {
        List<String> incomeNames = List.of("Salary", "Freelancing", "Scholarship", "Other Income");
        for (String name : incomeNames) {
            categoryRepository.findByNameIgnoreCaseAndTypeAndUserIsNull(name, CategoryType.INCOME)
                    .orElseGet(() -> categoryRepository.save(new Category(name, CategoryType.INCOME, null)));
        }

        List<String> expenseNames = List.of("Food", "Shopping", "Education", "Transport", "Entertainment", "Bills", "Others");
        for (String name : expenseNames) {
            categoryRepository.findByNameIgnoreCaseAndTypeAndUserIsNull(name, CategoryType.EXPENSE)
                    .orElseGet(() -> categoryRepository.save(new Category(name, CategoryType.EXPENSE, null)));
        }
    }

    private void seedDemoUser() {
        if (userRepository.existsByEmailIgnoreCase("demo@expensetracker.com")) {
            return;
        }

        User demo = userRepository.save(new User(
                "Aarav Sharma",
                "demo@expensetracker.com",
                passwordEncoder.encode("demo1234")
        ));

        Category salary = categoryRepository.findByNameIgnoreCaseAndTypeAndUserIsNull("Salary", CategoryType.INCOME).orElseThrow();
        Category freelance = categoryRepository.findByNameIgnoreCaseAndTypeAndUserIsNull("Freelancing", CategoryType.INCOME).orElseThrow();
        Category food = categoryRepository.findByNameIgnoreCaseAndTypeAndUserIsNull("Food", CategoryType.EXPENSE).orElseThrow();
        Category transport = categoryRepository.findByNameIgnoreCaseAndTypeAndUserIsNull("Transport", CategoryType.EXPENSE).orElseThrow();
        Category education = categoryRepository.findByNameIgnoreCaseAndTypeAndUserIsNull("Education", CategoryType.EXPENSE).orElseThrow();
        Category bills = categoryRepository.findByNameIgnoreCaseAndTypeAndUserIsNull("Bills", CategoryType.EXPENSE).orElseThrow();

        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(today);

        Income i1 = new Income();
        i1.setUser(demo);
        i1.setAmount(new BigDecimal("45000.00"));
        i1.setSource("Monthly Internship Stipend");
        i1.setDescription("Software Engineering Intern");
        i1.setIncomeDate(today.withDayOfMonth(1));
        i1.setCategory(salary);
        incomeRepository.save(i1);

        Income i2 = new Income();
        i2.setUser(demo);
        i2.setAmount(new BigDecimal("8500.00"));
        i2.setSource("Web Design Project");
        i2.setDescription("Landing page freelance work");
        i2.setIncomeDate(today.minusDays(5).isBefore(today.withDayOfMonth(1)) ? today : today.minusDays(5));
        i2.setCategory(freelance);
        incomeRepository.save(i2);

        Expense e1 = new Expense();
        e1.setUser(demo);
        e1.setAmount(new BigDecimal("3200.00"));
        e1.setTitle("Groceries & Meals");
        e1.setDescription("Weekly supermarket & lunch");
        e1.setExpenseDate(today.withDayOfMonth(Math.min(today.getDayOfMonth(), 3)));
        e1.setCategory(food);
        expenseRepository.save(e1);

        Expense e2 = new Expense();
        e2.setUser(demo);
        e2.setAmount(new BigDecimal("1800.00"));
        e2.setTitle("Metro & Cab Pass");
        e2.setDescription("Monthly commute");
        e2.setExpenseDate(today.withDayOfMonth(Math.min(today.getDayOfMonth(), 5)));
        e2.setCategory(transport);
        expenseRepository.save(e2);

        Expense e3 = new Expense();
        e3.setUser(demo);
        e3.setAmount(new BigDecimal("4500.00"));
        e3.setTitle("DSA Course & Books");
        e3.setDescription("Placement prep materials");
        e3.setExpenseDate(today);
        e3.setCategory(education);
        expenseRepository.save(e3);

        Expense e4 = new Expense();
        e4.setUser(demo);
        e4.setAmount(new BigDecimal("2100.00"));
        e4.setTitle("Internet & Mobile Bill");
        e4.setDescription("Monthly fiber & recharge");
        e4.setExpenseDate(today);
        e4.setCategory(bills);
        expenseRepository.save(e4);

        Budget budget = new Budget();
        budget.setUser(demo);
        budget.setBudgetMonth(currentMonth.toString());
        budget.setMonthlyLimit(new BigDecimal("20000.00"));
        budgetRepository.save(budget);
    }
}

