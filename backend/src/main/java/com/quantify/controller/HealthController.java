package com.quantify.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    // If you have database, inject it here to ping it
    // @Autowired
    // private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @GetMapping("/healthz")
    public ResponseEntity<Map<String, Object>> healthz() {
        Map<String, Object> response = new HashMap<>();
        try {
            // If you have database, ping it
            // jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            
            response.put("status", "healthy");
            response.put("timestamp", Instant.now().toString());
            // Uptime in seconds
            response.put("uptime", ManagementFactory.getRuntimeMXBean().getUptime() / 1000.0);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "unhealthy");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }

    // A simple ping endpoint as requested
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }
}
