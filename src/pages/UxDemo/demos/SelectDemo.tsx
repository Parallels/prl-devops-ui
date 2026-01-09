import React, { useState } from 'react';
import Select from '../../../controls/Select';
import Toggle from '../../../controls/Toggle';
import MultiToggle from '../../../controls/MultiToggle';
import { ButtonColor } from '../../../controls/Button';
import { PlaygroundSection } from '../PlaygroundSection';
import { colorOptions } from '../constants';

export const SelectDemo: React.FC = () => {
    const [selectTone, setSelectTone] = useState<ButtonColor>('blue');
    const [selectSize, setSelectSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [selectValidation, setSelectValidation] = useState<'none' | 'error' | 'success'>('none');
    const [selectLeadingIcon, setSelectLeadingIcon] = useState(false);
    const [selectHideCaret, setSelectHideCaret] = useState(false);
    const [selectDisabled, setSelectDisabled] = useState(false);
    const [selectValue, setSelectValue] = useState('option-1');

    return (
        <PlaygroundSection
            title="Select"
            label="[Select]"
            description="Styled select dropdown with icon support."
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
                                value={selectSize}
                                size="sm"
                                onChange={(value) => setSelectSize(value as 'sm' | 'md' | 'lg')}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Tone</span>
                            <MultiToggle
                                fullWidth
                                options={colorOptions}
                                value={selectTone}
                                size="sm"
                                onChange={(value) => setSelectTone(value as ButtonColor)}
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
                            value={selectValidation}
                            size="sm"
                            onChange={(value) => setSelectValidation(value as 'none' | 'error' | 'success')}
                        />
                    </label>
                    <div className="grid gap-2 md:grid-cols-4">
                        {[
                            { label: 'Leading icon', value: selectLeadingIcon, setter: setSelectLeadingIcon },
                            { label: 'Hide caret', value: selectHideCaret, setter: setSelectHideCaret },
                            { label: 'Disabled', value: selectDisabled, setter: setSelectDisabled },
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
                    <Select
                        size={selectSize}
                        tone={selectTone}
                        validationStatus={selectValidation}
                        leadingIcon={selectLeadingIcon ? 'Globe' : undefined}
                        hideCaret={selectHideCaret}
                        disabled={selectDisabled}
                        placeholder="Pick a region"
                        value={selectValue}
                        onChange={(event) => setSelectValue(event.target.value)}
                    >
                        <option value="us">United States</option>
                        <option value="eu">Europe</option>
                        <option value="apac">Asia Pacific</option>
                    </Select>
                    <Select multiple placeholder="Multi select" size="md">
                        <option value="one">One</option>
                        <option value="two">Two</option>
                        <option value="three">Three</option>
                    </Select>
                </div>
            }
        />
    );
};
