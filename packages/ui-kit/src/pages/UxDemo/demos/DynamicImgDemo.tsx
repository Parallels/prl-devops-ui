import React, { useState } from 'react';
import { DynamicImg, Select } from '../../..';
import { PlaygroundSection } from '../PlaygroundSection';

export const DynamicImgDemo: React.FC = () => {
    const [size, setSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
    // Simple SVG base64 for testing (a circle)
    const [base64, setBase64] = useState(
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIC8+PC9zdmc+'
    );

    return (
        <PlaygroundSection
            title="Dynamic Image"
            label="[DynamicImg]"
            description="Renders base64 encoded SVGs or Images with dynamic styling."
            controls={
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Size</label>
                        <Select value={size} onChange={(e) => setSize(e.target.value as 'xs' | 'sm' | 'md' | 'lg' | 'xl')}>
                            <option value="xs">XS</option>
                            <option value="sm">SM</option>
                            <option value="md">MD</option>
                            <option value="lg">LG</option>
                            <option value="xl">XL</option>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Base64 Content</label>
                        <textarea
                            className="h-24 w-full rounded border border-neutral-300 p-2 text-xs dark:border-neutral-600 dark:bg-neutral-800"
                            value={base64}
                            onChange={(e) => setBase64(e.target.value)}
                        />
                    </div>
                </div>
            }
            preview={
                <div className="flex items-center justify-center p-8">
                    <DynamicImg base64={base64} size={size} />
                </div>
            }
        />
    );
};
