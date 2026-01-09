import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { Checkbox, MultiToggle, Toggle } from '../../../controls';
import { CheckboxColor } from '../../../controls/Checkbox';
import { colorOptions } from '../constants';

export const CheckboxDemo: React.FC = () => {
    const [checkboxColor, setCheckboxColor] = useState<CheckboxColor>('blue');
    const [checkboxSize, setCheckboxSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [checkboxAlign, setCheckboxAlign] = useState<'left' | 'right'>('left');
    const [checkboxDescriptionPlacement, setCheckboxDescriptionPlacement] = useState<
        'bottom' | 'inline'
    >('bottom');
    const [checkboxLabel, setCheckboxLabel] = useState(true);
    const [checkboxDescription, setCheckboxDescription] = useState(true);
    const [checkboxIndeterminate, setCheckboxIndeterminate] = useState(false);
    const [checkboxDisabled, setCheckboxDisabled] = useState(false);
    const [checkboxChecked, setCheckboxChecked] = useState(true);

    return (
        <PlaygroundSection
            title="Checkbox"
            label="[Checkbox]"
            description="Accessible checkbox with description layouts."
            controls={
                <div className="space-y-4 text-sm">
                    <label className="flex flex-col gap-2">
                        <span>Color</span>
                        <MultiToggle
                            fullWidth
                            options={colorOptions}
                            value={checkboxColor}
                            size="sm"
                            onChange={(value) => setCheckboxColor(value as CheckboxColor)}
                        />
                    </label>
                    <div className="grid gap-3 md:grid-cols-3">
                        <label className="flex flex-col gap-2">
                            <span>Size</span>
                            <MultiToggle
                                fullWidth
                                options={[
                                    { label: 'SM', value: 'sm' },
                                    { label: 'MD', value: 'md' },
                                    { label: 'LG', value: 'lg' },
                                ]}
                                value={checkboxSize}
                                size="sm"
                                onChange={(value) => setCheckboxSize(value as 'sm' | 'md' | 'lg')}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Align</span>
                            <MultiToggle
                                fullWidth
                                options={[
                                    { label: 'Left', value: 'left' },
                                    { label: 'Right', value: 'right' },
                                ]}
                                value={checkboxAlign}
                                size="sm"
                                onChange={(value) => setCheckboxAlign(value as 'left' | 'right')}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Description</span>
                            <MultiToggle
                                fullWidth
                                options={[
                                    { label: 'Stacked', value: 'bottom' },
                                    { label: 'Inline', value: 'inline' },
                                ]}
                                value={checkboxDescriptionPlacement}
                                size="sm"
                                onChange={(value) => setCheckboxDescriptionPlacement(value as 'bottom' | 'inline')}
                            />
                        </label>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                        {[
                            { label: 'Show label', value: checkboxLabel, setter: setCheckboxLabel },
                            {
                                label: 'Show description',
                                value: checkboxDescription,
                                setter: setCheckboxDescription,
                            },
                            {
                                label: 'Indeterminate',
                                value: checkboxIndeterminate,
                                setter: setCheckboxIndeterminate,
                            },
                            { label: 'Disabled', value: checkboxDisabled, setter: setCheckboxDisabled },
                        ].map((item) => (
                            <label key={item.label} className="flex items-center justify-between">
                                <span>{item.label}</span>
                                <Toggle
                                    size="sm"
                                    checked={item.value}
                                    onChange={(event) => item.setter(event.target.checked)}
                                />
                            </label>
                        ))}
                    </div>
                </div>
            }
            preview={
                <div className="space-y-3">
                    <Checkbox
                        label={checkboxLabel ? 'Subscribe to release notes' : undefined}
                        description={
                            checkboxDescription
                                ? 'We will send important product updates occasionally.'
                                : undefined
                        }
                        descriptionPlacement={checkboxDescriptionPlacement}
                        size={checkboxSize}
                        color={checkboxColor}
                        indeterminate={checkboxIndeterminate}
                        controlAlign={checkboxAlign}
                        checked={checkboxChecked}
                        disabled={checkboxDisabled}
                        onChange={(event) => setCheckboxChecked(event.target.checked)}
                    />
                    <Checkbox label="I agree to the terms" color="emerald" size="lg" />
                </div>
            }
        />
    );
};
