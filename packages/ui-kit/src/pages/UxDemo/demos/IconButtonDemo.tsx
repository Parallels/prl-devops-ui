import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { IconButton, MultiToggle, Toggle } from '../../..';
import { ButtonColor, ButtonSize, ButtonVariant } from '../../..';
import { colorOptions, buttonVariantOptions, buttonSizeOptions } from '../constants';
import notificationService from '../mocks/NotificationService';
import { GLOBAL_NOTIFICATION_CHANNEL } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const createUpdateToast = (message?: string) => {
    const id = uuidv4();
    notificationService.createNotification({
        id: id,
        message: `You clicked something!`,
        details: message ?? 'This is a detailed message for the notification toast.',
        autoClose: true,
        dismissible: true,
        showAsToast: true,
        channel: GLOBAL_NOTIFICATION_CHANNEL,
    });
};

export const IconButtonDemo: React.FC = () => {
    const [iconButtonVariant, setIconButtonVariant] = useState<ButtonVariant>('solid');
    const [iconButtonSize, setIconButtonSize] = useState<ButtonSize>('md');
    const [iconButtonColor, setIconButtonColor] = useState<ButtonColor>('blue');
    const [iconButtonLoading, setIconButtonLoading] = useState(false);
    const [iconButtonDisabled, setIconButtonDisabled] = useState(false);
    const [iconButtonAccent, setIconButtonAccent] = useState(false);

    return (
        <PlaygroundSection
            title="Icon Buttons"
            label="[IconButton]"
            description="Adjust accent, size, and loading states."
            controls={
                <div className="space-y-4">
                    <div className="space-y-2">
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                            Color
                        </span>
                        <MultiToggle
                            fullWidth
                            options={colorOptions}
                            value={iconButtonColor}
                            size="sm"
                            onChange={(value) => setIconButtonColor(value as ButtonColor)}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm">
                            <span>Variant</span>
                            <MultiToggle
                                fullWidth
                                options={buttonVariantOptions}
                                value={iconButtonVariant}
                                size="sm"
                                onChange={(value) => setIconButtonVariant(value as ButtonVariant)}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm">
                            <span>Size</span>
                            <MultiToggle
                                fullWidth
                                options={buttonSizeOptions}
                                value={iconButtonSize}
                                size="sm"
                                onChange={(value) => setIconButtonSize(value as ButtonSize)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-2 text-sm md:grid-cols-2">
                        {[
                            { label: 'Loading', value: iconButtonLoading, setter: setIconButtonLoading },
                            { label: 'Disabled', value: iconButtonDisabled, setter: setIconButtonDisabled },
                            { label: 'Accent', value: iconButtonAccent, setter: setIconButtonAccent },
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
                <IconButton
                    variant={iconButtonVariant}
                    color={iconButtonColor}
                    loading={iconButtonLoading}
                    disabled={iconButtonDisabled}
                    icon="Send"
                    size={iconButtonSize}
                    accent={iconButtonAccent}
                    onClick={() => createUpdateToast()}
                />
            }
        />
    );
};
