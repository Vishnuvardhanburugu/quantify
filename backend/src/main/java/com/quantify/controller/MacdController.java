package com.quantify.controller;

import com.quantify.dto.MacdAnalysisResponse;
import com.quantify.dto.MacdPointResponse;
import com.quantify.service.MacdService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/macd")
@RequiredArgsConstructor
public class MacdController {

    private final MacdService macdService;

    @GetMapping("/analysis/{symbol}")
    public ResponseEntity<MacdAnalysisResponse> getAnalysis(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "12") int shortPeriod,
            @RequestParam(defaultValue = "26") int longPeriod,
            @RequestParam(defaultValue = "9") int signalPeriod,
            @RequestParam(defaultValue = "200") int days,
            @RequestParam(defaultValue = "1.0") BigDecimal riskPercent,
            @RequestParam(defaultValue = "2.0") BigDecimal rewardPercent
    ) {
        MacdAnalysisResponse analysis = macdService.getLatestMacdAnalysis(
                symbol, shortPeriod, longPeriod, signalPeriod, days, riskPercent, rewardPercent);
        return ResponseEntity.ok(analysis);
    }

    @PostMapping("/calculate/{symbol}")
    public ResponseEntity<List<MacdPointResponse>> calculate(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "12") int shortPeriod,
            @RequestParam(defaultValue = "26") int longPeriod,
            @RequestParam(defaultValue = "9") int signalPeriod,
            @RequestParam(defaultValue = "200") int days
    ) {
        List<MacdPointResponse> points = macdService.calculateMacdForSymbol(
                symbol, shortPeriod, longPeriod, signalPeriod, days);
        return ResponseEntity.ok(points);
    }

    @GetMapping("/history/{symbol}")
    public ResponseEntity<List<MacdPointResponse>> history(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "30") int days
    ) {
        List<MacdPointResponse> history = macdService.getMacdHistory(symbol, days);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/bulk-analysis")
    public ResponseEntity<List<MacdAnalysisResponse>> bulkAnalysis(
            @RequestBody List<String> symbols,
            @RequestParam(defaultValue = "12") int shortPeriod,
            @RequestParam(defaultValue = "26") int longPeriod,
            @RequestParam(defaultValue = "9") int signalPeriod,
            @RequestParam(defaultValue = "200") int days,
            @RequestParam(defaultValue = "1.0") BigDecimal riskPercent,
            @RequestParam(defaultValue = "2.0") BigDecimal rewardPercent
    ) {
        List<MacdAnalysisResponse> results = macdService.bulkAnalysis(
                symbols, shortPeriod, longPeriod, signalPeriod, days, riskPercent, rewardPercent);
        return ResponseEntity.ok(results);
    }
}

