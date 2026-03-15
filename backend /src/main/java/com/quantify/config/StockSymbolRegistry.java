package com.quantify.config;

import lombok.Getter;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

/**
 * Single source of truth for NSE stocks and indices used across Market, MACD, and Dashboard.
 * Supports smart partial search (e.g. "hdfc" matches HDFC Bank, HDFC Life).
 */
@Getter
public class StockSymbolRegistry {

    public static final List<StockInfo> ALL_SYMBOLS = new ArrayList<>();

    static {
        // Banking & Financial Services (12)
        add("HDFCBANK.NS", "HDFC Bank", "Banking & Financial Services", "hdfc", "bank");
        add("ICICIBANK.NS", "ICICI Bank", "Banking & Financial Services", "icici", "bank");
        add("SBIN.NS", "State Bank of India", "Banking & Financial Services", "sbi", "state bank", "bank");
        add("AXISBANK.NS", "Axis Bank", "Banking & Financial Services", "axis", "bank");
        add("KOTAKBANK.NS", "Kotak Mahindra Bank", "Banking & Financial Services", "kotak", "bank");
        add("BAJFINANCE.NS", "Bajaj Finance", "Banking & Financial Services", "bajaj", "finance");
        add("BAJAJFINSV.NS", "Bajaj Finserv", "Banking & Financial Services", "bajaj", "finserv");
        add("INDUSINDBK.NS", "IndusInd Bank", "Banking & Financial Services", "indusind", "bank");
        add("JIOFIN.NS", "Jio Financial Services", "Banking & Financial Services", "jio", "financial");
        add("SHRIRAMFIN.NS", "Shriram Finance", "Banking & Financial Services", "shriram", "finance");
        add("HDFCLIFE.NS", "HDFC Life Insurance", "Banking & Financial Services", "hdfc", "life", "insurance");
        add("SBILIFE.NS", "SBI Life Insurance", "Banking & Financial Services", "sbi", "life", "insurance");

        // Information Technology (6)
        add("TCS.NS", "Tata Consultancy Services", "Information Technology", "tcs", "tata", "consultancy");
        add("INFY.NS", "Infosys", "Information Technology", "infy", "infosys");
        add("HCLTECH.NS", "HCL Technologies", "Information Technology", "hcl", "tech");
        add("WIPRO.NS", "Wipro", "Information Technology", "wipro");
        add("TECHM.NS", "Tech Mahindra", "Information Technology", "tech", "mahindra");
        add("LTIM.NS", "LTIMindtree", "Information Technology", "ltim", "mindtree", "lti");

        // Energy: Oil, Gas & Power (6)
        add("RELIANCE.NS", "Reliance Industries", "Energy", "reliance", "ril");
        add("ONGC.NS", "ONGC", "Energy", "ongc", "oil", "gas");
        add("NTPC.NS", "NTPC", "Energy", "ntpc", "power");
        add("POWERGRID.NS", "Power Grid Corporation", "Energy", "power", "grid");
        add("BPCL.NS", "BPCL", "Energy", "bpcl", "bharat petroleum");
        add("COALINDIA.NS", "Coal India", "Energy", "coal", "india");

        // Automobiles & Components (6)
        add("MAHINDRA.NS", "Mahindra & Mahindra", "Automobiles", "mahindra", "m&m", "m and m");
        add("MARUTI.NS", "Maruti Suzuki", "Automobiles", "maruti", "suzuki");
        add("TATAMOTORS.NS", "Tata Motors", "Automobiles", "tata", "motors");
        add("BAJAJ-AUTO.NS", "Bajaj Auto", "Automobiles", "bajaj", "auto");
        add("EICHERMOT.NS", "Eicher Motors", "Automobiles", "eicher", "motors");
        add("HEROMOTOCO.NS", "Hero MotoCorp", "Automobiles", "hero", "moto");

        // Consumer Goods & Retail (6)
        add("HINDUNILVR.NS", "Hindustan Unilever", "Consumer Goods", "hul", "unilever", "hindunilvr");
        add("ITC.NS", "ITC", "Consumer Goods", "itc");
        add("NESTLEIND.NS", "Nestle India", "Consumer Goods", "nestle");
        add("BRITANNIA.NS", "Britannia Industries", "Consumer Goods", "britannia");
        add("TATACONSUM.NS", "Tata Consumer Products", "Consumer Goods", "tata", "consumer");
        add("TRENT.NS", "Trent", "Consumer Goods", "trent", "retail");

        // Healthcare (4)
        add("SUNPHARMA.NS", "Sun Pharma", "Healthcare", "sun", "pharma", "sunpharma");
        add("CIPLA.NS", "Cipla", "Healthcare", "cipla");
        add("DRREDDY.NS", "Dr. Reddy's Laboratories", "Healthcare", "dr", "reddy", "reddys");
        add("APOLLOHOSP.NS", "Apollo Hospitals", "Healthcare", "apollo", "hospitals");

        // Metals, Mining & Materials (5)
        add("TATASTEEL.NS", "Tata Steel", "Metals & Mining", "tata", "steel");
        add("JSWSTEEL.NS", "JSW Steel", "Metals & Mining", "jsw", "steel");
        add("HINDALCO.NS", "Hindalco Industries", "Metals & Mining", "hindalco");
        add("ULTRACEMCO.NS", "UltraTech Cement", "Metals & Mining", "ultratech", "cement");
        add("GRASIM.NS", "Grasim Industries", "Metals & Mining", "grasim");

        // Others (5)
        add("LT.NS", "Larsen & Toubro", "Construction", "lt", "l&t", "larsen", "toubro");
        add("BHARTIARTL.NS", "Bharti Airtel", "Telecom", "bharti", "airtel");
        add("TITAN.NS", "Titan Company", "Consumer Durables", "titan");
        add("ADANIPORTS.NS", "Adani Ports & SEZ", "Services", "adani", "ports");
        add("BEL.NS", "Bharat Electronics", "Capital Goods", "bel", "bharat", "electronics");

        // Indices
        add("^NSEI", "NIFTY 50", "Index", "nifty", "nifty50", "nse");
        add("^BSESN", "SENSEX", "Index", "sensex", "bse");
        add("^NSEBANK", "Nifty Bank", "Index", "bank", "nifty bank", "bank nifty");
    }

