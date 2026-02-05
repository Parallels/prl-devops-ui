import React, { useState } from 'react';
import { Spinner, Loader, Toggle, MultiToggle } from '../../..';
import { PlaygroundSection } from '../PlaygroundSection';
import { colorOptions } from '../constants';
import {
    SpinnerSize,
    SpinnerColor,
    SpinnerVariant,
    SpinnerThickness,
} from '../../..';

export const SpinnerDemo: React.FC = () => {
    const [spinnerSize, setSpinnerSize] = useState<SpinnerSize>('md');
    const [spinnerColor, setSpinnerColor] = useState<SpinnerColor>('blue');
    const [spinnerVariant, setSpinnerVariant] = useState<SpinnerVariant>('solid');
    const [spinnerThickness, setSpinnerThickness] = useState<SpinnerThickness>('normal');
    const [spinnerLabel, setSpinnerLabel] = useState(true);

    return (
        <PlaygroundSection
            title="Spinner & Loader"
            label="[Spinner / Loader]"
            description="Indeterminate spinner and loader previews."
            controls={
                <div className="space-y-4 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Spinner size</span>
                            <MultiToggle
                                fullWidth
                                options={[
                                    { label: 'XS', value: 'xs' },
                                    { label: 'SM', value: 'sm' },
                                    { label: 'MD', value: 'md' },
                                    { label: 'LG', value: 'lg' },
                                    { label: 'XL', value: 'xl' },
                                ]}
                                value={spinnerSize}
                                size="sm"
                                onChange={(value) => setSpinnerSize(value as SpinnerSize)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Color</span>
                            <MultiToggle
                                fullWidth
                                options={colorOptions}
                                value={spinnerColor}
                                size="sm"
                                onChange={(value) => setSpinnerColor(value as SpinnerColor)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Variant</span>
                            <MultiToggle
                                fullWidth
                                options={[
                                    { label: 'Solid', value: 'solid' },
                                    { label: 'Segments', value: 'segments' },
                                ]}
                                value={spinnerVariant}
                                size="sm"
                                onChange={(value) => setSpinnerVariant(value as SpinnerVariant)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Thickness</span>
                            <MultiToggle
                                fullWidth
                                options={[
                                    { label: 'Thin', value: 'thin' },
                                    { label: 'Normal', value: 'normal' },
                                    { label: 'Thick', value: 'thick' },
                                ]}
                                value={spinnerThickness}
                                size="sm"
                                onChange={(value) => setSpinnerThickness(value as SpinnerThickness)}
                            />
                        </label>
                    </div>
                    <label className="flex items-center justify-between">
                        <span>Show label</span>
                        <Toggle
                            size="sm"
                            checked={spinnerLabel}
                            onChange={(event) => setSpinnerLabel(event.target.checked)}
                        />
                    </label>
                </div>
            }
            preview={
                <div className="space-y-4">
                    <Spinner
                        size={spinnerSize}
                        color={spinnerColor}
                        variant={spinnerVariant}
                        thickness={spinnerThickness}
                        label={spinnerLabel ? 'Deploying update' : undefined}
                    />
                    <Loader overlay={false} title="Syncing..." spinnerVariant="segments" />
                </div>
            }
        />
    );
};
