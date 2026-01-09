import React, { useState, useRef } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { DropdownButton, DropdownMenu, MultiToggle, Toggle, Button } from '../../../controls';
import { ButtonColor, ButtonSize, ButtonVariant } from '../../../controls/Button';
import {
    dropdownButtonOptions,
    dropdownMenuPreviewOptions,
    buttonVariantOptions,
    colorOptions,
    buttonSizeOptions,
    dropdownWidthOptions,
    dropdownAlignOptions,
    dropdownSideOptions,
} from '../constants';
import notificationService from '@/services/NotificationService';
import { GLOBAL_NOTIFICATION_CHANNEL } from '@/constants/constants';
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

const safeLabelText = (label: React.ReactNode, fallback: string) =>
    typeof label === 'string' ? label : fallback;

export const DropdownButtonDemo: React.FC = () => {
    const [dropdownButtonVariant, setDropdownButtonVariant] = useState<ButtonVariant>('solid');
    const [dropdownButtonSize, setDropdownButtonSize] = useState<ButtonSize>('md');
    const [dropdownButtonColor, setDropdownButtonColor] = useState<ButtonColor>('blue');
    const [dropdownButtonDisabled, setDropdownButtonDisabled] = useState(false);
    const [dropdownButtonFullWidth, setDropdownButtonFullWidth] = useState(false);
    const [dropdownButtonSplit, setDropdownButtonSplit] = useState(true);
    const [dropdownMenuWidthChoice, setDropdownMenuWidthChoice] = useState<'trigger' | '240' | '320'>(
        'trigger'
    );
    const [dropdownSelection, setDropdownSelection] = useState<string>('None');
    const dropdownMenuWidthValue =
        dropdownMenuWidthChoice === 'trigger' ? 'trigger' : Number(dropdownMenuWidthChoice);

    const [menuPreviewAlign, setMenuPreviewAlign] = useState<'start' | 'end'>('end');
    const [menuPreviewSide, setMenuPreviewSide] = useState<'auto' | 'top' | 'bottom'>('auto');
    const [menuPreviewOpen, setMenuPreviewOpen] = useState(false);
    const menuPreviewAnchorRef = useRef<HTMLButtonElement>(null);
    const [menuPreviewSelection, setMenuPreviewSelection] = useState('Nothing selected');

    return (
        <PlaygroundSection
            title="Dropdown Button"
            label="[DropdownButton]"
            description="Control the trigger button plus preview the dropdown menu positioning."
            controls={
                <div className="space-y-4 text-sm">
                    <label className="flex flex-col gap-1">
                        <span>Variant</span>
                        <MultiToggle
                            options={buttonVariantOptions}
                            value={dropdownButtonVariant}
                            size="sm"
                            fullWidth
                            onChange={(value) => setDropdownButtonVariant(value as ButtonVariant)}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span>Color</span>
                        <MultiToggle
                            options={colorOptions}
                            value={dropdownButtonColor}
                            size="sm"
                            fullWidth
                            onChange={(value) => setDropdownButtonColor(value as ButtonColor)}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span>Size</span>
                        <MultiToggle
                            options={buttonSizeOptions}
                            value={dropdownButtonSize}
                            size="sm"
                            fullWidth
                            onChange={(value) => setDropdownButtonSize(value as ButtonSize)}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span>Menu Width</span>
                        <MultiToggle
                            options={dropdownWidthOptions}
                            value={dropdownMenuWidthChoice}
                            size="sm"
                            fullWidth
                            onChange={(value) => setDropdownMenuWidthChoice(value as 'trigger' | '240' | '320')}
                        />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <Toggle
                            size="sm"
                            fullWidth
                            label="Split trigger"
                            checked={dropdownButtonSplit}
                            onChange={(e) => setDropdownButtonSplit(e.target.checked)}
                        />
                        <Toggle
                            size="sm"
                            fullWidth
                            label="Full width"
                            checked={dropdownButtonFullWidth}
                            onChange={(e) => setDropdownButtonFullWidth(e.target.checked)}
                        />
                        <Toggle
                            size="sm"
                            fullWidth
                            label="Disabled"
                            checked={dropdownButtonDisabled}
                            onChange={(e) => setDropdownButtonDisabled(e.target.checked)}
                        />
                    </div>
                    <div className="space-y-2 rounded-2xl border border-neutral-200/80 bg-white/80 p-4 text-sm text-neutral-600 dark:border-neutral-700/70 dark:bg-neutral-900/60 dark:text-neutral-200">
                        <p className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                            Last selection
                        </p>
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {dropdownSelection}
                        </p>
                    </div>
                </div>
            }
            preview={
                <div className="space-y-4">
                    <DropdownButton
                        label="Deploy capsule"
                        options={dropdownButtonOptions}
                        variant={dropdownButtonVariant}
                        color={dropdownButtonColor}
                        size={dropdownButtonSize}
                        disabled={dropdownButtonDisabled}
                        fullWidth={dropdownButtonFullWidth}
                        split={dropdownButtonSplit}
                        menuWidth={dropdownMenuWidthValue}
                        onPrimaryClick={() => createUpdateToast('Primary action clicked')}
                        onOptionSelect={(option) => {
                            setDropdownSelection(option.value);
                            const labelText = safeLabelText(option.label, option.value ?? '');
                            createUpdateToast(`Selected ${labelText}`);
                        }}
                    />
                    <div className="rounded-2xl border border-neutral-200 bg-white/70 p-4 text-sm text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-100">
                        <div className="mb-2 flex flex-wrap gap-2">
                            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                Align
                                <MultiToggle
                                    options={dropdownAlignOptions}
                                    size="sm"
                                    value={menuPreviewAlign}
                                    onChange={(value) => setMenuPreviewAlign(value as 'start' | 'end')}
                                />
                            </label>
                            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                Side
                                <MultiToggle
                                    options={dropdownSideOptions}
                                    size="sm"
                                    value={menuPreviewSide}
                                    onChange={(value) => setMenuPreviewSide(value as 'auto' | 'top' | 'bottom')}
                                />
                            </label>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                ref={menuPreviewAnchorRef}
                                variant="outline"
                                size="sm"
                                onClick={() => setMenuPreviewOpen((prev) => !prev)}
                            >
                                {menuPreviewOpen ? 'Hide Menu' : 'Show Menu'}
                            </Button>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                Selection: {menuPreviewSelection}
                            </span>
                        </div>
                        <DropdownMenu
                            anchorRef={menuPreviewAnchorRef}
                            open={menuPreviewOpen}
                            onClose={() => setMenuPreviewOpen(false)}
                            items={dropdownMenuPreviewOptions}
                            align={menuPreviewAlign}
                            side={menuPreviewSide}
                            onSelect={(item) => {
                                setMenuPreviewSelection(safeLabelText(item.label, item.value ?? ''));
                                setMenuPreviewOpen(false);
                            }}
                        />
                    </div>
                </div>
            }
        />
    );
};
