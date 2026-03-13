package com.quantify.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymbolTradeCount {
    private String symbol;
    private Long count;
}
