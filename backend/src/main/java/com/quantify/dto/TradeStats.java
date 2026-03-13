package com.quantify.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeStats {
    private Long totalTrades;
    private Long winningTrades;
    private Double winRate;
    private BigDecimal totalProfitLoss;
    private List<SymbolTradeCount> topSymbols;
}
