package com.quantify.dto;

import com.quantify.model.MacdIndicator;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MacdPointResponse {
    private LocalDate date;
    private BigDecimal closePrice;
    private BigDecimal emaShort;
    private BigDecimal emaLong;
    private BigDecimal macdLine;
    private BigDecimal signalLine;
    private BigDecimal histogram;
    private MacdIndicator.Signal signal;
    private BigDecimal strength;
}

