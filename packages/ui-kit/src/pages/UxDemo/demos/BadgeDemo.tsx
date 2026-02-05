import React from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { Badge } from '../../..';

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
                    <span className="text-xs font-semibold text-neutral-500">Variants</span>
                    <div className="flex gap-2">
                        <Badge count={5} variant="primary" />
                        <Badge count={5} variant="secondary" />
                        <Badge count={5} variant="success" />
                        <Badge count={5} variant="danger" />
                        <Badge count={5} variant="warning" />
                        <Badge count={5} variant="info" />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-neutral-500">Dot</span>
                    <div className="flex gap-2">
                        <div className="relative inline-flex">
                            <div className="h-8 w-8 rounded bg-neutral-200 dark:bg-neutral-700"></div>
                            <span className="absolute -top-1 -right-1">
                                <Badge dot variant="danger" />
                            </span>
                        </div>
                        <div className="relative inline-flex">
                            <div className="h-8 w-8 rounded bg-neutral-200 dark:bg-neutral-700"></div>
                            <span className="absolute -top-1 -right-1">
                                <Badge dot variant="success" />
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-neutral-500">Max Count</span>
                    <div className="flex gap-2">
                        <Badge count={100} maxCount={99} variant="danger" />
                        <Badge count={1000} maxCount={999} variant="primary" />
                    </div>
                </div>
            </div>
        }
    />
);
