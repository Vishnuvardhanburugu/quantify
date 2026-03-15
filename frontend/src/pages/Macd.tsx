import { useState, useDeferredValue, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CandlestickChart, type OhlcPoint, type OverlayLine } from "@/components/CandlestickChart";
import { Activity, ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Briefcase, AlertTriangle, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type MacdSignal = "BUY" | "SELL" | "HOLD" | "STRONG_BUY" | "STRONG_SELL";

type MacdPoint = {
  date: string;
  closePrice: number;
  emaShort: number;
  emaLong: number;
  macdLine: number;
  signalLine: number;
  histogram: number;
  signal: MacdSignal;
  strength: number;
};

type MacdTrend = {
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  strength: "WEAK" | "MODERATE" | "STRONG";
  divergence: boolean;
};

type MacdCurrent = {
  macdLine: number;
  signalLine: number;
  histogram: number;
  signal: MacdSignal;
  strength: number;
  recommendation: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
};

type MacdAnalysis = {
  symbol: string;
  current: MacdCurrent;
  trend: MacdTrend;
  overallRecommendation: string;
  confidence: number;
};

const macdChartConfig = {
  macdLine: {
    label: "MACD",
    theme: {
      light: "hsl(222.2 84% 56.5%)",
      dark: "hsl(210 40% 98%)",
    },
  },
  signalLine: {
    label: "Signal",
    theme: {
      light: "hsl(0 84% 60%)",
      dark: "hsl(0 84% 60%)",
    },
  },
  histogram: {
    label: "Histogram",
    theme: {
      light: "hsl(142.1 76.2% 36.3%)",
      dark: "hsl(142.1 76.2% 36.3%)",
    },
  },
} satisfies ChartConfig;

const priceChartConfig = {
  closePrice: {
    label: "Close Price",
    theme: {
      light: "hsl(47.9 95.8% 53.1%)",
      dark: "hsl(47.9 95.8% 53.1%)",
    },
  },
} satisfies ChartConfig;

const signalColor = (signal?: MacdSignal) => {
  switch (signal) {
    case "STRONG_BUY":
      return "bg-emerald-500 text-emerald-50";
    case "BUY":
      return "bg-emerald-100 text-emerald-700";
    case "STRONG_SELL":
      return "bg-red-600 text-red-50";
    case "SELL":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const trendColor = (trend?: MacdTrend) => {
  if (!trend) return "text-muted-foreground";
  if (trend.direction === "BULLISH") return "text-emerald-600";
  if (trend.direction === "BEARISH") return "text-red-600";
  return "text-muted-foreground";
};

function emaSeries(values: number[], period: number): number[] {
  if (values.length === 0 || period < 1) return [];
  const mult = 2 / (period + 1);
  const out: number[] = [];
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(NaN);
    } else if (i === period - 1) {
      ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      out.push(ema);
    } else {
      ema = (values[i] - ema) * mult + ema;
      out.push(ema);
    }
  }
  return out;
}

type CrossoverSuggestion = "BUY" | "SELL" | "HOLD" | null;
type CrossoverState = {
  suggestion: CrossoverSuggestion;
  reason: string;
  lastBullishDate: string | null;
  lastBearishDate: string | null;
  shortAboveLong: boolean;
};

function getCrossoverState(
  history: MacdPoint[],
  emaShort: number[],
  emaLong: number[],
  takeProfit: number | undefined
): CrossoverState {
  const result: CrossoverState = {
    suggestion: null,
    reason: "",
    lastBullishDate: null,
    lastBearishDate: null,
    shortAboveLong: false,
  };
  if (!history?.length || emaShort.length !== history.length || emaLong.length !== history.length) return result;

  for (let i = 1; i < history.length; i++) {
    const s0 = emaShort[i - 1], s1 = emaShort[i];
    const l0 = emaLong[i - 1], l1 = emaLong[i];
    if (Number.isNaN(s0) || Number.isNaN(l0) || Number.isNaN(s1) || Number.isNaN(l1)) continue;
    if (s0 <= l0 && s1 > l1) result.lastBullishDate = history[i].date;
    if (s0 >= l0 && s1 < l1) result.lastBearishDate = history[i].date;
  }

  const lastIdx = history.length - 1;
  const s = emaShort[lastIdx], l = emaLong[lastIdx];
  result.shortAboveLong = typeof s === "number" && typeof l === "number" && !Number.isNaN(s) && !Number.isNaN(l) && s > l;
  const currentPrice = history[lastIdx]?.closePrice ?? 0;
  const targetHit = takeProfit != null && currentPrice >= takeProfit;

  if (targetHit) {
    result.suggestion = "SELL";
    result.reason = `Take profit reached (price ≥ ₹${takeProfit.toFixed(2)}).`;
    return result;
  }

  const lastBullish = result.lastBullishDate ?? "";
  const lastBearish = result.lastBearishDate ?? "";
  const lastCrossoverWasBullish = lastBullish > lastBearish;

  if (lastBullish === "" && lastBearish === "") {
    result.suggestion = "HOLD";
    result.reason = "No crossover yet in this window — short and long overlay have not crossed.";
    return result;
  }

  if (lastCrossoverWasBullish) {
    result.suggestion = "BUY";
    result.reason = "Short overlay crossed above long (bullish crossover) — consider buy; use your stop/target ratio.";
  } else {
    result.suggestion = "SELL";
    result.reason = "Short overlay crossed below long (bearish crossover) — exit or avoid new buys.";
  }
  return result;
}

type SymbolOption = { symbol: string; companyName: string; sector: string };

const Macd = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState("");
  const [symbolInput, setSymbolInput] = useState("");
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [shortPeriod, setShortPeriod] = useState(12);
  const [longPeriod, setLongPeriod] = useState(26);
  const [signalPeriod, setSignalPeriod] = useState(9);
  const [riskPercent, setRiskPercent] = useState(1);
  const [rewardPercent, setRewardPercent] = useState(2);
  const [historyDays, setHistoryDays] = useState(90);
  const [overlayShortDays, setOverlayShortDays] = useState(10);
  const [overlayLongDays, setOverlayLongDays] = useState(15);

  // Portfolio auto-sell state
  const [selectedPortfolioSymbol, setSelectedPortfolioSymbol] = useState("");
  const [autoSellQty, setAutoSellQty] = useState<number>(0);
  const [autoSellEnabled, setAutoSellEnabled] = useState(false);
  const [autoSellTriggered, setAutoSellTriggered] = useState(false);
  const [showAutoSellConfirm, setShowAutoSellConfirm] = useState(false);
  const [funds, setFunds] = useState<number>(0);
  const autoSellProcessing = useRef(false);

  // Load funds
  useEffect(() => {
    const storedFunds = localStorage.getItem("userFunds");
    if (storedFunds) setFunds(Number(storedFunds));
    const handleFundsChange = () => {
      const f = localStorage.getItem("userFunds");
      if (f) setFunds(Number(f));
    };
    window.addEventListener("fundsUpdated", handleFundsChange);
    window.addEventListener("storage", handleFundsChange);
    return () => {
      window.removeEventListener("fundsUpdated", handleFundsChange);
      window.removeEventListener("storage", handleFundsChange);
    };
  }, []);

  const updateFunds = useCallback((newFunds: number) => {
    setFunds(newFunds);
    localStorage.setItem("userFunds", String(newFunds));
    window.dispatchEvent(new Event("fundsUpdated"));
  }, []);

  // Fetch portfolio holdings
  const { data: holdings } = useQuery({
    queryKey: ["holdings"],
    queryFn: async () => {
      const response = await api.get("/portfolio");
      return response.data;
    },
  });

  const portfolioStocks = useMemo(() => {
    if (!Array.isArray(holdings)) return [];
    return holdings.filter((h: any) => h.quantity > 0);
  }, [holdings]);

  const selectedHolding = useMemo(() => {
    return portfolioStocks.find((h: any) => h.symbol === selectedPortfolioSymbol);
  }, [portfolioStocks, selectedPortfolioSymbol]);

  // Auto-sell trade mutation
  const autoSellMutation = useMutation({
    mutationFn: async (payload: { symbol: string; companyName: string; quantity: number; price: number }) => {
      return await api.post("/trades", {
        symbol: payload.symbol,
        companyName: payload.companyName,
        type: "SELL",
        quantity: payload.quantity,
        price: payload.price,
        sentiment: "NEUTRAL",
        notes: "Auto-sold by MACD crossover signal",
      });
    },
    onSuccess: (_data, variables) => {
      const proceeds = variables.quantity * variables.price;
      updateFunds(funds + proceeds);
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["tradeStats"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioSummary"] });
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      autoSellProcessing.current = false;
      toast({
        title: "\u2705 Auto-Sell Executed!",
        description: `Sold ${variables.quantity} shares of ${variables.symbol.replace(".NS", "")} at \u20b9${variables.price.toLocaleString()}. Proceeds \u20b9${proceeds.toLocaleString()} added to your funds.`,
      });
    },
    onError: (error: any) => {
      autoSellProcessing.current = false;
      toast({
        variant: "destructive",
        title: "Auto-Sell Failed",
        description: error.response?.data?.message || "Failed to execute auto-sell trade.",
      });
    },
  });

  // Reset auto-sell triggered state when user changes stock or disables auto-sell
  useEffect(() => {
    setAutoSellTriggered(false);
    autoSellProcessing.current = false;
  }, [selectedPortfolioSymbol, autoSellEnabled]);

  // Auto-detect if the currently analyzed symbol exists in portfolio
  useEffect(() => {
    if (!symbol || !portfolioStocks.length) {
      setSelectedPortfolioSymbol("");
      setAutoSellQty(0);
      setAutoSellEnabled(false);
      return;
    }
    const found = portfolioStocks.find((h: any) => h.symbol === symbol);
    if (found) {
      setSelectedPortfolioSymbol(found.symbol);
      setAutoSellQty(0); // User decides how many to sell
    } else {
      setSelectedPortfolioSymbol("");
      setAutoSellQty(0);
      setAutoSellEnabled(false);
    }
  }, [symbol, portfolioStocks]);

  const deferredSearch = useDeferredValue(symbolInput);
  const { data: symbolOptions } = useQuery<SymbolOption[]>({
    queryKey: ["marketSymbols", deferredSearch],
    queryFn: async () => {
      const res = await api.get("/market/symbols", {
        params: deferredSearch ? { q: deferredSearch } : {},
      });
      return res.data;
    },
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (!symbol || !symbolOptions?.length) return;
    const found = symbolOptions.find((s) => s.symbol === symbol);
    if (found) setSymbolInput(`${found.companyName} (${found.symbol})`);
  }, [symbol, symbolOptions]);

  const { data: analysis, isLoading: loadingAnalysis } = useQuery<MacdAnalysis>({
    queryKey: ["macdAnalysis", symbol, shortPeriod, longPeriod, signalPeriod, riskPercent, rewardPercent],
    queryFn: async () => {
      const response = await api.get(`/macd/analysis/${encodeURIComponent(symbol)}`, {
        params: {
          shortPeriod,
          longPeriod,
          signalPeriod,
          days: Math.max(historyDays, longPeriod + signalPeriod + 10),
          riskPercent,
          rewardPercent,
        },
      });
      return response.data;
    },
    enabled: !!symbol,
    refetchInterval: 60_000,
  });

  const { data: history, isLoading: loadingHistory } = useQuery<MacdPoint[]>({
    queryKey: ["macdHistory", symbol, historyDays],
    queryFn: async () => {
      const response = await api.get(`/macd/history/${encodeURIComponent(symbol)}`, {
        params: { days: historyDays },
      });
      return response.data;
    },
    enabled: !!symbol && !!analysis,
    refetchInterval: 60_000,
  });

  const { data: ohlcData } = useQuery<OhlcPoint[]>({
    queryKey: ["marketHistory", symbol, historyDays],
    queryFn: async () => {
      const res = await api.get(`/market/history/${encodeURIComponent(symbol)}`, {
        params: { days: historyDays },
      });
      return res.data;
    },
    enabled: !!symbol,
    staleTime: 60_000,
  });

  const loading = loadingAnalysis || loadingHistory;

  const overlayCrossover = useMemo(() => {
    if (!history?.length) return null;
    const macdCloses = history.map((d) => d.macdLine);
    const short = emaSeries(macdCloses, overlayShortDays);
    const long = emaSeries(macdCloses, overlayLongDays);
    return {
      emaShort: short,
      emaLong: long,
      state: getCrossoverState(history, short, long, analysis?.current?.takeProfit),
    };
  }, [history, analysis?.current?.takeProfit, overlayShortDays, overlayLongDays]);

  // Auto-sell is only enabled when user presses Enter in the qty input
  // (no auto-enable on keystroke to avoid premature sells while typing)

  // Auto-sell execution: when MACD crossover suggests SELL and auto-sell is enabled
  // NO confirmation dialog — executes immediately
  useEffect(() => {
    if (
      !autoSellEnabled ||
      autoSellTriggered ||
      autoSellProcessing.current ||
      !overlayCrossover?.state ||
      !selectedPortfolioSymbol ||
      !selectedHolding ||
      autoSellQty <= 0
    ) return;

    if (selectedPortfolioSymbol !== symbol) return;

    const suggestion = overlayCrossover.state.suggestion;
    if (suggestion === "SELL") {
      const sellQty = Math.min(autoSellQty, selectedHolding.quantity);
      const price = selectedHolding.currentPrice || selectedHolding.avgPrice;
      autoSellProcessing.current = true;
      setAutoSellTriggered(true);
      toast({
        title: "⚡ Auto-Sell Triggered!",
        description: `MACD SELL signal detected. Selling ${sellQty} shares of ${selectedPortfolioSymbol.replace(".NS", "")} at ₹${price?.toLocaleString()}...`,
      });
      autoSellMutation.mutate({
        symbol: selectedHolding.symbol,
        companyName: selectedHolding.companyName,
        quantity: sellQty,
        price,
      });
    }
  }, [overlayCrossover?.state?.suggestion, autoSellEnabled, autoSellTriggered, selectedPortfolioSymbol, symbol, selectedHolding, autoSellQty]);

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MACD Analysis</h1>
          <p className="text-muted-foreground">
            Visual MACD signals and 1:2 risk–reward levels for NSE/BSE stocks, inspired by TradingView.
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Parameters</CardTitle>
          <CardDescription>Choose symbol and MACD settings. Defaults use 12/26/9 and 1:2 risk–reward.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 relative">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={symbolInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setSymbolInput(v);
                  setSymbolDropdownOpen(true);
                  if (symbol) {
                    const opt = symbolOptions?.find((o) => o.symbol === symbol);
                    if (!opt || v !== `${opt.companyName} (${opt.symbol})`) setSymbol("");
                  }
                }}
                onFocus={() => setSymbolDropdownOpen(true)}
                onBlur={() => setTimeout(() => setSymbolDropdownOpen(false), 200)}
                placeholder="Search by name or symbol (e.g. HDFC, Reliance, Nifty)"
              />
              {symbolDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto">
                  {(symbolOptions?.length ?? 0) > 0 ? (
                    symbolOptions!.map((opt) => (
                      <button
                        key={opt.symbol}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent flex flex-col gap-0.5"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSymbol(opt.symbol);
                          setSymbolInput(`${opt.companyName} (${opt.symbol})`);
                          setSymbolDropdownOpen(false);
                        }}
                      >
                        <span className="font-medium">{opt.companyName}</span>
                        <span className="text-xs text-muted-foreground">
                          {opt.symbol} · {opt.sector}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      Type to search 50+ NSE stocks & indices
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Smart search: type half the name (e.g. &quot;hdfc&quot;, &quot;tata&quot;) to find stocks.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Risk % (Stop Loss)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  min={0.5}
                  max={5}
                  step={0.5}
                  value={[riskPercent]}
                  onValueChange={([v]) => setRiskPercent(v)}
                />
                <span className="w-10 text-right text-sm font-mono">{riskPercent.toFixed(1)}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reward % (Take Profit)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  min={1}
                  max={10}
                  step={0.5}
                  value={[rewardPercent]}
                  onValueChange={([v]) => setRewardPercent(v)}
                />
                <span className="w-10 text-right text-sm font-mono">{rewardPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Short EMA</Label>
              <Input
                type="number"
                min={3}
                max={50}
                value={shortPeriod}
                onChange={(e) => setShortPeriod(Number(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">Typical: 12 or 10</p>
            </div>
            <div className="space-y-2">
              <Label>Long EMA</Label>
              <Input
                type="number"
                min={shortPeriod + 1}
                max={200}
                value={longPeriod}
                onChange={(e) => setLongPeriod(Number(e.target.value) || shortPeriod + 1)}
              />
              <p className="text-xs text-muted-foreground">Typical: 26 or 15</p>
            </div>
            <div className="space-y-2">
              <Label>Signal EMA</Label>
              <Input
                type="number"
                min={3}
                max={50}
                value={signalPeriod}
                onChange={(e) => setSignalPeriod(Number(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">Typical: 9</p>
            </div>
            <div className="space-y-2">
              <Label>History Days</Label>
              <Input
                type="number"
                min={30}
                max={365}
                value={historyDays}
                onChange={(e) => setHistoryDays(Number(e.target.value) || 30)}
              />
              <p className="text-xs text-muted-foreground">Window for the MACD chart</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Auto-Sell Qty
                {autoSellEnabled && !autoSellTriggered && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
                {autoSellTriggered && (
                  <span className="text-emerald-600 text-[10px]">✅</span>
                )}
              </Label>
              <Input
                type="number"
                min={0}
                max={selectedHolding?.quantity ?? 9999}
                value={autoSellQty || ""}
                placeholder={selectedHolding ? "0" : "—"}
                disabled={!selectedHolding}
                onChange={(e) => {
                  setAutoSellQty(Number(e.target.value) || 0);
                  setAutoSellEnabled(false); // Reset on change, only activate on Enter
                  setAutoSellTriggered(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && autoSellQty > 0 && selectedHolding) {
                    setAutoSellEnabled(true);
                    setAutoSellTriggered(false);
                    toast({
                      title: "⚡ Auto-Sell Armed",
                      description: `Will auto-sell ${Math.min(autoSellQty, selectedHolding.quantity)} shares of ${selectedPortfolioSymbol.replace(".NS", "")} when MACD signals SELL.`,
                    });
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {selectedHolding
                  ? autoSellEnabled
                    ? `⚡ Armed: ${Math.min(autoSellQty, selectedHolding.quantity)} shares will auto-sell on SELL signal`
                    : `You hold ${selectedHolding.quantity} shares · type qty & press Enter to arm`
                  : "Select a stock you own"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-border/60">
            <div className="space-y-2">
              <Label>Overlay short (days)</Label>
              <Input
                type="number"
                min={2}
                max={60}
                value={overlayShortDays}
                onChange={(e) => {
                  const v = Number(e.target.value) || 2;
                  setOverlayShortDays(v);
                  if (overlayLongDays <= v) setOverlayLongDays(v + 1);
                }}
              />
              <p className="text-xs text-muted-foreground">Short-period average for crossover line (e.g. 10)</p>
            </div>
            <div className="space-y-2">
              <Label>Overlay long (days)</Label>
              <Input
                type="number"
                min={overlayShortDays + 1}
                max={120}
                value={overlayLongDays}
                onChange={(e) => setOverlayLongDays(Math.max(overlayShortDays + 1, Number(e.target.value) || overlayShortDays + 1))}
              />
              <p className="text-xs text-muted-foreground">Long-period average for crossover line (e.g. 15). Buy when short crosses above long; sell when short crosses below or target hit.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crossover strategy: agent BUY/SELL from overlay overlap */}
      {overlayCrossover?.state && (
        <Card className="glass-card border-2 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Crossover strategy (your ratio: {riskPercent}% stop / {rewardPercent}% target)
              {overlayCrossover.state.suggestion === "BUY" && (
                <Badge className="bg-emerald-600 text-white">Suggest BUY</Badge>
              )}
              {overlayCrossover.state.suggestion === "SELL" && (
                <Badge className="bg-red-600 text-white">Suggest SELL</Badge>
              )}
              {overlayCrossover.state.suggestion === "HOLD" && (
                <Badge className="bg-slate-500 text-white">HOLD</Badge>
              )}
            </CardTitle>
            <CardDescription>
              When the {overlayShortDays}d line crosses above the {overlayLongDays}d line, the agent suggests buy; when it crosses below or your take-profit is hit, it suggests sell.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium">{overlayCrossover.state.reason}</p>
            {(overlayCrossover.state.lastBullishDate || overlayCrossover.state.lastBearishDate) && (
              <p className="text-xs text-muted-foreground">
                Last bullish cross: {overlayCrossover.state.lastBullishDate ?? "—"} · Last bearish cross: {overlayCrossover.state.lastBearishDate ?? "—"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Portfolio Holdings Block */}
      {portfolioStocks.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Your Portfolio Holdings
            </CardTitle>
            <CardDescription>Stocks you currently own. Select any stock above to view its MACD analysis and enable auto-sell.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {portfolioStocks.map((h: any) => {
                const isSelected = h.symbol === symbol;
                const avgP = h.avgPrice ?? h.averagePrice;
                const curP = h.currentPrice || avgP;
                const pnl = curP && avgP ? ((curP - avgP) * h.quantity) : 0;
                const pnlPct = avgP ? (((curP - avgP) / avgP) * 100) : 0;
                return (
                  <button
                    key={h.symbol}
                    type="button"
                    className={`text-left rounded-lg border p-3 transition-all hover:shadow-md cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                    onClick={() => {
                      setSymbol(h.symbol);
                      setSymbolInput(`${h.companyName} (${h.symbol})`);
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm">{h.symbol?.replace(".NS", "")}</span>
                      <span className="text-xs text-muted-foreground">{h.quantity} shares</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-2">{h.companyName}</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Avg: ₹{avgP?.toLocaleString()}</p>
                        <p className="text-xs font-medium">Current: ₹{curP?.toLocaleString()}</p>
                      </div>
                      <span className={`text-xs font-semibold ${
                        pnl >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {pnl >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                      </span>
                    </div>
                    {isSelected && (
                      <div className="mt-2 pt-1.5 border-t border-primary/20">
                        <p className="text-[10px] text-primary font-medium">📊 Viewing MACD</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary + current signal */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Current Signal
                {analysis && (
                  <Badge className={signalColor(analysis.current?.signal)}>
                    {analysis.current?.signal?.replace("_", " ")}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {symbol ? `Real-time MACD crossover and histogram strength for ${analysis?.symbol || symbol}.` : "Select a symbol above to see signal and recommendations."}
              </CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {!symbol && (
              <p className="text-sm text-muted-foreground">Search and select a stock to see MACD signal and recommendations.</p>
            )}
            {symbol && loading && <p className="text-sm text-muted-foreground">Loading MACD analysis…</p>}
            {symbol && !loading && !analysis && (
              <p className="text-sm text-muted-foreground">
                No MACD data yet. Try a different symbol or time window.
              </p>
            )}
            {analysis && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Recommendation</p>
                    <p className="text-sm font-medium">{analysis.current.recommendation}</p>
                    <p className="text-xs text-muted-foreground">
                      Overall: <span className="font-semibold">{analysis.overallRecommendation}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Trend</p>
                    <p className={`text-sm font-medium flex items-center gap-1 ${trendColor(analysis.trend)}`}>
                      {analysis.trend.direction === "BULLISH" && <TrendingUp className="h-4 w-4" />}
                      {analysis.trend.direction === "BEARISH" && <TrendingDown className="h-4 w-4" />}
                      {analysis.trend.direction === "NEUTRAL" && <Activity className="h-4 w-4" />}
                      {analysis.trend.direction.toLowerCase()} • {analysis.trend.strength.toLowerCase()}
                    </p>
                    {analysis.trend.divergence && (
                      <p className="text-xs text-amber-600">Potential price/MACD divergence detected</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="text-sm font-semibold">{analysis.confidence.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      Signal strength: {analysis.current.strength.toFixed(1)} / 100
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 pt-2 border-t border-border/60 mt-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Entry</p>
                    <p className="text-sm font-mono">
                      ₹{analysis.current.entryPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Stop Loss (~{riskPercent.toFixed(1)}%)</p>
                    <p className="text-sm font-mono text-red-600">
                      ₹{analysis.current.stopLoss.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Take Profit (~{rewardPercent.toFixed(1)}%)</p>
                    <p className="text-sm font-mono text-emerald-600">
                      ₹{analysis.current.takeProfit.toFixed(2)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Refresh MACD or reset parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                // Just refetch all queries for this symbol/params
                void api.get(`/macd/analysis/${encodeURIComponent(symbol)}`, {
                  params: {
                    shortPeriod,
                    longPeriod,
                    signalPeriod,
                    days: Math.max(historyDays, longPeriod + signalPeriod + 10),
                    riskPercent,
                    rewardPercent,
                  },
                });
              }}
            >
              Recalculate MACD
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => {
                setShortPeriod(12);
                setLongPeriod(26);
                setSignalPeriod(9);
                setRiskPercent(1);
                setRewardPercent(2);
                setHistoryDays(90);
                setOverlayShortDays(10);
                setOverlayLongDays(15);
              }}
            >
              Reset to classic 12-26-9, 1:2; overlay 10/15
            </Button>
            <p className="text-xs text-muted-foreground pt-1">
              This tool focuses on MACD only. Always confirm with your broader strategy and risk rules.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts: stacked and synced (crosshair + value on hover) */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Price & MACD (synced)</CardTitle>
          <CardDescription>
            Both charts share the same time axis. Hover on either chart to see values and a crosshair on both.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {!symbol ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
              <p className="text-sm font-medium">Search and select a stock above to see price and MACD charts.</p>
              <p className="mt-1 text-xs">Use the symbol search (e.g. HDFC, Reliance, Nifty) then pick from the list.</p>
            </div>
          ) : (ohlcData?.length || history?.length) ? (
            <>
              {/* Price candlestick */}
              <div className="pb-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Price (OHLC)</p>
                {history && history.length > 0 ? (() => {
                  const priceCandles: OhlcPoint[] =
                    ohlcData && ohlcData.length > 0
                      ? ohlcData
                      : history.map((d, i) => {
                          const prev = i > 0 ? history[i - 1] : d;
                          const open = prev.closePrice;
                          const close = d.closePrice;
                          const high = Math.max(open, close);
                          const low = Math.min(open, close);
                          return {
                            date: d.date,
                            open,
                            close,
                            high,
                            low,
                          };
                        });
                  return (
                    <CandlestickChart
                      data={priceCandles}
                      height={280}
                      hoveredDate={hoveredDate}
                      onHoverDate={setHoveredDate}
                      yAxisDecimals={0}
                    />
                  );
                })() : (
                  <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Loading price…</div>
                )}
              </div>
              {/* MACD candlestick + user-defined overlay lines (crossover) */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  MACD (candlestick) + {overlayShortDays}d & {overlayLongDays}d lines — buy when short crosses above long; sell when short crosses below or target hit
                </p>
                {history && history.length > 0 && overlayCrossover ? (() => {
                  const macdCandleData = history.map((d, i) => {
                    const prev = i > 0 ? history[i - 1] : d;
                    return {
                      date: d.date,
                      open: prev.macdLine,
                      close: d.macdLine,
                      high: Math.max(d.macdLine, d.signalLine),
                      low: Math.min(d.macdLine, d.signalLine),
                    };
                  });
                  const overlayLines: OverlayLine[] = [
                    { name: `${overlayShortDays}d`, values: overlayCrossover.emaShort, color: "#3b82f6" },
                    { name: `${overlayLongDays}d`, values: overlayCrossover.emaLong, color: "#f59e0b" },
                  ];
                  return (
                    <CandlestickChart
                      data={macdCandleData}
                      height={280}
                      hoveredDate={hoveredDate}
                      onHoverDate={setHoveredDate}
                      yAxisDecimals={2}
                      overlayLines={overlayLines}
                    />
                  );
                })() : (
                  <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Loading MACD…</div>
                )}
              </div>
            </>
          ) : (
            <div className="py-24 flex items-center justify-center text-sm text-muted-foreground">
              No data yet. Select a symbol and wait for charts to load.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Macd;

