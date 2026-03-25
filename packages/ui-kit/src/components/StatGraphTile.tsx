import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Tooltip as RechartsTooltip } from 'recharts';
import StatTile from './StatTile';
import type { StatTileProps } from './StatTile';
import type { ThemeColor } from '../theme';

export interface StatGraphSeries {
  key: string;
  label: string;
  color: ThemeColor;
}

export interface StatGraphTileProps extends Omit<StatTileProps, 'body' | 'progress' | 'trend' | 'meta' | 'footer'> {
  data: any[];
  variant: 'bar' | 'sparkline';
  series: StatGraphSeries[];
  height?: number;
  showLegend?: boolean;
  showAxes?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  /** Y-axis domain for sparkline. Defaults to [0, 'auto']. Use ['auto', 'auto'] for auto-scaling. */
  yDomain?: [number | string, number | string];
  /** Enable chart enter/update animation. Keep disabled for high-frequency realtime updates. */
  chartAnimation?: boolean;
  /** Animation duration when chartAnimation is enabled. */
  chartAnimationDuration?: number;
  /** Optional cap for rendered data points to reduce chart redraw work. */
  maxDataPoints?: number;
}

// ── Portal tooltip (same approach as MultiProgressBar) ────────────────────────

interface TooltipState {
  x: number;
  y: number;
  payload: any[];
  label: string;
}

interface TooltipSnapshot {
  x: number;
  y: number;
  label: string;
  keys: string;
  values: string;
}

function PortalTooltip({ tooltip, series, getColor }: { tooltip: TooltipState | null; series: StatGraphSeries[]; getColor: (color: string) => string }) {
  if (!tooltip || tooltip.payload.length === 0) return null;

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: 'translate(-50%, calc(-100% - 12px))',
      }}
    >
      <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl ring-1 ring-black/10 dark:ring-black/5 min-w-[100px]">
        {tooltip.payload.map((entry: any) => {
          const s = series.find((s) => s.key === entry.dataKey);
          return (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill ?? getColor(s?.color ?? 'blue') }} />
              <span className="font-semibold">{entry.value}</span>
              {s && <span className="text-neutral-400 dark:text-neutral-500">{s.label}</span>}
            </div>
          );
        })}
      </div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-neutral-900 dark:border-t-white" />
    </div>,
    document.body,
  );
}

// Recharts custom content — renders nothing; we use it only to intercept hover state
function SilentTooltipContent() {
  return null;
}

// ── StatGraphTile ─────────────────────────────────────────────────────────────

