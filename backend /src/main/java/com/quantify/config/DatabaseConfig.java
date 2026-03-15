package com.quantify.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
@Slf4j
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSource dataSource() {
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            throw new IllegalStateException("DATABASE_URL environment variable is not set");
        }

        log.info("Configuring database connection...");
        
        // Clean the URL - remove any unsupported params like channel_binding
        String cleanUrl = databaseUrl
            .replaceAll("[&?]channel_binding=[^&]*", "")
            .replace("&&", "&")
            .replaceAll("\\?&", "?")
            .replaceAll("[&?]$", "");
        
        // Ensure it starts with jdbc:
        if (!cleanUrl.startsWith("jdbc:")) {
            if (cleanUrl.startsWith("postgres://")) {
                cleanUrl = "jdbc:postgresql://" + cleanUrl.substring("postgres://".length());
            } else if (cleanUrl.startsWith("postgresql://")) {
                cleanUrl = "jdbc:" + cleanUrl;
            }
        }
        
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(cleanUrl);
        config.setMaximumPoolSize(3);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        
        // Extract host for logging (don't log credentials)
        String host = extractHost(cleanUrl);
        log.info("Database configured: host={}", host);
        
        return new HikariDataSource(config);
    }
    
    private String extractHost(String url) {
        try {
            // Extract just the host part for logging
            int start = url.indexOf("://") + 3;
            int end = url.indexOf("/", start);
            if (end == -1) end = url.indexOf("?", start);
            if (end == -1) end = url.length();
            String hostPort = url.substring(start, end);
            // Remove any user:pass@ prefix
            if (hostPort.contains("@")) {
                hostPort = hostPort.substring(hostPort.indexOf("@") + 1);
            }
            return hostPort;
        } catch (Exception e) {
            return "unknown";
        }
    }
}
