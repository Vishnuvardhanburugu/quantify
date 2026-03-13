import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { BarChart3, BookOpen, Brain, Eye, Shield, TrendingUp } from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.png";

const features = [
  {
    icon: BarChart3,
    title: "Smart Dashboard",
    desc: "Real-time stats, win rate tracking, and market movers — all in one view.",
  },
  {
    icon: TrendingUp,
    title: "Portfolio Management",
    desc: "Track holdings with live prices, P&L breakdown, and sector analysis.",
  },
  {
    icon: BookOpen,
    title: "Trade Journaling",
    desc: "Log every trade with sentiment tracking to understand your behavior.",
  },
  {
    icon: Brain,
    title: "AI Assistant",
    desc: "Personalized insights from a local LLM that knows your trading style.",
  },
  {
    icon: Eye,
    title: "Live Market Watch",
    desc: "NSE real-time prices with auto-refresh every 30 seconds.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "JWT authentication with all AI processing happening locally.",
  },
];

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = (window as any).UnicornStudio;
    if (u && u.init) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
          u.init();
        });
      } else {
        u.init();
      }
    } else {
      (window as any).UnicornStudio = { isInitialized: false };
      const i = document.createElement("script");
      i.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.3/dist/unicornStudio.umd.js";
      i.onload = function () {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", function () {
            (window as any).UnicornStudio.init();
          });
        } else {
          (window as any).UnicornStudio.init();
        }
      };
      (document.head || document.body).appendChild(i);
    }

    // Aggressive watermark removal loop
    const cleanupInterval = setInterval(() => {
      document.querySelectorAll('a[href*="unicorn.studio"]').forEach((el) => {
        (el as HTMLElement).style.setProperty("display", "none", "important");
        (el as HTMLElement).style.setProperty("opacity", "0", "important");
        (el as HTMLElement).style.setProperty("visibility", "hidden", "important");
        (el as HTMLElement).style.setProperty("pointer-events", "none", "important");
      });
      document.querySelectorAll('a[href*="unicornstudio"]').forEach((el) => {
        (el as HTMLElement).style.setProperty("display", "none", "important");
        (el as HTMLElement).style.setProperty("opacity", "0", "important");
        (el as HTMLElement).style.setProperty("visibility", "hidden", "important");
        (el as HTMLElement).style.setProperty("pointer-events", "none", "important");
      });
      document.querySelectorAll("a").forEach((el) => {
        if (el.textContent && el.textContent.toLowerCase().includes("unicorn.studio")) {
          (el as HTMLElement).style.setProperty("display", "none", "important");
        }
      });
      // Shadow DOM traversal
      document.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot) {
          el.shadowRoot.querySelectorAll('a').forEach((anchor) => {
            if (
              anchor.href.includes("unicorn.studio") ||
              anchor.href.includes("unicornstudio") ||
              (anchor.textContent && anchor.textContent.toLowerCase().includes("unicorn"))
            ) {
              (anchor as HTMLElement).style.setProperty('display', 'none', 'important');
              (anchor as HTMLElement).style.setProperty('opacity', '0', 'important');
              (anchor as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
              (anchor as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
            }
          });
        }
      });
    }, 50);

    return () => clearInterval(cleanupInterval);
  }, []);
  return (
    <div>
      {/* Hero */}
      <section className="relative w-full overflow-hidden flex items-center justify-center bg-transparent" style={{ minHeight: "100vh" }}>
        <style>{`
          [data-us-project] a,
          a[href*="unicorn.studio"],
          a[href*="unicornstudio"],
          [data-us-project] div > a,
          [data-us-project] ~ a,
          [data-us-project] + a,
          [data-us-project] ~ div > a,
          a[target="_blank"][rel="noopener noreferrer"] {
            color: black !important;
            background: black !important;
            background-color: black !important;
            border-color: black !important;
            box-shadow: none !important;
            fill: black !important;
            stroke: black !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          [data-us-project] a *,
          a[href*="unicorn.studio"] *,
          a[href*="unicornstudio"] * {
            color: black !important;
            fill: black !important;
            stroke: black !important;
            opacity: 0 !important;
          }
        `}</style>

        <div className="absolute inset-0">
          <div
            ref={containerRef}
            style={{ width: "100%", height: "100%", minHeight: "100vh" }}
            data-us-project="2V8iRUl8f24c0jIjRFRQ"
          ></div>
        </div>
      </section>

      {/* Trust */}
      <section className="section-padding bg-secondary/40">
        <div className="container text-center">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            Built for traders who think
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            No gimmicks. No spam. No gamification. Just honest tools that help you make better decisions with your money.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30 hover:bg-accent/30">
                <f.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section className="section-padding bg-secondary/40">
        <div className="container text-center">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            Free to use. Always.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Quantify is open and free. Your AI runs locally on your machine — no cloud costs, no subscriptions.
          </p>
          <div className="mt-8 grid gap-6 text-center md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold text-foreground">₹0</div>
              <p className="mt-1 text-sm text-muted-foreground">Equity delivery</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">₹0</div>
              <p className="mt-1 text-sm text-muted-foreground">AI insights</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">₹0</div>
              <p className="mt-1 text-sm text-muted-foreground">Account opening</p>
            </div>
          </div>
          <Link
            to="/signup"
            className="mt-8 inline-block rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
