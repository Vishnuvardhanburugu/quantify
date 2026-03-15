package com.quantify.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioResponse {
    private Long id;
    private String symbol;
    private String companyName;
    private Integer quantity;
    private BigDecimal averagePrice;
    private BigDecimal currentPrice;
    private BigDecimal investedValue;
    private BigDecimal currentValue;
    private BigDecimal profitLoss;
    private BigDecimal profitLossPercent;
    private LocalDateTime updatedAt;
}
