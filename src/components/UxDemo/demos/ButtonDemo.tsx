import React, { useState } from 'react';
import { Button, Toggle, MultiToggle } from '../../../controls';
import { PlaygroundSection } from '../PlaygroundSection';
import {
    colorOptions,
    buttonVariantOptions,
    buttonSizeOptions,
    buttonWeightOptions,
} from '../constants';
import {
    ButtonVariant,
    ButtonSize,
    ButtonWeight,
    ButtonColor,
} from '../../../controls/Button';

export const ButtonDemo: React.FC = () => {
    const [buttonVariant, setButtonVariant] = useState<ButtonVariant>('solid');
    const [buttonSize, setButtonSize] = useState<ButtonSize>('md');
    const [buttonWeight, setButtonWeight] = useState<ButtonWeight>('normal');
    const [buttonColor, setButtonColor] = useState<ButtonColor>('blue');
    const [buttonLoading, setButtonLoading] = useState<boolean>(false);
    const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);
    const [buttonShowLeadingIcon, setButtonShowLeadingIcon] = useState<boolean>(false);
    const [buttonShowTrailingIcon, setButtonShowTrailingIcon] = useState<boolean>(false);
    const [buttonFullWidth, setButtonFullWidth] = useState<boolean>(false);

    return (
        <PlaygroundSection
            title="Buttons"
            label="[Button]"
            description="Experiment with variants, weights, and icon options."
            controls={
                <div className="space-y-4">
                    <div className="space-y-2">
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                            Color
                        </span>
                        <MultiToggle
                            fullWidth
                            options={colorOptions}
                            value={buttonColor}
                            size="sm"
                            onChange={(value) => setButtonColor(value as ButtonColor)}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                                Variant
                            </span>
                            <MultiToggle
                                fullWidth
                                options={buttonVariantOptions}
                                value={buttonVariant}
                                size="sm"
                                onChange={(value) => setButtonVariant(value as ButtonVariant)}
                            />
                        </div>
                        <div className="space-y-2">
                            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                                Size
                            </span>
                            <MultiToggle
                                fullWidth
                                options={buttonSizeOptions}
                                value={buttonSize}
                                size="sm"
                                onChange={(value) => setButtonSize(value as ButtonSize)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                                Weight
                            </span>
                            <MultiToggle
                                fullWidth
                                options={buttonWeightOptions}
                                value={buttonWeight}
                                size="sm"
                                onChange={(value) => setButtonWeight(value as ButtonWeight)}
                            />
                        </div>
                        <div className="grid gap-2 text-sm md:grid-cols-2">
                            {[
                                { label: 'Loading', value: buttonLoading, setter: setButtonLoading },
                                { label: 'Disabled', value: buttonDisabled, setter: setButtonDisabled },
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
                    <div className="grid gap-2 text-sm md:grid-cols-2">
                        {[
                            {
                                label: 'Leading Icon',
                                value: buttonShowLeadingIcon,
                                setter: setButtonShowLeadingIcon,
                            },
                            {
                                label: 'Trailing Icon',
                                value: buttonShowTrailingIcon,
                                setter: setButtonShowTrailingIcon,
                            },
                            { label: 'Full Width', value: buttonFullWidth, setter: setButtonFullWidth },
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
                <Button
                    variant={buttonVariant}
                    color={buttonColor}
                    loading={buttonLoading}
                    disabled={buttonDisabled}
                    size={buttonSize}
                    weight={buttonWeight}
                    fullWidth={buttonFullWidth}
                    leadingIcon={buttonShowLeadingIcon ? 'Search' : undefined}
                    trailingIcon={buttonShowTrailingIcon ? 'ArrowRight' : undefined}
                >
                    Button Label
                </Button>
            }
        />
    );
};
