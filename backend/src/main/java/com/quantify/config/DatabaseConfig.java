package com.quantify.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
@Slf4j
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSource dataSource() {
        String[] parsedConfig = parseDatabaseUrl(databaseUrl);
        String jdbcUrl = parsedConfig[0];
        String username = parsedConfig[1];
        String password = parsedConfig[2];
        
        log.info("Configuring database connection...");
        
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        
        if (username != null && !username.isEmpty()) {
            config.setUsername(username);
        }
        if (password != null && !password.isEmpty()) {
            config.setPassword(password);
        }
        
        config.setMaximumPoolSize(3);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        
        return new HikariDataSource(config);
    }

    /**
     * Parses various database URL formats and returns [jdbcUrl, username, password]
     * 
     * Handles:
     * - postgres://user:pass@host:port/db (Heroku/Render style)
     * - postgresql://user:pass@host:port/db
     * - jdbc:postgresql://user:pass@host:port/db (incorrect but common)
     * - jdbc:postgresql://host:port/db?user=x&password=y (correct JDBC style)
     */
    private String[] parseDatabaseUrl(String url) {
        if (url == null || url.isEmpty()) {
            log.info("No DATABASE_URL found, falling back to in-memory H2 database.");
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl("jdbc:h2:mem:testdb");
            config.setDriverClassName("org.h2.Driver");
            config.setUsername("sa");
            config.setPassword("");
            return new String[]{"jdbc:h2:mem:testdb", "sa", ""};
        }

        String username = null;
        String password = null;
        String jdbcUrl;

        try {
            // Remove jdbc: prefix if present for parsing
            String parseableUrl = url;
            if (url.startsWith("jdbc:")) {
                parseableUrl = url.substring(5); // Remove "jdbc:"
            }
            
            // Convert postgres:// to postgresql:// for URI parsing
            if (parseableUrl.startsWith("postgres://")) {
                parseableUrl = parseableUrl.replace("postgres://", "postgresql://");
            }

            URI uri = new URI(parseableUrl);
            
            // Extract credentials from URI if present (user:pass@host format)
            String userInfo = uri.getUserInfo();
            if (userInfo != null && !userInfo.isEmpty()) {
                String[] credentials = userInfo.split(":", 2);
                username = credentials[0];
                if (credentials.length > 1) {
                    password = credentials[1];
                }
            }

            // Build clean JDBC URL without credentials in the path
            String host = uri.getHost();
            int port = uri.getPort();
            String path = uri.getPath(); // This is the database name like /postgres
            String query = uri.getQuery();
            
            // Remove channel_binding if present
            if (query != null) {
                query = query.replaceAll("&?channel_binding=[^&]*", "");
                query = query.replaceAll("^&", ""); // Remove leading &
            }

            StringBuilder urlBuilder = new StringBuilder();
            urlBuilder.append("jdbc:postgresql://");
            urlBuilder.append(host);
            if (port > 0) {
                urlBuilder.append(":").append(port);
            }
            urlBuilder.append(path != null ? path : "/postgres");
            
            // Add query parameters if any remain
            if (query != null && !query.isEmpty()) {
                urlBuilder.append("?").append(query);
            }
            
            jdbcUrl = urlBuilder.toString();
            
            // If credentials weren't in userInfo, check query params
            if (username == null && query != null) {
                for (String param : query.split("&")) {
                    String[] kv = param.split("=", 2);
                    if (kv.length == 2) {
                        if ("user".equals(kv[0])) username = kv[1];
                        if ("password".equals(kv[0])) password = kv[1];
                    }
                }
            }

            log.info("Database configured: host={}, port={}", host, port > 0 ? port : 5432);
            
        } catch (Exception e) {
            log.error("Failed to parse DATABASE_URL: {}", e.getMessage());
            throw new IllegalStateException("Invalid DATABASE_URL format", e);
        }

        return new String[]{jdbcUrl, username, password};
    }
}
