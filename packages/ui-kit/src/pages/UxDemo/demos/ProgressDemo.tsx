// @ts-nocheck
import React, { useState } from 'react';
import { Progress, Toggle, MultiToggle } from '../../..';
import { PlaygroundSection } from '../PlaygroundSection';
import { colorOptions } from '../constants';
import { ProgressSize } from '../../..';
import { SpinnerColor } from '../../..';

export const ProgressDemo: React.FC = () => {
    const [progressValue, setProgressValue] = useState(45);
    const [progressSize, setProgressSize] = useState<ProgressSize>('md');
    const [progressColor, setProgressColor] = useState<SpinnerColor>('blue');
    const [progressShimmer, setProgressShimmer] = useState(true);

    return (
        <PlaygroundSection
            title="Progress"
            label="[Progress]"
            description="Deterministic progress bar with shimmer."
            controls={
                <div className="space-y-4 text-sm">
                    <label className="flex flex-col gap-2">
                        <span>Value ({progressValue}%)</span>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={progressValue}
                            onChange={(event) => setProgressValue(Number(event.target.value))}
                            className="w-full accent-blue-500"
                        />
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Size</span>
                            <MultiToggle
                                fullWidth
                                options={[
                                    { label: 'XS', value: 'xs' },
                                    { label: 'SM', value: 'sm' },
                                    { label: 'MD', value: 'md' },
                                    { label: 'LG', value: 'lg' },
                                ]}
                                value={progressSize}
                                size="sm"
                                onChange={(value) => setProgressSize(value as ProgressSize)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Color</span>
                            <MultiToggle
                                fullWidth
                                options={colorOptions}
                                value={progressColor}
                                size="sm"
                                onChange={(value) => setProgressColor(value as SpinnerColor)}
                            />
                        </label>
                    </div>
                    <label className="flex items-center justify-between">
                        <span>Show shimmer</span>
                        <Toggle
                            size="sm"
                            checked={progressShimmer}
                            onChange={(event) => setProgressShimmer(event.target.checked)}
                        />
                    </label>
                </div>
            }
            preview={
                <div className="space-y-3">
                    <Progress
                        value={progressValue}
                        size={progressSize}
                        color={progressColor}
                        showShimmer={progressShimmer}
                    />
                    <Progress value={100} size="sm" color="emerald" showShimmer={false} />
                </div>
            }
        />
    );
};
