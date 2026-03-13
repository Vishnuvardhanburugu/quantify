package com.quantify.dto;

import com.quantify.model.Trade;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeRequest {
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
