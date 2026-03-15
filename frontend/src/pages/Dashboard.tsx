import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Wallet,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Plus,
    Brain,
    IndianRupee
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

const Dashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [funds, setFunds] = useState<number>(0);
    const [addFundAmount, setAddFundAmount] = useState<string>("");
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            navigate("/signin");
            return;
        }
        setUser(JSON.parse(storedUser));
        // Load funds from localStorage
        const storedFunds = localStorage.getItem("userFunds");
        if (storedFunds) {
            setFunds(Number(storedFunds));
        }
    }, [navigate]);

    // Listen for fund changes from other pages (e.g., Trades, MACD)
    useEffect(() => {
        const handleStorageChange = () => {
            const storedFunds = localStorage.getItem("userFunds");
            if (storedFunds) setFunds(Number(storedFunds));
        };
        window.addEventListener("fundsUpdated", handleStorageChange);
        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("fundsUpdated", handleStorageChange);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const handleAddFunds = () => {
        const amount = Number(addFundAmount);
        if (!amount || amount <= 0) {
            toast({ variant: "destructive", title: "Invalid amount", description: "Please enter a valid amount greater than 0." });
            return;
        }
        const newFunds = funds + amount;
        setFunds(newFunds);
        localStorage.setItem("userFunds", String(newFunds));
        window.dispatchEvent(new Event("fundsUpdated"));
        setAddFundAmount("");
        setIsAddFundsOpen(false);
        toast({ title: "Funds Added", description: `₹${amount.toLocaleString()} has been added to your wallet. New balance: ₹${newFunds.toLocaleString()}` });
    };

    const { data: marketData, isLoading: marketLoading } = useQuery({
        queryKey: ["marketData"],
        queryFn: async () => {
            const response = await api.get("/market");
            return response.data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const { data: holdings } = useQuery({
        queryKey: ["holdings"],
        queryFn: async () => {
            const response = await api.get("/portfolio");
            return response.data;
        },
    });

    // Derive top gainers from the user's own portfolio holdings
    const portfolioGainers = useMemo(() => {
        if (!holdings || !Array.isArray(holdings) || holdings.length === 0) return [];
        return [...holdings]
            .filter((h: any) => h.profitLossPercent != null && h.profitLossPercent > 0)
            .sort((a: any, b: any) => b.profitLossPercent - a.profitLossPercent)
            .slice(0, 5);
    }, [holdings]);

    const { data: summary } = useQuery({
        queryKey: ["portfolioSummary"],
        queryFn: async () => {
            const response = await api.get("/portfolio/summary");
            return response.data;
        },
    });

    if (!user) return null;

    return (
        <div className="container py-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {user.name}. Here's what's happening today.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => navigate("/trades")}>
                        <Plus className="mr-2 h-4 w-4" /> New Trade
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(summary?.totalCurrentValue ?? summary?.totalValue)?.toLocaleString() || "0"}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Current assessment of all holdings
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Invested</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{summary?.totalInvested?.toLocaleString() || "0"}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Initial capital invested
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                        <div className={summary?.totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}>
                            {summary?.totalProfitLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary?.totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {summary?.totalProfitLoss >= 0 ? "+" : ""}
                            ₹{summary?.totalProfitLoss?.toLocaleString() || "0"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {summary?.totalProfitLossPercent?.toFixed(2) || "0"}% overall return
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Funds</CardTitle>
                        <Wallet className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">₹{funds.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ready for new investments
                        </p>
                        <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="mt-3 w-full" variant="outline">
                                    <IndianRupee className="mr-1.5 h-3.5 w-3.5" /> Add Funds
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>Add Funds to Wallet</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="rounded-md bg-accent/50 p-3 text-sm flex justify-between">
                                        <span className="text-muted-foreground">Current Balance</span>
                                        <span className="font-semibold">₹{funds.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="addFundAmount">Amount (₹)</Label>
                                        <Input
                                            id="addFundAmount"
                                            type="number"
                                            min={1}
                                            placeholder="Enter amount to add"
                                            value={addFundAmount}
                                            onChange={(e) => setAddFundAmount(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAddFunds()}
                                        />
                                    </div>
                                    {addFundAmount && Number(addFundAmount) > 0 && (
                                        <div className="rounded-md border border-border p-3 text-sm flex justify-between">
                                            <span className="text-muted-foreground">New Balance</span>
                                            <span className="font-semibold text-primary">₹{(funds + Number(addFundAmount)).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddFundsOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddFunds}>Add Funds</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Main Market Watch */}
                <Card className="md:col-span-4 glass-card overflow-hidden">
                    <CardHeader>
                        <CardTitle>Market Watch</CardTitle>
                        <CardDescription>Live prices for NSE stocks & indices (Banking, IT, Energy, Auto, more).</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Symbol</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Change</TableHead>
                                    <TableHead className="text-right pr-6">Volume</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {marketLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="pl-6"><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell className="text-right pr-6"><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    marketData?.slice(0, 8).map((stock: any) => (
                                        <TableRow key={stock.symbol} className="cursor-pointer hover:bg-accent/50 transition-colors">
                                            <TableCell className="pl-6 font-medium">
                                                <div className="flex flex-col">
                                                    <span>{stock.symbol.replace(".NS", "")}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                                        {stock.companyName}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>₹{stock.currentPrice?.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <div className={`flex items-center gap-1 ${stock.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                    {stock.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                    {Math.abs(stock.changePercent).toFixed(2)}%
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 text-muted-foreground font-mono text-xs">
                                                {stock.volume != null ? (stock.volume / 100000).toFixed(1) + "L" : "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="p-4 border-t border-border flex justify-center">
                            <Button variant="ghost" size="sm" className="text-xs" asChild>
                                <Link to="/market">View all market data</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Side panels: Your Top Gainers & Quick Assistant */}
                <div className="md:col-span-3 space-y-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-lg">Your Top Gainers</CardTitle>
                            <CardDescription>Best performing stocks in your portfolio</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {portfolioGainers.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    <p>No gaining stocks yet.</p>
                                    <p className="text-xs mt-1">Buy stocks from the <span className="text-primary cursor-pointer" onClick={() => navigate("/trades")}>Trades</span> page to see your top gainers here.</p>
                                </div>
                            ) : (
                                portfolioGainers.map((holding: any) => (
                                    <div key={holding.symbol} className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{holding.symbol?.replace(".NS", "")}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                                {holding.companyName}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-semibold">₹{holding.currentPrice?.toLocaleString()}</span>
                                            <span className="text-xs text-green-500">+{holding.profitLossPercent?.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card className="glass-card bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Brain className="h-5 w-5 text-primary" />
                                Quantify AI
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Ask me about your portfolio performance or get insights on current market moves.
                            </p>
                            <Button className="w-full" variant="outline" onClick={() => navigate("/chat")}>
                                Start a Conversation
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
