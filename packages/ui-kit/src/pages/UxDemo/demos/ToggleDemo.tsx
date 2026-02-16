import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { Toggle, MultiToggle } from '../../..';
import { ThemeColor } from '../../..';
import { ToggleSize, ToggleAlign, ToggleDescriptionPlacement } from '../../..';
import {
    colorOptions,
    toggleSizeOptions,
    toggleAlignOptions,
    toggleDescriptionPlacementOptions,
} from '../constants';

export const ToggleDemo: React.FC = () => {
    const [toggleChecked, setToggleChecked] = useState<boolean>(true);
    const [toggleColor, setToggleColor] = useState<ThemeColor>('blue');
    const [toggleSize, setToggleSize] = useState<ToggleSize>('md');
    const [toggleAlign, setToggleAlign] = useState<ToggleAlign>('left');
    const [toggleLabel, setToggleLabel] = useState<boolean>(true);
    const [toggleFullWidth, setToggleFullWidth] = useState<boolean>(false);
    const [toggleCustomIcons, setToggleCustomIcons] = useState<boolean>(false);
    const [toggleDescription, setToggleDescription] = useState<boolean>(false);
    const [toggleDisabled, setToggleDisabled] = useState<boolean>(false);
    const [toggleDescriptionPlacement, setToggleDescriptionPlacement] =
        useState<ToggleDescriptionPlacement>('stacked');

    const toggleBooleanOptions = [
        { label: 'Show label', value: toggleLabel, setter: setToggleLabel },
        { label: 'Disabled', value: toggleDisabled, setter: setToggleDisabled },
        { label: 'Show description', value: toggleDescription, setter: setToggleDescription },
        { label: 'Full width', value: toggleFullWidth, setter: setToggleFullWidth },
        { label: 'Custom icons', value: toggleCustomIcons, setter: setToggleCustomIcons },
    ];

    return (
        <PlaygroundSection
            title="Toggle"
            label="[Toggle]"
            description="Switch labels, layout, and icon treatments."
            controls={
                <div className="space-y-4">
                    <div className="space-y-2">
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                            Tone
                        </span>
                        <MultiToggle
                            fullWidth
                            options={colorOptions}
                            value={toggleColor}
                            size="sm"
                            onChange={(value) => setToggleColor(value as ThemeColor)}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm">
                            <span>Size</span>
                            <MultiToggle
                                fullWidth
                                options={toggleSizeOptions}
                                value={toggleSize}
                                size="sm"
                                onChange={(value) => setToggleSize(value as ToggleSize)}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm">
                            <span>Label alignment</span>
                            <MultiToggle
                                fullWidth
                                options={toggleAlignOptions}
                                value={toggleAlign}
                                size="sm"
                                onChange={(value) => setToggleAlign(value as ToggleAlign)}
                            />
                        </label>
                    </div>
                    <label className="flex flex-col gap-2 text-sm">
                        <span>Description placement</span>
                        <MultiToggle
                            fullWidth
                            options={toggleDescriptionPlacementOptions}
                            value={toggleDescriptionPlacement}
                            size="sm"
                            onChange={(value) =>
                                setToggleDescriptionPlacement(value as ToggleDescriptionPlacement)
                            }
                        />
                    </label>
                    <div className="grid gap-2 text-sm md:grid-cols-2">
                        {toggleBooleanOptions.map((option) => (
                            <label key={option.label} className="flex items-center justify-between">
                                <span>{option.label}</span>
                                <Toggle
                                    size="sm"
                                    checked={option.value}
                                    onChange={(event) => option.setter(event.target.checked)}
                                />
                            </label>
                        ))}
                    </div>
                </div>
            }
            preview={
                <Toggle
                    size={toggleSize}
                    color={toggleColor}
                    checked={toggleChecked}
                    disabled={toggleDisabled}
                    label={toggleLabel ? 'Toggle Label' : undefined}
                    description={
                        toggleDescription ? 'This is a description for the toggle component.' : undefined
                    }
                    descriptionPlacement={toggleDescriptionPlacement}
                    alignLabel={toggleAlign}
                    fullWidth={toggleFullWidth}
                    iconOn={toggleCustomIcons ? 'Send' : undefined}
                    iconOff={toggleCustomIcons ? 'Close' : undefined}
                    onChange={(value) => setToggleChecked(value.target.checked)}
                />
            }
        />
    );
};
