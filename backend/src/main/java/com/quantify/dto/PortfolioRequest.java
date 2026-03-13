package com.quantify.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioRequest {
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
