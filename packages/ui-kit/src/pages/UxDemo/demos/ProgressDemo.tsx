// @ts-nocheck
import React, { useState } from 'react';
import { Progress, MultiToggle } from '../../..';
import { PlaygroundSection } from '../PlaygroundSection';
import { colorOptions } from '../constants';
import { ProgressSize } from '../../..';
import { SpinnerColor } from '../../..';
import { ProgressMotion, ProgressMotionSpeed } from '../../..';
import { ProgressMotionDirection } from '../../..';

export const ProgressDemo: React.FC = () => {
    const [progressValue, setProgressValue] = useState(45);
    const [progressSize, setProgressSize] = useState<ProgressSize>('md');
    const [progressColor, setProgressColor] = useState<SpinnerColor>('blue');
    const [progressMotion, setProgressMotion] = useState<ProgressMotion>('shimmer');
    const [progressMotionSpeed, setProgressMotionSpeed] = useState<ProgressMotionSpeed>('normal');
    const [progressMotionDirection, setProgressMotionDirection] = useState<ProgressMotionDirection>('forward');

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
                    <label className="flex flex-col gap-2">
                        <span>Motion</span>
                        <MultiToggle
                            fullWidth
                            options={[
                                { label: 'None', value: 'none' },
                                { label: 'Shimmer', value: 'shimmer' },
                                { label: 'Pulse', value: 'pulse' },
                                { label: 'Stripes', value: 'stripes' },
                                { label: 'Stripes + Shimmer', value: 'stripes-shimmer' },
                                { label: 'Both', value: 'shimmer-pulse' },
                            ]}
                            value={progressMotion}
                            size="sm"
                            onChange={(value) => setProgressMotion(value as ProgressMotion)}
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span>Motion Speed</span>
                        <MultiToggle
                            fullWidth
                            options={[
                                { label: 'Slow', value: 'slow' },
                                { label: 'Normal', value: 'normal' },
                                { label: 'Fast', value: 'fast' },
                            ]}
                            value={progressMotionSpeed}
                            size="sm"
                            onChange={(value) => setProgressMotionSpeed(value as ProgressMotionSpeed)}
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span>Direction</span>
                        <MultiToggle
                            fullWidth
                            options={[
                                { label: 'Forward', value: 'forward' },
                                { label: 'Reverse', value: 'reverse' },
                            ]}
                            value={progressMotionDirection}
                            size="sm"
                            onChange={(value) => setProgressMotionDirection(value as ProgressMotionDirection)}
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
                        motion={progressMotion}
                        motionSpeed={progressMotionSpeed}
                        motionDirection={progressMotionDirection}
                    />
                    <Progress value={100} size="sm" color="emerald" motion="stripes-shimmer" motionDirection={progressMotionDirection} />
                </div>
            }
        />
    );
};
