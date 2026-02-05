import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { Alert, Button, MultiToggle, Toggle, Pill } from '../../..';
import { AlertTone, AlertVariant } from '../../..';
import { alertToneOptions, alertVariantOptions } from '../constants';
import notificationService from '../mocks/NotificationService';
import { GLOBAL_NOTIFICATION_CHANNEL } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const createUpdateToast = (message?: string) => {
    const id = uuidv4();
    notificationService.createNotification({
        id,
        channel: GLOBAL_NOTIFICATION_CHANNEL,
        message: 'Update successful',
        details: message || 'Your changes have been saved.',
        type: 'success',
        autoClose: true,
        dismissible: true,
        showAsToast: true,
    });
};

export const AlertDemo: React.FC = () => {
    const [alertTone, setAlertTone] = useState<AlertTone>('info');
    const [alertVariant, setAlertVariant] = useState<AlertVariant>('subtle');
    const [alertTitle, setAlertTitle] = useState('Deployment paused');
    const [alertDescription, setAlertDescription] = useState(
        'We paused rollout while we investigate a spike in error rates.'
    );
    const [alertShowIcon, setAlertShowIcon] = useState(true);
    const [alertDismissible, setAlertDismissible] = useState(true);
    const [alertShowActions, setAlertShowActions] = useState(true);

    return (
        <PlaygroundSection
            title="Alerts"
            label="[Alert]"
            description="Contextual banners with tone, icon, and action controls."
            controls={
                <div className="space-y-4 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Tone</span>
                            <MultiToggle
                                fullWidth
                                options={alertToneOptions}
                                value={alertTone}
                                size="sm"
                                onChange={(value) => setAlertTone(value as AlertTone)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Variant</span>
                            <MultiToggle
                                fullWidth
                                options={alertVariantOptions}
                                value={alertVariant}
                                size="sm"
                                onChange={(value) => setAlertVariant(value as AlertVariant)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm">
                            <span>Title</span>
                            <input
                                type="text"
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-900"
                                value={alertTitle}
                                onChange={(event) => setAlertTitle(event.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                            <span>Description</span>
                            <textarea
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-900"
                                value={alertDescription}
                                rows={3}
                                onChange={(event) => setAlertDescription(event.target.value)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-2 md:grid-cols-4">
                        {[
                            { label: 'Show icon', value: alertShowIcon, setter: setAlertShowIcon },
                            { label: 'Dismissible', value: alertDismissible, setter: setAlertDismissible },
                            { label: 'Show actions', value: alertShowActions, setter: setAlertShowActions },
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
                <div className="space-y-4">
                    <Alert
                        tone={alertTone}
                        variant={alertVariant}
                        title={alertTitle || undefined}
                        description={alertDescription || undefined}
                        icon={alertShowIcon ? undefined : false}
                        dismissible={alertDismissible}
                        onDismiss={() => createUpdateToast('Alert dismissed')}
                        actions={
                            alertShowActions ? (
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="soft"
                                        color="blue"
                                        onClick={() => createUpdateToast()}
                                    >
                                        Resolve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        color="slate"
                                        onClick={() => createUpdateToast('Snoozed')}
                                    >
                                        Snooze
                                    </Button>
                                </div>
                            ) : null
                        }
                    />
                    <Alert
                        tone="success"
                        variant="outline"
                        title="Everything looks good"
                        description="We finished deploying the latest changes to all regions."
                        icon={
                            <Pill size="xs" tone="success" variant="solid">
                                OK
                            </Pill>
                        }
                    />
                </div>
            }
        />
    );
};
