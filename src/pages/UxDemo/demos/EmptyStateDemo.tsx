import React, { useState } from 'react';
import EmptyState, { EmptyStateTone } from '../../../controls/EmptyState';
import { ButtonVariant, ButtonColor, ButtonSize } from '../../../controls/Button';
import { IconName } from '@/types/Icon';
import MultiToggle from '../../../controls/MultiToggle';
import Toggle from '../../../controls/Toggle';
import { PlaygroundSection } from '../PlaygroundSection';
import { alertToneOptions, buttonVariantOptions, colorOptions, buttonSizeOptions } from '../constants';

export const EmptyStateDemo: React.FC = () => {
    const [emptyTone, setEmptyTone] = useState<EmptyStateTone>('neutral');
    const [emptyTitle, setEmptyTitle] = useState('All caught up');
    const [emptySubtitle, setEmptySubtitle] = useState(
        'Connect your first workspace or import data to see activity here.'
    );
    const [emptyShowSubtitle, setEmptyShowSubtitle] = useState(true);
    const [emptyShowIcon, setEmptyShowIcon] = useState(true);
    const [emptyShowAction, setEmptyShowAction] = useState(true);
    const [emptyButtonText, setEmptyButtonText] = useState('Create workspace');
    const [emptyActionVariant, setEmptyActionVariant] = useState<ButtonVariant>('soft');
    const [emptyActionColor, setEmptyActionColor] = useState<ButtonColor>('blue');
    const [emptyFullWidth, setEmptyFullWidth] = useState(false);
    const [emptyActionSize, setEmptyActionSize] = useState<ButtonSize>('sm');
    const [emptyActionUseIcon, setEmptyActionUseIcon] = useState(false);
    const [emptyActionLeadingIcon, setEmptyActionLeadingIcon] = useState<IconName>('Plus');

    return (
        <PlaygroundSection
            title="Empty States"
            label="[EmptyState]"
            description="Use Tailwind empty states with tone, icon, and action controls."
            controls={
                <div className="space-y-4 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Tone</span>
                            <MultiToggle
                                fullWidth
                                options={alertToneOptions}
                                value={emptyTone}
                                size="sm"
                                onChange={(value) => setEmptyTone(value as EmptyStateTone)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Action variant</span>
                            <MultiToggle
                                fullWidth
                                options={buttonVariantOptions}
                                value={emptyActionVariant}
                                size="sm"
                                onChange={(value) => setEmptyActionVariant(value as ButtonVariant)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Action color</span>
                            <MultiToggle
                                fullWidth
                                options={colorOptions}
                                value={emptyActionColor}
                                size="sm"
                                onChange={(value) => setEmptyActionColor(value as ButtonColor)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Action size</span>
                            <MultiToggle
                                fullWidth
                                options={buttonSizeOptions}
                                value={emptyActionSize}
                                size="sm"
                                onChange={(value) => setEmptyActionSize(value as ButtonSize)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Button label</span>
                            <input
                                type="text"
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-900"
                                value={emptyButtonText}
                                onChange={(event) => setEmptyButtonText(event.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Leading icon name</span>
                            <input
                                type="text"
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-900 disabled:opacity-50"
                                value={emptyActionLeadingIcon}
                                onChange={(event) => setEmptyActionLeadingIcon(event.target.value as IconName)}
                                disabled={!emptyActionUseIcon}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Title</span>
                            <input
                                type="text"
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-900"
                                value={emptyTitle}
                                onChange={(event) => setEmptyTitle(event.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Subtitle</span>
                            <textarea
                                rows={3}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-900"
                                value={emptySubtitle}
                                onChange={(event) => setEmptySubtitle(event.target.value)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                        {[
                            { label: 'Show subtitle', value: emptyShowSubtitle, setter: setEmptyShowSubtitle },
                            { label: 'Show icon', value: emptyShowIcon, setter: setEmptyShowIcon },
                            { label: 'Show action', value: emptyShowAction, setter: setEmptyShowAction },
                            { label: 'Full width', value: emptyFullWidth, setter: setEmptyFullWidth },
                            { label: 'Leading icon', value: emptyActionUseIcon, setter: setEmptyActionUseIcon },
                        ].map((option) => (
                            <label key={option.label} className="flex items-center justify-between">
                                <span>{option.label}</span>
                                <Toggle
                                    size="sm"
                                    checked={option.value}
                                    onChange={(event) => option.setter(event.target.checked)}
                                />
                            </label>
                        ))}
                    </div>
                </div>
            }
            preview={
                <EmptyState
                    className={emptyFullWidth ? undefined : 'mx-auto max-w-xl'}
                    tone={emptyTone}
                    title={emptyTitle || 'Empty state title'}
                    subtitle={emptyShowSubtitle ? emptySubtitle || undefined : undefined}
                    showIcon={emptyShowIcon}
                    buttonText={emptyShowAction ? emptyButtonText || 'Create item' : undefined}
                    onAction={emptyShowAction ? () => console.log('Empty state action clicked') : undefined}
                    actionVariant={emptyActionVariant}
                    actionColor={emptyActionColor}
                    actionSize={emptyActionSize}
                    actionLeadingIcon={emptyActionUseIcon ? emptyActionLeadingIcon : undefined}
                />
            }
        />
    );
};

