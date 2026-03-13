import { useEffect, useRef } from "react";

const About = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = (window as any).UnicornStudio;
    if (u && u.init) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => u.init());
      } else {
        u.init();
      }
    } else {
      (window as any).UnicornStudio = { isInitialized: false };
      const i = document.createElement("script");
      i.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.3/dist/unicornStudio.umd.js";
      i.onload = () => {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => (window as any).UnicornStudio.init());
        } else {
          (window as any).UnicornStudio.init();
        }
      };
      (document.head || document.body).appendChild(i);
    }

    const cleanupInterval = setInterval(() => {
      // Camouflage: make everything black so it merges with the black background
      const hide = (el: HTMLElement) => {
        el.style.setProperty("color", "black", "important");
        el.style.setProperty("background", "black", "important");
        el.style.setProperty("background-color", "black", "important");
        el.style.setProperty("border-color", "black", "important");
        el.style.setProperty("box-shadow", "none", "important");
        el.style.setProperty("text-decoration", "none", "important");
        el.style.setProperty("fill", "black", "important");
        el.style.setProperty("stroke", "black", "important");
        el.style.setProperty("opacity", "0", "important");
      };

      document.querySelectorAll('a[href*="unicorn.studio"], a[href*="unicornstudio"]').forEach((el) => {
        hide(el as HTMLElement);
        el.querySelectorAll("*").forEach((child) => hide(child as HTMLElement));
      });
      // Match by text content
      document.querySelectorAll("a, span, div, p").forEach((el) => {
        const txt = el.textContent?.toLowerCase() || "";
        if (txt.includes("unicorn.studio") || txt.includes("made with unicorn") || txt.includes("unicornstudio")) {
          if (el.children.length <= 2) {
            hide(el as HTMLElement);
            el.querySelectorAll("*").forEach((child) => hide(child as HTMLElement));
          }
        }
      });
      // Shadow DOM
      document.querySelectorAll("*").forEach((el) => {
        if (el.shadowRoot) {
          el.shadowRoot.querySelectorAll("a, span, div, svg, img, p").forEach((inner) => {
            const txt = inner.textContent?.toLowerCase() || "";
            if (
              (inner as HTMLAnchorElement).href?.includes("unicorn") ||
              txt.includes("unicorn") ||
              txt.includes("made with")
            ) {
              hide(inner as HTMLElement);
              inner.querySelectorAll("*").forEach((child) => hide(child as HTMLElement));
            }
          });
        }
      });
    }, 50);

    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <div className="flex flex-col w-full">
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

      {/* ── Hero Animation Section ── */}
      <section className="relative w-full overflow-hidden" style={{ height: "70vh" }}>
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <div
            ref={containerRef}
            style={{ width: "100%", height: "100%", minHeight: "70vh" }}
            data-us-project="NXQZyAufIlbwWd5zpVqR"
          />
        </div>
      </section>

      {/* ── About Content (Zerodha-inspired) ── */}
      <section className="py-24 bg-background">
        <div className="container max-w-5xl mx-auto px-4 md:px-8">

          {/* Headline */}
          <div className="text-center mb-20">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
              We set out to break the information monopoly in Indian capital markets.
              <br />
              <span className="text-primary mt-2 block">
                Now, we are doing it again — with Institutional-Grade AI.
              </span>
            </h1>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full mt-8" />
          </div>

          {/* Two-column story */}
          <div className="grid md:grid-cols-2 gap-16 mb-24">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold border-b border-border pb-4">Our Origins</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Quantify was born from a startling realization: the gap between retail traders and institutional desks
                was never about capital — it was about <strong>technology</strong>. Hedge funds deployed
                deep-learning ensembles, quant models, and sub-millisecond data pipelines. Retail traders were left
                with lagging indicators, gut feelings, and emotional biases.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We set out to dismantle that divide. By fusing transformer-based architectures with live market feeds,
                we engineered an entirely new financial operating system — one that places institutional firepower into
                the hands of every Indian investor.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-semibold border-b border-border pb-4">Our Philosophy</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe trading should be <strong>transparent</strong>, <strong>data-driven</strong>, and completely
                devoid of noise. No gamification. No manipulative nudges designed to make you over-trade. No hidden
                advisory fees disguised as "premium tiers."
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Every tool inside Quantify — from real-time portfolio heatmaps and MACD signal engines to our locally
                processed AI assistant — is designed with a singular purpose: protect our traders from psychological
                traps and maximize their mathematical edge.
              </p>
            </div>
          </div>

          {/* Impact numbers */}
          <div className="bg-secondary/30 rounded-3xl p-10 md:p-14 mb-24 text-center border border-border">
            <h3 className="text-2xl md:text-3xl font-bold mb-10">An ecosystem built on trust</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <div className="text-5xl font-extrabold text-primary mb-2">100%</div>
                <p className="text-muted-foreground font-medium">Local AI Processing — your data never leaves your machine</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-extrabold text-primary mb-2">₹0</div>
                <p className="text-muted-foreground font-medium">Hidden advisory or platform fees</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-extrabold text-primary mb-2">24/7</div>
                <p className="text-muted-foreground font-medium">Objective, emotion-free market analysis</p>
              </div>
            </div>
          </div>


          {/* ── Team Section ── */}
          <div className="text-center pt-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">The Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
              A passionate team of builders, analysts, and designers united by a single mission — to make
              institutional-grade trading intelligence accessible to everyone.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">

              {/* Vishnu Vardhan */}
              <div className="flex flex-col items-center group">
                <div className="w-36 h-36 rounded-full mb-6 relative overflow-hidden shadow-2xl border-4 border-primary/20 group-hover:border-primary transition-colors duration-300"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #06b6d4 100%)" }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-xl font-bold">B. Vishnu Vardhan</h4>
                <p className="text-primary font-semibold mb-3 text-sm">Founder & Lead Developer</p>
                <p className="text-muted-foreground text-sm text-center leading-relaxed max-w-xs">
                  Passionate about building intelligent digital platforms that simplify complex financial data. Created Quantify to help traders track performance, analyze strategies, and make smarter investment decisions through technology, data, and automation.
                </p>
              </div>

              {/* Sai Kumar */}
              <div className="flex flex-col items-center group">
                <div className="w-36 h-36 rounded-full mb-6 relative overflow-hidden shadow-2xl border-4 border-primary/20 group-hover:border-primary transition-colors duration-300"
                  style={{ background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)" }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-xl font-bold">P. Sai Kumar</h4>
                <p className="text-primary font-semibold mb-3 text-sm">Co-Founder & Data Analyst</p>
                <p className="text-muted-foreground text-sm text-center leading-relaxed max-w-xs">
                  Specializes in analyzing trading data, identifying patterns, and transforming raw financial information into meaningful insights. Ensures the platform delivers accurate analytics and data-driven features for smarter strategies.
                </p>
              </div>

              {/* Ramana */}
              <div className="flex flex-col items-center group">
                <div className="w-36 h-36 rounded-full mb-6 relative overflow-hidden shadow-2xl border-4 border-primary/20 group-hover:border-primary transition-colors duration-300"
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)" }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-xl font-bold">S. Ramana</h4>
                <p className="text-primary font-semibold mb-3 text-sm">UI/UX Designer</p>
                <p className="text-muted-foreground text-sm text-center leading-relaxed max-w-xs">
                  Focuses on creating intuitive, clean, and user-friendly interfaces that make complex trading tools easy to use. Ensures users can navigate the platform smoothly while maintaining a visually modern experience.
                </p>
              </div>

              {/* Karthik */}
              <div className="flex flex-col items-center group">
                <div className="w-36 h-36 rounded-full mb-6 relative overflow-hidden shadow-2xl border-4 border-primary/20 group-hover:border-primary transition-colors duration-300"
                  style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #d946ef 100%)" }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-xl font-bold">O. Karthik</h4>
                <p className="text-primary font-semibold mb-3 text-sm">Quality Assurance & Tester</p>
                <p className="text-muted-foreground text-sm text-center leading-relaxed max-w-xs">
                  Manages testing and quality assurance for Quantify. Ensures every feature works smoothly and efficiently through systematic testing and debugging, maintaining platform reliability and performance.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
