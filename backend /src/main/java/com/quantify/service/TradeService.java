package com.quantify.service;

import com.quantify.model.Trade;
import com.quantify.model.User;
import com.quantify.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
@Slf4j
public class TradeService {

    private final TradeRepository tradeRepository;
    private final PortfolioService portfolioService;

    public Page<Trade> getUserTrades(User user, Pageable pageable) {
        return tradeRepository.findByUserOrderByExecutedAtDesc(user, pageable);
    }

    public List<Trade> getRecentTrades(User user, int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return tradeRepository.findRecentTrades(user, startDate);
    }

    @Transactional
    public Trade logTrade(User user, String symbol, String companyName, Trade.TradeType type,
                          Integer quantity, BigDecimal price, BigDecimal profitLoss,
                          Trade.Sentiment sentiment, String notes) {
        final String normalizedSymbol = symbol == null ? null : symbol.toUpperCase();

        // Validate SELLs against portfolio and auto-compute realized P&L when possible
        BigDecimal finalProfitLoss = profitLoss;
        if (type == Trade.TradeType.SELL) {
            var holding = portfolioService.getHoldingOrThrow(user, normalizedSymbol);
            if (holding.getQuantity() == null || holding.getQuantity() < quantity) {
                throw new ResponseStatusException(BAD_REQUEST, "Not enough quantity in portfolio to sell");
            }
            if (finalProfitLoss == null && holding.getAveragePrice() != null) {
                finalProfitLoss = price.subtract(holding.getAveragePrice())
                        .multiply(BigDecimal.valueOf(quantity));
            }
        }

        Trade trade = Trade.builder()
                .user(user)
                .symbol(normalizedSymbol)
                .companyName(companyName)
                .type(type)
                .quantity(quantity)
                .price(price)
                .profitLoss(finalProfitLoss)
                .sentiment(sentiment)
                .notes(notes)
                .build();

        // Update portfolio in the same transaction so trade + portfolio stay consistent
        portfolioService.applyTrade(user, normalizedSymbol, companyName, type, quantity, price);

        return tradeRepository.save(trade);
    }

    public Map<String, Object> getTradeStats(User user) {
        Long totalTrades = tradeRepository.getTotalTradesCount(user);
        Long winningTrades = tradeRepository.getWinningTradesCount(user);
        BigDecimal totalProfitLoss = tradeRepository.getTotalProfitLoss(user);

        Double winRate = 0.0;
        if (totalTrades != null && totalTrades > 0 && winningTrades != null) {
            winRate = (winningTrades.doubleValue() / totalTrades.doubleValue()) * 100;
        }

        List<Object[]> topSymbolsData = tradeRepository.getTopTradedSymbols(user, PageRequest.of(0, 5));
        List<Map<String, Object>> topSymbols = new ArrayList<>();
        for (Object[] row : topSymbolsData) {
            Map<String, Object> symbolCount = new HashMap<>();
            symbolCount.put("symbol", row[0]);
            symbolCount.put("count", row[1]);
            topSymbols.add(symbolCount);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTrades", totalTrades != null ? totalTrades : 0L);
        stats.put("winningTrades", winningTrades != null ? winningTrades : 0L);
        stats.put("winRate", Math.round(winRate * 100.0) / 100.0);
        stats.put("totalProfitLoss", totalProfitLoss != null ? totalProfitLoss : BigDecimal.ZERO);
        stats.put("topSymbols", topSymbols);

        return stats;
    }

    public List<Trade> getTradesBySymbol(User user, String symbol) {
        return tradeRepository.findByUserAndSymbolOrderByExecutedAtDesc(user, symbol);
    }
}
