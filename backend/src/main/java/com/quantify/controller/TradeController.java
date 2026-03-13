package com.quantify.controller;

import com.quantify.model.Trade;
import com.quantify.model.User;
import com.quantify.service.AuthService;
import com.quantify.service.TradeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/trades")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getTrades(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User user = authService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<Trade> trades = tradeService.getUserTrades(user, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("trades", trades.getContent().stream().map(this::mapTradeToResponse).toList());
        response.put("currentPage", trades.getNumber());
        response.put("totalPages", trades.getTotalPages());
        response.put("totalElements", trades.getTotalElements());

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> logTrade(@Valid @RequestBody TradeRequest request) {
        User user = authService.getCurrentUser();
        Trade trade = tradeService.logTrade(
                user,
                request.getSymbol(),
                request.getCompanyName(),
                request.getType(),
                request.getQuantity(),
                request.getPrice(),
                request.getProfitLoss(),
                request.getSentiment(),
                request.getNotes()
        );
        return ResponseEntity.ok(mapTradeToResponse(trade));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(tradeService.getTradeStats(user));
    }

    @GetMapping("/symbol/{symbol}")
    public ResponseEntity<?> getTradesBySymbol(@PathVariable String symbol) {
        User user = authService.getCurrentUser();
        var trades = tradeService.getTradesBySymbol(user, symbol);
        return ResponseEntity.ok(trades.stream().map(this::mapTradeToResponse).toList());
    }

    private Map<String, Object> mapTradeToResponse(Trade trade) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", trade.getId());
        map.put("symbol", trade.getSymbol());
        map.put("companyName", trade.getCompanyName());
        map.put("type", trade.getType());
        map.put("quantity", trade.getQuantity());
        map.put("price", trade.getPrice());
        map.put("totalValue", trade.getTotalValue());
        map.put("profitLoss", trade.getProfitLoss());
        map.put("sentiment", trade.getSentiment());
        map.put("notes", trade.getNotes());
        map.put("executedAt", trade.getExecutedAt());
        return map;
    }

    @Data
    static class TradeRequest {
        @NotBlank(message = "Symbol is required")
        private String symbol;

        private String companyName;

        @NotNull(message = "Trade type is required")
        private Trade.TradeType type;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        private Integer quantity;

        @NotNull(message = "Price is required")
        @Positive(message = "Price must be positive")
        private BigDecimal price;

        private BigDecimal profitLoss;
        private Trade.Sentiment sentiment;
        private String notes;
    }
}
