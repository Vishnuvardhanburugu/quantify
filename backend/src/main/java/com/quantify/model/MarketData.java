package com.quantify.model;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketData implements Serializable {

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
    private LocalDateTime lastUpdated;

    public boolean isPositive() {
        return change != null && change.compareTo(BigDecimal.ZERO) > 0;
    }
}
