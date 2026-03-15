package com.quantify.dto;

import com.quantify.model.Trade;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeResponse {
    private Long id;
    private String symbol;
    private String companyName;
    private Trade.TradeType type;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal totalValue;
    private BigDecimal profitLoss;
    private Trade.Sentiment sentiment;
    private String notes;
    private LocalDateTime executedAt;
}
