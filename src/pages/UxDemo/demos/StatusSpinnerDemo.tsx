import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { StatusSpinner, MultiToggle, Toggle } from '../../../controls';
import { StatusSpinnerIntent, StatusSpinnerSize } from '../../../controls/StatusSpinner';
import { statusSpinnerIntentOptions, statusSpinnerSizeOptions } from '../constants';

export const StatusSpinnerDemo: React.FC = () => {
    const [statusSpinnerIntent, setStatusSpinnerIntent] = useState<StatusSpinnerIntent>('neutral');
    const [statusSpinnerSize, setStatusSpinnerSize] = useState<StatusSpinnerSize>('md');
    const [statusSpinnerAnimated, setStatusSpinnerAnimated] = useState<boolean>(true);

    return (
        <PlaygroundSection
            title="Status Spinner"
            label="[StatusSpinner]"
            description="Labeled spinner for async states."
            controls={
                <div className="grid gap-3 text-sm md:grid-cols-2">
                    <label className="flex flex-col gap-2">
                        <span>Intent</span>
                        <MultiToggle
                            fullWidth
                            size="sm"
                            options={statusSpinnerIntentOptions}
                            value={statusSpinnerIntent}
                            onChange={(value) => setStatusSpinnerIntent(value as StatusSpinnerIntent)}
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span>Size</span>
                        <MultiToggle
                            fullWidth
                            size="sm"
                            options={statusSpinnerSizeOptions}
                            value={statusSpinnerSize}
                            onChange={(value) => setStatusSpinnerSize(value as StatusSpinnerSize)}
                        />
                    </label>
                    <label className="flex items-center justify-between gap-2">
                        <span>Animate</span>
                        <Toggle
                            size="sm"
                            checked={statusSpinnerAnimated}
                            onChange={(event) => setStatusSpinnerAnimated(event.target.checked)}
                        />
                    </label>
                </div>
            }
            preview={
                <div className="flex flex-wrap items-center gap-6">
                    <StatusSpinner
                        intent={statusSpinnerIntent}
                        size={statusSpinnerSize}
                        animated={statusSpinnerAnimated}
                        label="Deploying update"
                    />
                    <StatusSpinner intent="success" size="sm" label="Healthy" />
                    <StatusSpinner
                        intent="warning"
                        size="md"
                        animated={statusSpinnerAnimated}
                        label="Pending approval"
                    />
                    <StatusSpinner intent="danger" size="sm" animated={false} label="Failed stage" />
                </div>
            }
        />
    );
};
