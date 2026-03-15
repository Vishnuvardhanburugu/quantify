package com.quantify.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsightsResponse {
    private String summary;
    private List<String> highlights;
    private List<String> recommendations;
    private TradingBehavior behavior;
    private LocalDateTime generatedAt;
}
