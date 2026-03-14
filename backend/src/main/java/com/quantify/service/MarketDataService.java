package com.quantify.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantify.config.StockSymbolRegistry;
import com.quantify.model.MarketData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketDataService {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    
    // In-memory cache as fallback when Redis is not available
    private final Map<String, MarketData> localCache = new ConcurrentHashMap<>();

    @Value("${yahoo.finance.base-url:https://query1.finance.yahoo.com/v8/finance}")
    private String yahooFinanceUrl;

    @Value("${yahoo.finance.cache-ttl:30}")
    private int cacheTtl;

    // NSE stocks + indices from single source of truth (StockSymbolRegistry)
    private static List<String> getNseSymbols() {
        return StockSymbolRegistry.getSymbolsOnly();
    }

    public MarketData getMarketData(String symbol) {
        // Check local cache first
        MarketData cached = localCache.get(symbol);
        if (cached != null && cached.getLastUpdated() != null &&
                cached.getLastUpdated().isAfter(LocalDateTime.now().minusSeconds(cacheTtl))) {
            return cached;
        }

        try {
            MarketData marketData = fetchFromYahooFinance(symbol);
            if (marketData != null) {
                localCache.put(symbol, marketData);
                return marketData;
            }
        } catch (Exception e) {
            log.error("Error fetching market data for {}: {}", symbol, e.getMessage());
        }

        // Return cached data even if expired, or generate mock data
        if (cached != null) {
            return cached;
        }
        return generateMockData(symbol);
    }

    public List<MarketData> getAllMarketData() {
        List<MarketData> allData = new ArrayList<>();
        for (String symbol : getNseSymbols()) {
            try {
                MarketData data = getMarketData(symbol);
                if (data != null) {
                    allData.add(data);
                }
            } catch (Exception e) {
                log.warn("Could not fetch data for {}", symbol);
            }
        }
        return allData;
    }

    public List<MarketData> getTopGainers() {
        return getAllMarketData().stream()
                .filter(data -> data.getChangePercent() != null && data.getChangePercent().compareTo(BigDecimal.ZERO) > 0)
                .sorted((a, b) -> b.getChangePercent().compareTo(a.getChangePercent()))
                .limit(5)
                .toList();
    }

    public List<MarketData> getTopLosers() {
        return getAllMarketData().stream()
                .filter(data -> data.getChangePercent() != null && data.getChangePercent().compareTo(BigDecimal.ZERO) < 0)
                .sorted(Comparator.comparing(MarketData::getChangePercent))
                .limit(5)
                .toList();
    }

    /**
     * Fetch OHLC history for candlestick charts (TradingView-style).
     */
    public List<Map<String, Object>> getOhlcHistory(String symbol, int days) {
        String range;
        if (days <= 5) range = "5d";
        else if (days <= 30) range = "1mo";
        else if (days <= 90) range = "3mo";
        else if (days <= 180) range = "6mo";
        else if (days <= 365) range = "1y";
        else if (days <= 730) range = "2y";
        else range = "5y";
        try {
            WebClient client = webClientBuilder.build();
            String url = String.format("%s/chart/%s?interval=1d&range=%s", yahooFinanceUrl, symbol, range);
            String response = client.get()
                    .uri(url)
                    .header("User-Agent", "Mozilla/5.0")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();
            if (response == null) return List.of();
            JsonNode root = objectMapper.readTree(response);
            JsonNode result = root.path("chart").path("result").get(0);
            if (result == null || result.isMissingNode()) return List.of();
            JsonNode timestamps = result.path("timestamp");
            JsonNode quote = result.path("indicators").path("quote").get(0);
            JsonNode opens = quote.path("open");
            JsonNode highs = quote.path("high");
            JsonNode lows = quote.path("low");
            JsonNode closes = quote.path("close");
            List<Map<String, Object>> out = new ArrayList<>();
            for (int i = 0; i < timestamps.size(); i++) {
                JsonNode ts = timestamps.get(i);
                JsonNode o = opens.get(i);
                JsonNode h = highs.get(i);
                JsonNode l = lows.get(i);
                JsonNode c = closes.get(i);
                if (ts == null || c == null || c.isNull()) continue;
                LocalDate date = Instant.ofEpochSecond(ts.asLong()).atZone(ZoneId.systemDefault()).toLocalDate();
                double openVal = o != null && !o.isNull() ? o.asDouble() : c.asDouble();
                double highVal = h != null && !h.isNull() ? h.asDouble() : c.asDouble();
                double lowVal = l != null && !l.isNull() ? l.asDouble() : c.asDouble();
                double closeVal = c.asDouble();
                out.add(Map.<String, Object>of(
                        "date", date.toString(),
                        "open", openVal,
                        "high", highVal,
                        "low", lowVal,
                        "close", closeVal
                ));
            }
            return out;
        } catch (Exception e) {
            log.warn("OHLC fetch failed for {}: {}", symbol, e.getMessage());
            return List.of();
        }
    }

    private MarketData fetchFromYahooFinance(String symbol) {
        try {
            WebClient webClient = webClientBuilder.build();
            
            String url = String.format("%s/chart/%s?interval=1d&range=1d", yahooFinanceUrl, symbol);
            
            String response = webClient.get()
                    .uri(url)
                    .header("User-Agent", "Mozilla/5.0")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (response != null) {
                return parseYahooResponse(symbol, response);
            }
        } catch (Exception e) {
            log.debug("Yahoo Finance API error for {}: {}", symbol, e.getMessage());
        }
        return null;
    }

    private MarketData parseYahooResponse(String symbol, String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode chart = root.path("chart").path("result").get(0);
            
            if (chart == null) return null;

            JsonNode meta = chart.path("meta");
            JsonNode quote = chart.path("indicators").path("quote").get(0);

            BigDecimal currentPrice = getBigDecimal(meta, "regularMarketPrice");
            BigDecimal previousClose = getBigDecimal(meta, "previousClose");
            
            BigDecimal change = null;
            BigDecimal changePercent = null;
            if (currentPrice != null && previousClose != null) {
                change = currentPrice.subtract(previousClose);
                if (previousClose.compareTo(BigDecimal.ZERO) > 0) {
                    changePercent = change.divide(previousClose, 4, java.math.RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100));
                }
            }

            return MarketData.builder()
                    .symbol(symbol)
                    .companyName(meta.path("shortName").asText(symbol))
                    .currentPrice(currentPrice)
                    .previousClose(previousClose)
                    .change(change)
                    .changePercent(changePercent)
                    .dayHigh(getBigDecimal(meta, "regularMarketDayHigh"))
                    .dayLow(getBigDecimal(meta, "regularMarketDayLow"))
                    .fiftyTwoWeekHigh(getBigDecimal(meta, "fiftyTwoWeekHigh"))
                    .fiftyTwoWeekLow(getBigDecimal(meta, "fiftyTwoWeekLow"))
                    .volume(meta.path("regularMarketVolume").asLong(0))
                    .exchange(meta.path("exchangeName").asText("NSE"))
                    .lastUpdated(LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            log.error("Error parsing Yahoo response for {}: {}", symbol, e.getMessage());
            return null;
        }
    }

    private BigDecimal getBigDecimal(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        return BigDecimal.valueOf(value.asDouble());
    }

    private MarketData generateMockData(String symbol) {
        Random random = new Random();
        BigDecimal basePrice = BigDecimal.valueOf(1000 + random.nextInt(3000));
        BigDecimal change = BigDecimal.valueOf((random.nextDouble() - 0.5) * 100);
        BigDecimal previousClose = basePrice.subtract(change);
        BigDecimal changePercent = change.divide(previousClose, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        return MarketData.builder()
                .symbol(symbol)
                .companyName(getCompanyName(symbol))
                .currentPrice(basePrice)
                .previousClose(previousClose)
                .change(change)
                .changePercent(changePercent)
                .dayHigh(basePrice.add(BigDecimal.valueOf(random.nextInt(50))))
                .dayLow(basePrice.subtract(BigDecimal.valueOf(random.nextInt(50))))
                .volume((long) (random.nextInt(10000000) + 1000000))
                .exchange("NSE")
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    private String getCompanyName(String symbol) {
        return StockSymbolRegistry.getCompanyName(symbol);
    }

    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void refreshMarketData() {
        log.debug("Refreshing market data...");
        for (String symbol : getNseSymbols()) {
            try {
                MarketData data = fetchFromYahooFinance(symbol);
                if (data != null) {
                    localCache.put(symbol, data);
                }
            } catch (Exception e) {
                log.debug("Could not refresh data for {}", symbol);
            }
        }
    }
}
