package com.expensetracker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.YearMonth;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ExpenseTrackerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void fullUserJourney_registerIncomeExpenseBudgetSummary() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isUnauthorized());

        String registerJson = """
                {
                  "fullName": "Priya Patel",
                  "email": "priya.test@example.com",
                  "password": "password123"
                }
                """;
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.email").value("priya.test@example.com"))
                .andReturn();

        MockHttpSession session = (MockHttpSession) regResult.getRequest().getSession(false);

        mockMvc.perform(get("/api/dashboard/summary").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncome").value(0))
                .andExpect(jsonPath("$.expensePercentage").value(0.0))
                .andExpect(jsonPath("$.savingsPercentage").value(0.0));

        String incCats = mockMvc.perform(get("/api/categories?type=INCOME").session(session))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long salaryCatId = objectMapper.readTree(incCats).get(0).get("id").asLong();

        String expCats = mockMvc.perform(get("/api/categories?type=EXPENSE").session(session))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long foodCatId = objectMapper.readTree(expCats).get(0).get("id").asLong();

        String today = LocalDate.now().toString();
        String currentMonth = YearMonth.now().toString();

        String incomeJson = """
                {
                  "amount": 10000.00,
                  "source": "Internship",
                  "description": "Monthly stipend",
                  "incomeDate": "%s",
                  "categoryId": %d
                }
                """.formatted(today, salaryCatId);
        mockMvc.perform(post("/api/incomes").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(incomeJson))
                .andExpect(status().isCreated());

        String budgetJson = """
                {
                  "budgetMonth": "%s",
                  "monthlyLimit": 5000.00
                }
                """.formatted(currentMonth);
        mockMvc.perform(post("/api/budgets").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(budgetJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alertLevel").value("NONE"));

        String expenseJson = """
                {
                  "amount": 4200.00,
                  "title": "Mess & Groceries",
                  "description": "Monthly food",
                  "expenseDate": "%s",
                  "categoryId": %d
                }
                """.formatted(today, foodCatId);
        MvcResult expResult = mockMvc.perform(post("/api/expenses").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(expenseJson))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode expNode = objectMapper.readTree(expResult.getResponse().getContentAsString());
        long expenseId = expNode.get("id").asLong();

        mockMvc.perform(get("/api/dashboard/summary").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncome").value(10000.0))
                .andExpect(jsonPath("$.totalExpenses").value(4200.0))
                .andExpect(jsonPath("$.totalSavings").value(5800.0))
                .andExpect(jsonPath("$.expensePercentage").value(42.0))
                .andExpect(jsonPath("$.savingsPercentage").value(58.0))
                .andExpect(jsonPath("$.remainingBudget").value(800.0))
                .andExpect(jsonPath("$.budgetAlertLevel").value("WARNING_80"));

        mockMvc.perform(get("/api/reports?period=MONTHLY").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.periodIncome").value(10000.0))
                .andExpect(jsonPath("$.periodExpenses").value(4200.0))
                .andExpect(jsonPath("$.monthlyComparison", hasSize(6)));

        mockMvc.perform(get("/api/transactions/export").session(session))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Mess & Groceries")));

        mockMvc.perform(delete("/api/expenses/" + expenseId).session(session))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/dashboard/summary").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalExpenses").value(0.0))
                .andExpect(jsonPath("$.totalSavings").value(10000.0));
    }
}

