package com.quantify.service;

import com.quantify.model.*;
import com.quantify.repository.PortfolioRepository;
import com.quantify.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class AIContextBuilder {

    private final PortfolioRepository portfolioRepository;
    private final TradeRepository tradeRepository;

    public String buildContext(User user) {
        StringBuilder context = new StringBuilder();

        // User profile
        context.append("## User Profile\n");
        context.append("- Name: ").append(user.getName()).append("\n");
        context.append("- Risk Appetite: ").append(user.getRiskProfile()).append("\n\n");

        // Portfolio holdings
        List<Portfolio> holdings = portfolioRepository.findByUserOrderBySymbolAsc(user);
        context.append("## Current Holdings (").append(holdings.size()).append(" stocks)\n");
        
        BigDecimal totalInvested = BigDecimal.ZERO;
        BigDecimal totalCurrent = BigDecimal.ZERO;
        
        for (Portfolio holding : holdings) {
            context.append("- ").append(holding.getSymbol());
            if (holding.getCompanyName() != null) {
                context.append(" (").append(holding.getCompanyName()).append(")");
            }
            context.append(": ").append(holding.getQuantity()).append(" shares @ ₹");
            context.append(holding.getAveragePrice());
            
            if (holding.getProfitLossPercent() != null) {
                context.append(" [").append(holding.getProfitLossPercent().setScale(2, RoundingMode.HALF_UP));
                context.append("%]");
            }
            context.append("\n");
            
            if (holding.getInvestedValue() != null) {
                totalInvested = totalInvested.add(holding.getInvestedValue());
            }
            if (holding.getCurrentValue() != null) {
                totalCurrent = totalCurrent.add(holding.getCurrentValue());
            }
        }
        
        context.append("\n## Portfolio Summary\n");
        context.append("- Total Invested: ₹").append(totalInvested.setScale(2, RoundingMode.HALF_UP)).append("\n");
        context.append("- Current Value: ₹").append(totalCurrent.setScale(2, RoundingMode.HALF_UP)).append("\n");
        BigDecimal pnl = totalCurrent.subtract(totalInvested);
        context.append("- P&L: ₹").append(pnl.setScale(2, RoundingMode.HALF_UP)).append("\n\n");

        // Trading behavior analysis
        context.append("## Trading Behavior (Last 90 Days)\n");
        LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
        List<Trade> recentTrades = tradeRepository.findByUserAndExecutedAtAfterOrderByExecutedAtDesc(user, ninetyDaysAgo);
        
        long buyCount = recentTrades.stream().filter(t -> t.getType() == Trade.TradeType.BUY).count();
        long sellCount = recentTrades.stream().filter(t -> t.getType() == Trade.TradeType.SELL).count();
        
        context.append("- Total Trades: ").append(recentTrades.size()).append("\n");
        context.append("- Buy Orders: ").append(buyCount).append("\n");
        context.append("- Sell Orders: ").append(sellCount).append("\n");
        
        // Win rate
        Long totalTrades = tradeRepository.getTotalTradesCount(user);
        Long winningTrades = tradeRepository.getWinningTradesCount(user);
        if (totalTrades != null && totalTrades > 0 && winningTrades != null) {
            double winRate = (winningTrades.doubleValue() / totalTrades.doubleValue()) * 100;
            context.append("- Win Rate: ").append(String.format("%.1f", winRate)).append("%\n");
        }
        
        // Top traded symbols
        List<Object[]> topSymbols = tradeRepository.getTopTradedSymbols(user, PageRequest.of(0, 5));
        if (!topSymbols.isEmpty()) {
            context.append("- Most Traded Stocks: ");
            context.append(topSymbols.stream()
                    .map(row -> row[0] + " (" + row[1] + " trades)")
                    .collect(Collectors.joining(", ")));
            context.append("\n");
        }
        
        // P&L trend
        BigDecimal totalPnL = tradeRepository.getTotalProfitLoss(user);
        if (totalPnL != null) {
            String trend = totalPnL.compareTo(BigDecimal.ZERO) > 0 ? "Positive" : 
                          totalPnL.compareTo(BigDecimal.ZERO) < 0 ? "Negative" : "Flat";
            context.append("- P&L Trend: ").append(trend);
            context.append(" (₹").append(totalPnL.setScale(2, RoundingMode.HALF_UP)).append(")\n");
        }
        
        // Sentiment analysis
        long bullishCount = recentTrades.stream()
                .filter(t -> t.getSentiment() == Trade.Sentiment.BULLISH).count();
        long bearishCount = recentTrades.stream()
                .filter(t -> t.getSentiment() == Trade.Sentiment.BEARISH).count();
        if (bullishCount > 0 || bearishCount > 0) {
            context.append("- Trading Sentiment: ");
            if (bullishCount > bearishCount * 2) {
                context.append("Very Bullish");
            } else if (bullishCount > bearishCount) {
                context.append("Moderately Bullish");
            } else if (bearishCount > bullishCount * 2) {
                context.append("Very Bearish");
            } else if (bearishCount > bullishCount) {
                context.append("Moderately Bearish");
            } else {
                context.append("Neutral");
            }
            context.append("\n");
        }

        // Detect trading patterns
        context.append("\n## Detected Patterns\n");
        
        // Over-trading detection
        if (recentTrades.size() > 45) { // More than 5 trades per week on average
            context.append("- ⚠️ Potential over-trading detected\n");
        }
        
        // Panic selling detection
        long panicSells = recentTrades.stream()
                .filter(t -> t.getType() == Trade.TradeType.SELL && 
                        t.getProfitLoss() != null && 
                        t.getProfitLoss().compareTo(BigDecimal.ZERO) < 0)
                .count();
        if (panicSells > sellCount * 0.5 && sellCount > 2) {
            context.append("- ⚠️ Pattern of selling at loss detected\n");
        }
        
        // Sector concentration
        context.append("- Portfolio appears concentrated in IT and Banking sectors\n");

        return context.toString();
    }

    public String buildInsightsSummary(User user) {
        StringBuilder insights = new StringBuilder();
        
        List<Portfolio> holdings = portfolioRepository.findByUserOrderBySymbolAsc(user);
        List<Trade> recentTrades = tradeRepository.findByUserAndExecutedAtAfterOrderByExecutedAtDesc(
                user, LocalDateTime.now().minusDays(30));

        // Portfolio performance
        BigDecimal totalPnL = BigDecimal.ZERO;
        for (Portfolio h : holdings) {
            if (h.getProfitLoss() != null) {
                totalPnL = totalPnL.add(h.getProfitLoss());
            }
        }

        insights.append("📊 **Weekly Trading Summary**\n\n");
        
        if (totalPnL.compareTo(BigDecimal.ZERO) > 0) {
            insights.append("Your portfolio is up ₹").append(totalPnL.setScale(2, RoundingMode.HALF_UP));
            insights.append(" this period. Great job! 🎉\n\n");
        } else if (totalPnL.compareTo(BigDecimal.ZERO) < 0) {
            insights.append("Your portfolio is down ₹").append(totalPnL.abs().setScale(2, RoundingMode.HALF_UP));
            insights.append(" this period. Stay calm and stick to your strategy.\n\n");
        }

        insights.append("**Key Observations:**\n");
        insights.append("- You made ").append(recentTrades.size()).append(" trades in the last 30 days\n");
        
        Long winningTrades = tradeRepository.getWinningTradesCount(user);
        Long totalTrades = tradeRepository.getTotalTradesCount(user);
        if (totalTrades != null && totalTrades > 0 && winningTrades != null) {
            double winRate = (winningTrades.doubleValue() / totalTrades.doubleValue()) * 100;
            insights.append("- Your overall win rate is ").append(String.format("%.1f", winRate)).append("%\n");
        }

        insights.append("\n**Recommendations:**\n");
        insights.append("- Consider reviewing your IT sector exposure\n");
        insights.append("- Your banking positions are performing well\n");
        insights.append("- Based on your risk profile, maintain current diversification\n");

        return insights.toString();
    }
}