const StatGraphTile: React.FC<StatGraphTileProps> = ({
  data,
  variant = 'bar',
  series,
  height = 200,
  showLegend = true,
  showAxes = true,
  showGrid = true,
  showTooltip = true,
  yDomain = [0, 'auto'],
  chartAnimation = true,
  chartAnimationDuration = 250,
  maxDataPoints = 0,
  ...props
}) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipFrameRef = useRef<number | null>(null);
  const tooltipSnapshotRef = useRef<TooltipSnapshot | null>(null);

  useEffect(() => {
    return () => {
      if (tooltipFrameRef.current != null) {
        cancelAnimationFrame(tooltipFrameRef.current);
      }
    };
  }, []);

  // Graph colors helper
  const getColor = useCallback((color: string) => {
    const colorMap: Record<string, string> = {
      blue: '#3b82f6',
      sky: '#0ea5e9',
      emerald: '#10b981',
      indigo: '#6366f1',
      slate: '#64748b',
      amber: '#f59e0b',
      green: '#22c55e',
      red: '#ef4444',
      rose: '#f43f5e',
      violet: '#8b5cf6',
      parallels: '#e4001b',
      neutral: '#737373',
      text: '#64748b',
      grid: '#e2e8f0',
    };
    return colorMap[color] || '#3b82f6';
  }, []);

  const chartData = useMemo(() => {
    if (!maxDataPoints || maxDataPoints <= 0 || data.length <= maxDataPoints) return data;
    return data.slice(-maxDataPoints);
  }, [data, maxDataPoints]);

  const queueTooltipUpdate = useCallback((next: TooltipState | null) => {
    if (tooltipFrameRef.current != null) {
      cancelAnimationFrame(tooltipFrameRef.current);
    }

    tooltipFrameRef.current = requestAnimationFrame(() => {
      tooltipFrameRef.current = null;

      if (!next) {
        if (tooltipSnapshotRef.current === null) return;
        tooltipSnapshotRef.current = null;
        setTooltip(null);
        return;
      }

      const snapshot: TooltipSnapshot = {
        x: next.x,
        y: next.y,
        label: next.label,
        keys: next.payload.map((entry: any) => String(entry.dataKey ?? '')).join('|'),
        values: next.payload.map((entry: any) => String(entry.value ?? '')).join('|'),
      };

      const prev = tooltipSnapshotRef.current;
      if (prev && prev.x === snapshot.x && prev.y === snapshot.y && prev.label === snapshot.label && prev.keys === snapshot.keys && prev.values === snapshot.values) {
        return;
      }

      tooltipSnapshotRef.current = snapshot;
      setTooltip(next);
    });
  }, []);

  // Custom Recharts tooltip renderer — silently tracks hover position/payload into portal state
  const rechartsTooltipContent = useCallback(
    ({ active, payload, label, coordinate }: any) => {
      if (!showTooltip) return null;
      if (active && payload && payload.length > 0 && coordinate) {
        const wrapperEl = wrapperRef.current;
        if (wrapperEl) {
          const rect = wrapperEl.getBoundingClientRect();
          const absX = rect.left + (coordinate.x ?? 0);
          const absY = rect.top + (coordinate.y ?? 0);
          queueTooltipUpdate({ x: absX, y: absY, payload, label: label ?? '' });
        }
      } else {
        queueTooltipUpdate(null);
      }
      return <SilentTooltipContent />;
    },
    [showTooltip, queueTooltipUpdate],
  );

  // Legend (bar only)
  const customActions = useMemo(() => {
    if (!showLegend || variant !== 'bar') return null;
    return (
      <div className="flex items-center space-x-4">
        {series.map((s) => (
          <div key={s.key} className="flex items-center">
            <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: getColor(s.color) }} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    );
  }, [showLegend, variant, series, getColor]);

  const textColor = '#64748b';
  const gridColor = '#e2e8f0';

  const renderChart = () => {
    if (variant === 'bar') {
      return (
        <div ref={wrapperRef} className="relative" onMouseLeave={() => queueTooltipUpdate(null)}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} barSize={8} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.5} />}
              {showAxes && (
                <>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
                </>
              )}
              <RechartsTooltip content={rechartsTooltipContent} cursor={{ fill: 'rgba(100,116,139,0.05)' }} isAnimationActive={false} />
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} fill={getColor(s.color)} radius={[4, 4, 4, 4]} isAnimationActive={chartAnimation} animationDuration={chartAnimation ? chartAnimationDuration : 0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <PortalTooltip tooltip={tooltip} series={series} getColor={getColor} />
        </div>
      );
    }

    if (variant === 'sparkline') {
      return (
        <div ref={wrapperRef} className="relative" onMouseLeave={() => queueTooltipUpdate(null)}>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={chartData}>
              <YAxis domain={yDomain} hide />
              <Line
                type="monotone"
                dataKey={series[0].key}
                stroke={getColor(series[0].color)}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={chartAnimation}
                animationDuration={chartAnimation ? chartAnimationDuration : 0}
              />
              {showTooltip && <RechartsTooltip content={rechartsTooltipContent} cursor={false} isAnimationActive={false} />}
            </LineChart>
          </ResponsiveContainer>
          <PortalTooltip tooltip={tooltip} series={series} getColor={getColor} />
        </div>
      );
    }
    return null;
  };

  return (
    <StatTile
      {...props}
      actions={customActions || props.actions}
      body={
        <div className="flex flex-col h-full w-full">
          {variant === 'sparkline' && (
            <div className="mt-2 mb-4 px-1">
              {renderChart()}
              <div className="mt-4">
                <div className="text-3xl font-bold text-neutral-900 dark:text-white">{props.value}</div>
                {props.subtitle && <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{props.subtitle}</div>}
              </div>
            </div>
          )}
          {variant === 'bar' && <div className="mt-4">{renderChart()}</div>}
        </div>
      }
    />
  );
};

export default StatGraphTile;
