package com.quantify.config;

import com.quantify.model.*;
import com.quantify.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final TradeRepository tradeRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedData() {
        return args -> {
            try {
                if (userRepository.count() == 0) {
                    log.info("Seeding demo data...");

                    // Create demo user
                    User demoUser = User.builder()
                            .name("Demo Trader")
                            .email("demo@trading.com")
                            .password(passwordEncoder.encode("demo123"))
                            .riskProfile(User.RiskProfile.MODERATE)
                            .build();
                    demoUser = userRepository.save(demoUser);

                    // Create portfolio holdings
                    List<Portfolio> holdings = List.of(
                            Portfolio.builder()
                                    .user(demoUser)
                                    .symbol("RELIANCE.NS")
                                    .companyName("Reliance Industries")
                                    .quantity(50)
                                    .averagePrice(new BigDecimal("2450.75"))
                                    .currentPrice(new BigDecimal("2520.50"))
                                    .build(),
                            Portfolio.builder()
                                    .user(demoUser)
                                    .symbol("TCS.NS")
                                    .companyName("Tata Consultancy Services")
                                    .quantity(30)
                                    .averagePrice(new BigDecimal("3850.00"))
                                    .currentPrice(new BigDecimal("3920.25"))
                                    .build(),
                            Portfolio.builder()
                                    .user(demoUser)
                                    .symbol("INFY.NS")
                                    .companyName("Infosys Limited")
                                    .quantity(100)
                                    .averagePrice(new BigDecimal("1520.75"))
                                    .currentPrice(new BigDecimal("1485.30"))
                                    .build(),
                            Portfolio.builder()
                                    .user(demoUser)
                                    .symbol("HDFCBANK.NS")
                                    .companyName("HDFC Bank")
                                    .quantity(40)
                                    .averagePrice(new BigDecimal("1650.00"))
                                    .currentPrice(new BigDecimal("1720.80"))
                                    .build(),
                            Portfolio.builder()
                                    .user(demoUser)
                                    .symbol("ICICIBANK.NS")
                                    .companyName("ICICI Bank")
                                    .quantity(60)
                                    .averagePrice(new BigDecimal("980.50"))
                                    .currentPrice(new BigDecimal("1015.25"))
                                    .build()
                    );
                    portfolioRepository.saveAll(holdings);

                    // Create trade history
                    List<Trade> trades = List.of(
                            Trade.builder()
                                    .user(demoUser)
                                    .symbol("RELIANCE.NS")
                                    .companyName("Reliance Industries")
                                    .type(Trade.TradeType.BUY)
                                    .quantity(50)
                                    .price(new BigDecimal("2450.75"))
                                    .sentiment(Trade.Sentiment.BULLISH)
                                    .notes("Long-term investment")
                                    .build(),
                            Trade.builder()
                                    .user(demoUser)
                                    .symbol("TCS.NS")
                                    .companyName("Tata Consultancy Services")
                                    .type(Trade.TradeType.BUY)
                                    .quantity(30)
                                    .price(new BigDecimal("3850.00"))
                                    .sentiment(Trade.Sentiment.BULLISH)
                                    .notes("IT sector play")
                                    .build(),
                            Trade.builder()
                                    .user(demoUser)
                                    .symbol("WIPRO.NS")
                                    .companyName("Wipro Limited")
                                    .type(Trade.TradeType.BUY)
                                    .quantity(80)
                                    .price(new BigDecimal("420.50"))
                                    .sentiment(Trade.Sentiment.NEUTRAL)
                                    .build(),
                            Trade.builder()
                                    .user(demoUser)
                                    .symbol("WIPRO.NS")
                                    .companyName("Wipro Limited")
                                    .type(Trade.TradeType.SELL)
                                    .quantity(80)
                                    .price(new BigDecimal("445.25"))
                                    .profitLoss(new BigDecimal("1980.00"))
                                    .sentiment(Trade.Sentiment.NEUTRAL)
                                    .notes("Profit booking")
                                    .build(),
                            Trade.builder()
                                    .user(demoUser)
                                    .symbol("INFY.NS")
                                    .companyName("Infosys Limited")
                                    .type(Trade.TradeType.BUY)
                                    .quantity(100)
                                    .price(new BigDecimal("1520.75"))
                                    .sentiment(Trade.Sentiment.BULLISH)
                                    .build(),
                            Trade.builder()
                                    .user(demoUser)
                                    .symbol("HDFCBANK.NS")
                                    .companyName("HDFC Bank")
                                    .type(Trade.TradeType.BUY)
                                    .quantity(40)
                                    .price(new BigDecimal("1650.00"))
                                    .sentiment(Trade.Sentiment.BULLISH)
                                    .notes("Banking sector position")
                                    .build(),
                            Trade.builder()
                                    .user(demoUser)
                                    .symbol("ICICIBANK.NS")
                                    .companyName("ICICI Bank")
                                    .type(Trade.TradeType.BUY)
                                    .quantity(60)
                                    .price(new BigDecimal("980.50"))
                                    .sentiment(Trade.Sentiment.BULLISH)
                                    .build(),
                            Trade.builder()
                                    .user(demoUser)
                                    .symbol("SBIN.NS")
                                    .companyName("State Bank of India")
                                    .type(Trade.TradeType.BUY)
                                    .quantity(100)
                                    .price(new BigDecimal("625.00"))
                                    .sentiment(Trade.Sentiment.BULLISH)
                                    .build(),
                            Trade.builder()
                                    .user(demoUser)
                                    .symbol("SBIN.NS")
                                    .companyName("State Bank of India")
                                    .type(Trade.TradeType.SELL)
                                    .quantity(100)
                                    .price(new BigDecimal("598.50"))
                                    .profitLoss(new BigDecimal("-2650.00"))
                                    .sentiment(Trade.Sentiment.BEARISH)
                                    .notes("Stop loss triggered")
                                    .build()
                    );
                    tradeRepository.saveAll(trades);

                    log.info("Demo data seeded successfully!");
                    log.info("Demo credentials: demo@trading.com / demo123");
                } else {
                    log.info("Database already contains data, skipping seed.");
                }
            } catch (Exception e) {
                log.warn("Could not seed demo data (this is OK for production): {}", e.getMessage());
                // Don't fail startup if seeding fails
            }
        };
    }
}
