package com.quantify.controller;

import com.quantify.config.StockSymbolRegistry;
import com.quantify.model.MarketData;
import com.quantify.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketController {

    private final MarketDataService marketDataService;

    @GetMapping("/symbols")
    public ResponseEntity<List<Map<String, String>>> getSymbols(
            @RequestParam(required = false) String q
    ) {
        List<StockSymbolRegistry.StockInfo> list = (q != null && !q.isBlank())
                ? StockSymbolRegistry.search(q)
                : StockSymbolRegistry.getAllSymbols();
        List<Map<String, String>> response = list.stream()
                .map(info -> Map.<String, String>of(
                        "symbol", info.getSymbol(),
                        "companyName", info.getCompanyName(),
                        "sector", info.getSector()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllMarketData() {
        List<MarketData> marketData = marketDataService.getAllMarketData();
        List<Map<String, Object>> response = marketData.stream()
                .map(this::mapToResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{symbol}")
    public ResponseEntity<Map<String, Object>> getMarketData(@PathVariable String symbol) {
        MarketData data = marketDataService.getMarketData(symbol);
        if (data == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(mapToResponse(data));
    }

    @GetMapping("/history/{symbol}")
    public ResponseEntity<List<Map<String, Object>>> getOhlcHistory(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "90") int days) {
        return ResponseEntity.ok(marketDataService.getOhlcHistory(symbol, days));
    }

    @GetMapping("/gainers")
    public ResponseEntity<List<Map<String, Object>>> getTopGainers() {
        List<MarketData> gainers = marketDataService.getTopGainers();
        List<Map<String, Object>> response = gainers.stream()
                .map(this::mapToResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/losers")
    public ResponseEntity<List<Map<String, Object>>> getTopLosers() {
        List<MarketData> losers = marketDataService.getTopLosers();
        List<Map<String, Object>> response = losers.stream()
                .map(this::mapToResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> mapToResponse(MarketData data) {
        Map<String, Object> map = new HashMap<>();
        map.put("symbol", data.getSymbol());
        map.put("companyName", data.getCompanyName());
        map.put("sector", com.quantify.config.StockSymbolRegistry.getAllSymbols().stream()
                .filter(s -> s.getSymbol().equalsIgnoreCase(data.getSymbol()))
                .map(com.quantify.config.StockSymbolRegistry.StockInfo::getSector)
                .findFirst()
                .orElse(null));
        map.put("currentPrice", data.getCurrentPrice());
        map.put("previousClose", data.getPreviousClose());
        map.put("change", data.getChange());
        map.put("changePercent", data.getChangePercent());
        map.put("dayHigh", data.getDayHigh());
        map.put("dayLow", data.getDayLow());
        map.put("fiftyTwoWeekHigh", data.getFiftyTwoWeekHigh());
        map.put("fiftyTwoWeekLow", data.getFiftyTwoWeekLow());
        map.put("volume", data.getVolume());
        map.put("avgVolume", data.getAvgVolume());
        map.put("marketCap", data.getMarketCap());
        map.put("pe", data.getPe());
        map.put("eps", data.getEps());
        map.put("exchange", data.getExchange());
        map.put("positive", data.isPositive());
        map.put("lastUpdated", data.getLastUpdated());
        return map;
    }
}
