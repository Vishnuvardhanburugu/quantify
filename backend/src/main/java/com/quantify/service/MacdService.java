package com.quantify.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantify.dto.MacdAnalysisResponse;
import com.quantify.dto.MacdPointResponse;
import com.quantify.model.MacdIndicator;
import com.quantify.repository.MacdIndicatorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class MacdService {

    private final MacdIndicatorRepository macdRepository;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final jakarta.persistence.EntityManager entityManager;

    public MacdService(MacdIndicatorRepository macdRepository,
                       WebClient.Builder webClientBuilder,
                       ObjectMapper objectMapper,
                       jakarta.persistence.EntityManager entityManager) {
        this.macdRepository = macdRepository;
        this.webClientBuilder = webClientBuilder;
        this.objectMapper = objectMapper;
        this.entityManager = entityManager;
    }

    @Value("${yahoo.finance.base-url:https://query1.finance.yahoo.com/v8/finance}")
    private String yahooFinanceUrl;

    /**
     * Calculate MACD for a symbol using configurable EMA periods and store results.
     */
    @Transactional
    public List<MacdPointResponse> calculateMacdForSymbol(String symbol,
                                                          int shortPeriod,
                                                          int longPeriod,
                                                          int signalPeriod,
                                                          int days) {
        symbol = symbol.toUpperCase();
        List<PricePoint> rawHistory = fetchHistoricalPrices(symbol, days);

        // Deduplicate by date (Yahoo may return multiple entries for the same date)
        java.util.Map<LocalDate, PricePoint> dateMap = new java.util.LinkedHashMap<>();
        for (PricePoint p : rawHistory) {
            dateMap.put(p.date(), p); // last entry wins
        }
        List<PricePoint> priceHistory = new ArrayList<>(dateMap.values());

        if (priceHistory.size() < longPeriod + signalPeriod) {
            log.warn("Not enough historical data for MACD calculation for {}", symbol);
            return List.of();
        }

        priceHistory.sort(Comparator.comparing(PricePoint::date));

        BigDecimal shortMultiplier = multiplier(shortPeriod);
        BigDecimal longMultiplier = multiplier(longPeriod);
        BigDecimal signalMultiplier = multiplier(signalPeriod);

        BigDecimal emaShort = null;
        BigDecimal emaLong = null;
        BigDecimal signalEma = null;

        List<BigDecimal> macdValues = new ArrayList<>();
        List<MacdIndicator> indicatorsToSave = new ArrayList<>();
        List<MacdPointResponse> responses = new ArrayList<>();

        for (int i = 0; i < priceHistory.size(); i++) {
            PricePoint point = priceHistory.get(i);
            BigDecimal close = point.close();

            if (i + 1 == shortPeriod) {
                emaShort = simpleMovingAverage(priceHistory, i + 1 - shortPeriod, i + 1);
            } else if (i + 1 > shortPeriod && emaShort != null) {
                emaShort = ema(close, emaShort, shortMultiplier);
            }

            if (i + 1 == longPeriod) {
                emaLong = simpleMovingAverage(priceHistory, i + 1 - longPeriod, i + 1);
            } else if (i + 1 > longPeriod && emaLong != null) {
                emaLong = ema(close, emaLong, longMultiplier);
            }

            if (emaShort == null || emaLong == null) {
                continue;
            }

            BigDecimal macdLine = emaShort.subtract(emaLong)
                    .setScale(6, RoundingMode.HALF_UP);
            macdValues.add(macdLine);

            BigDecimal signalLine = null;
            BigDecimal histogram = null;

            if (macdValues.size() == signalPeriod) {
                signalEma = simpleAverage(macdValues);
            } else if (macdValues.size() > signalPeriod && signalEma != null) {
                signalEma = ema(macdLine, signalEma, signalMultiplier);
            }

            if (signalEma != null) {
                signalLine = signalEma.setScale(6, RoundingMode.HALF_UP);
                histogram = macdLine.subtract(signalLine)
                        .setScale(6, RoundingMode.HALF_UP);
            }

            if (signalLine == null || histogram == null) {
                continue;
            }

            MacdIndicator previous = indicatorsToSave.isEmpty()
                    ? macdRepository.findFirstBySymbolOrderByDateDesc(symbol).orElse(null)
                    : indicatorsToSave.get(indicatorsToSave.size() - 1);

            MacdIndicator.Signal signal = determineSignal(previous, macdLine, signalLine, histogram);
            BigDecimal strength = calculateStrength(histogram, close, signal);

            MacdIndicator indicator = MacdIndicator.builder()
                    .symbol(symbol)
                    .date(point.date())
                    .closePrice(close)
                    .ema12(emaShort)
                    .ema26(emaLong)
                    .macdLine(macdLine)
                    .signalLine(signalLine)
                    .histogram(histogram)
                    .signal(signal)
                    .strength(strength)
                    .build();

            indicatorsToSave.add(indicator);

            responses.add(MacdPointResponse.builder()
                    .date(point.date())
                    .closePrice(close)
                    .emaShort(emaShort)
                    .emaLong(emaLong)
                    .macdLine(macdLine)
                    .signalLine(signalLine)
                    .histogram(histogram)
                    .signal(signal)
                    .strength(strength)
                    .build());
        }

        // Skip database persistence — return computed data directly
        // This avoids all unique constraint issues with H2/Hibernate

        return responses;
    }

    public MacdAnalysisResponse getLatestMacdAnalysis(String symbol,
                                                      int shortPeriod,
                                                      int longPeriod,
                                                      int signalPeriod,
                                                      int days,
                                                      BigDecimal riskPercent,
                                                      BigDecimal rewardPercent) {
        final String normalizedSymbol = symbol.toUpperCase();

        // Calculate MACD in-memory (no database)
        List<MacdPointResponse> points = calculateMacdForSymbol(
                normalizedSymbol, shortPeriod, longPeriod, signalPeriod, days);

        if (points.isEmpty()) {
            throw new IllegalStateException("Unable to calculate MACD for symbol " + normalizedSymbol);
        }

        // Use the last point as the "latest"
        MacdPointResponse latest = points.get(points.size() - 1);

        // Build trend from the last 20 points
        List<MacdPointResponse> recent = points.subList(
                Math.max(0, points.size() - 20), points.size());
        MacdAnalysisResponse.TrendSnapshot trend = analyzeTrendFromPoints(recent);
        BigDecimal confidence = calculateConfidenceFromPoint(latest, trend);

        BigDecimal entryPrice = latest.getClosePrice();
        BigDecimal stopLoss = entryPrice.multiply(
                        BigDecimal.ONE.subtract(riskPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal takeProfit = entryPrice.multiply(
                        BigDecimal.ONE.add(rewardPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);

        String recommendation = buildRecommendation(latest.getSignal(), trend);

        return MacdAnalysisResponse.builder()
                .symbol(normalizedSymbol)
                .current(MacdAnalysisResponse.CurrentSnapshot.builder()
                        .macdLine(latest.getMacdLine())
                        .signalLine(latest.getSignalLine())
                        .histogram(latest.getHistogram())
                        .signal(latest.getSignal())
                        .strength(latest.getStrength())
                        .recommendation(recommendation)
                        .entryPrice(entryPrice)
                        .stopLoss(stopLoss)
                        .takeProfit(takeProfit)
                        .build())
                .trend(trend)
                .overallRecommendation(overallFromSignal(latest.getSignal(), trend))
                .confidence(confidence)
                .build();
    }

    public List<MacdPointResponse> getMacdHistory(String symbol, int days) {
        symbol = symbol.toUpperCase();
        // Calculate in-memory and return the last N days
        List<MacdPointResponse> allPoints = calculateMacdForSymbol(
                symbol, 12, 26, 9, Math.max(days + 50, 200));

        if (allPoints.isEmpty()) return List.of();

        // Filter to the requested number of days
        LocalDate cutoff = LocalDate.now().minusDays(days);
        return allPoints.stream()
                .filter(p -> !p.getDate().isBefore(cutoff))
                .toList();
    }

    public List<MacdAnalysisResponse> bulkAnalysis(List<String> symbols,
                                                   int shortPeriod,
                                                   int longPeriod,
                                                   int signalPeriod,
                                                   int days,
                                                   BigDecimal riskPercent,
                                                   BigDecimal rewardPercent) {
        List<MacdAnalysisResponse> results = new ArrayList<>();
        for (String symbol : symbols) {
            try {
                results.add(getLatestMacdAnalysis(symbol, shortPeriod, longPeriod, signalPeriod, days,
                        riskPercent, rewardPercent));
            } catch (Exception e) {
                log.warn("Failed MACD analysis for {}: {}", symbol, e.getMessage());
            }
        }
        return results;
    }

    private List<PricePoint> fetchHistoricalPrices(String symbol, int days) {
        try {
            WebClient client = webClientBuilder.build();

            // Yahoo Finance supports fixed range buckets (1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max)
            // Map requested days to the closest bucket so we reliably get data.
            String range;
            if (days <= 5) {
                range = "5d";
            } else if (days <= 30) {
                range = "1mo";
            } else if (days <= 90) {
                range = "3mo";
            } else if (days <= 180) {
                range = "6mo";
            } else if (days <= 365) {
                range = "1y";
            } else if (days <= 730) {
                range = "2y";
            } else if (days <= 1825) {
                range = "5y";
            } else {
                range = "10y";
            }

            String url = String.format("%s/chart/%s?interval=1d&range=%s", yahooFinanceUrl, symbol, range);

            String response = client.get()
                    .uri(url)
                    .header("User-Agent", "Mozilla/5.0")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response == null) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode result = root.path("chart").path("result").get(0);
            if (result == null || result.isNull()) {
                return List.of();
            }

            JsonNode timestamps = result.path("timestamp");
            JsonNode quote = result.path("indicators").path("quote").get(0);
            JsonNode closes = quote.path("close");

            List<PricePoint> points = new ArrayList<>();
            for (int i = 0; i < timestamps.size(); i++) {
                JsonNode tsNode = timestamps.get(i);
                JsonNode closeNode = closes.get(i);
                if (tsNode == null || closeNode == null || closeNode.isNull()) {
                    continue;
                }

                long epochSeconds = tsNode.asLong();
                LocalDate date = Instant.ofEpochSecond(epochSeconds)
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate();

                BigDecimal close = BigDecimal.valueOf(closeNode.asDouble());
                points.add(new PricePoint(date, close));
            }

            return points;
        } catch (Exception e) {
            log.error("Error fetching historical prices for {}: {}", symbol, e.getMessage());
            return List.of();
        }
    }

    private BigDecimal multiplier(int period) {
        return BigDecimal.valueOf(2.0)
                .divide(BigDecimal.valueOf(period + 1L), 8, RoundingMode.HALF_UP);
    }

    private BigDecimal simpleMovingAverage(List<PricePoint> points, int startInclusive, int endExclusive) {
        BigDecimal sum = BigDecimal.ZERO;
        int count = 0;
        for (int i = startInclusive; i < endExclusive; i++) {
            sum = sum.add(points.get(i).close());
            count++;
        }
        return sum.divide(BigDecimal.valueOf(count), 6, RoundingMode.HALF_UP);
    }

    private BigDecimal simpleAverage(List<BigDecimal> values) {
        BigDecimal sum = BigDecimal.ZERO;
        for (BigDecimal v : values) {
            sum = sum.add(v);
        }
        return sum.divide(BigDecimal.valueOf(values.size()), 6, RoundingMode.HALF_UP);
    }

    private BigDecimal ema(BigDecimal price, BigDecimal previousEma, BigDecimal multiplier) {
        return price.subtract(previousEma)
                .multiply(multiplier)
                .add(previousEma);
    }

    private MacdIndicator.Signal determineSignal(MacdIndicator previous,
                                                 BigDecimal macdLine,
                                                 BigDecimal signalLine,
                                                 BigDecimal histogram) {
        if (previous == null || previous.getMacdLine() == null || previous.getSignalLine() == null) {
            return MacdIndicator.Signal.HOLD;
        }

        BigDecimal prevMacd = previous.getMacdLine();
        BigDecimal prevSignal = previous.getSignalLine();

        boolean crossedUp = prevMacd.compareTo(prevSignal) <= 0 && macdLine.compareTo(signalLine) > 0;
        boolean crossedDown = prevMacd.compareTo(prevSignal) >= 0 && macdLine.compareTo(signalLine) < 0;

        if (crossedUp) {
            if (histogram.compareTo(BigDecimal.ZERO) > 0) {
                return MacdIndicator.Signal.STRONG_BUY;
            }
            return MacdIndicator.Signal.BUY;
        }
        if (crossedDown) {
            if (histogram.compareTo(BigDecimal.ZERO) < 0) {
                return MacdIndicator.Signal.STRONG_SELL;
            }
            return MacdIndicator.Signal.SELL;
        }
        return MacdIndicator.Signal.HOLD;
    }

    private BigDecimal calculateStrength(BigDecimal histogram,
                                         BigDecimal closePrice,
                                         MacdIndicator.Signal signal) {
        BigDecimal base = histogram.abs()
                .divide(closePrice.max(BigDecimal.valueOf(0.01)), 6, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        BigDecimal capped = base.min(BigDecimal.valueOf(80));

        if (signal == MacdIndicator.Signal.STRONG_BUY || signal == MacdIndicator.Signal.STRONG_SELL) {
            capped = capped.add(BigDecimal.valueOf(10));
        }

        BigDecimal result = capped.min(BigDecimal.valueOf(100));
        return result.setScale(2, RoundingMode.HALF_UP);
    }

    private MacdAnalysisResponse.TrendSnapshot analyzeTrend(List<MacdIndicator> recent) {
        if (recent.size() < 3) {
            return MacdAnalysisResponse.TrendSnapshot.builder()
                    .direction("NEUTRAL")
                    .strength("WEAK")
                    .divergence(false)
                    .build();
        }

        // Use histogram and MACD sign for a simple trend classification
        MacdIndicator latest = recent.get(0);
        MacdIndicator earlier = recent.get(Math.min(4, recent.size() - 1));

        BigDecimal latestHist = latest.getHistogram();
        BigDecimal earlierHist = earlier.getHistogram();

        String direction;
        if (latest.getMacdLine().compareTo(BigDecimal.ZERO) > 0) {
            direction = "BULLISH";
        } else if (latest.getMacdLine().compareTo(BigDecimal.ZERO) < 0) {
            direction = "BEARISH";
        } else {
            direction = "NEUTRAL";
        }

        BigDecimal histChange = latestHist.subtract(earlierHist).abs();
        String strength;
        if (histChange.compareTo(BigDecimal.valueOf(0.5)) > 0) {
            strength = "STRONG";
        } else if (histChange.compareTo(BigDecimal.valueOf(0.2)) > 0) {
            strength = "MODERATE";
        } else {
            strength = "WEAK";
        }

        // Divergence detection is non-trivial; keep simple placeholder (false) for now
        boolean divergence = false;

        return MacdAnalysisResponse.TrendSnapshot.builder()
                .direction(direction)
                .strength(strength)
                .divergence(divergence)
                .build();
    }

    private BigDecimal calculateConfidence(MacdIndicator latest,
                                           MacdAnalysisResponse.TrendSnapshot trend) {
        BigDecimal confidence = BigDecimal.valueOf(50);

        if (latest.getSignal() == MacdIndicator.Signal.STRONG_BUY
                || latest.getSignal() == MacdIndicator.Signal.STRONG_SELL) {
            confidence = confidence.add(BigDecimal.valueOf(20));
        }

        if ("STRONG".equals(trend.getStrength())) {
            confidence = confidence.add(BigDecimal.valueOf(15));
        } else if ("MODERATE".equals(trend.getStrength())) {
            confidence = confidence.add(BigDecimal.valueOf(10));
        }

        if (trend.isDivergence()) {
            confidence = confidence.subtract(BigDecimal.valueOf(20));
        }

        BigDecimal strengthComponent = latest.getStrength()
                .min(BigDecimal.valueOf(20));
        confidence = confidence.add(strengthComponent.divide(BigDecimal.valueOf(5), 2, RoundingMode.HALF_UP));

        if (confidence.compareTo(BigDecimal.ZERO) < 0) {
            confidence = BigDecimal.ZERO;
        }
        if (confidence.compareTo(BigDecimal.valueOf(100)) > 0) {
            confidence = BigDecimal.valueOf(100);
        }

        return confidence.setScale(2, RoundingMode.HALF_UP);
    }

    private String buildRecommendation(MacdIndicator.Signal signal,
                                       MacdAnalysisResponse.TrendSnapshot trend) {
        return switch (signal) {
            case STRONG_BUY -> "STRONG BUY - MACD shows strong bullish momentum";
            case BUY -> "BUY - MACD crossover indicates emerging bullish trend";
            case STRONG_SELL -> "STRONG SELL - MACD shows strong bearish momentum";
            case SELL -> "SELL - MACD crossover indicates emerging bearish trend";
            case HOLD -> {
                if ("BULLISH".equals(trend.getDirection())) {
                    yield "HOLD - Bullish trend in progress, wait for clearer signal";
                } else if ("BEARISH".equals(trend.getDirection())) {
                    yield "HOLD - Bearish trend in progress, wait for better entry";
                } else {
                    yield "HOLD - No strong MACD signal currently";
                }
            }
        };
    }

    private String overallFromSignal(MacdIndicator.Signal signal,
                                     MacdAnalysisResponse.TrendSnapshot trend) {
        return switch (signal) {
            case STRONG_BUY -> "STRONG BUY";
            case BUY -> "BUY";
            case STRONG_SELL -> "STRONG SELL";
            case SELL -> "SELL";
            case HOLD -> "NEUTRAL";
        };
    }

    private record PricePoint(LocalDate date, BigDecimal close) {
    }

    private MacdAnalysisResponse.TrendSnapshot analyzeTrendFromPoints(List<MacdPointResponse> recent) {
        if (recent.size() < 3) {
            return MacdAnalysisResponse.TrendSnapshot.builder()
                    .direction("NEUTRAL")
                    .strength("WEAK")
                    .divergence(false)
                    .build();
        }

        MacdPointResponse latest = recent.get(recent.size() - 1);
        MacdPointResponse earlier = recent.get(Math.max(0, recent.size() - 5));

        BigDecimal latestHist = latest.getHistogram();
        BigDecimal earlierHist = earlier.getHistogram();

        String direction;
        if (latest.getMacdLine().compareTo(BigDecimal.ZERO) > 0) {
            direction = "BULLISH";
        } else if (latest.getMacdLine().compareTo(BigDecimal.ZERO) < 0) {
            direction = "BEARISH";
        } else {
            direction = "NEUTRAL";
        }

        BigDecimal histChange = latestHist.subtract(earlierHist).abs();
        String strength;
        if (histChange.compareTo(BigDecimal.valueOf(0.5)) > 0) {
            strength = "STRONG";
        } else if (histChange.compareTo(BigDecimal.valueOf(0.2)) > 0) {
            strength = "MODERATE";
        } else {
            strength = "WEAK";
        }

        return MacdAnalysisResponse.TrendSnapshot.builder()
                .direction(direction)
                .strength(strength)
                .divergence(false)
                .build();
    }

    private BigDecimal calculateConfidenceFromPoint(MacdPointResponse latest,
                                                     MacdAnalysisResponse.TrendSnapshot trend) {
        BigDecimal confidence = BigDecimal.valueOf(50);

        if (latest.getSignal() == MacdIndicator.Signal.STRONG_BUY
                || latest.getSignal() == MacdIndicator.Signal.STRONG_SELL) {
            confidence = confidence.add(BigDecimal.valueOf(20));
        }

        if ("STRONG".equals(trend.getStrength())) {
            confidence = confidence.add(BigDecimal.valueOf(15));
        } else if ("MODERATE".equals(trend.getStrength())) {
            confidence = confidence.add(BigDecimal.valueOf(10));
        }

        if (trend.isDivergence()) {
            confidence = confidence.subtract(BigDecimal.valueOf(20));
        }

        BigDecimal strengthComponent = latest.getStrength()
                .min(BigDecimal.valueOf(20));
        confidence = confidence.add(strengthComponent.divide(BigDecimal.valueOf(5), 2, RoundingMode.HALF_UP));

        if (confidence.compareTo(BigDecimal.ZERO) < 0) {
            confidence = BigDecimal.ZERO;
        }
        if (confidence.compareTo(BigDecimal.valueOf(100)) > 0) {
            confidence = BigDecimal.valueOf(100);
        }

        return confidence.setScale(2, RoundingMode.HALF_UP);
    }
}

