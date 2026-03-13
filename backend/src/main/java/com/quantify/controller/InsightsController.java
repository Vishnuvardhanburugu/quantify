package com.quantify.controller;

import com.quantify.model.User;
import com.quantify.service.AIContextBuilder;
import com.quantify.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightsController {

    private final AIContextBuilder contextBuilder;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getInsights() {
        User user = authService.getCurrentUser();
        String summary = contextBuilder.buildInsightsSummary(user);

        Map<String, Object> response = new HashMap<>();
        response.put("summary", summary);
        response.put("highlights", Arrays.asList(
                "Portfolio showing positive momentum",
                "IT sector holdings performing well",
                "Consider diversifying into pharma sector"
        ));
        response.put("recommendations", Arrays.asList(
                "Review your banking sector allocation",
                "Consider taking profits on high-performing stocks",
                "Set stop-loss orders for volatile positions"
        ));
        
        Map<String, Object> behavior = new HashMap<>();
        behavior.put("riskProfile", user.getRiskProfile());
        behavior.put("winRate", 65.0);
        behavior.put("pnlTrend", "Positive");
        behavior.put("topSymbols", Arrays.asList("RELIANCE.NS", "TCS.NS", "INFY.NS"));
        behavior.put("tradingPattern", "Moderate frequency, long-term focus");
        response.put("behavior", behavior);
        
        response.put("generatedAt", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("aiService", "connected");
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }
}
