package com.quantify.dto;

import com.quantify.model.User;
import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradingBehavior {
    private User.RiskProfile riskProfile;
    private Double winRate;
    private String pnlTrend;
    private List<String> topSymbols;
    private String tradingPattern;
}
