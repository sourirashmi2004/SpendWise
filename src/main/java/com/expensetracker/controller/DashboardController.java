package com.expensetracker.controller;

import com.expensetracker.dto.DashboardDtos.ReportsResponse;
import com.expensetracker.dto.DashboardDtos.SummaryResponse;
import com.expensetracker.dto.TransactionDtos.UnifiedTransactionItem;
import com.expensetracker.service.DashboardService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard/summary")
    public SummaryResponse getSummary() {
        return dashboardService.getSummary();
    }

    @GetMapping("/transactions")
    public List<UnifiedTransactionItem> getTransactions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return dashboardService.getTransactions(type, category, search, fromDate, toDate);
    }

    @GetMapping("/transactions/export")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<UnifiedTransactionItem> rows = dashboardService.getTransactions(type, category, search, fromDate, toDate);
        StringBuilder csv = new StringBuilder("Date,Type,Category,Title,Description,Amount\n");
        for (UnifiedTransactionItem row : rows) {
            csv.append(row.date()).append(',')
                    .append(row.type()).append(',')
                    .append(escapeCsv(row.categoryName())).append(',')
                    .append(escapeCsv(row.title())).append(',')
                    .append(escapeCsv(row.description())).append(',')
                    .append(row.amount()).append('\n');
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=expense-tracker-report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    @GetMapping("/reports")
    public ReportsResponse getReports(
            @RequestParam(required = false, defaultValue = "MONTHLY") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return dashboardService.getReports(period, fromDate, toDate);
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
