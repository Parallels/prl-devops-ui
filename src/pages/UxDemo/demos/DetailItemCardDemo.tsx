import React, { useState } from 'react';
import { DetailItemCard, Input, Select, Pill } from '../../../controls';
import { PlaygroundSection } from '../PlaygroundSection';

export const DetailItemCardDemo: React.FC = () => {
    const [title, setTitle] = useState('Example Item');
    const [subtitle, setSubtitle] = useState('Subtitle information');
    const [description, setDescription] = useState('This is a description of the item.');
    const [badgesAlignment, setBadgesAlignment] = useState<'bottom' | 'right' | 'bottom-end'>(
        'right'
    );

    return (
        <PlaygroundSection
            title="Detail Item Card"
            label="[DetailItemCard]"
            description="A list item with expandable details and badge support."
            controls={
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Title</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Subtitle</label>
                        <Input
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Description</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Badges Alignment</label>
                        <Select
                            value={badgesAlignment}
                            onChange={(e) => setBadgesAlignment(e.target.value as 'bottom' | 'right' | 'bottom-end')}
                        >
                            <option value="right">Right</option>
                            <option value="bottom">Bottom</option>
                            <option value="bottom-end">Bottom End</option>
                        </Select>
                    </div>
                </div>
            }
            preview={
                <div className="w-full max-w-md rounded border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <DetailItemCard
                        title={title}
                        subtitle={subtitle}
                        description={description}
                        badgesAlignment={badgesAlignment}
                        badges={[
                            <Pill key="1" tone="success" size="xs">Badge 1</Pill>,
                            <Pill key="2" tone="warning" size="xs">Badge 2</Pill>,
                        ]}
                    >
                        <div className="p-4 text-sm text-neutral-600 dark:text-neutral-300">
                            This is the expandable content area. You can put any content here.
                        </div>
                    </DetailItemCard>
                </div>
            }
        />
    );
};
