import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { Stepper, MultiToggle, Toggle, Button } from '../../../controls';
import {
    StepperVariant,
    StepperOrientation,
    StepperSize,
    StepperConnector,
    StepperConnectorAlign,
} from '../../../controls/Stepper';
import { PanelTone } from '../../../controls/Panel';
import {
    stepperVariantOptions,
    stepperOrientationOptions,
    stepperSizeOptions,
    stepperConnectorOptions,
    stepperConnectorAlignOptions,
    panelToneOptions,
} from '../constants';

const deploymentSteps = [
    {
        id: 'plan',
        title: 'Plan Changes',
        subtitle: 'Resolve diffs',
        description: 'Review the pending infrastructure changes before applying.',
    },
    {
        id: 'apply',
        title: 'Apply Changes',
        subtitle: 'Run terraform apply',
        description: 'Execute the plan to provision resources.',
    },
    {
        id: 'verify',
        title: 'Verify',
        subtitle: 'Smoke tests',
        description: 'Confirm the deployment is healthy and logs are clean.',
    },
    {
        id: 'complete',
        title: 'Complete',
        description: 'Notify stakeholders and archive the run.',
        optionalLabel: 'Optional notes',
    },
];

export const StepperDemo: React.FC = () => {
    const [stepperCompletedIds, setStepperCompletedIds] = useState<string[]>([]);
    const [stepperLoadingIds] = useState<string[]>([]);
    const [stepperLoading, setStepperLoading] = useState(false);
    const [stepperTone, setStepperTone] = useState<PanelTone>('neutral');
    const [stepperOrientation, setStepperOrientation] = useState<StepperOrientation>('horizontal');
    const [stepperVariant, setStepperVariant] = useState<StepperVariant>('card');
    const [stepperSize, setStepperSize] = useState<StepperSize>('md');
    const [stepperConnector, setStepperConnector] = useState<StepperConnector>('line');
    const [stepperConnectorAlign, setStepperConnectorAlign] =
        useState<StepperConnectorAlign>('center');
    const [stepperConnectNodes, setStepperConnectNodes] = useState<boolean>(false);
    const [stepperInteractive, setStepperInteractive] = useState<boolean>(true);
    const [stepperShowProgressBar, setStepperShowProgressBar] = useState<boolean>(false);
    const [stepperShowProgressSummary, setStepperShowProgressSummary] = useState<boolean>(false);

    const handleStepperStepClick = (id: string) => {
        if (stepperLoadingIds.includes(id) || stepperLoading) return;
        // Simulate async verification when clicking a completed step
        if (stepperCompletedIds.includes(id)) {
            setStepperLoading(true);
            setTimeout(() => setStepperLoading(false), 1200);
        } else {
            // Toggle completion logic
            const index = deploymentSteps.findIndex((s) => s.id === id);
            if (index !== -1) {
                const newCompleted = deploymentSteps.slice(0, index + 1).map((s) => s.id ?? '');
                setStepperCompletedIds(newCompleted);
            }
        }
    };

    return (
        <PlaygroundSection
            title="Stepper"
            label="[Stepper]"
            description="Multi-step workflow with optional actions and progress."
            controls={
                <div className="space-y-4 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Variant</span>
                            <MultiToggle
                                fullWidth
                                options={stepperVariantOptions}
                                value={stepperVariant}
                                size="sm"
                                onChange={(value) => setStepperVariant(value as StepperVariant)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Tone</span>
                            <MultiToggle
                                fullWidth
                                options={panelToneOptions}
                                value={stepperTone}
                                size="sm"
                                onChange={(value) => setStepperTone(value as PanelTone)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <label className="flex flex-col gap-2">
                            <span>Size</span>
                            <MultiToggle
                                fullWidth
                                options={stepperSizeOptions}
                                value={stepperSize}
                                size="sm"
                                onChange={(value) => setStepperSize(value as StepperSize)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Orientation</span>
                            <MultiToggle
                                fullWidth
                                options={stepperOrientationOptions}
                                value={stepperOrientation}
                                size="sm"
                                onChange={(value) => setStepperOrientation(value as StepperOrientation)}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span>Connector</span>
                            <MultiToggle
                                fullWidth
                                options={stepperConnectorOptions}
                                value={stepperConnector}
                                size="sm"
                                onChange={(value) => setStepperConnector(value as StepperConnector)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2">
                            <span>Connector align</span>
                            <MultiToggle
                                fullWidth
                                options={stepperConnectorAlignOptions}
                                value={stepperConnectorAlign}
                                size="sm"
                                onChange={(value) => setStepperConnectorAlign(value as StepperConnectorAlign)}
                            />
                        </label>
                        <label className="flex items-center justify-between">
                            <span>Connect nodes</span>
                            <Toggle
                                size="sm"
                                checked={stepperConnectNodes}
                                onChange={(event) => setStepperConnectNodes(event.target.checked)}
                            />
                        </label>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                        {[
                            {
                                label: 'Progress bar',
                                value: stepperShowProgressBar,
                                setter: setStepperShowProgressBar,
                            },
                            {
                                label: 'Progress summary',
                                value: stepperShowProgressSummary,
                                setter: setStepperShowProgressSummary,
                            },
                            { label: 'Interactive', value: stepperInteractive, setter: setStepperInteractive },
                            { label: 'Loading', value: stepperLoading, setter: setStepperLoading },
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
                <div className="flex flex-col gap-4">
                    <Stepper
                        steps={deploymentSteps}
                        variant={stepperVariant}
                        tone={stepperTone}
                        orientation={stepperOrientation}
                        connector={stepperConnector}
                        connectorAlign={stepperConnectorAlign}
                        size={stepperSize}
                        connectNodes={stepperConnectNodes}
                        interactive={stepperInteractive}
                        completedStepIds={stepperCompletedIds}
                        loaderStepIds={stepperLoadingIds}
                        loading={stepperLoading}
                        showProgressBar={stepperShowProgressBar}
                        showProgressSummary={stepperShowProgressSummary}
                        loaderTitle={stepperLoading ? 'Revalidating...' : undefined}
                        onChange={(index, stepId) => {
                            if (!stepId) return;
                            const newCompleted = deploymentSteps.slice(0, index).map((step) => step.id ?? '');
                            setStepperCompletedIds(newCompleted);
                            handleStepperStepClick(stepId);
                        }}
                    />
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStepperCompletedIds([])}
                        >
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStepperCompletedIds(deploymentSteps.map((s) => s.id ?? ''))}
                        >
                            Mark all complete
                        </Button>
                    </div>
                </div>
            }
        />
    );
};
