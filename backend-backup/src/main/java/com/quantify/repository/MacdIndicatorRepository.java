package com.quantify.repository;

import com.quantify.model.MacdIndicator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MacdIndicatorRepository extends JpaRepository<MacdIndicator, Long> {

    List<MacdIndicator> findBySymbolOrderByDateDesc(String symbol);

    List<MacdIndicator> findBySymbolAndDateBetweenOrderByDateAsc(String symbol, LocalDate start, LocalDate end);

    Optional<MacdIndicator> findFirstBySymbolOrderByDateDesc(String symbol);

    @Query("SELECT m FROM MacdIndicator m " +
            "WHERE m.symbol = :symbol AND m.signal IN :signals " +
            "ORDER BY m.date DESC")
    List<MacdIndicator> findRecentBySymbolAndSignals(@Param("symbol") String symbol,
                                                     @Param("signals") List<MacdIndicator.Signal> signals);
}