    private static void add(String symbol, String companyName, String sector, String... searchTerms) {
        ALL_SYMBOLS.add(new StockInfo(symbol, companyName, sector, searchTerms));
    }

    /**
     * Returns all symbols for market/MACD dropdown and listing.
     */
    public static List<StockInfo> getAllSymbols() {
        return List.copyOf(ALL_SYMBOLS);
    }

    /**
     * Smart partial search: matches symbol (without exchange suffix), company name, or any search term.
     * Case-insensitive; query can be a substring (e.g. "hdfc" matches HDFC Bank, HDFC Life).
     */
    public static List<StockInfo> search(String query) {
        if (query == null || query.isBlank()) {
            return getAllSymbols();
        }
        String q = query.trim().toLowerCase(Locale.ROOT);
        return ALL_SYMBOLS.stream()
                .filter(info -> matches(info, q))
                .toList();
    }

    private static boolean matches(StockInfo info, String q) {
        String symbolBase = info.getSymbol().replace(".NS", "").toLowerCase(Locale.ROOT);
        if (symbolBase.contains(q)) return true;
        if (info.getCompanyName().toLowerCase(Locale.ROOT).contains(q)) return true;
        return Stream.of(info.getSearchTerms()).anyMatch(term -> term.toLowerCase(Locale.ROOT).contains(q) || q.contains(term.toLowerCase(Locale.ROOT)));
    }

    public static List<String> getSymbolsOnly() {
        return ALL_SYMBOLS.stream().map(StockInfo::getSymbol).toList();
    }

    public static String getCompanyName(String symbol) {
        return ALL_SYMBOLS.stream()
                .filter(s -> s.getSymbol().equalsIgnoreCase(symbol))
                .map(StockInfo::getCompanyName)
                .findFirst()
                .orElse(symbol);
    }

    @Getter
    public static class StockInfo {
        private final String symbol;
        private final String companyName;
        private final String sector;
        private final String[] searchTerms;

        public StockInfo(String symbol, String companyName, String sector, String... searchTerms) {
            this.symbol = symbol;
            this.companyName = companyName;
            this.sector = sector;
            this.searchTerms = searchTerms != null ? searchTerms : new String[0];
        }
    }
}
