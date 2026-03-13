package com.quantify.repository;

import com.quantify.model.Portfolio;
import com.quantify.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    List<Portfolio> findByUserOrderBySymbolAsc(User user);
    
    List<Portfolio> findByUserId(Long userId);

    Optional<Portfolio> findByUserAndSymbol(User user, String symbol);

    Optional<Portfolio> findByIdAndUser(Long id, User user);

    boolean existsByUserAndSymbol(User user, String symbol);

    @Query("SELECT SUM(p.investedValue) FROM Portfolio p WHERE p.user = :user")
    BigDecimal getTotalInvestedValue(@Param("user") User user);

    @Query("SELECT SUM(p.currentValue) FROM Portfolio p WHERE p.user = :user")
    BigDecimal getTotalCurrentValue(@Param("user") User user);

    @Query("SELECT SUM(p.profitLoss) FROM Portfolio p WHERE p.user = :user")
    BigDecimal getTotalProfitLoss(@Param("user") User user);

    @Query("SELECT COUNT(p) FROM Portfolio p WHERE p.user = :user")
    Long getHoldingsCount(@Param("user") User user);

    void deleteByIdAndUser(Long id, User user);
}
