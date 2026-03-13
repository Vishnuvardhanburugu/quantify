package com.quantify.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioSummary {
    private BigDecimal totalInvested;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalProfitLoss;
    private BigDecimal totalProfitLossPercent;
    private Long holdingsCount;
    private String topGainer;
    private String topLoser;
}
