import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import About from "./pages/About";
import Support from "./pages/Support";
import Signup from "./pages/Signup";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Trades from "./pages/Trades";
import ChatAssistant from "./pages/ChatAssistant";
import Market from "./pages/Market";
import Macd from "./pages/Macd";
import Logo from "./pages/Logo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 min — don't re-fetch if data is fresh
      gcTime: 10 * 60 * 1000,      // 10 min — keep unused data in cache
      retry: 2,                     // retry failed requests (helps with Render cold starts)
      refetchOnWindowFocus: false,  // don't refetch every time user tabs back
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/support" element={<Support />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/chat" element={<ChatAssistant />} />
            <Route path="/market" element={<Market />} />
            <Route path="/macd" element={<Macd />} />
            <Route path="/logo" element={<Logo />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
