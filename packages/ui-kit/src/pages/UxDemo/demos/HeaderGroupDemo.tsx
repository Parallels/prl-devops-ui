import React, { useState } from 'react';
import { HeaderGroup, Input, CustomIcon } from '../../..';
import { PlaygroundSection } from '../PlaygroundSection';

export const HeaderGroupDemo: React.FC = () => {
    const [itemCount, setItemCount] = useState(3);

    return (
        <PlaygroundSection
            title="Header Group"
            label="[HeaderGroup]"
            description="A container for header elements with automatic separators between groups."
            controls={
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Item Count</label>
                        <Input
                            type="number"
                            value={itemCount.toString()}
                            onChange={(e) => setItemCount(Number(e.target.value))}
                            min={1}
                            max={5}
                        />
                    </div>
                </div>
            }
            preview={
                <div className="flex h-12 items-center rounded border border-neutral-200 bg-white px-4 dark:border-neutral-700 dark:bg-neutral-800">
                    {Array.from({ length: itemCount }).map((_, i) => (
                        <HeaderGroup key={i}>
                            <div className="flex items-center gap-2 px-2">
                                <CustomIcon icon="Notification" className="text-blue-500" />
                                <span className="text-sm font-medium">Group {i + 1}</span>
                            </div>
                        </HeaderGroup>
                    ))}
                </div>
            }
        />
    );
};
