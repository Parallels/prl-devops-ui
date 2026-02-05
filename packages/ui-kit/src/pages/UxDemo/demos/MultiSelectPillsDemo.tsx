import React, { useState } from 'react';
import { MultiSelectPills, Select } from '../../..';

import { PlaygroundSection } from '../PlaygroundSection';

export const MultiSelectPillsDemo: React.FC = () => {
    const [selected, setSelected] = useState<string[]>(['option1']);
    const [selectionMode, setSelectionMode] = useState<'multiple' | 'single'>('multiple');
    const [color, setColor] = useState<'indigo' | 'blue' | 'emerald' | 'amber' | 'rose'>('indigo');
    const [size, setSize] = useState<'xs' | 'sm' | 'base' | 'lg'>('sm');
    const [disabled, setDisabled] = useState(false);

    const options = [
        { value: 'option1', label: 'Option 1', description: 'Desc 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3', disabled: true },
        { value: 'option4', label: 'Option 4' },
    ];

    return (
        <PlaygroundSection
            title="Multi Select Pills"
            label="[MultiSelectPills]"
            description="A group of pill-shaped buttons for selection."
            controls={
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Selection Mode</label>
                        <Select
                            value={selectionMode}
                            onChange={(e) => setSelectionMode(e.target.value as 'multiple' | 'single')}
                        >
                            <option value="multiple">Multiple</option>
                            <option value="single">Single</option>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Color</label>
                        <Select value={color} onChange={(e) => setColor(e.target.value as 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose')}>
                            <option value="indigo">Indigo</option>
                            <option value="blue">Blue</option>
                            <option value="emerald">Emerald</option>
                            <option value="rose">Rose</option>
                            <option value="amber">Amber</option>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Size</label>
                        <Select value={size} onChange={(e) => setSize(e.target.value as 'xs' | 'sm' | 'base' | 'lg')}>
                            <option value="xs">XS</option>
                            <option value="sm">SM</option>
                            <option value="base">Base</option>
                            <option value="lg">LG</option>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">State</label>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={disabled}
                                    onChange={(e) => setDisabled(e.target.checked)}
                                />
                                Disabled
                            </label>
                        </div>
                    </div>
                </div>
            }
            preview={
                <div className="flex items-center justify-center p-8">
                    <MultiSelectPills
                        name="demo-pills"
                        options={options}
                        value={selected}
                        onChange={setSelected}
                        selectionMode={selectionMode}
                        color={color}
                        size={size}
                        disabled={disabled}
                        legend="Select Options"
                    />
                </div>
            }
        />
    );
};
