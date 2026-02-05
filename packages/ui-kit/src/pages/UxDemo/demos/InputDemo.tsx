import React, { useState } from 'react';
import { Input, Toggle, MultiToggle, ButtonColor } from '../../..';
import { PlaygroundSection } from '../PlaygroundSection';
import { colorOptions } from '../constants';

export const InputDemo: React.FC = () => {
    const [inputSize, setInputSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [inputTone, setInputTone] = useState<ButtonColor>('blue');
    const [inputValidation, setInputValidation] = useState<'none' | 'error' | 'success'>('none');
    const [inputDisabled, setInputDisabled] = useState(false);
    const [inputLeadingIcon, setInputLeadingIcon] = useState(true);
    const [inputTrailingIcon, setInputTrailingIcon] = useState(false);
    const [inputUnstyled, setInputUnstyled] = useState(false);

    return (
        <PlaygroundSection
            title="Inputs"
            label="[Input]"
            description="Text inputs with validation, icons, and tones."
            controls={
                <div className="space-y-4 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Size</span>
                            <MultiToggle
                                fullWidth
                                options={[
                                    { label: 'SM', value: 'sm' },
                                    { label: 'MD', value: 'md' },
                                    { label: 'LG', value: 'lg' },
                                ]}
                                value={inputSize}
                                size="sm"
                                onChange={(value) => setInputSize(value as 'sm' | 'md' | 'lg')}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Tone</span>
                            <MultiToggle
                                fullWidth
                                options={colorOptions}
                                value={inputTone}
                                size="sm"
                                onChange={(value) => setInputTone(value as ButtonColor)}
                            />
                        </label>
                    </div>
                    <label className="flex flex-col gap-2">
                        <span>Validation</span>
                        <MultiToggle
                            fullWidth
                            options={[
                                { label: 'None', value: 'none' },
                                { label: 'Error', value: 'error' },
                                { label: 'Success', value: 'success' },
                            ]}
                            value={inputValidation}
                            size="sm"
                            onChange={(value) => setInputValidation(value as 'none' | 'error' | 'success')}
                        />
                    </label>
                    <div className="grid gap-2 md:grid-cols-4">
                        {[
                            { label: 'Leading icon', value: inputLeadingIcon, setter: setInputLeadingIcon },
                            { label: 'Trailing icon', value: inputTrailingIcon, setter: setInputTrailingIcon },
                            { label: 'Disabled', value: inputDisabled, setter: setInputDisabled },
                            { label: 'Unstyled', value: inputUnstyled, setter: setInputUnstyled },
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
                    <Input
                        size={inputSize}
                        tone={inputTone}
                        validationStatus={inputValidation}
                        leadingIcon={inputLeadingIcon ? 'Search' : undefined}
                        trailingIcon={inputTrailingIcon ? 'Notification' : undefined}
                        placeholder="Search or command"
                        disabled={inputDisabled}
                        unstyled={inputUnstyled}
                    />
                    <Input tone="blue" placeholder="Inline unstyled input" unstyled />
                </div>
            }
        />
    );
};
