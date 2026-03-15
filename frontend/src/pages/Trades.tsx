import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Plus,
    Search,
    Filter,
    Calendar as CalendarIcon,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    BookOpen,
    PieChart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Trades = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [sectorFilter, setSectorFilter] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [funds, setFunds] = useState<number>(0);
    const [newTrade, setNewTrade] = useState({
        symbol: "",
        companyName: "",
        type: "BUY" as "BUY" | "SELL",
        quantity: 0,
        price: 0,
        sentiment: "NEUTRAL" as const,
        notes: ""
    });

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            navigate("/signin");
        }
        // Load funds from localStorage
        const storedFunds = localStorage.getItem("userFunds");
        if (storedFunds) setFunds(Number(storedFunds));
    }, [navigate]);

    // Listen for fund changes from other pages
    useEffect(() => {
        const handleFundsChange = () => {
            const storedFunds = localStorage.getItem("userFunds");
            if (storedFunds) setFunds(Number(storedFunds));
        };
        window.addEventListener("fundsUpdated", handleFundsChange);
        window.addEventListener("storage", handleFundsChange);
        return () => {
            window.removeEventListener("fundsUpdated", handleFundsChange);
            window.removeEventListener("storage", handleFundsChange);
        };
    }, []);

    const updateFunds = (newFunds: number) => {
        setFunds(newFunds);
        localStorage.setItem("userFunds", String(newFunds));
        window.dispatchEvent(new Event("fundsUpdated"));
    };

    const { data: tradesResponse, isLoading } = useQuery({
        queryKey: ["trades"],
        queryFn: async () => {
            const response = await api.get("/trades");
            return response.data;
        },
    });
    const trades = tradesResponse?.trades ?? tradesResponse ?? [];

    const { data: marketData } = useQuery({
        queryKey: ["marketDataAll"],
        queryFn: async () => {
            const res = await api.get("/market");
            return res.data;
        },
        refetchInterval: 60000,
    });

    const { data: stats } = useQuery({
        queryKey: ["tradeStats"],
        queryFn: async () => {
            const response = await api.get("/trades/stats");
            return response.data;
        },
    });

    // Fetch user's portfolio holdings to know which stocks can be sold
    const { data: holdings } = useQuery({
        queryKey: ["holdings"],
        queryFn: async () => {
            const response = await api.get("/portfolio");
            return response.data;
        },
    });

    // Build a map of symbol -> held quantity for quick lookup
    const holdingsMap = useMemo(() => {
        const map: Record<string, number> = {};
        if (Array.isArray(holdings)) {
            for (const h of holdings) {
                map[h.symbol?.toUpperCase()] = h.quantity ?? 0;
            }
        }
        return map;
    }, [holdings]);

    const sectors = Array.from(new Set((marketData ?? []).map((s: any) => s.sector).filter(Boolean))).sort() as string[];
    const filteredStocks = marketData?.filter((s: any) => {
        const matchSearch = !searchTerm || s.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) || s.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchSector = !sectorFilter || s.sector === sectorFilter;
        return matchSearch && matchSector;
    }) ?? [];

    const logTradeMutation = useMutation({
        mutationFn: async (payload: { symbol: string; companyName?: string; type: "BUY" | "SELL"; quantity: number; price: number; sentiment?: string; notes?: string }) => {
            return await api.post("/trades", {
                symbol: payload.symbol,
                companyName: payload.companyName || payload.symbol,
                type: payload.type,
                quantity: payload.quantity,
                price: payload.price,
                sentiment: payload.sentiment || "NEUTRAL",
                notes: payload.notes || "",
            });
        },
        onSuccess: (_data, variables) => {
            const tradeTotal = variables.quantity * variables.price;
            if (variables.type === "BUY") {
                updateFunds(funds - tradeTotal);
            } else {
                updateFunds(funds + tradeTotal);
            }
            queryClient.invalidateQueries({ queryKey: ["trades"] });
            queryClient.invalidateQueries({ queryKey: ["tradeStats"] });
            queryClient.invalidateQueries({ queryKey: ["portfolioSummary"] });
            queryClient.invalidateQueries({ queryKey: ["holdings"] });
            setIsAddOpen(false);
            setNewTrade({
                symbol: "", companyName: "", type: "BUY", quantity: 0, price: 0, sentiment: "NEUTRAL", notes: ""
            });
            toast({
                title: "Trade logged",
                description: `Trade logged successfully. ${variables.type === "BUY" ? "Funds deducted" : "Funds added"}: ₹${tradeTotal.toLocaleString()}`,
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to log trade.",
            });
        },
    });

    const filteredTrades = Array.isArray(trades) ? trades.filter((t: any) =>
        t.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    const [quickQty, setQuickQty] = useState<Record<string, number>>({});
    const submitQuickTrade = (stock: any, type: "BUY" | "SELL") => {
        const qty = quickQty[stock.symbol] ?? 0;
        if (qty <= 0) {
            toast({ variant: "destructive", title: "Invalid quantity", description: "Enter a quantity greater than 0." });
            return;
        }
        const price = Number(stock.currentPrice);
        if (!price || price <= 0) {
            toast({ variant: "destructive", title: "Invalid price", description: "Price not available for this symbol." });
            return;
        }
        const tradeTotal = qty * price;
        // Validate funds for BUY
        if (type === "BUY") {
            if (tradeTotal > funds) {
                toast({
                    variant: "destructive",
                    title: "Insufficient Funds",
                    description: `You need ₹${tradeTotal.toLocaleString()} but only have ₹${funds.toLocaleString()} available. Please add funds from the Dashboard first.`,
                });
                return;
            }
        }
        // Validate sell quantity against holdings
        if (type === "SELL") {
            const heldQty = holdingsMap[stock.symbol?.toUpperCase()] ?? 0;
            if (heldQty <= 0) {
                toast({ variant: "destructive", title: "Cannot sell", description: "You don't own this stock." });
                return;
            }
            if (qty > heldQty) {
                toast({ variant: "destructive", title: "Insufficient quantity", description: `You only hold ${heldQty} shares of ${stock.symbol?.replace(".NS", "")}.` });
                return;
            }
        }
        logTradeMutation.mutate({
            symbol: stock.symbol,
            companyName: stock.companyName,
            type,
            quantity: qty,
            price,
            sentiment: "NEUTRAL",
            notes: "",
        });
        setQuickQty((prev) => ({ ...prev, [stock.symbol]: 0 }));
    };

    return (
        <div className="container py-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Trade Journal</h1>
                    <p className="text-muted-foreground">
                        Quick trade from the list below, or log a custom trade.
                    </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" /> Log Custom Trade
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Log Trade Details</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="symbol">Symbol</Label>
                                    <Input
                                        id="symbol"
                                        placeholder="RELIANCE.NS"
                                        value={newTrade.symbol}
                                        onChange={(e) => setNewTrade({ ...newTrade, symbol: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                        value={newTrade.type}
                                        onValueChange={(v) => setNewTrade({ ...newTrade, type: v })}
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BUY">BUY</SelectItem>
                                            <SelectItem value="SELL">SELL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        value={newTrade.quantity}
                                        onChange={(e) => setNewTrade({ ...newTrade, quantity: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={newTrade.price}
                                        onChange={(e) => setNewTrade({ ...newTrade, price: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sentiment">Sentiment</Label>
                                <Select
                                    value={newTrade.sentiment}
                                    onValueChange={(v) => setNewTrade({ ...newTrade, sentiment: v })}
                                >
                                    <SelectTrigger id="sentiment">
                                        <SelectValue placeholder="How did you feel?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BULLISH">Bullish (Confident)</SelectItem>
                                        <SelectItem value="NEUTRAL">Neutral</SelectItem>
                                        <SelectItem value="BEARISH">Bearish (Cautious)</SelectItem>
                                        <SelectItem value="PANIC">Panic (Felt rushed)</SelectItem>
                                        <SelectItem value="FOMO">FOMO (Afraid to miss out)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Why did you take this trade?"
                                    value={newTrade.notes}
                                    onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={() => {
                                if (newTrade.type === "BUY") {
                                    const total = newTrade.quantity * newTrade.price;
                                    if (total > funds) {
                                        toast({
                                            variant: "destructive",
                                            title: "Insufficient Funds",
                                            description: `You need ₹${total.toLocaleString()} but only have ₹${funds.toLocaleString()} available. Please add funds from the Dashboard first.`,
                                        });
                                        return;
                                    }
                                }
                                logTradeMutation.mutate({
                                    symbol: newTrade.symbol,
                                    companyName: newTrade.companyName,
                                    type: newTrade.type,
                                    quantity: newTrade.quantity,
                                    price: newTrade.price,
                                    sentiment: newTrade.sentiment,
                                    notes: newTrade.notes,
                                });
                            }} disabled={logTradeMutation.isPending}>
                                {logTradeMutation.isPending ? "Logging..." : "Save Trade"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Quick trade: stocks with prices, user adds quantity only */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Quick Trade</CardTitle>
                    <CardDescription>Select a stock, enter quantity, and click Buy or Sell. Price is current market price.</CardDescription>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Input
                            placeholder="Search symbol or name..."
                            className="max-w-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm max-w-[180px]"
                            value={sectorFilter}
                            onChange={(e) => setSectorFilter(e.target.value)}
                        >
                            <option value="">All sectors</option>
                            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Symbol</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Sector</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="w-[120px]">Quantity</TableHead>
                                <TableHead className="text-right pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStocks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No stocks match. Adjust search or sector.</TableCell>
                                </TableRow>
                            ) : (
                                filteredStocks.slice(0, 30).map((stock: any) => (
                                    <TableRow key={stock.symbol}>
                                        <TableCell className="pl-6 font-semibold">{stock.symbol?.replace(".NS", "") ?? stock.symbol}</TableCell>
                                        <TableCell className="max-w-[180px] truncate">{stock.companyName}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{stock.sector ?? "—"}</TableCell>
                                        <TableCell className="font-mono">₹{stock.currentPrice?.toLocaleString() ?? "—"}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    placeholder="Qty"
                                                    className="w-24 h-9"
                                                    value={quickQty[stock.symbol] || ""}
                                                    onChange={(e) => setQuickQty((prev) => ({ ...prev, [stock.symbol]: Number(e.target.value) || 0 }))}
                                                />
                                                {(holdingsMap[stock.symbol?.toUpperCase()] ?? 0) > 0 && (
                                                    <span className="text-[10px] text-muted-foreground mt-0.5">Held: {holdingsMap[stock.symbol?.toUpperCase()]}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 flex gap-2 justify-end">
                                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => submitQuickTrade(stock, "BUY")}>
                                                Buy
                                            </Button>
                                            {(holdingsMap[stock.symbol?.toUpperCase()] ?? 0) > 0 && (
                                                <Button size="sm" variant="destructive" onClick={() => submitQuickTrade(stock, "SELL")}>
                                                    Sell
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalTrades || 0}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.winRate?.toFixed(1) || 0}%</div>
                        <div className="h-1.5 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-primary"
                                style={{ width: `${stats?.winRate || 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Profit Trades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{stats?.winningTrades ?? stats?.profitTrades ?? 0}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Loss Trades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{(stats?.totalTrades ?? 0) - (stats?.winningTrades ?? stats?.profitTrades ?? 0)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Trades Table */}
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Trade History</CardTitle>
                            <CardDescription>A complete log of all your market activities.</CardDescription>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search symbol..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Symbol</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Sentiment</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7} className="text-center py-10">
                                            <div className="flex justify-center flex-col items-center gap-2">
                                                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredTrades?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <BookOpen className="h-10 w-10 opacity-20" />
                                            <p>No trades logged yet.</p>
                                            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
                                                Start your journal
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTrades?.map((trade: any) => (
                                    <TableRow key={trade.id}>
                                        <TableCell className="text-xs text-muted-foreground font-mono">
                                            {new Date(trade.executedAt ?? trade.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="font-semibold">{trade.symbol.replace(".NS", "")}</TableCell>
                                        <TableCell>
                                            <Badge variant={trade.type === "BUY" ? "default" : "destructive"} className="px-2 py-0 text-[10px]">
                                                {trade.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{trade.quantity}</TableCell>
                                        <TableCell>₹{trade.price?.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <span className="text-xs italic text-muted-foreground">{trade.sentiment}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            ₹{(trade.quantity * trade.price).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default Trades;
