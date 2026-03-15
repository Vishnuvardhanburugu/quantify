package com.quantify.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketDataResponse {
    private String symbol;
    private String companyName;
    private BigDecimal currentPrice;
    private BigDecimal previousClose;
    private BigDecimal change;
    private BigDecimal changePercent;
    private BigDecimal dayHigh;
    private BigDecimal dayLow;
    private BigDecimal fiftyTwoWeekHigh;
    private BigDecimal fiftyTwoWeekLow;
    private Long volume;
    private Long avgVolume;
    private BigDecimal marketCap;
    private BigDecimal pe;
    private BigDecimal eps;
    private String exchange;
    private boolean positive;
    private LocalDateTime lastUpdated;
}
