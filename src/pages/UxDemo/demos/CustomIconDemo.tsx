import React from 'react';
import { CustomIcon } from '../../../controls/CustomIcon';
import { PlaygroundSection } from '../PlaygroundSection';

export const CustomIconDemo: React.FC = () => (
    <PlaygroundSection
        title="Custom Icon"
        label="[CustomIcon]"
        description="Renders icons from the registry (SVG or Image)."
        controls={
            <div className="text-sm text-neutral-500">
                No interactive controls for this component.
            </div>
        }
        preview={
            <div className="flex flex-wrap gap-8">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-neutral-500">Sizes</span>
                    <div className="flex items-end gap-2">
                        <CustomIcon icon="Notification" size="xs" />
                        <CustomIcon icon="Notification" size="sm" />
                        <CustomIcon icon="Notification" size="md" />
                        <CustomIcon icon="Notification" size="lg" />
                        <CustomIcon icon="Notification" size="xl" />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-neutral-500">Coloring</span>
                    <div className="flex gap-2">
                        <CustomIcon icon="Notification" size="md" className="text-blue-500" />
                        <CustomIcon icon="Notification" size="md" className="text-emerald-500" />
                        <CustomIcon icon="Notification" size="md" className="text-rose-500" />
                        <CustomIcon icon="Notification" size="md" colored />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-neutral-500">Fallback</span>
                    <div className="flex gap-2">
                        <CustomIcon icon={'Send'} size="md" />
                    </div>
                </div>
            </div>
        }
    />
);
