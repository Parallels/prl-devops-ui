import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { CollapsibleHelpText, MultiToggle, Toggle } from '../../..';
import { ThemeColor } from '../../..';
import { colorOptions, collapsibleVariantOptions } from '../constants';

export const CollapsibleHelpDemo: React.FC = () => {
    const [helpTone, setHelpTone] = useState<ThemeColor>('emerald');
    const [helpShowIcon, setHelpShowIcon] = useState<boolean>(true);
    const [helpUseLongCopy, setHelpUseLongCopy] = useState<boolean>(true);
    const [helpMaxLength, setHelpMaxLength] = useState<number>(130);
    const [helpVariant, setHelpVariant] = useState<'card' | 'plain'>('card');

    const shortHelpCopy =
        'We encrypt your API tokens client-side using the session keys you configure here.';
    const longHelpCopy =
        'We ask for usage feedback a few weeks after onboarding. Your responses help us prioritize features like Git integration, remote builds, and workspace sharing. The score is anonymous unless you choose to leave your name in the comment field. Feel free to mention bugs, friction, or workflows you would like us to streamline.';

    return (
        <PlaygroundSection
            title="Collapsible Help Text"
            label="[CollapsibleHelpText]"
            description="Inline helper copy that truncates to a summary and expands for more context."
            controls={
                <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col gap-3">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                                    Tone
                                </span>
                                <MultiToggle
                                    fullWidth
                                    size="sm"
                                    options={colorOptions}
                                    value={helpTone}
                                    onChange={(value) => setHelpTone(value as ThemeColor)}
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                                    Variant
                                </span>
                                <MultiToggle
                                    fullWidth
                                    size="sm"
                                    options={collapsibleVariantOptions}
                                    value={helpVariant}
                                    onChange={(value) => setHelpVariant(value as 'card' | 'plain')}
                                />
                            </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="flex items-center justify-between gap-2 text-sm">
                                <span>Show Icon</span>
                                <Toggle
                                    size="sm"
                                    checked={helpShowIcon}
                                    onChange={(event) => setHelpShowIcon(event.target.checked)}
                                />
                            </label>
                            <label className="flex items-center justify-between gap-2 text-sm">
                                <span>Use Long Copy</span>
                                <Toggle
                                    size="sm"
                                    checked={helpUseLongCopy}
                                    onChange={(event) => setHelpUseLongCopy(event.target.checked)}
                                />
                            </label>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                                Max Length ({helpMaxLength} characters)
                            </label>
                            <input
                                type="range"
                                min={60}
                                max={240}
                                value={helpMaxLength}
                                onChange={(event) => setHelpMaxLength(Number(event.target.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>
                    </div>
                </div>
            }
            preview={
                <CollapsibleHelpText
                    title={helpUseLongCopy ? 'Why we ask for reviews' : 'Secret tokens'}
                    text={helpUseLongCopy ? longHelpCopy : shortHelpCopy}
                    showIcon={helpShowIcon}
                    tone={helpTone}
                    maxLength={helpMaxLength}
                    variant={helpVariant}
                />
            }
        />
    );
};
