package com.quantify.dto;

import com.quantify.model.MacdIndicator;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MacdAnalysisResponse {

    private String symbol;
    private CurrentSnapshot current;
    private TrendSnapshot trend;
    private String overallRecommendation;
    private BigDecimal confidence;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CurrentSnapshot {
        private BigDecimal macdLine;
        private BigDecimal signalLine;
        private BigDecimal histogram;
        private MacdIndicator.Signal signal;
        private BigDecimal strength;
        private String recommendation;
        private BigDecimal entryPrice;
        private BigDecimal stopLoss;
        private BigDecimal takeProfit;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrendSnapshot {
        private String direction; // BULLISH, BEARISH, NEUTRAL
        private String strength;  // WEAK, MODERATE, STRONG
        private boolean divergence;
    }
}

