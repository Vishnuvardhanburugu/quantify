package com.quantify.service;

import com.quantify.model.MarketData;
import com.quantify.model.Portfolio;
import com.quantify.model.Trade;
import com.quantify.model.User;
import com.quantify.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final MarketDataService marketDataService;

    public List<Portfolio> getUserPortfolio(User user) {
        List<Portfolio> holdings = portfolioRepository.findByUserOrderBySymbolAsc(user);
        
        // Update current prices from market data
        for (Portfolio holding : holdings) {
            try {
                MarketData marketData = marketDataService.getMarketData(holding.getSymbol());
                if (marketData != null && marketData.getCurrentPrice() != null) {
                    holding.setCurrentPrice(marketData.getCurrentPrice());
                    holding.calculateValues();
                }
            } catch (Exception e) {
                log.warn("Could not update price for {}: {}", holding.getSymbol(), e.getMessage());
            }
        }
        
        return holdings;
    }

    @Transactional
    public Portfolio addOrUpdateHolding(User user, String symbol, String companyName, 
                                         Integer quantity, BigDecimal averagePrice) {
        final String normalizedSymbol = symbol == null ? null : symbol.toUpperCase();
        Optional<Portfolio> existing = portfolioRepository.findByUserAndSymbol(user, normalizedSymbol);

        Portfolio portfolio;
        if (existing.isPresent()) {
            portfolio = existing.get();
            // Calculate new average price
            BigDecimal totalOldValue = portfolio.getAveragePrice()
                    .multiply(BigDecimal.valueOf(portfolio.getQuantity()));
            BigDecimal totalNewValue = averagePrice.multiply(BigDecimal.valueOf(quantity));
            int totalQuantity = portfolio.getQuantity() + quantity;
            BigDecimal newAveragePrice = totalOldValue.add(totalNewValue)
                    .divide(BigDecimal.valueOf(totalQuantity), 2, RoundingMode.HALF_UP);

            portfolio.setQuantity(totalQuantity);
            portfolio.setAveragePrice(newAveragePrice);
        } else {
            portfolio = Portfolio.builder()
                    .user(user)
                    .symbol(normalizedSymbol)
                    .companyName(companyName)
                    .quantity(quantity)
                    .averagePrice(averagePrice)
                    .build();
        }

        // Try to get current price
        try {
            MarketData marketData = marketDataService.getMarketData(normalizedSymbol);
            if (marketData != null && marketData.getCurrentPrice() != null) {
                portfolio.setCurrentPrice(marketData.getCurrentPrice());
                if (companyName == null || companyName.isEmpty()) {
                    portfolio.setCompanyName(marketData.getCompanyName());
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch current price for {}", symbol);
        }

        return portfolioRepository.save(portfolio);
    }

    public Portfolio getHoldingOrThrow(User user, String symbol) {
        final String normalizedSymbol = symbol == null ? null : symbol.toUpperCase();
        return portfolioRepository.findByUserAndSymbol(user, normalizedSymbol)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No holding found for " + normalizedSymbol));
    }

    @Transactional
    public void applyTrade(User user, String symbol, String companyName, Trade.TradeType type, Integer quantity, BigDecimal price) {
        final String normalizedSymbol = symbol == null ? null : symbol.toUpperCase();
        if (type == Trade.TradeType.BUY) {
            addOrUpdateHolding(user, normalizedSymbol, companyName, quantity, price);
            return;
        }
        if (type == Trade.TradeType.SELL) {
            sellFromHolding(user, normalizedSymbol, quantity, price);
        }
    }

    @Transactional
    public void sellFromHolding(User user, String symbol, Integer quantity, BigDecimal sellPrice) {
        Portfolio holding = getHoldingOrThrow(user, symbol);
        if (holding.getQuantity() == null || holding.getQuantity() < quantity) {
            throw new ResponseStatusException(BAD_REQUEST, "Not enough quantity in portfolio to sell");
        }

        int remaining = holding.getQuantity() - quantity;
        if (remaining == 0) {
            portfolioRepository.delete(holding);
            return;
        }

        holding.setQuantity(remaining);
        // Keep averagePrice as-is; update currentPrice for valuation convenience
        holding.setCurrentPrice(sellPrice);
        holding.calculateValues();
        portfolioRepository.save(holding);
    }

    @Transactional
    public void deleteHolding(User user, Long holdingId) {
        portfolioRepository.findByIdAndUser(holdingId, user)
                .ifPresent(portfolioRepository::delete);
    }

    public Map<String, Object> getPortfolioSummary(User user) {
        List<Portfolio> holdings = getUserPortfolio(user);
        
        BigDecimal totalInvested = BigDecimal.ZERO;
        BigDecimal totalCurrentValue = BigDecimal.ZERO;
        String topGainer = null;
        String topLoser = null;
        BigDecimal maxGain = BigDecimal.ZERO;
        BigDecimal maxLoss = BigDecimal.ZERO;

        for (Portfolio holding : holdings) {
            if (holding.getInvestedValue() != null) {
                totalInvested = totalInvested.add(holding.getInvestedValue());
            }
            if (holding.getCurrentValue() != null) {
                totalCurrentValue = totalCurrentValue.add(holding.getCurrentValue());
            }
            if (holding.getProfitLossPercent() != null) {
                if (holding.getProfitLossPercent().compareTo(maxGain) > 0) {
                    maxGain = holding.getProfitLossPercent();
                    topGainer = holding.getSymbol();
                }
                if (holding.getProfitLossPercent().compareTo(maxLoss) < 0) {
                    maxLoss = holding.getProfitLossPercent();
                    topLoser = holding.getSymbol();
                }
            }
        }

        BigDecimal totalProfitLoss = totalCurrentValue.subtract(totalInvested);
        BigDecimal totalProfitLossPercent = BigDecimal.ZERO;
        if (totalInvested.compareTo(BigDecimal.ZERO) > 0) {
            totalProfitLossPercent = totalProfitLoss.divide(totalInvested, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalInvested", totalInvested);
        summary.put("totalCurrentValue", totalCurrentValue);
        summary.put("totalProfitLoss", totalProfitLoss);
        summary.put("totalProfitLossPercent", totalProfitLossPercent);
        summary.put("holdingsCount", (long) holdings.size());
        summary.put("topGainer", topGainer);
        summary.put("topLoser", topLoser);

        return summary;
    }
}
