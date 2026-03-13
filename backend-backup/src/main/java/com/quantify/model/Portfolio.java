package com.quantify.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "portfolios", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "symbol"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Portfolio {

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

    @Positive
    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "average_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal averagePrice;

    @Column(name = "current_price", precision = 12, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "invested_value", precision = 14, scale = 2)
    private BigDecimal investedValue;

    @Column(name = "current_value", precision = 14, scale = 2)
    private BigDecimal currentValue;

    @Column(name = "profit_loss", precision = 14, scale = 2)
    private BigDecimal profitLoss;

    @Column(name = "profit_loss_percent", precision = 8, scale = 2)
    private BigDecimal profitLossPercent;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void calculateValues() {
        if (quantity != null && averagePrice != null) {
            this.investedValue = averagePrice.multiply(BigDecimal.valueOf(quantity));
        }
        if (quantity != null && currentPrice != null) {
            this.currentValue = currentPrice.multiply(BigDecimal.valueOf(quantity));
            if (investedValue != null && investedValue.compareTo(BigDecimal.ZERO) > 0) {
                this.profitLoss = currentValue.subtract(investedValue);
                this.profitLossPercent = profitLoss.divide(investedValue, 4, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            }
        }
    }
}
