package com.quantify.controller;

import com.quantify.model.Portfolio;
import com.quantify.model.User;
import com.quantify.service.AuthService;
import com.quantify.service.PortfolioService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getPortfolio() {
        User user = authService.getCurrentUser();
        List<Portfolio> holdings = portfolioService.getUserPortfolio(user);

        List<Map<String, Object>> response = holdings.stream()
                .map(this::mapPortfolioToResponse)
                .toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addHolding(@Valid @RequestBody PortfolioRequest request) {
        User user = authService.getCurrentUser();
        Portfolio portfolio = portfolioService.addOrUpdateHolding(
                user,
                request.getSymbol(),
                request.getCompanyName(),
                request.getQuantity(),
                request.getAveragePrice());
        return ResponseEntity.ok(mapPortfolioToResponse(portfolio));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteHolding(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        portfolioService.deleteHolding(user, id);
        return ResponseEntity.ok(Map.of("message", "Holding deleted successfully"));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(portfolioService.getPortfolioSummary(user));
    }

    private Map<String, Object> mapPortfolioToResponse(Portfolio portfolio) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", portfolio.getId());
        map.put("symbol", portfolio.getSymbol());
        map.put("companyName", portfolio.getCompanyName());
        map.put("quantity", portfolio.getQuantity());
        map.put("averagePrice", portfolio.getAveragePrice());
        map.put("avgPrice", portfolio.getAveragePrice()); // alias for frontend compatibility
        map.put("currentPrice", portfolio.getCurrentPrice());
        map.put("investedValue", portfolio.getInvestedValue());
        map.put("currentValue", portfolio.getCurrentValue());
        map.put("profitLoss", portfolio.getProfitLoss());
        map.put("profitLossPercent", portfolio.getProfitLossPercent());
        map.put("updatedAt", portfolio.getUpdatedAt());
        return map;
    }

    @Data
    static class PortfolioRequest {
        @NotBlank(message = "Symbol is required")
        private String symbol;

        private String companyName;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        private Integer quantity;

        @NotNull(message = "Average price is required")
        @Positive(message = "Average price must be positive")
        private BigDecimal averagePrice;
    }
}
