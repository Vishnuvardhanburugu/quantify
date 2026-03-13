import { useRef, useState, useEffect } from "react";

export type OhlcPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

const UP_COLOR = "#22c55e";
const DOWN_COLOR = "#ef4444";
const WICK_COLOR = "#64748b";
const MARGIN = { top: 12, right: 12, bottom: 28, left: 48 };

export type OverlayLine = {
  name: string;
  values: number[];
  color: string;
};

export function CandlestickChart({
  data,
  height = 320,
  hoveredDate,
  onHoverDate,
  yAxisDecimals = 0,
  overlayLines = [],
}: {
  data: OhlcPoint[];
  height?: number;
  hoveredDate?: string | null;
  onHoverDate?: (date: string | null) => void;
  yAxisDecimals?: number;
  overlayLines?: OverlayLine[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [localHover, setLocalHover] = useState<string | null>(null);
  const activeDate = hoveredDate ?? localHover;

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => setWidth(el.offsetWidth));
    ro.observe(el);
    setWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  if (!data?.length || width <= 0) {
    return <div ref={containerRef} className="w-full" style={{ height }} />;
  }

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const candleMin = Math.min(...data.map((d) => d.low));
  const candleMax = Math.max(...data.map((d) => d.high));
  let min = candleMin;
  let max = candleMax;
  overlayLines.forEach((line) => {
    line.values.forEach((v) => {
      if (typeof v === "number" && !Number.isNaN(v)) {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    });
  });
  const pad = (max - min) * 0.05 || 1;
  const range = max - min + pad * 2;
  const yScale = (v: number) =>
    MARGIN.top + innerH - ((v - min + pad) / range) * innerH;
  const n = data.length;
  const barW = Math.max(3, innerW / n - 2);
  const xCenter = (i: number) => MARGIN.left + (i + 0.5) * (innerW / n);

  const dateToIndex = (date: string) => data.findIndex((d) => d.date === date);
  const indexToDate = (i: number) => (i >= 0 && i < data.length ? data[i].date : null);
  const pixelToIndex = (px: number) => {
    const x = px - MARGIN.left;
    if (x < 0 || x > innerW) return -1;
    const i = Math.floor((x / innerW) * n);
    return Math.max(0, Math.min(i, n - 1));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const i = pixelToIndex(px);
    const date = indexToDate(i);
    setLocalHover(date);
    onHoverDate?.(date);
  };

  const handleMouseLeave = () => {
    setLocalHover(null);
    onHoverDate?.(null);
  };

  const hoveredPoint = activeDate ? data[dateToIndex(activeDate)] : null;
  const hoveredX = hoveredPoint != null ? xCenter(dateToIndex(activeDate!)) : null;

  const ticks = [min, min + range / 2, max].filter((v, i, a) => a.indexOf(v) === i);

  const overlayPath = (values: number[]) => {
    let first = true;
    return values
      .map((v, i) => {
        const x = xCenter(i);
        const y = typeof v === "number" && !Number.isNaN(v) ? yScale(v) : null;
        if (y == null) return null;
        const cmd = first ? (first = false, "M") : "L";
        return `${cmd} ${x} ${y}`;
      })
      .filter(Boolean)
      .join(" ");
  };

  return (
    <div
      ref={containerRef}
      className="w-full relative"
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid */}
        {ticks.map((v, i) => (
          <line
            key={i}
            x1={MARGIN.left}
            y1={yScale(v)}
            x2={width - MARGIN.right}
            y2={yScale(v)}
            stroke="var(--border)"
            strokeDasharray="3 3"
            strokeOpacity={0.6}
          />
        ))}
        {/* Y-axis labels */}
        {ticks.map((v, i) => (
          <text
            key={i}
            x={MARGIN.left - 6}
            y={yScale(v)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 10 }}
          >
            {v.toFixed(yAxisDecimals)}
          </text>
        ))}
        {/* Candles */}
        {data.map((d, i) => {
          const x = xCenter(i) - barW / 2;
          const isUp = d.close >= d.open;
          const bodyTop = yScale(Math.max(d.open, d.close));
          const bodyH = Math.abs(yScale(d.close) - yScale(d.open)) || 2;
          const tip = `${d.date}  O:${d.open.toFixed(2)} H:${d.high.toFixed(2)} L:${d.low.toFixed(2)} C:${d.close.toFixed(2)}`;
          return (
            <g key={`${d.date}-${i}`} style={{ cursor: "pointer" }}>
              <title>{tip}</title>
              <line
                x1={xCenter(i)}
                y1={yScale(d.high)}
                x2={xCenter(i)}
                y2={yScale(d.low)}
                stroke={WICK_COLOR}
                strokeWidth={1}
              />
              <rect
                x={x}
                y={bodyTop}
                width={barW}
                height={bodyH}
                fill={isUp ? UP_COLOR : DOWN_COLOR}
                stroke={isUp ? UP_COLOR : DOWN_COLOR}
                strokeWidth={1}
              />
            </g>
          );
        })}
        {/* Overlay lines (e.g. 10-day, 15-day EMAs) – drawn over candles so they collide/overlap */}
        {overlayLines.map((line) => (
          <path
            key={line.name}
            d={overlayPath(line.values)}
            fill="none"
            stroke={line.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* Crosshair: vertical line at hovered date */}
        {hoveredX != null && (
          <line
            x1={hoveredX}
            y1={MARGIN.top}
            x2={hoveredX}
            y2={height - MARGIN.bottom}
            stroke="hsl(var(--primary))"
            strokeWidth={1}
            strokeDasharray="4 2"
            opacity={0.9}
          />
        )}
        {/* X-axis labels (every Nth) */}
        {data
          .filter((_, i) => i % Math.max(1, Math.floor(n / 8)) === 0)
          .map((d) => {
            const idx = data.indexOf(d);
            return (
              <text
                key={d.date}
                x={xCenter(idx)}
                y={height - 8}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 10 }}
              >
                {d.date.slice(5)}
              </text>
            );
          })}
      </svg>
      {/* Floating tooltip at cursor: show value when hovering */}
      {hoveredPoint && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border bg-background px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            left: hoveredX != null ? Math.min(Math.max(hoveredX - 60, 8), width - 130) : 0,
            top: 8,
          }}
        >
          <div className="font-medium text-muted-foreground">{hoveredPoint.date}</div>
          <div className="mt-0.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 font-mono">
            <span className="text-muted-foreground">O</span>
            <span>{hoveredPoint.open.toFixed(2)}</span>
            <span className="text-muted-foreground">H</span>
            <span className="text-green-600">{hoveredPoint.high.toFixed(2)}</span>
            <span className="text-muted-foreground">L</span>
            <span className="text-red-600">{hoveredPoint.low.toFixed(2)}</span>
            <span className="text-muted-foreground">C</span>
            <span>{hoveredPoint.close.toFixed(2)}</span>
          </div>
          {overlayLines.length > 0 && activeDate && (() => {
            const idx = data.findIndex((d) => d.date === activeDate);
            if (idx < 0) return null;
            return (
              <div className="mt-1 pt-1 border-t border-border/50 space-y-0.5">
                {overlayLines.map((line) => (
                  <div key={line.name} className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-0.5 rounded-full shrink-0" style={{ backgroundColor: line.color }} />
                    <span className="font-mono text-foreground">{line.name}: {(line.values[idx] ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
