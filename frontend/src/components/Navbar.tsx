import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import logo from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location]);

  // Wake up backend on app load (helps with Render cold starts)
  useEffect(() => {
    api.get("/market/symbols", { params: { query: "HDFC" } }).catch(() => {});
  }, []);

  // Prefetch data when user hovers a nav link
  const prefetchMap: Record<string, () => void> = {
    "/portfolio": () => {
      queryClient.prefetchQuery({ queryKey: ["holdings"], queryFn: () => api.get("/portfolio").then(r => r.data) });
    },
    "/market": () => {
      queryClient.prefetchQuery({ queryKey: ["marketData"], queryFn: () => api.get("/market").then(r => r.data) });
    },
    "/trades": () => {
      queryClient.prefetchQuery({ queryKey: ["trades"], queryFn: () => api.get("/trades").then(r => r.data) });
    },
    "/dashboard": () => {
      queryClient.prefetchQuery({ queryKey: ["marketData"], queryFn: () => api.get("/market").then(r => r.data) });
    },
  };

  const handlePrefetch = useCallback((to: string) => {
    const fn = prefetchMap[to];
    if (fn) fn();
  }, [queryClient]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    toast({
      title: "Logged out",
      description: "Successfully signed out of your account.",
    });
    navigate("/");
  };

  const authenticatedLinks = [
    { to: "/", label: "Main Menu" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/trades", label: "Trades" },
    { to: "/market", label: "Market" },
    { to: "/macd", label: "MACD" },
    { to: "/chat", label: "AI Assistant" },
  ];

  const publicLinks = [
    { to: "/", label: "Main Menu" },
    { to: "/about", label: "About" },
    { to: "/support", label: "Support" },
  ];

  const links = user ? authenticatedLinks : publicLinks;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <div className="h-16 w-[16rem] md:w-[24rem] flex items-center justify-start overflow-visible">
            <video
              className="w-full h-full object-contain object-left"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/Logo_Redesign_for_Trading_Platform.mp4" type="video/mp4" />
            </video>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onMouseEnter={() => handlePrefetch(link.to)}
              className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === link.to
                ? "text-primary"
                : "text-muted-foreground"
                }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-secondary">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-400" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/signin"
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {user && (
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="flex items-center text-sm font-medium text-red-600 hover:text-red-500 mt-2"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/signin"
                className="rounded-md bg-primary px-5 py-2 text-center text-sm font-medium text-primary-foreground"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
