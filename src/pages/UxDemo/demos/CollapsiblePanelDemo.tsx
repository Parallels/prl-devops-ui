import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlaygroundSection } from '../PlaygroundSection';
import { CollapsiblePanel, MultiToggle, Toggle, Button } from '../../../controls';
import { PanelTone } from '../../../controls/Panel';
import { panelToneOptions } from '../constants';
import notificationService from '../../../services/NotificationService';
import { GLOBAL_NOTIFICATION_CHANNEL } from '../../../constants/constants';

export const CollapsiblePanelDemo: React.FC = () => {
    const [collapsiblePanelVariant, setCollapsiblePanelVariant] = useState<'card' | 'plain'>('card');
    const [collapsiblePanelTone, setCollapsiblePanelTone] = useState<PanelTone>('neutral');
    const [collapsiblePanelExpanded, setCollapsiblePanelExpanded] = useState(true);
    const [collapsiblePanelDisabled, setCollapsiblePanelDisabled] = useState(false);

    const createUpdateToast = (message?: string) => {
        const id = uuidv4();
        console.info('Creating update notification with id:', id);
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

    return (
        <PlaygroundSection
            title="Collapsible Panel"
            label="[CollapsiblePanel]"
            description="Simple accordion-style panel with tone and variant controls."
            controls={
                <div className="space-y-4 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Variant</span>
                            <MultiToggle
                                fullWidth
                                options={[
                                    { label: 'Card', value: 'card' },
                                    { label: 'Plain', value: 'plain' },
                                ]}
                                value={collapsiblePanelVariant}
                                size="sm"
                                onChange={(value) => setCollapsiblePanelVariant(value as 'card' | 'plain')}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Tone</span>
                            <MultiToggle
                                fullWidth
                                options={panelToneOptions}
                                value={collapsiblePanelTone}
                                size="sm"
                                onChange={(value) => setCollapsiblePanelTone(value as PanelTone)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex items-center justify-between">
                            <span>Expanded</span>
                            <Toggle
                                size="sm"
                                checked={collapsiblePanelExpanded}
                                onChange={(event) => setCollapsiblePanelExpanded(event.target.checked)}
                            />
                        </label>
                        <label className="flex items-center justify-between">
                            <span>Disabled</span>
                            <Toggle
                                size="sm"
                                checked={collapsiblePanelDisabled}
                                onChange={(event) => setCollapsiblePanelDisabled(event.target.checked)}
                            />
                        </label>
                    </div>
                </div>
            }
            preview={
                <CollapsiblePanel
                    title="Deployment logs"
                    subtitle="Last updated 5 minutes ago"
                    tone={collapsiblePanelTone}
                    variant={collapsiblePanelVariant}
                    expanded={collapsiblePanelExpanded}
                    onToggle={setCollapsiblePanelExpanded}
                    disabled={collapsiblePanelDisabled}
                    actions={
                        <Button size="xs" variant="ghost" color="slate" onClick={() => createUpdateToast()}>
                            Refresh
                        </Button>
                    }
                >
                    <p>
                        Showing the latest deployment output. Errors and status logs appear here while we run
                        automated checks against the new release.
                    </p>
                </CollapsiblePanel>
            }
        />
    );
};
