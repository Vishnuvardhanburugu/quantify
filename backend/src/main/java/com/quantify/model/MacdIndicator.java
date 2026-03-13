package com.quantify.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "macd_indicators",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"symbol", "date"})
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MacdIndicator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "close_price", precision = 14, scale = 4)
    private BigDecimal closePrice;

    @Column(name = "ema12", precision = 14, scale = 6)
    private BigDecimal ema12;

    @Column(name = "ema26", precision = 14, scale = 6)
    private BigDecimal ema26;

    @Column(name = "macd_line", precision = 14, scale = 6)
    private BigDecimal macdLine;

    @Column(name = "signal_line", precision = 14, scale = 6)
    private BigDecimal signalLine;

    @Column(name = "histogram", precision = 14, scale = 6)
    private BigDecimal histogram;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Signal signal;

    /**
     * Signal strength between 0-100
     */
    @Column(name = "strength", precision = 5, scale = 2)
    private BigDecimal strength;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public enum Signal {
        BUY,
        SELL,
        HOLD,
        STRONG_BUY,
        STRONG_SELL
    }
}

