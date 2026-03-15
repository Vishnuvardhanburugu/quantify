package com.quantify.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "trades")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Column(nullable = false)
    private String symbol;

    @Column(name = "company_name")
    private String companyName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TradeType type;

    @Positive
    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "total_value", precision = 14, scale = 2)
    private BigDecimal totalValue;

    @Column(name = "profit_loss", precision = 14, scale = 2)
    private BigDecimal profitLoss;

    @Enumerated(EnumType.STRING)
    private Sentiment sentiment;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "executed_at", updatable = false)
    private LocalDateTime executedAt;

    public enum TradeType {
        BUY, SELL
    }

    public enum Sentiment {
        BULLISH,
        BEARISH,
        NEUTRAL
    }

    @PrePersist
    public void calculateTotalValue() {
        if (quantity != null && price != null) {
            this.totalValue = price.multiply(BigDecimal.valueOf(quantity));
        }
    }
}
