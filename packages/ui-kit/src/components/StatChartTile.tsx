import React, { useState, useMemo } from "react";
import classNames from "classnames";
import StatTile from "./StatTile";
import type { StatTileProps } from "./StatTile";
import { CustomIcon } from "./CustomIcon";
import type { ThemeColor } from "../theme";

export interface StatChartItem {
  label: string;
  value: number;
  color: ThemeColor;
  intensity?: string;
  onClick?: () => void;
}

export interface StatChartDataset {
  id: string | number;
  label: string;
  centerLabel: string;
  items: StatChartItem[];
}

export interface StatChartTileProps extends Omit<StatTileProps, "body" | "title" | "value" | "subtitle"> {
  data: StatChartDataset[];
}

const StatChartTile: React.FC<StatChartTileProps> = ({ data, ...props }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentDataset = data[currentIndex];
  const total = useMemo(() => currentDataset.items.reduce((acc, item) => acc + item.value, 0), [currentDataset]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Chart dimensions
  const size = 200;
  const strokeWidth = 12; // Thicker stroke for donut
  const radius = (size - strokeWidth) / 2 - 1; // -1 for buffer
  const circumference = radius * 2 * Math.PI;

  // Calculate segments
  let cumulativePercent = 0;
  const segments =
    total === 0
      ? [
        {
          label: "",
          value: 0,
          color: "neutral",
          intensity: "200",
          dashArray: `${circumference} ${circumference}`,
          dashOffset: 0,
          onClick: undefined,
        },
      ]
      : currentDataset.items.map((item) => {
        const percent = item.value / total;
        const dashArray = `${circumference * percent} ${circumference}`;
        const dashOffset = -circumference * cumulativePercent;
        cumulativePercent += percent;
        return {
          ...item,
          dashArray,
          dashOffset,
        };
      });

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <StatTile
      {...props}
      body={
        <div className="flex flex-col h-full">
          {/* Header with Navigation */}
          <div className="flex justify-between items-center mb-2 px-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={classNames(
                "p-1 rounded-full transition-colors",
                currentIndex === 0 ? "text-neutral-300 cursor-not-allowed" : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                data.length <= 1 && "invisible",
              )}
            >
              <CustomIcon icon="ChevronLeft" size="sm" />
            </button>

            <span className="font-bold text-neutral-900 dark:text-white flex-1 text-center">{currentDataset.label}</span>

            <button
              onClick={handleNext}
              disabled={currentIndex === data.length - 1}
              className={classNames(
                "p-1 rounded-full transition-colors",
                currentIndex === data.length - 1 ? "text-neutral-300 cursor-not-allowed" : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                data.length <= 1 && "invisible",
              )}
            >
              <CustomIcon icon="ChevronRight" size="sm" />
            </button>
          </div>

          {/* Chart Area */}
          <div className="relative flex-1 flex items-center justify-center min-h-[220px]">
            <svg className="transform -rotate-90 w-48 h-48 overflow-visible" viewBox={`0 0 ${size} ${size}`}>
              {/* Background Circle (Optional, maybe not needed if full 100%) */}
              <circle className="text-neutral-100 dark:text-neutral-800" strokeWidth={strokeWidth} stroke="currentColor" fill="none" r={radius} cx={size / 2} cy={size / 2} />

              {/* Segments - Render non-hovered first */}
              {segments.map((segment, idx) => {
                if (idx === hoveredIndex && total > 0) return null;
                return (
                  <circle
                    key={idx}
                    className={classNames(
                      `text-${segment.color}-${segment.intensity || "500"} transition-all duration-300 ease-out origin-center`,
                      total > 0 && "hover:scale-110 hover:drop-shadow-lg cursor-pointer hover:opacity-90",
                    )}
                    strokeWidth={strokeWidth}
                    strokeDasharray={segment.dashArray}
                    strokeDashoffset={segment.dashOffset}
                    strokeLinecap={total > 0 ? "round" : undefined}
                    stroke="currentColor"
                    fill="none"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    onMouseEnter={() => total > 0 && setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={(e) => {
                      if (total > 0 && segment.onClick) {
                        e.stopPropagation();
                        segment.onClick();
                      }
                    }}
                  >
                    {total > 0 && (
                      <title>
                        {segment.label}: {segment.value}
                      </title>
                    )}
                  </circle>
                );
              })}

              {/* Render Hovered Segment Last (On Top) */}
              {hoveredIndex !== null &&
                total > 0 &&
                segments[hoveredIndex] &&
                (() => {
                  const segment = segments[hoveredIndex];
                  return (
                    <circle
                      key={hoveredIndex}
                      className={classNames(
                        `text-${segment.color}-${segment.intensity || "500"} transition-all duration-300 ease-out origin-center scale-110 drop-shadow-lg cursor-pointer opacity-90`,
                      )}
                      strokeWidth={strokeWidth}
                      strokeDasharray={segment.dashArray}
                      strokeDashoffset={segment.dashOffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      r={radius}
                      cx={size / 2}
                      cy={size / 2}
                      onMouseEnter={() => setHoveredIndex(hoveredIndex)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={(e) => {
                        if (segment.onClick) {
                          e.stopPropagation();
                          segment.onClick();
                        }
                      }}
                    >
                      <title>
                        {segment.label}: {segment.value}
                      </title>
                    </circle>
                  );
                })()}
            </svg>

            {/* Center Text */}
            <div className="absolute flex flex-col items-center justify-center text-center max-w-[120px]">
              <span className="text-4xl font-bold text-neutral-900 dark:text-white leading-none mb-1">{total}</span>
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-tight">{currentDataset.centerLabel}</span>
            </div>
          </div>

          {/* Legend */}
          {total > 0 && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4 px-2">
              {currentDataset.items.map((item, idx) => (
                <div
                  key={idx}
                  className={classNames(
                    "flex items-center justify-between min-w-0 group",
                    item.onClick ? "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded px-1 -mx-1" : "cursor-default",
                  )}
                  title={`${item.label}: ${item.value}`}
                  onClick={() => item.onClick && item.onClick()}
                >
                  <div className="flex items-center min-w-0 mr-2">
                    <div className={`w-2.5 h-2.5 flex-none rounded-full bg-${item.color}-500 mr-2`} />
                    <span className="text-xs text-neutral-600 dark:text-neutral-300 truncate group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white flex-none">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
};

export default StatChartTile;
