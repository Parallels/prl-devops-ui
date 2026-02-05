import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import StatTile from "./StatTile";
import type { StatTileProps } from "./StatTile";
import type { ThemeColor } from "../theme";

export interface StatGraphSeries {
  key: string;
  label: string;
  color: ThemeColor;
}

export interface StatGraphTileProps extends Omit<StatTileProps, "body" | "progress" | "trend" | "meta" | "footer"> {
  data: any[];
  variant: "bar" | "sparkline";
  series: StatGraphSeries[];
  height?: number;
  showLegend?: boolean;
  showAxes?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
}

const StatGraphTile: React.FC<StatGraphTileProps> = ({ data, variant = "bar", series, height = 200, showLegend = true, showAxes = true, showGrid = true, showTooltip = true, ...props }) => {
  // Custom Legend Header for Bar Chart
  const customActions = useMemo(() => {
    if (!showLegend || variant !== "bar") return null;

    return (
      <div className="flex items-center space-x-4">
        {series.map((s) => (
          <div key={s.key} className="flex items-center">
            <div className={`w-2.5 h-2.5 rounded-full bg-${s.color}-500 mr-2`} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    );
  }, [showLegend, variant, series]);

  // Graph colors helper
  const getColor = (color: ThemeColor | "text" | "grid") => {
    const colorMap: Record<string, string> = {
      blue: "#3b82f6",
      sky: "#0ea5e9",
      emerald: "#10b981",
      indigo: "#6366f1",
      slate: "#64748b",
      amber: "#f59e0b",
      green: "#22c55e",
      red: "#ef4444",
      text: "#64748b", // neutral-500
      grid: "#e2e8f0", // neutral-200
    };

    return colorMap[color] || "#3b82f6";
  };

  const renderChart = () => {
    if (variant === "bar") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} barSize={8} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={getColor("grid")} opacity={0.5} />}
            {showAxes && (
              <>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: getColor("text"), fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: getColor("text"), fontSize: 12 }} />
              </>
            )}
            {showTooltip && <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />}
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} fill={getColor(s.color)} radius={[4, 4, 4, 4]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (variant === "sparkline") {
      return (
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={data}>
            <Line type="monotone" dataKey={series[0].key} stroke={getColor(series[0].color)} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
            {/* We can add a custom dot for the last point if we want to match Screenshot 2 exactly */}
          </LineChart>
        </ResponsiveContainer>
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
          {/* Sparkline specific content layout */}
          {variant === "sparkline" && (
            <div className="mt-2 mb-4 px-1">
              {renderChart()}
              <div className="mt-4">
                <div className="text-3xl font-bold text-neutral-900 dark:text-white">{props.value}</div>
                {props.subtitle && <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{props.subtitle}</div>}
              </div>
            </div>
          )}

          {variant === "bar" && <div className="mt-4">{renderChart()}</div>}
        </div>
      }
    />
  );
};

export default StatGraphTile;
