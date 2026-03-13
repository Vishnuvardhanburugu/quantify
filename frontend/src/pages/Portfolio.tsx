import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Plus,
    Trash2,
    TrendingUp,
    TrendingDown,
    Search,
    PieChart as PieChartIcon,
    LayoutGrid,
    Filter,
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Portfolio = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newHolding, setNewHolding] = useState({ symbol: "", companyName: "", quantity: 0, avgPrice: 0 });

    // Stock search state for Add Holding dialog
    const [stockSearch, setStockSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            navigate("/signin");
        }
    }, [navigate]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const { data: holdings, isLoading } = useQuery({
        queryKey: ["holdings"],
        queryFn: async () => {
            const response = await api.get("/portfolio");
            return response.data;
        },
    });

    const { data: summary } = useQuery({
        queryKey: ["portfolioSummary"],
        queryFn: async () => {
            const response = await api.get("/portfolio/summary");
            return response.data;
        },
    });

    // Fetch market data for the stock search dropdown
    const { data: marketData } = useQuery({
        queryKey: ["marketDataAll"],
        queryFn: async () => {
            const res = await api.get("/market");
            return res.data;
        },
        refetchInterval: 60000,
    });

    const filteredMarketStocks = (marketData ?? []).filter((s: any) =>
        stockSearch.length > 0 && (
            s.symbol?.toLowerCase().includes(stockSearch.toLowerCase()) ||
            s.companyName?.toLowerCase().includes(stockSearch.toLowerCase())
        )
    ).slice(0, 8);

    const selectStock = (stock: any) => {
        setNewHolding({
            ...newHolding,
            symbol: stock.symbol,
            companyName: stock.companyName,
            avgPrice: Number(stock.currentPrice) || 0,
        });
        setStockSearch(stock.symbol?.replace(".NS", "") + " — " + stock.companyName);
        setShowDropdown(false);
    };

    const addHoldingMutation = useMutation({
        mutationFn: async (holding: any) => {
            // Route through the trades endpoint so that both trade history
            // AND portfolio get updated together (TradeService.logTrade calls portfolioService.applyTrade)
            return await api.post("/trades", {
                symbol: holding.symbol,
                companyName: holding.companyName,
                type: "BUY",
                quantity: holding.quantity,
                price: holding.avgPrice,
                sentiment: "NEUTRAL",
                notes: "Added from Portfolio",
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["holdings"] });
            queryClient.invalidateQueries({ queryKey: ["portfolioSummary"] });
            queryClient.invalidateQueries({ queryKey: ["trades"] });
            queryClient.invalidateQueries({ queryKey: ["tradeStats"] });
            setIsAddOpen(false);
            setNewHolding({ symbol: "", companyName: "", quantity: 0, avgPrice: 0 });
            setStockSearch("");
            toast({
                title: "Success",
                description: "Stock purchased and added to your portfolio.",
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to add holding.",
            });
        },
    });

    const deleteHoldingMutation = useMutation({
        mutationFn: async (id: number) => {
            return await api.delete(`/portfolio/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["holdings"] });
            queryClient.invalidateQueries({ queryKey: ["portfolioSummary"] });
            toast({
                title: "Success",
                description: "Holding removed.",
            });
        },
    });

    const filteredHoldings = holdings?.filter((h: any) =>
        h.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container py-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
                    <p className="text-muted-foreground">
                        Manage your investments and track their performance.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Dialog open={isAddOpen} onOpenChange={(open) => {
                        setIsAddOpen(open);
                        if (!open) {
                            setStockSearch("");
                            setShowDropdown(false);
                            setNewHolding({ symbol: "", companyName: "", quantity: 0, avgPrice: 0 });
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Holding
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Stock Holding</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                {/* Stock Search with Dropdown */}
                                <div className="grid gap-2 relative" ref={dropdownRef}>
                                    <Label htmlFor="stockSearch">Search Stock</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="stockSearch"
                                            placeholder="Search by name or symbol..."
                                            className="pl-9"
                                            value={stockSearch}
                                            onChange={(e) => {
                                                setStockSearch(e.target.value);
                                                setShowDropdown(true);
                                                if (newHolding.symbol) {
                                                    setNewHolding({ symbol: "", companyName: "", quantity: newHolding.quantity, avgPrice: 0 });
                                                }
                                            }}
                                            onFocus={() => stockSearch.length > 0 && setShowDropdown(true)}
                                        />
                                    </div>
                                    {showDropdown && filteredMarketStocks.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-auto rounded-md border border-border bg-background shadow-lg">
                                            {filteredMarketStocks.map((stock: any) => (
                                                <button
                                                    key={stock.symbol}
                                                    type="button"
                                                    className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                                                    onClick={() => selectStock(stock)}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{stock.symbol?.replace(".NS", "")}</span>
                                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{stock.companyName}</span>
                                                    </div>
                                                    <span className="text-sm font-mono text-muted-foreground">₹{stock.currentPrice?.toLocaleString()}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Selected stock info */}
                                {newHolding.symbol && (
                                    <div className="rounded-md bg-accent/50 p-3 text-sm">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-semibold">{newHolding.symbol.replace(".NS", "")}</span>
                                                <span className="text-muted-foreground ml-2">{newHolding.companyName}</span>
                                            </div>
                                            <span className="font-mono font-semibold">₹{newHolding.avgPrice.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min={1}
                                        placeholder="Enter number of shares"
                                        value={newHolding.quantity || ""}
                                        onChange={(e) => setNewHolding({ ...newHolding, quantity: Number(e.target.value) })}
                                    />
                                </div>

                                {/* Total value preview */}
                                {newHolding.symbol && newHolding.quantity > 0 && (
                                    <div className="rounded-md border border-border p-3 text-sm flex justify-between">
                                        <span className="text-muted-foreground">Total Investment</span>
                                        <span className="font-semibold">₹{(newHolding.quantity * newHolding.avgPrice).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={() => addHoldingMutation.mutate(newHolding)}
                                    disabled={addHoldingMutation.isPending || !newHolding.symbol || newHolding.quantity <= 0}
                                >
                                    {addHoldingMutation.isPending ? "Adding..." : "Add Holding"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{summary?.totalCurrentValue?.toLocaleString() || "0"}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={summary?.totalProfitLoss >= 0 ? "default" : "destructive"}>
                                {summary?.totalProfitLossPercent?.toFixed(2) || "0"}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">Overall P&L</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{summary?.totalInvested?.toLocaleString() || "0"}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across {holdings?.length || 0} stocks</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary?.totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {summary?.totalProfitLoss >= 0 ? "+" : ""}₹{summary?.totalProfitLoss?.toLocaleString() || "0"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Real-time valuation</p>
                    </CardContent>
                </Card>
            </div>

            {/* Holdings Table */}
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Your Holdings</CardTitle>
                            <CardDescription>Current market value and performance of your stocks.</CardDescription>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search stocks..."
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
                                <TableHead>Stock</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Avg. Price</TableHead>
                                <TableHead>Current Price</TableHead>
                                <TableHead>Invested</TableHead>
                                <TableHead>P&L</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7} className="text-center py-10">
                                            <div className="flex justify-center flex-col items-center gap-2">
                                                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                                                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredHoldings?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No holdings found matching your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredHoldings?.map((holding: any) => (
                                    <TableRow key={holding.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{holding.symbol.replace(".NS", "")}</span>
                                                <span className="text-xs text-muted-foreground">{holding.companyName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{holding.quantity}</TableCell>
                                        <TableCell>₹{holding.avgPrice?.toLocaleString() ?? holding.averagePrice?.toLocaleString()}</TableCell>
                                        <TableCell>₹{holding.currentPrice?.toLocaleString()}</TableCell>
                                        <TableCell>₹{(holding.quantity * (holding.avgPrice ?? holding.averagePrice ?? 0)).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={holding.profitLoss >= 0 ? "text-green-500" : "text-red-500"}>
                                                    {holding.profitLoss >= 0 ? "+" : ""}
                                                    ₹{holding.profitLoss?.toLocaleString()}
                                                </span>
                                                <span className={`text-xs ${holding.profitLoss >= 0 ? "text-green-500/80" : "text-red-500/80"}`}>
                                                    {holding.profitLossPercent?.toFixed(2)}%
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    if (confirm("Are you sure you want to remove this holding?")) {
                                                        deleteHoldingMutation.mutate(holding.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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

export default Portfolio;
