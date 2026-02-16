// @ts-nocheck
import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { Panel, MultiToggle, Toggle, Badge } from '../../..';
import {
    PanelActionLayout,
    PanelCorner,
    PanelLoaderType,
    PanelMediaPlacement,
    PanelPadding,
    PanelTone,
    PanelVariant,
    PanelAction,
} from '../../..';
import {
    panelVariantOptions,
    panelToneOptions,
    panelMediaPlacementOptions,
    panelActionLayoutOptions,
    panelPaddingOptions,
    panelCornerOptions,
    panelLoadingTypeOptions,
} from '../constants';
import notificationService from '../mocks/NotificationService';
import { GLOBAL_NOTIFICATION_CHANNEL } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import parallels from '../../../assets/images/parallels.png';

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

export const PanelDemo: React.FC = () => {
    const [panelTone, setPanelTone] = useState<PanelTone>('neutral');
    const [panelVariant, setPanelVariant] = useState<PanelVariant>('elevated');
    const [panelLoading, setPanelLoading] = useState<boolean>(false);
    const [panelCorner, setPanelCorner] = useState<PanelCorner>('rounded');
    const [panelHasMedia, setPanelHasMedia] = useState<boolean>(true);
    const [panelMediaPlacement, setPanelMediaPlacement] = useState<PanelMediaPlacement>('top');
    const [panelHasActions, setPanelHasActions] = useState<boolean>(true);
    const [panelHasBadge, setPanelHasBadge] = useState<boolean>(true);
    const [panelLoadingType, setPanelLoadingType] = useState<PanelLoaderType>('spinner');
    const [panelActionLayout, setPanelActionLayout] = useState<PanelActionLayout>('inline');
    const [panelPadding, setPanelPadding] = useState<PanelPadding>('md');
    const [panelFullWidth, setPanelFullWidth] = useState<boolean>(false);
    const [panelHoverShadow, setPanelHoverShadow] = useState<boolean>(false);
    const [panelDisabled, setPanelDisabled] = useState<boolean>(false);

    const panelActions: PanelAction[] = panelHasActions
        ? [
            {
                variant: 'solid',
                label: 'Open',
                color: 'blue',
                onClick: () => createUpdateToast(),
            },
            {
                variant: 'solid',
                label: 'Close',
                color: 'rose',
                onClick: () => createUpdateToast(),
            },
        ]
        : [];

    const panelPreview = (
        <Panel
            title={`${panelVariant.charAt(0).toUpperCase() + panelVariant.slice(1)} Panel`}
            subtitle="This is a subtitle"
            tone={panelTone}
            variant={panelVariant}
            media={panelHasMedia ? <img src={parallels} alt="Parallels" /> : null}
            mediaPlacement={panelMediaPlacement}
            badge={panelHasBadge ? <Badge count={10} variant="primary" /> : null}
            corner={panelCorner}
            loaderProgress={30}
            loading={panelLoading}
            disabled={panelDisabled}
            loaderType={panelLoadingType}
            loaderTitle="Loading..."
            loaderMessage="Getting things ready..."
            padding={panelPadding}
            actionLayout={panelActionLayout}
            fullWidth={panelFullWidth}
            actions={panelActions}
            hoverShadow={panelHoverShadow}
        >
            This Panel uses the {panelVariant} variant
        </Panel>
    );

    return (
        <PlaygroundSection
            title="Panels"
            label="[Panel]"
            description="Card layout with media, badges, actions, and loaders."
            controls={
                <div className="space-y-4 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Variant</span>
                            <MultiToggle
                                fullWidth
                                options={panelVariantOptions}
                                value={panelVariant}
                                size="sm"
                                onChange={(value) => setPanelVariant(value as PanelVariant)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Tone</span>
                            <MultiToggle
                                fullWidth
                                options={panelToneOptions}
                                value={panelTone}
                                size="sm"
                                onChange={(value) => setPanelTone(value as PanelTone)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <label className="flex flex-col gap-2">
                            <span>Media placement</span>
                            <MultiToggle
                                fullWidth
                                options={panelMediaPlacementOptions}
                                value={panelMediaPlacement}
                                size="sm"
                                onChange={(value) => setPanelMediaPlacement(value as PanelMediaPlacement)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Action layout</span>
                            <MultiToggle
                                fullWidth
                                options={panelActionLayoutOptions}
                                value={panelActionLayout}
                                size="sm"
                                onChange={(value) => setPanelActionLayout(value as PanelActionLayout)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Padding</span>
                            <MultiToggle
                                fullWidth
                                options={panelPaddingOptions}
                                value={panelPadding}
                                size="sm"
                                onChange={(value) => setPanelPadding(value as PanelPadding)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Corner</span>
                            <MultiToggle
                                fullWidth
                                options={panelCornerOptions}
                                value={panelCorner}
                                size="sm"
                                onChange={(value) => setPanelCorner(value as PanelCorner)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Loader type</span>
                            <MultiToggle
                                fullWidth
                                options={panelLoadingTypeOptions}
                                value={panelLoadingType}
                                size="sm"
                                onChange={(value) => setPanelLoadingType(value as PanelLoaderType)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                        {[
                            { label: 'Media', value: panelHasMedia, setter: setPanelHasMedia },
                            { label: 'Badge', value: panelHasBadge, setter: setPanelHasBadge },
                            { label: 'Actions', value: panelHasActions, setter: setPanelHasActions },
                            { label: 'Loading', value: panelLoading, setter: setPanelLoading },
                            { label: 'Full width', value: panelFullWidth, setter: setPanelFullWidth },
                            { label: 'Disabled', value: panelDisabled, setter: setPanelDisabled },
                            { label: 'Hover shadow', value: panelHoverShadow, setter: setPanelHoverShadow },
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
                <div className="space-y-4">
                    {panelPreview}
                    {!panelFullWidth && (
                        <Panel
                            title="Secondary Panel"
                            subtitle="Loading demo"
                            tone={panelTone}
                            variant={panelVariant}
                            loaderProgress={45}
                            loading={panelLoading}
                            loaderType="progress"
                            padding={panelPadding}
                            actionLayout={panelActionLayout}
                            actions={panelActions}
                            hoverShadow={panelHoverShadow}
                        >
                            Secondary panel preview
                        </Panel>
                    )}
                </div>
            }
        />
    );
};
