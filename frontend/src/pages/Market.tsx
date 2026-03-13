import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Search,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    TrendingDown,
    Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Market = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sectorFilter, setSectorFilter] = useState<string>("");
    const { data: marketData, isLoading } = useQuery({
        queryKey: ["marketDataAll"],
        queryFn: async () => {
            const response = await api.get("/market");
            return response.data;
        },
        refetchInterval: 60000,
    });

    const sectors = Array.from(
        new Set((marketData ?? []).map((s: any) => s.sector).filter(Boolean))
    ).sort() as string[];

    const filteredData = marketData?.filter((stock: any) => {
        const matchesSearch =
            !searchTerm ||
            stock.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stock.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stock.sector?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSector = !sectorFilter || stock.sector === sectorFilter;
        return matchesSearch && matchesSector;
    });

    return (
        <div className="container py-8 space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Market Watch</h1>
                <p className="text-muted-foreground">
                    Real-time prices for NSE stocks. Updated every minute.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center flex-wrap">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, symbol or sector..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                    >
                        <option value="">All sectors</option>
                        {sectors.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <Badge variant="outline" className="px-3 py-1">NSE</Badge>
                    <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">Live</Badge>
                </div>
            </div>

            <Card className="glass-card">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Symbol</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Sector</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Change</TableHead>
                                <TableHead>%</TableHead>
                                <TableHead className="text-right pr-6">Volume</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7} className="py-4 px-6">
                                            <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                filteredData?.map((stock: any) => (
                                    <TableRow key={stock.symbol} className="group hover:bg-accent/30 transition-colors">
                                        <TableCell className="pl-6 font-bold text-primary">
                                            {stock.symbol?.replace(".NS", "") ?? stock.symbol}
                                        </TableCell>
                                        <TableCell className="max-w-[180px] truncate">
                                            {stock.companyName}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm max-w-[140px] truncate">
                                            {stock.sector ?? "—"}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            ₹{stock.currentPrice?.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className={stock.change >= 0 ? "text-green-500" : "text-red-500"}>
                                                {stock.change >= 0 ? "+" : ""}{stock.change?.toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`flex items-center gap-1 ${stock.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                {stock.changePercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                {Math.abs(stock.changePercent).toFixed(2)}%
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 text-muted-foreground font-mono">
                                            {stock.volume?.toLocaleString()}
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

export default Market;
