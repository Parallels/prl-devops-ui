import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { Pill, MultiToggle, Toggle, CustomIcon } from '../../..';
import { PillTone, PillVariant, PillSize } from '../../..';
import { alertToneOptions } from '../constants';

export const PillDemo: React.FC = () => {
    const [pillTone, setPillTone] = useState<PillTone>('info');
    const [pillVariant, setPillVariant] = useState<PillVariant>('soft');
    const [pillSize, setPillSize] = useState<PillSize>('md');
    const [pillUppercase, setPillUppercase] = useState(false);
    const [pillShowIcon, setPillShowIcon] = useState(true);
    const [pillDot, setPillDot] = useState(false);

    return (
        <PlaygroundSection
            title="Pills"
            label="[Pill]"
            description="Small badges for status and metadata."
            controls={
                <div className="space-y-4 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Tone</span>
                            <MultiToggle
                                fullWidth
                                options={alertToneOptions}
                                value={pillTone}
                                size="sm"
                                onChange={(value) => setPillTone(value as PillTone)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Variant</span>
                            <MultiToggle
                                fullWidth
                                options={[
                                    { label: 'Soft', value: 'soft' },
                                    { label: 'Solid', value: 'solid' },
                                    { label: 'Outline', value: 'outline' },
                                ]}
                                value={pillVariant}
                                size="sm"
                                onChange={(value) => setPillVariant(value as PillVariant)}
                            />
                        </label>
                    </div>
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
                            value={pillSize}
                            size="sm"
                            onChange={(value) => setPillSize(value as PillSize)}
                        />
                    </label>
                    <div className="grid gap-2 md:grid-cols-3">
                        {[
                            { label: 'Uppercase', value: pillUppercase, setter: setPillUppercase },
                            { label: 'Show icon', value: pillShowIcon, setter: setPillShowIcon },
                            { label: 'Dot mode', value: pillDot, setter: setPillDot },
                        ].map((item) => (
                            <label key={item.label} className="flex items-center justify-between gap-2">
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
                <div className="flex flex-wrap gap-3">
                    <Pill
                        tone={pillTone}
                        variant={pillVariant}
                        size={pillSize}
                        uppercase={pillUppercase}
                        dot={pillDot}
                        icon={pillShowIcon && !pillDot ? <CustomIcon icon="Info" /> : undefined}
                    >
                        {pillDot ? null : 'In review'}
                    </Pill>
                    <Pill tone="success" variant="solid" icon={<CustomIcon icon="CheckCircle" />}>
                        Healthy
                    </Pill>
                    <Pill tone="warning" variant="outline">
                        Pending approval
                    </Pill>
                </div>
            }
        />
    );
};
