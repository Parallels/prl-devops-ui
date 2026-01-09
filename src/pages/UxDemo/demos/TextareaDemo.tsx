import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { Textarea, Select, Toggle } from '../../../controls';
import { ButtonColor } from '../../../controls/Button';
import { colorOptions } from '../constants';

export const TextareaDemo: React.FC = () => {
    const [textareaSize, setTextareaSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [textareaTone, setTextareaTone] = useState<ButtonColor>('blue');
    const [textareaValidation, setTextareaValidation] = useState<'none' | 'error' | 'success'>('none');
    const [textareaResize, setTextareaResize] = useState<'none' | 'vertical' | 'horizontal' | 'both'>('vertical');
    const [textareaDisabled, setTextareaDisabled] = useState(false);

    return (
        <PlaygroundSection
            title="Textarea"
            label="[Textarea]"
            description="A multi-line text input control."
            controls={
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Size</label>
                            <Select
                                value={textareaSize}
                                onChange={(e) => setTextareaSize(e.target.value as "sm" | "md" | "lg")}
                            >
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Tone</label>
                            <Select
                                value={textareaTone}
                                onChange={(e) => setTextareaTone(e.target.value as ButtonColor)}
                            >
                                {colorOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Validation</label>
                            <Select
                                value={textareaValidation}
                                onChange={(e) => setTextareaValidation(e.target.value as "none" | "error" | "success")}
                            >
                                <option value="none">None</option>
                                <option value="error">Error</option>
                                <option value="success">Success</option>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Resize</label>
                            <Select
                                value={textareaResize}
                                onChange={(e) => setTextareaResize(e.target.value as "none" | "both" | "horizontal" | "vertical")}
                            >
                                <option value="none">None</option>
                                <option value="vertical">Vertical</option>
                                <option value="horizontal">Horizontal</option>
                                <option value="both">Both</option>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Toggle
                            label="Disabled"
                            checked={textareaDisabled}
                            onChange={(e) => setTextareaDisabled(e.target.checked)}
                        />
                    </div>
                </div>
            }
            preview={
                <div className="w-full max-w-md">
                    <Textarea
                        placeholder="Enter your text here..."
                        size={textareaSize}
                        tone={textareaTone}
                        validationStatus={textareaValidation}
                        resize={textareaResize}
                        disabled={textareaDisabled}
                    />
                </div>
            }
        />
    );
};
