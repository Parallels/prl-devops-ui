// @ts-nocheck
import React from "react";
import { PlaygroundSection } from "../PlaygroundSection";
import { Badge } from "../../..";

export const BadgeDemo: React.FC = () => (
  <PlaygroundSection
    title="Badge"
    label="[Badge]"
    description="Notification counts or status indicators."
    controls={
      <div className="text-sm text-neutral-500">
        No interactive controls for this component.
      </div>
    }
    preview={
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-neutral-500">
            Variants
          </span>
          <div className="flex gap-2">
            <Badge count={5} tone="primary" />
            <Badge count={5} tone="secondary" />
            <Badge count={5} tone="success" />
            <Badge count={5} tone="danger" />
            <Badge count={5} tone="warning" />
            <Badge count={5} tone="info" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-neutral-500">Dot</span>
          <div className="flex gap-2">
            <div className="relative inline-flex">
              <div className="h-8 w-8 rounded bg-neutral-200 dark:bg-neutral-700"></div>
              <span className="absolute -top-1 -right-1">
                <Badge dot tone="danger" />
              </span>
            </div>
            <div className="relative inline-flex">
              <div className="h-8 w-8 rounded bg-neutral-200 dark:bg-neutral-700"></div>
              <span className="absolute -top-1 -right-1">
                <Badge dot tone="success" />
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-neutral-500">
            Max Count
          </span>
          <div className="flex gap-2">
            <Badge count={100} maxCount={99} tone="danger" />
            <Badge count={1000} maxCount={999} tone="primary" />
          </div>
        </div>
      </div>
    }
  />
);
