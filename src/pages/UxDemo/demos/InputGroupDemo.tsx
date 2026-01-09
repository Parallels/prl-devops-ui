import React, { useState } from 'react';
import { InputGroup, Input, MultiToggle, Toggle } from '../../../controls';
import { ButtonColor } from '../../../controls/Button';
import { colorOptions } from '../constants';
import { PlaygroundSection } from '../PlaygroundSection';

export const InputGroupDemo: React.FC = () => {
    const [inputGroupTone, setInputGroupTone] = useState<ButtonColor>('blue');
    const [inputGroupSize, setInputGroupSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [inputGroupLeading, setInputGroupLeading] = useState(true);
    const [inputGroupTrailing, setInputGroupTrailing] = useState(true);

    return (
        <PlaygroundSection
            title="Input Group"
            label="[InputGroup]"
            description="Chain inputs with addons for prefixes/suffixes."
            controls={
                <div className="space-y-4 text-sm">
                    <label className="flex flex-col gap-2">
                        <span>Tone</span>
                        <MultiToggle
                            fullWidth
                            options={colorOptions}
                            value={inputGroupTone}
                            size="sm"
                            onChange={(value) => setInputGroupTone(value as ButtonColor)}
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span>Size</span>
                        <MultiToggle
                            fullWidth
                            options={[
                                { label: 'SM', value: 'sm' },
                                { label: 'MD', value: 'md' },
                                { label: 'LG', value: 'lg' },
                            ]}
                            value={inputGroupSize}
                            size="sm"
                            onChange={(value) => setInputGroupSize(value as 'sm' | 'md' | 'lg')}
                        />
                    </label>
                    <div className="grid gap-2 md:grid-cols-2">
                        <label className="flex items-center justify-between">
                            <span>Leading addon</span>
                            <Toggle
                                size="sm"
                                checked={inputGroupLeading}
                                onChange={(event) => setInputGroupLeading(event.target.checked)}
                            />
                        </label>
                        <label className="flex items-center justify-between">
                            <span>Trailing addon</span>
                            <Toggle
                                size="sm"
                                checked={inputGroupTrailing}
                                onChange={(event) => setInputGroupTrailing(event.target.checked)}
                            />
                        </label>
                    </div>
                </div>
            }
            preview={
                <InputGroup
                    tone={inputGroupTone}
                    size={inputGroupSize}
                    leadingAddon={inputGroupLeading ? 'https://' : undefined}
                    trailingAddon={inputGroupTrailing ? '.example.com' : undefined}
                >
                    <Input placeholder="workspace" />
                </InputGroup>
            }
        />
    );
};
