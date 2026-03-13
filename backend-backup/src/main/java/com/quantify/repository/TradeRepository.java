package com.quantify.repository;

import com.quantify.model.Trade;
import com.quantify.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {

    Page<Trade> findByUserOrderByExecutedAtDesc(User user, Pageable pageable);

    List<Trade> findByUserOrderByExecutedAtDesc(User user);

    List<Trade> findByUserAndExecutedAtAfterOrderByExecutedAtDesc(User user, LocalDateTime after);

    List<Trade> findByUserAndSymbolOrderByExecutedAtDesc(User user, String symbol);

    @Query("SELECT COUNT(t) FROM Trade t WHERE t.user = :user")
    Long getTotalTradesCount(@Param("user") User user);

    @Query("SELECT COUNT(t) FROM Trade t WHERE t.user = :user AND t.profitLoss > 0")
    Long getWinningTradesCount(@Param("user") User user);

    @Query("SELECT t.symbol, COUNT(t) as tradeCount FROM Trade t WHERE t.user = :user GROUP BY t.symbol ORDER BY tradeCount DESC")
    List<Object[]> getTopTradedSymbols(@Param("user") User user, Pageable pageable);

    @Query("SELECT t.type, COUNT(t) FROM Trade t WHERE t.user = :user GROUP BY t.type")
    List<Object[]> getTradeTypeDistribution(@Param("user") User user);

    @Query("SELECT SUM(t.profitLoss) FROM Trade t WHERE t.user = :user")
    java.math.BigDecimal getTotalProfitLoss(@Param("user") User user);

    @Query("SELECT t FROM Trade t WHERE t.user = :user AND t.executedAt >= :startDate ORDER BY t.executedAt DESC")
    List<Trade> findRecentTrades(@Param("user") User user, @Param("startDate") LocalDateTime startDate);
}
