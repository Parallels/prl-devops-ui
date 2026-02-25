import { useCallback, useEffect, useRef, useState } from "react";

export interface UseResizableOptions {
  /** Initial width in pixels */
  initialWidth: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels (or function returning max) */
  maxWidth?: number | (() => number);
  /** Called on every resize frame */
  onResize?: (width: number) => void;
  /** Called when drag ends */
  onResizeEnd?: (width: number) => void;
  /** Whether resizing is enabled */
  enabled?: boolean;
}

export interface UseResizableReturn {
  /** Current width in pixels */
  width: number;
  /** Whether the user is currently dragging */
  isDragging: boolean;
  /** Props to spread onto the resize handle element */
  handleProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    role: "separator";
    "aria-orientation": "vertical";
    "aria-valuenow": number;
    "aria-valuemin": number;
    "aria-valuemax": number;
    tabIndex: number;
  };
}

export function useResizable({
  initialWidth,
  minWidth = 100,
  maxWidth: maxWidthOpt = 600,
  onResize,
  onResizeEnd,
  enabled = true,
}: UseResizableOptions): UseResizableReturn {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const getMaxWidth = useCallback(() => {
    return typeof maxWidthOpt === "function" ? maxWidthOpt() : maxWidthOpt;
  }, [maxWidthOpt]);

  const clamp = useCallback(
    (value: number) => Math.max(minWidth, Math.min(getMaxWidth(), value)),
    [minWidth, getMaxWidth],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = clamp(startWidthRef.current + delta);
      setWidth(newWidth);
      onResize?.(newWidth);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setWidth((w) => {
        onResizeEnd?.(w);
        return w;
      });
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, clamp, onResize, onResizeEnd]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      setIsDragging(true);
    },
    [enabled, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) return;
      const step = 20;
      let newWidth = width;
      if (e.key === "ArrowRight") {
        newWidth = clamp(width + step);
      } else if (e.key === "ArrowLeft") {
        newWidth = clamp(width - step);
      } else {
        return;
      }
      e.preventDefault();
      setWidth(newWidth);
      onResize?.(newWidth);
      onResizeEnd?.(newWidth);
    },
    [enabled, width, clamp, onResize, onResizeEnd],
  );

  const resolvedMax = getMaxWidth();

  return {
    width,
    isDragging,
    handleProps: {
      onPointerDown,
      onKeyDown,
      role: "separator" as const,
      "aria-orientation": "vertical" as const,
      "aria-valuenow": width,
      "aria-valuemin": minWidth,
      "aria-valuemax": resolvedMax,
      tabIndex: enabled ? 0 : -1,
    },
  };
}
